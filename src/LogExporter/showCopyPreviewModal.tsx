import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './showCopyPreviewModal.css';
import { processChatLog } from '../utils/domParser';
import { THEMES, COLORS } from './components/constants';
import type { RisuCharacter } from '../types/risuai';
import type { ThemeKey, ColorKey } from '../types';

import PluginSettingsModal from './components/PluginSettingsModal';
import ExportTab from './components/ExportTab';
import FilterTab from './components/FilterTab';
import AdvancedTab from './components/AdvancedTab';
import MobileSettingsTab from './components/MobileSettingsTab';
import MobileToolsTab from './components/MobileToolsTab';

import PreviewPanel from './components/PreviewPanel';
import ArcaHelperModal from './components/ArcaHelperModal';

import Actionbar from './components/Actionbar';
import { generateMarkdownLog, generateTextLog, generateHtmlPreview } from './services/logGenerator';
import { getLogHtml } from './services/htmlGenerator';
import { collectUIClasses, filterWithCustomClasses, getNameFromNode } from './utils/domUtils';
import type { UIClassInfo } from './utils/domUtils';
import { loadAllCharSettings, loadGlobalSettings } from './services/settingsService';
import { saveAsFile } from './services/fileService';

interface Settings {
  format?: 'basic' | 'html' | 'markdown' | 'text';
  theme?: ThemeKey;
  color?: ColorKey;
  showAvatar?: boolean;
  showBubble?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  imageScale?: number;
  embedImages?: boolean;
  expandHover?: boolean;
  imageResolution?: number;
  imageLibrary?: 'html-to-image' | 'dom-to-image' | 'html2canvas';
  imageFormat?: 'png' | 'jpeg' | 'webp';
  previewFontSize?: number;
  previewWidth?: number;
  rawHtmlView?: boolean;
  showArcaHelper?: boolean;
  customFilters?: { [key: string]: boolean };
  isEditable?: boolean;
}


// Helper functions from the original script (to be moved to service files later)


interface ShowCopyPreviewModalProps {
  chatIndex: number;
  options?: any;
  onClose: () => void;
}

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);
  
    useEffect(() => {
      const media = window.matchMedia(query);
      const listener = () => setMatches(media.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }, [query]);
  
    return matches;
  };

