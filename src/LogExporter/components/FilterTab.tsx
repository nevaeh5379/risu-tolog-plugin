import React from 'react';
import type { UIClassInfo } from '../utils/domUtils';

interface FilterTabProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  participants: Set<string>;
  globalSettings: any;
  onGlobalSettingChange: (key: string, value: any) => void;
  uiClasses: UIClassInfo[];
}

const FilterTab: React.FC<FilterTabProps> = ({ 
  settings, 
  onSettingChange, 
  participants, 
  globalSettings, 
  onGlobalSettingChange,
  uiClasses 
}) => {

  const handleCustomFilterChange = (className: string, isChecked: boolean) => {
    const newFilters = { ...(settings.customFilters || {}), [className]: isChecked };
    onSettingChange('customFilters', newFilters);
  };

  const handleParticipantToggle = (participant: string) => {
    const currentList = globalSettings.filteredParticipants || [];
    const isHidden = currentList.includes(participant);
    const newList = isHidden 
      ? currentList.filter((p: string) => p !== participant) 
      : [...currentList, participant];
    onGlobalSettingChange('filteredParticipants', newList);
  };

  const isParticipantVisible = (participant: string) => {
    return !globalSettings.filteredParticipants?.includes(participant);
  };

  return (
    <div className="tab-content">
      <div className="tab-section">
        <h3 className="tab-section-title">👥 참가자 필터</h3>
        <p className="section-description">표시할 참가자를 선택하세요</p>
        <div className="filter-grid">
          {Array.from(participants).map(p => (
            <button
              key={p}
              className={`filter-chip ${isParticipantVisible(p) ? 'active' : ''}`}
              onClick={() => handleParticipantToggle(p)}
            >
              {isParticipantVisible(p) ? '✓' : '○'} {p}
            </button>
          ))}
        </div>
      </div>

      {uiClasses.length > 0 && (
        <div className="tab-section">
          <h3 className="tab-section-title">🎯 UI 요소 필터</h3>
          <p className="section-description">숨길 UI 요소를 선택하세요</p>
          <div className="ui-filter-list">
            {uiClasses.map(classInfo => {
              const isChecked = settings.customFilters?.[classInfo.name] ?? false;
              return (
                <div key={classInfo.name} className="ui-filter-item">
                  <label className="ui-filter-label">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={(e) => handleCustomFilterChange(classInfo.name, e.target.checked)}
                    />
                    <span className="ui-filter-name">{classInfo.displayName}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterTab;
