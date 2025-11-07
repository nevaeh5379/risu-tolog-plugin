import React from 'react';

interface ToolsPanelProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({ settings, onSettingChange }) => {

    const Toggle: React.FC<{ settingKey: string, label: string, value: any, defaultOn?: boolean }> = ({ settingKey, label, value, defaultOn = true }) => {
        const isChecked = defaultOn ? value !== false : value === true;
        const handleChange = () => {
            onSettingChange(settingKey, !isChecked);
        };
        return (
            <div className="desktop-option-row">
                <span className="desktop-option-label">{label}</span>
                <div className={`desktop-toggle ${isChecked ? 'active' : ''}`} onClick={handleChange}>
                    <input type="checkbox" checked={isChecked} style={{display: 'none'}} readOnly />
                </div>
            </div>
        );
    };

  return (
    <>
        <div className="desktop-section" id="desktop-preview-controls">
            <div className="desktop-section-header">
                <span className="desktop-section-icon">👁️</span>
                <span className="desktop-section-title">미리보기 옵션</span>
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">글자 크기</span>
                <input type="number" className="desktop-input" data-setting-key="previewFontSize" value={settings.previewFontSize || 16} onChange={(e) => onSettingChange('previewFontSize', e.target.value)} min="10" max="32" />
            </div>
            <div className="desktop-option-row">
                <span className="desktop-option-label">너비</span>
                <input type="number" className="desktop-input" data-setting-key="previewWidth" value={settings.previewWidth || 800} onChange={(e) => onSettingChange('previewWidth', e.target.value)} min="320" max="1920" step="10" />
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
            <Toggle settingKey="splitImage" label="긴 이미지 분할" value={settings.splitImage} defaultOn={false} />
            {settings.splitImage && (
                <div className="desktop-option-row">
                    <label htmlFor="max-height-input" className="desktop-option-label">최대 높이 (px)</label>
                    <input id="max-height-input" type="number" className="desktop-input" value={settings.maxImageHeight || 10000} onChange={(e) => onSettingChange('maxImageHeight', parseInt(e.target.value, 10))} min="1000" max="50000" step="1000" />
                </div>
            )}
            <Toggle settingKey="rawHtmlView" label="Raw HTML 보기" value={settings.rawHtmlView} defaultOn={false} />
        </div>


    </>
  );
};

export default ToolsPanel;
