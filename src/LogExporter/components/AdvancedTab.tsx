import React, { useEffect } from 'react';

interface AdvancedTabProps {
  settings: any;
  onSettingChange: (key: string, value: any) => void;
  imageSizeWarning?: string;
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({ settings, onSettingChange, imageSizeWarning }) => {

  const resolution = settings.imageResolution === 'auto' ? 1 : (Number(settings.imageResolution) || 1);
  const browserMaxHeight = 16384;
  const maxAllowedHeight = Math.floor(browserMaxHeight / resolution);

  useEffect(() => {
    if (settings.maxImageHeight > maxAllowedHeight) {
      onSettingChange('maxImageHeight', maxAllowedHeight);
    }
  }, [settings.imageResolution, settings.maxImageHeight, maxAllowedHeight, onSettingChange]);

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
      <div className="tab-section">
        <h3 className="tab-section-title">👁️ 미리보기</h3>
        <div className="tab-option-row">
          <span className="option-label">글자 크기</span>
          <div className="number-input-group">
            <input 
              type="number" 
              className="tab-number-input" 
              value={settings.previewFontSize || 16} 
              onChange={(e) => onSettingChange('previewFontSize', Number(e.target.value))} 
              min="10" 
              max="32" 
            />
            <span className="input-unit">px</span>
          </div>
        </div>
        <div className="tab-option-row">
          <span className="option-label">너비</span>
          <div className="number-input-group">
            <input 
              type="number" 
              className="tab-number-input" 
              value={settings.previewWidth || 800} 
              onChange={(e) => onSettingChange('previewWidth', Number(e.target.value))} 
              min="320" 
              max="1920" 
              step="10" 
            />
            <span className="input-unit">px</span>
          </div>
        </div>
      </div>

      <div className="tab-section">
        <h3 className="tab-section-title">📷 이미지 내보내기</h3>
        {imageSizeWarning && (
          <div className="tab-option-row" style={{ color: 'var(--text-warning)', fontSize: '0.85em', padding: '8px', background: 'rgba(224, 175, 104, 0.1)', borderRadius: '4px', display: 'block' }}>
            {imageSizeWarning}
          </div>
        )}
        <div className="tab-option-row">
          <span className="option-label">해상도</span>
          <select 
            className="tab-select" 
            value={settings.imageResolution || 1} 
            onChange={(e) => onSettingChange('imageResolution', e.target.value)}
          >
            <option value="auto">자동</option>
                                        <option value="1">1x</option>
                                                            <option value="2">2x</option>
                                                            <option value="3">3x</option>
                                                            <option value="4">4x</option>
                                                            <option value="8">8x</option>
                                                            <option value="16">16x</option>
                                                            <option value="32">32x</option>
                                                            <option value="64">64x</option>
                                                            <option value="128">128x</option>

          </select>
        </div>
        <div className="tab-option-row">
          <span className="option-label">라이브러리</span>
          <select 
            className="tab-select" 
            value={settings.imageLibrary || 'html-to-image'} 
            onChange={(e) => onSettingChange('imageLibrary', e.target.value)}
          >
            <option value="html-to-image">html-to-image (권장)</option>
            <option value="html2canvas">html2canvas</option>
            <option value="dom-to-image">dom-to-image-more</option>
          </select>
        </div>
        <div className="tab-option-row">
          <span className="option-label">포맷</span>
          <select 
            className="tab-select" 
            value={settings.imageFormat || 'png'} 
            onChange={(e) => onSettingChange('imageFormat', e.target.value)}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
        
        <div className="tab-option-row">
          <span className="option-label">이미지 분할</span>
          <select 
            className="tab-select" 
            value={settings.splitImage || 'none'} 
            onChange={(e) => onSettingChange('splitImage', e.target.value)}
          >
            <option value="none">분할 안함</option>
            <option value="chunk">청크 단위 (1개 파일로 병합)</option>
            <option value="message">메시지 단위 (여러 파일)</option>
          </select>
        </div>
        
        {settings.splitImage && settings.splitImage !== 'none' && (
          <div className="tab-option-row" style={{marginLeft: '20px'}}>
            <span className="option-label">최대 높이</span>
            <div className="number-input-group">
              <input 
                type="number" 
                className="tab-number-input" 
                value={settings.maxImageHeight || 10000} 
                onChange={(e) => onSettingChange('maxImageHeight', parseInt(e.target.value, 10))} 
                min="1000" 
                max={maxAllowedHeight} 
                step="1000" 
              />
              <span className="input-unit">px</span>
            </div>
          </div>
        )}
      </div>

      <div className="tab-section">
        <h3 className="tab-section-title">🔧 개발자 도구</h3>
        <Toggle 
          settingKey="rawHtmlView" 
          label="Raw HTML 보기" 
          description="생성된 HTML 코드 직접 보기"
          value={settings.rawHtmlView} 
          defaultOn={false} 
        />
        <Toggle 
          settingKey="isEditable" 
          label="로그 편집 모드" 
          description="메시지 직접 수정 및 삭제"
          value={settings.isEditable} 
          defaultOn={false} 
        />
        <Toggle 
          settingKey="disableAnimations" 
          label="CSS 애니메이션 제외" 
          description="미리보기 및 저장 시 애니메이션 제거 (권장)"
          value={settings.disableAnimations} 
          defaultOn={true} 
        />
      </div>
    </div>
  );
};

export default AdvancedTab;
