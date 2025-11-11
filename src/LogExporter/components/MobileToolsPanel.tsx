import React, { useEffect } from 'react';

interface MobileToolsPanelProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  imageSizeWarning?: string;
}

const MobileToolsPanel: React.FC<MobileToolsPanelProps> = ({ settings, onSettingChange, imageSizeWarning }) => {
  
  const resolution = settings.imageResolution === 'auto' ? 1 : (Number(settings.imageResolution) || 1);
  const browserMaxHeight = 16384;
  const maxAllowedHeight = Math.floor(browserMaxHeight / resolution);

  useEffect(() => {
    if (settings.maxImageHeight > maxAllowedHeight) {
      onSettingChange('maxImageHeight', maxAllowedHeight);
    }
  }, [settings.imageResolution, settings.maxImageHeight, maxAllowedHeight, onSettingChange]);

  return (
    <div className="mobile-settings-container">
      {/* 미리보기 옵션 */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <span className="mobile-card-icon">👁️</span>
          <span className="mobile-card-title">미리보기 옵션</span>
        </div>
        <div className="mobile-card-content">
          <div className="mobile-field">
            <label className="mobile-field-label">글자 크기</label>
            <input 
              type="number" 
              className="mobile-input-number" 
              value={settings.previewFontSize || 16} 
              onChange={(e) => onSettingChange('previewFontSize', Number(e.target.value))} 
              min="10" 
              max="32"
            />
          </div>
          <div className="mobile-field">
            <label className="mobile-field-label">너비 (px)</label>
            <input 
              type="number" 
              className="mobile-input-number" 
              value={settings.previewWidth || 800} 
              onChange={(e) => onSettingChange('previewWidth', Number(e.target.value))} 
              min="320" 
              max="1920" 
              step="10"
            />
          </div>
        </div>
      </div>

      {/* 이미지 내보내기 */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <span className="mobile-card-icon">📷</span>
          <span className="mobile-card-title">이미지 내보내기</span>
        </div>
        {imageSizeWarning && (
          <div style={{ color: 'var(--text-warning)', padding: '12px 16px', fontSize: '0.9em', background: 'rgba(224, 175, 104, 0.1)', borderBottom: '1px solid var(--border-color-light)' }}>
            {imageSizeWarning}
          </div>
        )}
        <div className="mobile-card-content">
          <div className="mobile-field">
            <label className="mobile-field-label">해상도</label>
            <div className="mobile-chip-scroll">
              <button 
                className={`mobile-chip ${settings.imageResolution === '1' || !settings.imageResolution ? 'active' : ''}`}
                onClick={() => onSettingChange('imageResolution', '1')}
              >
                ⚡ 1x
              </button>
              <button 
                className={`mobile-chip ${settings.imageResolution === '2' ? 'active' : ''}`}
                onClick={() => onSettingChange('imageResolution', '2')}
              >
                🔥 2x
              </button>
              <button 
                className={`mobile-chip ${settings.imageResolution === '3' ? 'active' : ''}`}
                onClick={() => onSettingChange('imageResolution', '3')}
              >
                💎 3x
              </button>
            </div>
          </div>

          <div className="mobile-field">
            <label className="mobile-field-label">라이브러리</label>
            <select 
              className="mobile-select" 
              value={settings.imageLibrary || 'html-to-image'} 
              onChange={(e) => onSettingChange('imageLibrary', e.target.value)}
            >
              <option value="html-to-image">html-to-image</option>
              <option value="html2canvas">html2canvas</option>
              <option value="dom-to-image">dom-to-image-more</option>
            </select>
          </div>

          <div className="mobile-field">
            <label className="mobile-field-label">이미지 분할</label>
            <select 
              className="mobile-select" 
              value={settings.splitImage || 'none'} 
              onChange={(e) => onSettingChange('splitImage', e.target.value)}
            >
              <option value="none">분할 안함</option>
              <option value="chunk">청크 단위 (1개 파일로 병합)</option>
              <option value="message">메시지 단위 (여러 파일)</option>
            </select>
          </div>
            
            {settings.splitImage && settings.splitImage !== 'none' && (
              <div className="mobile-field">
                <label className="mobile-field-label">최대 높이 (px)</label>
                <input 
                  type="number" 
                  className="mobile-input-number" 
                  value={settings.maxImageHeight || 10000} 
                  onChange={(e) => onSettingChange('maxImageHeight', parseInt(e.target.value, 10))} 
                  min="1000" 
                  max={maxAllowedHeight} 
                  step="1000"
                />
              </div>
            )}

          <div className="mobile-toggle-list">
            <div className="mobile-toggle-item">
              <span className="mobile-toggle-label">Raw HTML 보기</span>
              <div 
                className={`mobile-switch ${settings.rawHtmlView === true ? 'active' : ''}`}
                onClick={() => onSettingChange('rawHtmlView', settings.rawHtmlView !== true)}
              >
                <div className="mobile-switch-thumb"></div>
              </div>
            </div>

            <div className="mobile-toggle-item">
              <span className="mobile-toggle-label">✍️ 로그 편집</span>
              <div 
                className={`mobile-switch ${settings.isEditable === true ? 'active' : ''}`}
                onClick={() => onSettingChange('isEditable', settings.isEditable !== true)}
              >
                <div className="mobile-switch-thumb"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileToolsPanel;
