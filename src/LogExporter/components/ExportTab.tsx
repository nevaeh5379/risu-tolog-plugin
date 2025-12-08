import React from 'react';

interface ExportTabProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  themes: any;
  colors: any;
}

const ExportTab: React.FC<ExportTabProps> = ({ settings, onSettingChange, themes, colors }) => {
  
  const handleFormatChange = (format: string) => {
    onSettingChange('format', format);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('theme', e.target.value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('color', e.target.value);
  };

  const Toggle: React.FC<{ settingKey: string, label: string, value: any, defaultOn?: boolean, description?: string }> = ({ 
    settingKey, label, value, defaultOn = true, description 
  }) => {
    const isChecked = defaultOn ? value !== false : value === true;
    const handleChange = () => {
      onSettingChange(settingKey, !isChecked);
    };
    
    return (
      <div className="tab-option-row">
        <div className="option-info">
          <span className="option-label">{label}</span>
          {description && <span className="option-description">{description}</span>}
        </div>
        <div className={`tab-toggle ${isChecked ? 'active' : ''}`} onClick={handleChange}>
          <input type="checkbox" checked={isChecked} style={{display: 'none'}} readOnly />
        </div>
      </div>
    );
  };

  return (
    <div className="tab-content">
      {/* 출력 형식 */}
      <div className="tab-section">
        <h3 className="tab-section-title">📄 출력 형식</h3>
        <div className="format-grid">
          <button 
            className={`format-card ${(!settings.format || settings.format === 'basic') ? 'active' : ''}`}
            onClick={() => handleFormatChange('basic')}
          >
            <div className="format-icon">📱</div>
            <div className="format-name">기본</div>
            <div className="format-desc">최적화된 로그</div>
          </button>
          <button 
            className={`format-card ${settings.format === 'html' ? 'active' : ''}`}
            onClick={() => handleFormatChange('html')}
          >
            <div className="format-icon">🌐</div>
            <div className="format-name">HTML</div>
            <div className="format-desc">원본 형식 유지</div>
          </button>
          <button 
            className={`format-card ${settings.format === 'markdown' ? 'active' : ''}`}
            onClick={() => handleFormatChange('markdown')}
          >
            <div className="format-icon">📝</div>
            <div className="format-name">마크다운</div>
            <div className="format-desc">텍스트 편집용</div>
          </button>
          <button 
            className={`format-card ${settings.format === 'text' ? 'active' : ''}`}
            onClick={() => handleFormatChange('text')}
          >
            <div className="format-icon">📄</div>
            <div className="format-name">텍스트</div>
            <div className="format-desc">순수 텍스트</div>
          </button>
        </div>
      </div>

      {/* 기본 형식 설정 */}
      {(settings.format === 'basic' || !settings.format) && (
        <>
          <div className="tab-section">
            <h3 className="tab-section-title">🎨 스타일</h3>
            <div className="tab-option-row">
              <span className="option-label">테마</span>
              <select className="tab-select" value={settings.theme || 'basic'} onChange={handleThemeChange}>
                {Object.entries(themes).map(([key, theme]: [string, any]) => 
                  <option value={key} key={key}>{theme.name}</option>
                )}
              </select>
            </div>
            <div className="tab-option-row">
              <span className="option-label">색상</span>
              <select className="tab-select" value={settings.color || 'dark'} onChange={handleColorChange}>
                {Object.entries(colors).map(([key, color]: [string, any]) => 
                  <option value={key} key={key}>{color.name}</option>
                )}
              </select>
            </div>
              <div className="tab-option-row">
                <span className="option-label">헤더 레이아웃</span>
                <select className="tab-select" value={settings.headerLayout || 'default'} onChange={(e) => onSettingChange('headerLayout', e.target.value)}>
                  <option value="default">기본</option>
                  <option value="compact">컴팩트</option>
                  <option value="banner">배너</option>
                  <option value="smart">스마트</option>
                  <option value="cover">커버</option>
                </select>
              </div>
          </div>

          {settings.theme === 'custom' && (
            <div className="tab-section">
              <h3 className="tab-section-title">🎨 커스텀 CSS</h3>
              <textarea
                className="tab-textarea"
                style={{ width: '100%', minHeight: '150px', resize: 'vertical' }}
                value={settings.customCss || ''}
                onChange={(e) => onSettingChange('customCss', e.target.value)}
                placeholder="여기에 CSS 코드를 입력하세요..."
              />
            </div>
          )}

          <div className="tab-section">
            <h3 className="tab-section-title">👁️ 표시 옵션</h3>
            <Toggle settingKey="showAvatar" label="아바타" description="프로필 이미지 표시" value={settings.showAvatar} />
            <Toggle settingKey="showBubble" label="말풍선" description="메시지 말풍선 스타일" value={settings.showBubble} />
            <Toggle settingKey="showHeader" label="헤더" description="상단 정보 표시" value={settings.showHeader} />
            {settings.showHeader !== false && (
              <div style={{marginTop: '10px', paddingLeft: '10px', borderLeft: '2px solid var(--border-color-light)'}}>
                <Toggle settingKey="showHeaderIcon" label="헤더 아이콘" description="헤더 프로필 이미지 표시" value={settings.showHeaderIcon} />
                <div className="tab-option-row">
                  <span className="option-label">헤더 태그</span>
                  <input type="text" className="tab-input" value={settings.headerTags || ''} onChange={(e) => onSettingChange('headerTags', e.target.value)} placeholder="쉼표로 태그 구분" />
                </div>
                {settings.headerLayout === 'banner' && (
                  <>
                    <div className="tab-option-row">
                      <span className="option-label">배너 이미지 URL</span>
                      <input type="text" className="tab-input" value={settings.headerBannerUrl || ''} onChange={(e) => onSettingChange('headerBannerUrl', e.target.value)} placeholder="https://..." />
                    </div>
                    <Toggle settingKey="headerBannerBlur" label="블러 효과" description="배너 이미지에 블러 효과 적용" value={settings.headerBannerBlur} />
                                      <div className="tab-option-row">
                                        <span className="option-label">이미지 정렬</span>
                                        <div className="slider-container" style={{ flex: 1 }}>
                                          <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={settings.headerBannerAlign || 50} 
                                            className="tab-slider" 
                                            onChange={(e) => onSettingChange('headerBannerAlign', parseInt(e.target.value, 10))} 
                                          />
                                          <div className="slider-value">{settings.headerBannerAlign || 50}%</div>
                                        </div>
                                      </div>                  </>
                )}
              </div>
            )}
            <Toggle settingKey="showFooter" label="푸터" description="하단 정보 표시" value={settings.showFooter} />
            {settings.showFooter !== false && (
              <div style={{marginTop: '10px', paddingLeft: '10px', borderLeft: '2px solid var(--border-color-light)'}}>
                <div className="tab-option-row">
                  <span className="option-label">푸터 (왼쪽)</span>
                  <input type="text" className="tab-input" value={settings.footerLeft || ''} onChange={(e) => onSettingChange('footerLeft', e.target.value)} />
                </div>
                <div className="tab-option-row">
                  <span className="option-label">푸터 (중앙)</span>
                  <input type="text" className="tab-input" value={settings.footerCenter || ''} onChange={(e) => onSettingChange('footerCenter', e.target.value)} />
                </div>
                <div className="tab-option-row">
                  <span className="option-label">푸터 (오른쪽)</span>
                  <input type="text" className="tab-input" value={settings.footerRight || ''} onChange={(e) => onSettingChange('footerRight', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="tab-section">
            <h3 className="tab-section-title">🖼️ 이미지 크기</h3>
            <div className="slider-container">
              <input 
                type="range" 
                min="1" 
                max="100" 
                step="1" 
                value={settings.imageScale || 100} 
                className="tab-slider" 
                onChange={(e) => onSettingChange('imageScale', e.target.value)} 
              />
              <div className="slider-value">{settings.imageScale || 100}%</div>
            </div>
          </div>
        </>
      )}

      {/* HTML 형식 설정 */}
      {settings.format === 'html' && (
        <div className="tab-section">
          <h3 className="tab-section-title">⚙️ HTML 옵션</h3>
          <Toggle settingKey="embedImages" label="이미지 내장" description="이미지를 Base64로 포함" value={settings.embedImages} />
          <Toggle settingKey="expandHover" label="호버 요소 펼치기" description="접힌 요소 자동 펼침" value={settings.expandHover} defaultOn={false} />
        </div>
      )}
    </div>
  );
};

export default ExportTab;
