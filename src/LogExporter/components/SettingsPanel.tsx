import React from 'react';

interface SettingsPanelProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  themes: any;
  colors: any;
  participants: Set<string>;
  globalSettings: any;
  onGlobalSettingChange: (key: string, value: any) => void;
  arcaTitle: string;
  setArcaTitle: (title: string) => void;
  arcaContent: string;
  setArcaContent: (content: string) => void;
  messageNodes: HTMLElement[];
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingChange, themes, colors, participants, globalSettings, onGlobalSettingChange, arcaTitle, setArcaTitle, arcaContent, setArcaContent, messageNodes }) => {

  const handleFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('format', e.target.value);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('theme', e.target.value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('color', e.target.value);
  };

  return (
    <div className="desktop-settings-panel">
        <div className="desktop-section">
            <div className="desktop-section-header">
                <span className="desktop-section-icon">📄</span>
                <span className="desktop-section-title">출력 형식</span>
            </div>
            <div className="desktop-radio-group">
                <label className={`desktop-radio-label ${settings.format === 'html' ? 'active' : ''}`}>
                    <input type="radio" name="log-format-desktop" value="html" data-setting-key="format" checked={settings.format === 'html'} onChange={handleFormatChange} style={{display: 'none'}} />
                    HTML
                </label>
                <label className={`desktop-radio-label ${!settings.format || settings.format === 'basic' ? 'active' : ''}`}>
                    <input type="radio" name="log-format-desktop" value="basic" data-setting-key="format" checked={!settings.format || settings.format === 'basic'} onChange={handleFormatChange} style={{display: 'none'}} />
                    기본
                </label>
                <label className={`desktop-radio-label ${settings.format === 'markdown' ? 'active' : ''}`}>
                    <input type="radio" name="log-format-desktop" value="markdown" data-setting-key="format" checked={settings.format === 'markdown'} onChange={handleFormatChange} style={{display: 'none'}} />
                    마크다운
                </label>
                <label className={`desktop-radio-label ${settings.format === 'text' ? 'active' : ''}`}>
                    <input type="radio" name="log-format-desktop" value="text" data-setting-key="format" checked={settings.format === 'text'} onChange={handleFormatChange} style={{display: 'none'}} />
                    텍스트
                </label>
            </div>
        </div>
        
        <div className="desktop-section" id="desktop-basic-options" style={{display: settings.format === 'basic' ? 'block' : 'none'}}>
            <div className="desktop-section-header">
                <span className="desktop-section-icon">🎨</span>
                <span className="desktop-section-title">테마 & 스타일</span>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">테마</span>
                <select id="theme-selector" name="log-theme" className="desktop-select" data-setting-key="theme" value={settings.theme || 'basic'} onChange={handleThemeChange}>
                {Object.entries(themes).map(([key, theme]: [string, any]) => 
                    <option value={key} key={key}>{theme.name}</option>
                )}
                </select>
            </div>
            <div className="desktop-option-row" id="color-selector-container">
                <span className="desktop-option-label">색상</span>
                <select id="color-selector" name="log-color" className="desktop-select" data-setting-key="color" value={settings.color || 'dark'} onChange={handleColorChange}>
                    {Object.entries(colors).map(([key, color]: [string, any]) => 
                        <option value={key} key={key}>{color.name}</option>
                    )}
                </select>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">💬 아바타 표시</span>
                <div className={`desktop-toggle ${settings.showAvatar !== false ? 'active' : ''}`} onClick={() => onSettingChange('showAvatar', settings.showAvatar === false)}>
                    <input type="checkbox" data-setting-key="showAvatar" checked={settings.showAvatar !== false} style={{display: 'none'}} readOnly />
                </div>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">💭 말풍선 표시</span>
                <div className={`desktop-toggle ${settings.showBubble !== false ? 'active' : ''}`} onClick={() => onSettingChange('showBubble', settings.showBubble === false)}>
                    <input type="checkbox" data-setting-key="showBubble" checked={settings.showBubble !== false} style={{display: 'none'}} readOnly />
                </div>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">📌 헤더 표시</span>
                <div className={`desktop-toggle ${settings.showHeader !== false ? 'active' : ''}`} onClick={() => onSettingChange('showHeader', settings.showHeader === false)}>
                    <input type="checkbox" data-setting-key="showHeader" checked={settings.showHeader !== false} style={{display: 'none'}} readOnly />
                </div>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">📝 푸터 표시</span>
                <div className={`desktop-toggle ${settings.showFooter !== false ? 'active' : ''}`} onClick={() => onSettingChange('showFooter', settings.showFooter === false)}>
                    <input type="checkbox" data-setting-key="showFooter" checked={settings.showFooter !== false} style={{display: 'none'}} readOnly />
                </div>
            </div>
        </div>

        <div className="desktop-section" id="desktop-image-scale-controls" style={{display: settings.format === 'basic' ? 'block' : 'none'}}>
            <div className="desktop-section-header">
                <span className="desktop-section-icon">🖼️</span>
                <span className="desktop-section-title">이미지 스케일</span>
            </div>
            <div className="desktop-slider-container">
                <input type="range" min="50" max="200" step="10" data-setting-key="imageScale" value={settings.imageScale || 100} className="desktop-slider" onChange={(e) => onSettingChange('imageScale', e.target.value)} />
                <div style={{textAlign: 'center', fontSize: '0.9em', color: '#8a98c9', marginTop: '8px'}}>{settings.imageScale || 100}%</div>
            </div>
        </div>

        <div className="desktop-section" id="desktop-html-options" style={{display: settings.format === 'html' ? 'block' : 'none'}}>
            <div className="desktop-section-header">
                <span className="desktop-section-icon">⚙️</span>
                <span className="desktop-section-title">HTML 옵션</span>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">🖼️ 이미지 내장</span>
                <div className={`desktop-toggle ${settings.embedImages !== false ? 'active' : ''}`} onClick={() => onSettingChange('embedImages', settings.embedImages === false)}>
                    <input type="checkbox" data-setting-key="embedImages" checked={settings.embedImages !== false} style={{display: 'none'}} readOnly />
                </div>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">🖱️ 호버 요소 펼치기</span>
                <div className={`desktop-toggle ${settings.expandHover === true ? 'active' : ''}`} onClick={() => onSettingChange('expandHover', settings.expandHover !== true)}>
                    <input type="checkbox" data-setting-key="expandHover" checked={settings.expandHover === true} style={{display: 'none'}} readOnly />
                </div>
            </div>
        </div>

        <div className="desktop-section">
            <div className="desktop-section-header">
                <span className="desktop-section-icon">🔍</span>
                <span className="desktop-section-title">필터</span>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">참가자</span>
            </div>
            <div className="desktop-collapsible-content open">
                {Array.from(participants).map(p => {
                    const isHidden = globalSettings.filteredParticipants?.includes(p);
                    return (
                        <div key={p} className="desktop-option-row">
                            <span className="desktop-option-label">{p}</span>
                            <div className={`desktop-toggle ${!isHidden ? 'active' : ''}`} onClick={() => onGlobalSettingChange('filteredParticipants', isHidden ? globalSettings.filteredParticipants.filter((fp: string) => fp !== p) : [...(globalSettings.filteredParticipants || []), p])}>
                                <input type="checkbox" checked={!isHidden} style={{display: 'none'}} readOnly />
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">UI 요소</span>
            </div>
        </div>

        <div className="desktop-section" id="desktop-preview-controls">
            <div className="desktop-section-header">
                <span className="desktop-section-icon">👁️</span>
                <span className="desktop-section-title">미리보기 옵션</span>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">글자 크기</span>
                <input type="number" className="desktop-input" data-setting-key="previewFontSize" value={settings.previewFontSize || 16} onChange={(e) => onSettingChange('previewFontSize', e.target.value)} />
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">너비</span>
                <input type="number" className="desktop-input" data-setting-key="previewWidth" value={settings.previewWidth || 800} onChange={(e) => onSettingChange('previewWidth', e.target.value)} />
            </div>
        </div>

        <div className="desktop-section" id="desktop-image-export-controls">
            <div className="desktop-section-header">
                <span className="desktop-section-icon">📷</span>
                <span className="desktop-section-title">이미지 내보내기</span>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">해상도</span>
                <select className="desktop-select" data-setting-key="imageResolution" value={settings.imageResolution || 1} onChange={(e) => onSettingChange('imageResolution', e.target.value)}>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                </select>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">라이브러리</span>
                <select className="desktop-select" data-setting-key="imageLibrary" value={settings.imageLibrary || 'html-to-image'} onChange={(e) => onSettingChange('imageLibrary', e.target.value)}>
                    <option value="html-to-image">html-to-image</option>
                    <option value="html2canvas">html2canvas</option>
                    <option value="dom-to-image">dom-to-image-more</option>
                </select>
            </div>
            <div className="desktop-setting-row">
                <label htmlFor="split-image-checkbox">Split Long Image</label>
                <input id="split-image-checkbox" type="checkbox" checked={settings.splitImage || false} onChange={(e) => onSettingChange('splitImage', e.target.checked)} />
            </div>
            {settings.splitImage && (
                <div className="desktop-setting-row">
                    <label htmlFor="max-height-input">Max Height (px)</label>
                    <input id="max-height-input" type="number" value={settings.maxImageHeight || 10000} onChange={(e) => onSettingChange('maxImageHeight', parseInt(e.target.value, 10))} />
                </div>
            )}
            <div className="desktop-option-row">
                <span className="desktop-option-label">Raw HTML 보기</span>
                <div className={`desktop-toggle ${settings.rawHtmlView ? 'active' : ''}`} onClick={() => onSettingChange('rawHtmlView', !settings.rawHtmlView)}>
                    <input type="checkbox" data-setting-key="rawHtmlView" checked={settings.rawHtmlView} style={{display: 'none'}} readOnly />
                </div>
            </div>
        </div>

        <div className="desktop-section" id="desktop-arca-helper-controls">
            <div className="desktop-section-header">
                <span className="desktop-section-icon">🚀</span>
                <span className="desktop-section-title">아카라이브 헬퍼</span>
                <div className={`desktop-toggle ${settings.showArcaHelper ? 'active' : ''}`} onClick={() => onSettingChange('showArcaHelper', !settings.showArcaHelper)}>
                    <input type="checkbox" data-setting-key="showArcaHelper" checked={settings.showArcaHelper} style={{display: 'none'}} readOnly />
                </div>
            </div>
            {settings.showArcaHelper && (
                <div className="desktop-collapsible-content open">
                    <div className="desktop-option-row">
                        <span className="desktop-option-label">제목</span>
                        <input type="text" className="desktop-input" style={{width: '100%'}} value={arcaTitle} onChange={(e) => setArcaTitle(e.target.value)} />
                    </div>
                    <div className="desktop-option-row">
                        <span className="desktop-option-label">내용</span>
                        <textarea className="desktop-input" style={{width: '100%', height: '100px'}} value={arcaContent} onChange={(e) => setArcaContent(e.target.value)}></textarea>
                    </div>
                    <button className="desktop-btn desktop-btn-secondary" style={{width: '100%', marginTop: '10px'}} onClick={() => {
                        let imageList = '';
                        let imageCounter = 0;
                        for (const node of messageNodes) {
                            const images = Array.from(node.querySelectorAll('img'));
                            for (let i = 0; i < images.length; i++) {
                                imageCounter++;
                                imageList += `[img]${imageCounter}.jpg[/img]\n`;
                            }
                        }
                        setArcaContent(imageList);
                    }}>이미지 목록 생성</button>
                </div>
            )}
        </div>

    </div>
  );
};

export default SettingsPanel;
