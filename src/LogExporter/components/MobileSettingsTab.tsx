import React from 'react';

interface MobileSettingsTabProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  themes: any;
  colors: any;
  participants: Set<string>;
  globalSettings: any;
  onGlobalSettingChange: (key: string, value: any) => void;
  uiClasses: any[];
}

const MobileSettingsTab: React.FC<MobileSettingsTabProps> = ({ 
  settings, 
  onSettingChange, 
  themes, 
  colors 
}) => {
  // 기존 모바일 설정 UI를 그대로 유지
  return (
    <div className="mobile-settings-container">
      <div className="mobile-card">
        <div className="mobile-card-header">
          <span className="mobile-card-icon">📄</span>
          <span className="mobile-card-title">출력 형식</span>
        </div>
        <div className="mobile-card-content">
          <div className="mobile-chip-group">
            <button 
              className={`mobile-chip ${(!settings.format || settings.format === 'basic') ? 'active' : ''}`}
              onClick={() => onSettingChange('format', 'basic')}
            >
              기본
            </button>
            <button 
              className={`mobile-chip ${settings.format === 'html' ? 'active' : ''}`}
              onClick={() => onSettingChange('format', 'html')}
            >
              HTML
            </button>
            <button 
              className={`mobile-chip ${settings.format === 'markdown' ? 'active' : ''}`}
              onClick={() => onSettingChange('format', 'markdown')}
            >
              마크다운
            </button>
            <button 
              className={`mobile-chip ${settings.format === 'text' ? 'active' : ''}`}
              onClick={() => onSettingChange('format', 'text')}
            >
              텍스트
            </button>
          </div>
        </div>
      </div>

      {(settings.format === 'basic' || !settings.format) && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <span className="mobile-card-icon">🎨</span>
            <span className="mobile-card-title">스타일</span>
          </div>
          <div className="mobile-card-content">
            <div className="mobile-field">
              <label className="mobile-field-label">테마</label>
              <select 
                className="mobile-select" 
                value={settings.theme || 'basic'} 
                onChange={(e) => onSettingChange('theme', e.target.value)}
              >
                {Object.entries(themes).map(([key, theme]: [string, any]) => 
                  <option value={key} key={key}>{theme.name}</option>
                )}
              </select>
            </div>
            <div className="mobile-field">
              <label className="mobile-field-label">색상</label>
              <select 
                className="mobile-select" 
                value={settings.color || 'dark'} 
                onChange={(e) => onSettingChange('color', e.target.value)}
              >
                {Object.entries(colors).map(([key, color]: [string, any]) => 
                  <option value={key} key={key}>{color.name}</option>
                )}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSettingsTab;