const ShowCopyPreviewModal: React.FC<ShowCopyPreviewModalProps> = ({ chatIndex, options, onClose }) => {
    const [charName, setCharName] = useState('');
    const [chatName, setChatName] = useState('');
    const [charAvatarUrl, setCharAvatarUrl] = useState('');
    const [messageNodes, setMessageNodes] = useState<HTMLElement[]>([]);
    const [character, setCharacter] = useState<RisuCharacter | null>(null);
    const [participants, setParticipants] = useState<Set<string>>(new Set());
    const [uiClasses, setUiClasses] = useState<UIClassInfo[]>([]);

    const [savedSettings, setSavedSettings] = useState<Settings>({});
    const [globalSettings, setGlobalSettings] = useState<any>({});
    const [otherFormatContent, setOtherFormatContent] = useState('');
    const [activeTab, setActiveTab] = useState('export');
    const [isPluginSettingsOpen, setIsPluginSettingsOpen] = useState(false);
    const [isArcaHelperOpen, setIsArcaHelperOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState({ active: false, message: '', current: 0, total: 0 });
    const [selectedIndices, setSelectedIndices] = useState(new Set<number>());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

    const handleSelectionChange = (newSelection: Set<number>) => {
        setSelectedIndices(newSelection);
    };

    const handleLastSelectedIndexChange = (index: number | null) => {
        setLastSelectedIndex(index);
    };

    const handleSelectAll = () => {
        const allIndices = new Set(messageNodes.map((_, i) => i));
        setSelectedIndices(allIndices);
    };

    const handleDeselectAll = () => {
        setSelectedIndices(new Set());
        setLastSelectedIndex(null);
    };

    const handleInvertSelection = () => {
        const allIndices = new Set(messageNodes.map((_, i) => i));
        const newSelection = new Set(
            [...allIndices].filter(i => !selectedIndices.has(i))
        );
        setSelectedIndices(newSelection);
    };

    const handleDeleteSelected = () => {
        if (selectedIndices.size === 0) return;
        const newNodes = messageNodes.filter((_, i) => !selectedIndices.has(i));
        setMessageNodes(newNodes);
        setSelectedIndices(new Set());
        setLastSelectedIndex(null);
    };

    const handleProgressStart = (message: string, total = 0) => {
        setProgress({ active: true, message, current: 0, total });
    };
    const handleProgressUpdate = (update: { current?: number; message?: string }) => {
        setProgress(p => ({ ...p, ...update }));
    };
    const handleProgressEnd = () => {
        setProgress({ active: false, message: '', current: 0, total: 0 });
    };

    const isMobile = useMediaQuery('(max-width: 768px)');

    const themeInfo = THEMES[savedSettings.theme || 'basic'] || THEMES.basic;
    const colorPalette = savedSettings.theme === 'basic' ? (COLORS[savedSettings.color || 'dark'] || COLORS.dark) : (themeInfo.color || COLORS.dark);
    const backgroundColor = colorPalette.background;

    const handleSettingChange = (key: string, value: any) => {
        const newSettings = { ...savedSettings, [key]: value };
        setSavedSettings(newSettings);
    };

    const handleGlobalSettingChange = (key: string, value: any) => {
        const newSettings = { ...globalSettings, [key]: value };
        setGlobalSettings(newSettings);
        localStorage.setItem('logExporterGlobalSettings', JSON.stringify(newSettings));
    };

    const handleMessageUpdate = (index: number, newHtml: string) => {
        const newNodes = [...messageNodes];
        const nodeToUpdate = newNodes[index].cloneNode(true) as HTMLElement;
        const messageEl = nodeToUpdate.querySelector('.prose, .chattext');
        if (messageEl) {
            messageEl.innerHTML = newHtml;
            newNodes[index] = nodeToUpdate;
            setMessageNodes(newNodes);
        }
    };

    const handleSaveLogData = () => {
        const data = {
            charName,
            chatName,
            charAvatarUrl,
            messageNodes: messageNodes.map(node => node.outerHTML),
        };
        const content = JSON.stringify(data, null, 2);
        const safeCharName = charName.replace(/[\\/\?%\\*:|"<>]/g, '-');
        const safeChatName = chatName.replace(/[\\/\?%\\*:|"<>]/g, '-');
        const filename = `Risu_Log_Data_${safeCharName}_${safeChatName}.json`;
        saveAsFile(filename, content, 'application/json;charset=utf-8');
    };

    const handleLoadLogData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const content = await file.text();
            try {
                const data = JSON.parse(content);
                if (data.charName && data.chatName && data.charAvatarUrl && Array.isArray(data.messageNodes)) {
                    setCharName(data.charName);
                    setChatName(data.chatName);
                    setCharAvatarUrl(data.charAvatarUrl);
                    
                    const newNodes = data.messageNodes.map((html: string) => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        return tempDiv.firstChild as HTMLElement;
                    });
                    setMessageNodes(newNodes);
                    alert('로그 데이터를 성공적으로 불러왔습니다.');
                } else {
                    alert('잘못된 형식의 로그 데이터 파일입니다.');
                }
            } catch (err) {
                alert('로그 데이터 파일을 읽는 데 실패했습니다.');
                console.error(err);
            }
        };
        input.click();
    };

    useEffect(() => {
        if (character?.chaId && Object.keys(savedSettings).length > 0) {
            const allSettings = loadAllCharSettings();
            const charId = String(character.chaId);
            const existingSettings = allSettings[charId] || {};
            allSettings[charId] = { ...existingSettings, ...savedSettings };
            localStorage.setItem('logExporterCharacterSettings', JSON.stringify(allSettings));
        }
    }, [savedSettings, character]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { charName, chatName, charAvatarUrl, messageNodes, character } = await processChatLog(chatIndex, options);
                setCharName(charName);
                setChatName(chatName);
                setCharAvatarUrl(charAvatarUrl);
                setMessageNodes(messageNodes);
                setCharacter(character);

                const loadedGlobalSettings = loadGlobalSettings();
                setGlobalSettings(loadedGlobalSettings);

                const newParticipants = new Set<string>();
                messageNodes.forEach((node: HTMLElement) => {
                    const name = getNameFromNode(node, loadedGlobalSettings, charName);
                    if (name) newParticipants.add(name);
                });
                setParticipants(newParticipants);

                setUiClasses(collectUIClasses(messageNodes));

            } catch (error) {
                console.error('[Log Exporter] Modal open error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [chatIndex, options]);

    const activeFilters = savedSettings.customFilters ? Object.entries(savedSettings.customFilters).filter(([, checked]) => checked).map(([key]) => key) : [];
    
    const finalNodes = messageNodes
        .map(node => { // for customFilters
            if (activeFilters.length > 0) {
                return filterWithCustomClasses(node, activeFilters, globalSettings);
            }
            return node;
        })
        .filter(node => { // for participant filter
            const isMessageNode = node.querySelector('.prose, .chattext');
            if (isMessageNode) {
                const name = getNameFromNode(node as HTMLElement, globalSettings, charName);
                if (globalSettings?.filteredParticipants?.includes(name)) {
                    return false;
                }
            }
            return true;
        });

    const nodesForExport = selectedIndices.size > 0
        ? finalNodes.filter((_, i) => selectedIndices.has(i))
        : finalNodes;

    const logContainerProps = {
        nodes: finalNodes,
        charInfo: { name: charName, chatName: chatName, avatarUrl: charAvatarUrl },
        selectedThemeKey: savedSettings.theme || 'basic',
        selectedColorKey: savedSettings.color || 'dark',
        showAvatar: savedSettings.showAvatar,
        showHeader: savedSettings.showHeader,
        showFooter: savedSettings.showFooter,
        showBubble: savedSettings.showBubble,
        embedImagesAsBase64: true,
        globalSettings: globalSettings,
        fontSize: savedSettings.previewFontSize,
        containerWidth: savedSettings.previewWidth,
        isEditable: savedSettings.isEditable,
        onMessageUpdate: handleMessageUpdate,
    };

    const getPreviewContentForExport = async () => {
        if (savedSettings.format === 'basic' || !savedSettings.format) {
            return await getLogHtml({...logContainerProps, nodes: nodesForExport, isEditable: false, embedImagesAsBase64: true });
        } else if (savedSettings.format === 'html') {
            const htmlLog = await generateHtmlPreview(nodesForExport, savedSettings);
            return htmlLog.replace('</style>', `
              .x-risu-asset-table,
              .x-risu-asset-table table {
                width: 100% !important;
                table-layout: fixed !important;
                word-break: break-all;
              }
              .x-risu-asset-table img {
                max-width: 100% !important;
                height: auto !important;
                display: block;
                margin: 0 auto;
              }
            </style>`);
        } else if (savedSettings.format === 'markdown') {
            return await generateMarkdownLog(nodesForExport, charName);
        } else if (savedSettings.format === 'text') {
            return await generateTextLog(nodesForExport, charName);
        }
        return '';
    };

    useEffect(() => {
        const generateOtherFormatPreview = async () => {
            if (savedSettings.format === 'basic' || !savedSettings.format) {
                setOtherFormatContent('');
                return;
            }
            const content = await getPreviewContentForExport();
            if (savedSettings.format === 'markdown' || savedSettings.format === 'text') {
                const style = `font-size: ${savedSettings.previewFontSize || 16}px; max-width: ${savedSettings.previewWidth || 800}px; margin: 20px auto; padding: 20px; background-color: #1a1b26; color: #c0caf5; border-radius: 8px;`;
                setOtherFormatContent(`<div style="${style}"><pre style="white-space: pre-wrap; word-wrap: break-word;">${content}</pre></div>`);
            } else {
                setOtherFormatContent(content);
            }
        };

        generateOtherFormatPreview();
    }, [finalNodes, selectedIndices, savedSettings, globalSettings, charName]);

    const handleClose = () => {
        onClose();
    };

    const uiTheme = globalSettings.uiTheme || 'dark';

    return (
        <div className="log-exporter-modal-backdrop" onClick={isArcaHelperOpen ? () => setIsArcaHelperOpen(false) : handleClose}>
            {isArcaHelperOpen ? (
                <ArcaHelperModal
                    isOpen={isArcaHelperOpen}
                    onClose={() => setIsArcaHelperOpen(false)}
                    messageNodes={messageNodes}
                    charInfo={{ name: charName, chatName: chatName, avatarUrl: charAvatarUrl }}
                    settings={savedSettings}
                    globalSettings={globalSettings}
                    uiTheme={uiTheme}
                />
            ) : (
                <div className="log-exporter-modal" data-theme={uiTheme} onClick={(e) => e.stopPropagation()}>
                    <div className="log-exporter-modal-header-bar">
                        <button id="log-exporter-close" className="log-exporter-modal-close-btn" title="닫기 (Esc)" aria-label="모달 닫기" onClick={handleClose}>
                            &times;
                        </button>
                        <span className="header-title">로그 내보내기</span>
                        <button className="settings-button" onClick={() => setIsPluginSettingsOpen(true)}>
                            ⚙️ 플러그인 설정
                        </button>
                    </div>
                    {isLoading ? (
                        <div className="desktop-modal-loading">
                            <div className="desktop-spinner"></div>
                            <p>로그 데이터를 불러오는 중...</p>
                        </div>
                    ) : isMobile ? (
                        <div className="log-exporter-modal-content">
                            <div className="mobile-tab-navigation">
                                <button className={`mobile-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                                    설정
                                </button>
                                <button className={`mobile-tab-btn ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
                                    미리보기
                                </button>
                                <button className={`mobile-tab-btn ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>
                                    도구
                                </button>
                            </div>
                            <div className={`mobile-tab-content mobile-settings-tab ${activeTab === 'settings' ? 'active' : ''}`}>
                                <MobileSettingsTab 
                                    settings={savedSettings} 
                                    onSettingChange={handleSettingChange} 
                                    themes={THEMES} 
                                    colors={COLORS} 
                                    participants={participants}
                                    globalSettings={globalSettings}
                                    onGlobalSettingChange={handleGlobalSettingChange}
                                    uiClasses={uiClasses}
                                />
                            </div>
                            <div className={`mobile-tab-content mobile-preview-tab ${activeTab === 'preview' ? 'active' : ''}`}>
                                <PreviewPanel 
                                    logContainerProps={logContainerProps}
                                    settings={savedSettings}
                                    otherFormatContent={otherFormatContent}
                                    selectedIndices={selectedIndices}
                                    onSelectionChange={handleSelectionChange}
                                    lastSelectedIndex={lastSelectedIndex}
                                    onLastSelectedIndexChange={handleLastSelectedIndexChange}
                                    onSelectAll={handleSelectAll}
                                    onDeselectAll={handleDeselectAll}
                                    onInvertSelection={handleInvertSelection}
                                />
                            </div>
                            <div className={`mobile-tab-content mobile-tools-tab ${activeTab === 'tools' ? 'active' : ''}`}>
                                <MobileToolsTab 
                                    settings={savedSettings}
                                    onSettingChange={handleSettingChange}
                                />
                            </div>
                            <div className="mobile-action-bar">
                                <Actionbar 
                                    charName={charName} 
                                    chatName={chatName} 
                                    getPreviewContent={getPreviewContentForExport} 
                                    messageNodes={nodesForExport}
                                    settings={savedSettings}
                                    backgroundColor={backgroundColor}
                                    charAvatarUrl={charAvatarUrl}
                                    onOpenArcaHelper={() => setIsArcaHelperOpen(true)}
                                    onProgressStart={handleProgressStart}
                                    onProgressUpdate={handleProgressUpdate}
                                    onProgressEnd={handleProgressEnd}
                                    onSaveLogData={handleSaveLogData}
                                    onLoadLogData={handleLoadLogData}
                                    onDeleteSelected={handleDeleteSelected}
                                    hasSelection={selectedIndices.size > 0}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="log-exporter-modal-content">
                                <div className="desktop-settings-panel">
                                    <div className="tab-navigation">
                                        <button 
                                            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('export')}
                                        >
                                            📤 내보내기
                                        </button>
                                        <button 
                                            className={`tab-button ${activeTab === 'filter' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('filter')}
                                        >
                                            🔍 필터
                                        </button>
                                        <button 
                                            className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('advanced')}
                                        >
                                            ⚡ 고급
                                        </button>
                                    </div>
                                    <div style={{flex: 1, overflow: 'hidden'}}>
                                        {activeTab === 'export' && (
                                            <ExportTab 
                                                settings={savedSettings}
                                                onSettingChange={handleSettingChange}
                                                themes={THEMES}
                                                colors={COLORS}
                                            />
                                        )}
                                        {activeTab === 'filter' && (
                                            <FilterTab 
                                                settings={savedSettings}
                                                onSettingChange={handleSettingChange}
                                                participants={participants}
                                                globalSettings={globalSettings}
                                                onGlobalSettingChange={handleGlobalSettingChange}
                                                uiClasses={uiClasses}
                                            />
                                        )}
                                        {activeTab === 'advanced' && (
                                            <AdvancedTab 
                                                settings={savedSettings}
                                                onSettingChange={handleSettingChange}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="desktop-preview-panel">
                                    <PreviewPanel 
                                        logContainerProps={logContainerProps}
                                        settings={savedSettings}
                                        otherFormatContent={otherFormatContent}
                                        selectedIndices={selectedIndices}
                                        onSelectionChange={handleSelectionChange}
                                        lastSelectedIndex={lastSelectedIndex}
                                        onLastSelectedIndexChange={handleLastSelectedIndexChange}
                                        onSelectAll={handleSelectAll}
                                        onDeselectAll={handleDeselectAll}
                                        onInvertSelection={handleInvertSelection}
                                    />
                                </div>
                            </div>
                            <div className="desktop-action-bar">
                                <Actionbar 
                                    charName={charName} 
                                    chatName={chatName} 
                                    getPreviewContent={getPreviewContentForExport} 
                                    messageNodes={nodesForExport}
                                    settings={savedSettings}
                                    backgroundColor={backgroundColor}
                                    charAvatarUrl={charAvatarUrl}
                                    onOpenArcaHelper={() => setIsArcaHelperOpen(true)}
                                    onProgressStart={handleProgressStart}
                                    onProgressUpdate={handleProgressUpdate}
                                    onProgressEnd={handleProgressEnd}
                                    onSaveLogData={handleSaveLogData}
                                    onLoadLogData={handleLoadLogData}
                                    onDeleteSelected={handleDeleteSelected}
                                    hasSelection={selectedIndices.size > 0}
                                />
                            </div>
                        </>
                    )}
                    
                    <PluginSettingsModal 
                        isOpen={isPluginSettingsOpen}
                        onClose={() => setIsPluginSettingsOpen(false)}
                        globalSettings={globalSettings}
                        onGlobalSettingChange={handleGlobalSettingChange}
                    />
                </div>
            )}
            {progress.active && (
                <div className="desktop-modal-loading progress-overlay">
                    <div className="desktop-spinner"></div>
                    <p>{progress.message}</p>
                    {progress.total > 0 && (
                        <span>{progress.current} / {progress.total}</span>
                    )}
                </div>
            )}
        </div>
    );
};

let root: ReactDOM.Root | null = null;

export const showCopyPreviewModal = (chatIndex: number, options = {}) => {
  // Remove existing modal if any
  const existingModal = document.getElementById('log-exporter-react-modal-root');
  if (existingModal) {
    existingModal.remove();
  }

  const container = document.createElement('div');
  container.id = 'log-exporter-react-modal-root';
  document.body.appendChild(container);

  root = ReactDOM.createRoot(container);
  
  const handleClose = () => {
    if (root) {
      root.unmount();
    }
    if (container) {
      container.remove();
    }
    root = null;
  };

  root.render(
    <React.StrictMode>
      <ShowCopyPreviewModal chatIndex={chatIndex} options={options} onClose={handleClose} />
    </React.StrictMode>
  );
};

export default ShowCopyPreviewModal;
