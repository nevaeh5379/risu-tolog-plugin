import React, { useState } from 'react';
import type { UIClassInfo } from '../utils/domUtils';

interface SettingsPanelProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  themes: any;
  colors: any;
  participants: Set<string>;
  globalSettings: any;
  onGlobalSettingChange: (key: string, value: any) => void;
  uiClasses: UIClassInfo[];
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingChange, themes, colors, participants, globalSettings, onGlobalSettingChange, uiClasses }) => {
  const [newProfileClass, setNewProfileClass] = useState('');
  const [newParticipantNameClass, setNewParticipantNameClass] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['custom-selectors', 'filters', 'image-scale', 'html-options']));

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

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

  const handleFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('format', e.target.value);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('theme', e.target.value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('color', e.target.value);
  };

  const handleCustomFilterChange = (className: string, isChecked: boolean) => {
    const newFilters = { ...(settings.customFilters || {}), [className]: isChecked };
    onSettingChange('customFilters', newFilters);
  };

  const Toggle: React.FC<{ settingKey: string, label: string, value: any, isGlobal?: boolean, defaultOn?: boolean }> = ({ settingKey, label, value, isGlobal = false, defaultOn = true }) => {
    const isChecked = defaultOn ? value !== false : value === true;
    const handleChange = () => {
        if (isGlobal) {
            const currentList = globalSettings.filteredParticipants || [];
            const isHidden = currentList.includes(label);
            const newList = isHidden ? currentList.filter((p: string) => p !== label) : [...currentList, label];
            onGlobalSettingChange(settingKey, newList);
        } else {
            onSettingChange(settingKey, !isChecked);
        }
    };

    const participantIsChecked = isGlobal ? !globalSettings.filteredParticipants?.includes(label) : isChecked;

    return (
        <div className="desktop-option-row">
            <span className="desktop-option-label">{label}</span>
            <div className={`desktop-toggle ${participantIsChecked ? 'active' : ''}`} onClick={handleChange}>
                <input type="checkbox" checked={participantIsChecked} style={{display: 'none'}} readOnly />
            </div>
        </div>
    );
  };

  return (
    <>
        <div className={`desktop-section ${collapsedSections.has('ui-settings') ? 'collapsed' : ''}`}>
            <div className="desktop-section-header" onClick={() => toggleSection('ui-settings')}>
                <span className="desktop-section-icon">🖥️</span>
                <span className="desktop-section-title">UI 설정</span>
                <span className="desktop-section-collapse-icon">▼</span>
            </div>
            <div className="desktop-section-body">
                <div className="desktop-option-row">
                    <span className="desktop-option-label">UI 테마</span>
                    <select className="desktop-select" value={globalSettings.uiTheme || 'dark'} onChange={(e) => onGlobalSettingChange('uiTheme', e.target.value)}>
                        <option value="dark">다크 (모던)</option>
                        <option value="classic">클래식</option>
                        <option value="light">라이트</option>
                    </select>
                </div>
            </div>
        </div>

        <div className={`desktop-section ${collapsedSections.has('output-format') ? 'collapsed' : ''}`}>
            <div className="desktop-section-header" onClick={() => toggleSection('output-format')}>
                <span className="desktop-section-icon">📄</span>
                <span className="desktop-section-title">출력 형식</span>
                <span className="desktop-section-collapse-icon">▼</span>
            </div>
            <div className="desktop-section-body">
                <div className="desktop-radio-group">
                    <label className={`desktop-radio-label ${!settings.format || settings.format === 'basic' ? 'active' : ''}`}>
                        <input type="radio" name="log-format-desktop" value="basic" data-setting-key="format" checked={!settings.format || settings.format === 'basic'} onChange={handleFormatChange} style={{display: 'none'}} />
                        기본
                    </label>
                    <label className={`desktop-radio-label ${settings.format === 'html' ? 'active' : ''}`}>
                        <input type="radio" name="log-format-desktop" value="html" data-setting-key="format" checked={settings.format === 'html'} onChange={handleFormatChange} style={{display: 'none'}} />
                        HTML
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
        </div>
        
        {(settings.format === 'basic' || !settings.format) && (
            <div className={`desktop-section ${collapsedSections.has('theme-style') ? 'collapsed' : ''}`}>
                <div className="desktop-section-header" onClick={() => toggleSection('theme-style')}>
                    <span className="desktop-section-icon">🎨</span>
                    <span className="desktop-section-title">테마 & 스타일</span>
                    <span className="desktop-section-collapse-icon">▼</span>
                </div>
                <div className="desktop-section-body">
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
                        <span className="desktop-option-label">헤더 레이아웃</span>
                        <select className="desktop-select" value={settings.headerLayout || 'default'} onChange={(e) => onSettingChange('headerLayout', e.target.value)}>
                            <option value="default">기본</option>
                            <option value="compact">컴팩트</option>
                            <option value="banner">배너</option>
                            <option value="smart">스마트</option>
                            <option value="cover">커버</option>
                        </select>
                    </div>
                    <Toggle settingKey="showAvatar" label="💬 아바타 표시" value={settings.showAvatar} />
                    <Toggle settingKey="showBubble" label="💭 말풍선 표시" value={settings.showBubble} />
                    <Toggle settingKey="showHeader" label="📌 헤더 표시" value={settings.showHeader} />
                    <Toggle settingKey="showFooter" label="📝 푸터 표시" value={settings.showFooter} />
                </div>
            </div>
        )}

        {(settings.format === 'basic' || !settings.format) && (
            <div className={`desktop-section ${collapsedSections.has('image-scale') ? 'collapsed' : ''}`}>
                <div className="desktop-section-header" onClick={() => toggleSection('image-scale')}>
                    <span className="desktop-section-icon">🖼️</span>
                    <span className="desktop-section-title">이미지 스케일</span>
                    <span className="desktop-section-collapse-icon">▼</span>
                </div>
                <div className="desktop-section-body">
                    <div className="desktop-slider-container">
                        <input type="range" min="50" max="200" step="10" data-setting-key="imageScale" value={settings.imageScale || 100} className="desktop-slider" onChange={(e) => onSettingChange('imageScale', e.target.value)} />
                        <div style={{textAlign: 'center', fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: '6px'}}>{settings.imageScale || 100}%</div>
                    </div>
                </div>
            </div>
        )}

        {settings.format === 'html' && (
            <div className={`desktop-section ${collapsedSections.has('html-options') ? 'collapsed' : ''}`}>
                <div className="desktop-section-header" onClick={() => toggleSection('html-options')}>
                    <span className="desktop-section-icon">⚙️</span>
                    <span className="desktop-section-title">HTML 옵션</span>
                    <span className="desktop-section-collapse-icon">▼</span>
                </div>
                <div className="desktop-section-body">
                    <Toggle settingKey="embedImages" label="🖼️ 이미지 내장" value={settings.embedImages} />
                    <Toggle settingKey="expandHover" label="🖱️ 호버 요소 펼치기" value={settings.expandHover} defaultOn={false} />
                </div>
            </div>
        )}

        <div className={`desktop-section ${collapsedSections.has('filters') ? 'collapsed' : ''}`}>
            <div className="desktop-section-header" onClick={() => toggleSection('filters')}>
                <span className="desktop-section-icon">🔍</span>
                <span className="desktop-section-title">필터</span>
                <span className="desktop-section-collapse-icon">▼</span>
            </div>
            <div className="desktop-section-body">
                <div className="desktop-option-row" style={{borderBottom: 'none', paddingBottom: '6px'}}>
                    <span className="desktop-option-label" style={{fontWeight: 600, color: 'var(--text-title)'}}>참가자</span>
                </div>
                {Array.from(participants).map(p => (
                    <Toggle key={p} settingKey="filteredParticipants" label={p} value={p} isGlobal={true} />
                ))}
                {uiClasses.length > 0 && (
                    <>
                        <div className="desktop-option-row" style={{borderBottom: 'none', paddingTop: '12px', paddingBottom: '6px'}}>
                            <span className="desktop-option-label" style={{fontWeight: 600, color: 'var(--text-title)'}}>UI 요소 필터</span>
                        </div>
                        <div style={{maxHeight: '150px', overflowY: 'auto', paddingRight: '4px'}}>
                            {uiClasses.map(classInfo => {
                                const isChecked = settings.customFilters?.[classInfo.name] ?? false;
                                return (
                                    <div key={classInfo.name} className="desktop-option-row">
                                        <label htmlFor={`filter-${classInfo.name}`} className="desktop-option-label" style={{fontFamily: 'monospace', fontSize: '0.85em', cursor: 'pointer'}}>{classInfo.displayName}</label>
                                        <div className={`desktop-toggle ${isChecked ? 'active' : ''}`} onClick={() => handleCustomFilterChange(classInfo.name, !isChecked)}>
                                            <input id={`filter-${classInfo.name}`} type="checkbox" checked={isChecked} style={{display: 'none'}} readOnly />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>

        <div className={`desktop-section ${collapsedSections.has('custom-selectors') ? 'collapsed' : ''}`}>
            <div className="desktop-section-header" onClick={() => toggleSection('custom-selectors')}>
                <span className="desktop-section-icon">✍️</span>
                <span className="desktop-section-title">커스텀 선택자</span>
                <span className="desktop-section-collapse-icon">▼</span>
            </div>
            <div className="desktop-section-body">
                <div style={{marginBottom: '12px'}}>
                    <div style={{marginBottom: '6px', fontWeight: 600, fontSize: '0.88em', color: 'var(--text-title)'}}>프로필 클래스</div>
                    <div style={{display: 'flex', gap: '6px'}}>
                        <input 
                            type="text" 
                            className="desktop-input" 
                            value={newProfileClass} 
                            onChange={(e) => setNewProfileClass(e.target.value)}
                            placeholder="클래스 이름..."
                            style={{flex: 1}}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddProfileClass()}
                        />
                        <button className="desktop-btn desktop-btn-secondary desktop-btn-xs" onClick={handleAddProfileClass}>추가</button>
                    </div>
                    {globalSettings.profileClasses && globalSettings.profileClasses.length > 0 && (
                        <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            {globalSettings.profileClasses.map((cls: string) => (
                                <div key={cls} style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '6px', background: 'var(--bg-primary)', borderRadius: '4px'}}>
                                    <span style={{fontFamily: 'monospace', fontSize: '0.82em', flex: 1, wordBreak: 'break-all'}}>{cls}</span>
                                    <button onClick={() => handleRemoveProfileClass(cls)} className="desktop-btn desktop-btn-danger desktop-btn-xs">삭제</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{borderTop: '1px solid var(--border-color-light)', paddingTop: '12px'}}>
                    <div style={{marginBottom: '6px', fontWeight: 600, fontSize: '0.88em', color: 'var(--text-title)'}}>참가자 이름 클래스</div>
                    <div style={{display: 'flex', gap: '6px'}}>
                        <input 
                            type="text" 
                            className="desktop-input" 
                            value={newParticipantNameClass} 
                            onChange={(e) => setNewParticipantNameClass(e.target.value)}
                            placeholder="클래스 이름..."
                            style={{flex: 1}}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddParticipantNameClass()}
                        />
                        <button className="desktop-btn desktop-btn-secondary desktop-btn-xs" onClick={handleAddParticipantNameClass}>추가</button>
                    </div>
                    {globalSettings.participantNameClasses && globalSettings.participantNameClasses.length > 0 && (
                        <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            {globalSettings.participantNameClasses.map((cls: string) => (
                                <div key={cls} style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '6px', background: 'var(--bg-primary)', borderRadius: '4px'}}>
                                    <span style={{fontFamily: 'monospace', fontSize: '0.82em', flex: 1, wordBreak: 'break-all'}}>{cls}</span>
                                    <button onClick={() => handleRemoveParticipantNameClass(cls)} className="desktop-btn desktop-btn-danger desktop-btn-xs">삭제</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </>
  );
};

export default SettingsPanel;
