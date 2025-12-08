import React, { useState } from 'react';
import type { UIClassInfo } from '../utils/domUtils';

interface MobileSettingsPanelProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  themes: any;
  colors: any;
  participants: Set<string>;
  globalSettings: any;
  onGlobalSettingChange: (key: string, value: any) => void;
  uiClasses: UIClassInfo[];
}

const MobileSettingsPanel: React.FC<MobileSettingsPanelProps> = ({ 
  settings, 
  onSettingChange, 
  themes, 
  colors, 
  participants, 
  globalSettings, 
  onGlobalSettingChange, 
  uiClasses 
}) => {
  const [newProfileClass, setNewProfileClass] = useState('');
  const [newParticipantNameClass, setNewParticipantNameClass] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    customSelectors: false,
    participants: false,
    uiFilters: false
  });

  const handleAddProfileClass = () => {
    if (newProfileClass && !globalSettings.profileClasses?.includes(newProfileClass)) {
      const newClasses = [...(globalSettings.profileClasses || []), newProfileClass];
      onGlobalSettingChange('profileClasses', newClasses);
      setNewProfileClass('');
    }
  };

  const handleRemoveProfileClass = (cls: string) => {
    const newClasses = globalSettings.profileClasses?.filter((c: string) => c !== cls);
    onGlobalSettingChange('profileClasses', newClasses);
  };

  const handleAddParticipantNameClass = () => {
    if (newParticipantNameClass && !globalSettings.participantNameClasses?.includes(newParticipantNameClass)) {
      const newClasses = [...(globalSettings.participantNameClasses || []), newParticipantNameClass];
      onGlobalSettingChange('participantNameClasses', newClasses);
      setNewParticipantNameClass('');
    }
  };

  const handleRemoveParticipantNameClass = (cls: string) => {
    const newClasses = globalSettings.participantNameClasses?.filter((c: string) => c !== cls);
    onGlobalSettingChange('participantNameClasses', newClasses);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="mobile-settings-container">
      {/* UI 테마 */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <span className="mobile-card-icon">🖥️</span>
          <span className="mobile-card-title">UI 테마</span>
        </div>
        <div className="mobile-card-content">
          <div className="mobile-select-group">
            <select 
              className="mobile-select" 
              value={globalSettings.uiTheme || 'dark'} 
              onChange={(e) => onGlobalSettingChange('uiTheme', e.target.value)}
            >
              <option value="dark">다크 (모던)</option>
              <option value="classic">클래식</option>
              <option value="light">라이트</option>
            </select>
          </div>
        </div>
      </div>

      {/* 출력 형식 */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <span className="mobile-card-icon">📄</span>
          <span className="mobile-card-title">출력 형식</span>
        </div>
        <div className="mobile-card-content">
          <div className="mobile-chip-scroll">
            <button 
              className={`mobile-chip ${!settings.format || settings.format === 'basic' ? 'active' : ''}`}
              onClick={() => onSettingChange('format', 'basic')}
            >
              ✨ 기본
            </button>
            <button 
              className={`mobile-chip ${settings.format === 'html' ? 'active' : ''}`}
              onClick={() => onSettingChange('format', 'html')}
            >
              🌐 HTML
            </button>
            <button 
              className={`mobile-chip ${settings.format === 'markdown' ? 'active' : ''}`}
              onClick={() => onSettingChange('format', 'markdown')}
            >
              📝 마크다운
            </button>
            <button 
              className={`mobile-chip ${settings.format === 'text' ? 'active' : ''}`}
              onClick={() => onSettingChange('format', 'text')}
            >
              📄 텍스트
            </button>
          </div>
        </div>
      </div>

      {/* 테마 & 색상 (기본 형식일 때만) */}
      {(settings.format === 'basic' || !settings.format) && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <span className="mobile-card-icon">🎨</span>
            <span className="mobile-card-title">테마 & 색상</span>
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
            <div className="mobile-field">
              <label className="mobile-field-label">헤더 레이아웃</label>
              <select 
                className="mobile-select" 
                value={settings.headerLayout || 'default'} 
                onChange={(e) => onSettingChange('headerLayout', e.target.value)}
              >
                <option value="default">기본</option>
                <option value="compact">컴팩트</option>
                <option value="banner">배너</option>
                <option value="smart">스마트</option>
                <option value="cover">커버</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 커스텀 CSS (커스텀 테마일 때만) */}
      {settings.theme === 'custom' && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <span className="mobile-card-icon">✍️</span>
            <span className="mobile-card-title">커스텀 CSS</span>
          </div>
          <div className="mobile-card-content">
            <textarea
              className="mobile-textarea"
              style={{ minHeight: '200px' }}
              value={settings.customCss || ''}
              onChange={(e) => onSettingChange('customCss', e.target.value)}
              placeholder="여기에 CSS 코드를 입력하세요..."
            />
          </div>
        </div>
      )}

      {/* 표시 옵션 (기본 형식일 때만) */}
      {(settings.format === 'basic' || !settings.format) && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <span className="mobile-card-icon">👁️</span>
            <span className="mobile-card-title">표시 옵션</span>
          </div>
          <div className="mobile-card-content">
            <div className="mobile-toggle-list">
              <div className="mobile-toggle-item">
                <span className="mobile-toggle-label">💬 아바타</span>
                <div 
                  className={`mobile-switch ${settings.showAvatar !== false ? 'active' : ''}`}
                  onClick={() => onSettingChange('showAvatar', settings.showAvatar === false)}
                >
                  <div className="mobile-switch-thumb"></div>
                </div>
              </div>
              <div className="mobile-toggle-item">
                <span className="mobile-toggle-label">💭 말풍선</span>
                <div 
                  className={`mobile-switch ${settings.showBubble !== false ? 'active' : ''}`}
                  onClick={() => onSettingChange('showBubble', settings.showBubble === false)}
                >
                  <div className="mobile-switch-thumb"></div>
                </div>
              </div>
              <div className="mobile-toggle-item">
                <span className="mobile-toggle-label">📌 헤더</span>
                <div 
                  className={`mobile-switch ${settings.showHeader !== false ? 'active' : ''}`}
                  onClick={() => onSettingChange('showHeader', settings.showHeader === false)}
                >
                  <div className="mobile-switch-thumb"></div>
                </div>
              </div>
              {settings.showHeader !== false && (
                <div style={{padding: '10px 20px 0', display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div className="mobile-toggle-item" style={{padding: 0}}>
                    <span className="mobile-toggle-label" style={{fontSize: '0.9em'}}>🖼️ 헤더 아이콘</span>
                    <div 
                      className={`mobile-switch ${settings.showHeaderIcon !== false ? 'active' : ''}`}
                      onClick={() => onSettingChange('showHeaderIcon', settings.showHeaderIcon === false)}
                    >
                      <div className="mobile-switch-thumb"></div>
                    </div>
                  </div>
                  <div className="mobile-field" style={{marginTop: '10px'}}>
                    <label className="mobile-field-label">헤더 태그 (쉼표로 구분)</label>
                    <input type="text" className="mobile-input" value={settings.headerTags || ''} onChange={(e) => onSettingChange('headerTags', e.target.value)} />
                  </div>
                  {settings.headerLayout === 'banner' && (
                    <>
                      <div className="mobile-field" style={{marginTop: '10px'}}>
                        <label className="mobile-field-label">배너 이미지 URL</label>
                        <input type="text" className="mobile-input" value={settings.headerBannerUrl || ''} onChange={(e) => onSettingChange('headerBannerUrl', e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="mobile-toggle-item" style={{padding: '10px 0'}}>
                        <span className="mobile-toggle-label">블러 효과</span>
                        <div 
                          className={`mobile-switch ${settings.headerBannerBlur !== false ? 'active' : ''}`}
                          onClick={() => onSettingChange('headerBannerBlur', settings.headerBannerBlur === false)}
                        >
                          <div className="mobile-switch-thumb"></div>
                        </div>
                      </div>
                      <div className="mobile-field">
                        <label className="mobile-field-label">이미지 정렬</label>
                        <div className="mobile-slider-field">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={settings.headerBannerAlign || 50} 
                            className="mobile-slider" 
                            onChange={(e) => onSettingChange('headerBannerAlign', parseInt(e.target.value, 10))} 
                          />
                          <div className="mobile-slider-value">{settings.headerBannerAlign || 50}%</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="mobile-toggle-item">
                <span className="mobile-toggle-label">📝 푸터</span>
                <div 
                  className={`mobile-switch ${settings.showFooter !== false ? 'active' : ''}`}
                  onClick={() => onSettingChange('showFooter', settings.showFooter === false)}
                >
                  <div className="mobile-switch-thumb"></div>
                </div>
              </div>
            </div>
            {settings.showFooter !== false && (
              <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div className="mobile-field">
                  <label className="mobile-field-label">푸터 (왼쪽)</label>
                  <input type="text" className="mobile-input" value={settings.footerLeft || ''} onChange={(e) => onSettingChange('footerLeft', e.target.value)} />
                </div>
                <div className="mobile-field">
                  <label className="mobile-field-label">푸터 (중앙)</label>
                  <input type="text" className="mobile-input" value={settings.footerCenter || ''} onChange={(e) => onSettingChange('footerCenter', e.target.value)} />
                </div>
                <div className="mobile-field">
                  <label className="mobile-field-label">푸터 (오른쪽)</label>
                  <input type="text" className="mobile-input" value={settings.footerRight || ''} onChange={(e) => onSettingChange('footerRight', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 이미지 스케일 (기본 형식일 때만) */}
      {(settings.format === 'basic' || !settings.format) && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <span className="mobile-card-icon">🖼️</span>
            <span className="mobile-card-title">이미지 스케일</span>
          </div>
          <div className="mobile-card-content">
            <div className="mobile-slider-field">
              <input 
                type="range" 
                min="1" 
                max="100" 
                step="1" 
                value={settings.imageScale || 100} 
                className="mobile-slider" 
                onChange={(e) => onSettingChange('imageScale', e.target.value)} 
              />
              <div className="mobile-slider-value">{settings.imageScale || 100}%</div>
            </div>
          </div>
        </div>
      )}

      {/* HTML 옵션 (HTML 형식일 때만) */}
      {settings.format === 'html' && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <span className="mobile-card-icon">⚙️</span>
            <span className="mobile-card-title">HTML 옵션</span>
          </div>
          <div className="mobile-card-content">
            <div className="mobile-toggle-list">
              <div className="mobile-toggle-item">
                <span className="mobile-toggle-label">🖼️ 이미지 내장</span>
                <div 
                  className={`mobile-switch ${settings.embedImages !== false ? 'active' : ''}`}
                  onClick={() => onSettingChange('embedImages', settings.embedImages === false)}
                >
                  <div className="mobile-switch-thumb"></div>
                </div>
              </div>
              <div className="mobile-toggle-item">
                <span className="mobile-toggle-label">🖱️ 호버 요소 펼치기</span>
                <div 
                  className={`mobile-switch ${settings.expandHover === true ? 'active' : ''}`}
                  onClick={() => onSettingChange('expandHover', settings.expandHover !== true)}
                >
                  <div className="mobile-switch-thumb"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 참가자 필터 */}
      <div className="mobile-card">
        <div 
          className="mobile-card-header clickable" 
          onClick={() => toggleSection('participants')}
        >
          <span className="mobile-card-icon">👥</span>
          <span className="mobile-card-title">참가자 필터</span>
          <span className="mobile-expand-icon">{expandedSections.participants ? '▼' : '▶'}</span>
        </div>
        {expandedSections.participants && (
          <div className="mobile-card-content">
            <div className="mobile-toggle-list">
              {Array.from(participants).map(p => {
                const isVisible = !globalSettings.filteredParticipants?.includes(p);
                return (
                  <div key={p} className="mobile-toggle-item">
                    <span className="mobile-toggle-label">{p}</span>
                    <div 
                      className={`mobile-switch ${isVisible ? 'active' : ''}`}
                      onClick={() => {
                        const currentList = globalSettings.filteredParticipants || [];
                        const newList = isVisible 
                          ? [...currentList, p] 
                          : currentList.filter((name: string) => name !== p);
                        onGlobalSettingChange('filteredParticipants', newList);
                      }}
                    >
                      <div className="mobile-switch-thumb"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 커스텀 선택자 */}
      <div className="mobile-card">
        <div 
          className="mobile-card-header clickable" 
          onClick={() => toggleSection('customSelectors')}
        >
          <span className="mobile-card-icon">✍️</span>
          <span className="mobile-card-title">커스텀 선택자</span>
          <span className="mobile-expand-icon">{expandedSections.customSelectors ? '▼' : '▶'}</span>
        </div>
        {expandedSections.customSelectors && (
          <div className="mobile-card-content">
            <div className="mobile-field">
              <label className="mobile-field-label">프로필 클래스</label>
              <div className="mobile-input-group">
                <input 
                  type="text" 
                  className="mobile-input" 
                  value={newProfileClass} 
                  onChange={(e) => setNewProfileClass(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProfileClass()}
                  placeholder="클래스 이름 입력..."
                />
                <button className="mobile-input-btn" onClick={handleAddProfileClass}>
                  추가
                </button>
              </div>
              {globalSettings.profileClasses?.map((cls: string) => (
                <div key={cls} className="mobile-tag">
                  <span className="mobile-tag-text">{cls}</span>
                  <button className="mobile-tag-remove" onClick={() => handleRemoveProfileClass(cls)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mobile-field">
              <label className="mobile-field-label">참가자 이름 클래스</label>
              <div className="mobile-input-group">
                <input 
                  type="text" 
                  className="mobile-input" 
                  value={newParticipantNameClass} 
                  onChange={(e) => setNewParticipantNameClass(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddParticipantNameClass()}
                  placeholder="클래스 이름 입력..."
                />
                <button className="mobile-input-btn" onClick={handleAddParticipantNameClass}>
                  추가
                </button>
              </div>
              {globalSettings.participantNameClasses?.map((cls: string) => (
                <div key={cls} className="mobile-tag">
                  <span className="mobile-tag-text">{cls}</span>
                  <button className="mobile-tag-remove" onClick={() => handleRemoveParticipantNameClass(cls)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* UI 요소 필터 */}
      <div className="mobile-card">
        <div 
          className="mobile-card-header clickable" 
          onClick={() => toggleSection('uiFilters')}
        >
          <span className="mobile-card-icon">🔍</span>
          <span className="mobile-card-title">UI 요소 필터</span>
          <span className="mobile-expand-icon">{expandedSections.uiFilters ? '▼' : '▶'}</span>
        </div>
        {expandedSections.uiFilters && (
          <div className="mobile-card-content">
            <div className="mobile-toggle-list">
              {uiClasses.map(classInfo => {
                const isChecked = settings.customFilters?.[classInfo.name] ?? false;
                return (
                  <div key={classInfo.name} className="mobile-toggle-item">
                    <span className="mobile-toggle-label" style={{fontFamily: 'monospace', fontSize: '0.85em'}}>
                      {classInfo.displayName}
                    </span>
                    <div 
                      className={`mobile-switch ${isChecked ? 'active' : ''}`}
                      onClick={() => {
                        const newFilters = { ...(settings.customFilters || {}), [classInfo.name]: !isChecked };
                        onSettingChange('customFilters', newFilters);
                      }}
                    >
                      <div className="mobile-switch-thumb"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSettingsPanel;
