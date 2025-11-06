import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './showCopyPreviewModal.css';
import { processChatLog } from '../utils/domParser';
import { THEMES, COLORS } from './components/constants';
import type { RisuCharacter } from '../types/risuai';
import type { ThemeKey, ColorKey } from '../types';

import SettingsPanel from './components/SettingsPanel';

import PreviewPanel from './components/PreviewPanel';

import Actionbar from './components/Actionbar';
import { generateMarkdownLog, generateTextLog, generateHtmlPreview } from './services/logGenerator';
import { getLogHtml } from './services/htmlGenerator';
import { collectUIClasses, filterWithCustomClasses, getNameFromNode } from './utils/domUtils';
import type { UIClassInfo } from './utils/domUtils';

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
  previewFontSize?: number;
  previewWidth?: number;
  rawHtmlView?: boolean;
  showArcaHelper?: boolean;
  customFilters?: { [key: string]: boolean };
}


// Helper functions from the original script (to be moved to service files later)
const loadAllCharSettings = () => {
    try {
        const settings = localStorage.getItem('logExporterCharacterSettings');
        return settings ? JSON.parse(settings) : {};
    } catch (e) {
        console.error('[Log Exporter] Failed to load settings:', e);
        return {};
    }
};

const loadGlobalSettings = () => {
    try {
        const settings = localStorage.getItem('logExporterGlobalSettings');
        const parsed = settings ? JSON.parse(settings) : {};
        if (!Array.isArray(parsed.profileClasses)) parsed.profileClasses = [];
        if (!Array.isArray(parsed.participantNameClasses)) parsed.participantNameClasses = [];
        return parsed;
    } catch (e) {
        console.error('[Log Exporter] Failed to load global settings:', e);
        return { profileClasses: [], participantNameClasses: [] };
    }
};


interface ShowCopyPreviewModalProps {
  chatIndex: number;
  options?: any;
  onClose: () => void;
}

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
    const [arcaTitle, setArcaTitle] = useState('');
    const [arcaContent, setArcaContent] = useState('');
    const [previewContent, setPreviewContent] = useState('');

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
            }
        };

        fetchData();
    }, [chatIndex, options]);

    useEffect(() => {
        const generatePreview = async () => {
            if (messageNodes.length === 0) return;

            let content = '';
            const settings = savedSettings;

            const activeFilters = settings.customFilters ? Object.entries(settings.customFilters).filter(([, checked]) => checked).map(([key]) => key) : [];
            const filteredNodes = activeFilters.length > 0 
                ? messageNodes.map(node => filterWithCustomClasses(node, activeFilters, globalSettings))
                : messageNodes;

            const style = `font-size: ${settings.previewFontSize || 16}px; max-width: ${settings.previewWidth || 800}px; margin: 0 auto;`;
            const preStyle = `font-size: ${settings.previewFontSize || 16}px;`;
            const preWrapperStyle = `max-width: ${settings.previewWidth || 800}px; margin: 0 auto;`;
            const overrideStyle = `
              <style>
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
                img, video {
                  max-width: 100%;
                  height: auto;
                }
              </style>
            `;

            if (settings.format === 'basic' || !settings.format) {
                const logHtml = await getLogHtml({
                    nodes: filteredNodes,
                    charInfo: { name: charName, chatName: chatName, avatarUrl: charAvatarUrl },
                    selectedThemeKey: settings.theme || 'basic',
                    selectedColorKey: settings.color || 'dark',
                    showAvatar: settings.showAvatar,
                    showHeader: settings.showHeader,
                    showFooter: settings.showFooter,
                    showBubble: settings.showBubble,
                    embedImagesAsBase64: true, // Embed images for preview
                    globalSettings: globalSettings,
                });
                content = `${overrideStyle}<div style="${style}">${logHtml}</div>`;
            } else if (settings.format === 'html') {
                const htmlLog = await generateHtmlPreview(filteredNodes, settings);
                content = htmlLog.replace('</style>', `
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
            } else if (settings.format === 'markdown') {
                const markdownLog = await generateMarkdownLog(filteredNodes, charName);
                content = `${overrideStyle}<div style="${preWrapperStyle}"><pre style="${preStyle}">${markdownLog}</pre></div>`;
            } else {
                const textLog = await generateTextLog(filteredNodes, charName);
                content = `${overrideStyle}<div style="${preWrapperStyle}"><pre style="${preStyle}">${textLog}</pre></div>`;
            }
            setPreviewContent(content);
        };

        generatePreview();
    }, [messageNodes, savedSettings, globalSettings, charName, chatName, charAvatarUrl]);

    const handleClose = () => {
        onClose();
    };

    const uiTheme = globalSettings.uiTheme || 'dark';

    return (
        <div className="log-exporter-modal-backdrop" onClick={handleClose}>
            <div className="log-exporter-modal" data-theme={uiTheme} onClick={(e) => e.stopPropagation()}>
                <div className="log-exporter-modal-header-bar">
                    <button id="log-exporter-close" className="log-exporter-modal-close-btn" title="닫기 (Esc)" aria-label="모달 닫기" onClick={handleClose}>
                        &times;
                    </button>
                    <span className="header-title">로그 내보내기 옵션</span>
                    <span className="header-help">(Ctrl+/ 도움말)</span>
                </div>
                <div className="log-exporter-modal-content">
                    <SettingsPanel 
                        settings={savedSettings} 
                        onSettingChange={handleSettingChange} 
                        themes={THEMES} 
                        colors={COLORS} 
                        participants={participants}
                        globalSettings={globalSettings}
                        onGlobalSettingChange={handleGlobalSettingChange}
                        arcaTitle={arcaTitle}
                        setArcaTitle={setArcaTitle}
                        arcaContent={arcaContent}
                        setArcaContent={setArcaContent}
                        messageNodes={messageNodes}
                        uiClasses={uiClasses}
                    />
                    <PreviewPanel 
                        previewContent={previewContent}
                        settings={savedSettings}
                    />
                </div>
                <Actionbar 
                    charName={charName} 
                    chatName={chatName} 
                    getPreviewContent={() => Promise.resolve(previewContent)} 
                    messageNodes={messageNodes}
                    settings={savedSettings}
                    backgroundColor={backgroundColor}
                    charAvatarUrl={charAvatarUrl}
                />
            </div>
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
