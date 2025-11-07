import React, { useState } from 'react';

interface PluginSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalSettings: any;
  onGlobalSettingChange: (key: string, value: any) => void;
}

const PluginSettingsModal: React.FC<PluginSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  globalSettings, 
  onGlobalSettingChange 
}) => {
  const [newProfileClass, setNewProfileClass] = useState('');
  const [newParticipantNameClass, setNewParticipantNameClass] = useState('');

  if (!isOpen) return null;

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

  return (
    <div className="plugin-settings-backdrop" onClick={onClose}>
      <div className="plugin-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plugin-settings-header">
          <h2>⚙️ 플러그인 설정</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="plugin-settings-content">
          {/* UI 테마 설정 */}
          <section className="settings-section">
            <h3>🎨 UI 테마</h3>
            <div className="setting-item">
              <label>모달 테마</label>
              <select 
                className="setting-select" 
                value={globalSettings.uiTheme || 'dark'} 
                onChange={(e) => onGlobalSettingChange('uiTheme', e.target.value)}
              >
                <option value="dark">다크 모던</option>
                <option value="classic">클래식 다크</option>
                <option value="light">라이트</option>
              </select>
            </div>
          </section>

          {/* 커스텀 선택자 */}
          <section className="settings-section">
            <h3>✍️ 커스텀 선택자</h3>
            
            <div className="custom-selector-group">
              <label>프로필 이미지 클래스</label>
              <p className="setting-description">프로필 이미지를 찾기 위한 CSS 클래스를 추가하세요</p>
              <div className="input-group">
                <input 
                  type="text" 
                  className="setting-input" 
                  value={newProfileClass} 
                  onChange={(e) => setNewProfileClass(e.target.value)}
                  placeholder=".avatar, .profile-img"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProfileClass()}
                />
                <button className="add-btn" onClick={handleAddProfileClass}>추가</button>
              </div>
              {globalSettings.profileClasses && globalSettings.profileClasses.length > 0 && (
                <div className="class-list">
                  {globalSettings.profileClasses.map((cls: string) => (
                    <div key={cls} className="class-item">
                      <code>{cls}</code>
                      <button onClick={() => handleRemoveProfileClass(cls)} className="remove-btn">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="custom-selector-group">
              <label>참가자 이름 클래스</label>
              <p className="setting-description">참가자 이름을 찾기 위한 CSS 클래스를 추가하세요</p>
              <div className="input-group">
                <input 
                  type="text" 
                  className="setting-input" 
                  value={newParticipantNameClass} 
                  onChange={(e) => setNewParticipantNameClass(e.target.value)}
                  placeholder=".username, .name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddParticipantNameClass()}
                />
                <button className="add-btn" onClick={handleAddParticipantNameClass}>추가</button>
              </div>
              {globalSettings.participantNameClasses && globalSettings.participantNameClasses.length > 0 && (
                <div className="class-list">
                  {globalSettings.participantNameClasses.map((cls: string) => (
                    <div key={cls} className="class-item">
                      <code>{cls}</code>
                      <button onClick={() => handleRemoveParticipantNameClass(cls)} className="remove-btn">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="plugin-settings-footer">
          <button className="btn-secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default PluginSettingsModal;
