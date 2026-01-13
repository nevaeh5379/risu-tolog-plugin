import React, { useState } from 'react';
import type { ReplacementRule } from '../../types';

interface ReplacementTabProps {
  rules: ReplacementRule[];
  onRulesChange: (rules: ReplacementRule[]) => void;
}

const ReplacementTab: React.FC<ReplacementTabProps> = ({ rules, onRulesChange }) => {
  const [newPattern, setNewPattern] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [regexFlags, setRegexFlags] = useState('g');

  const handleAddRule = () => {
    if (!newPattern) return;
    const newRule: ReplacementRule = {
      id: Date.now().toString(),
      pattern: newPattern,
      replacement: newReplacement,
      isRegex,
      flags: isRegex ? regexFlags : undefined,
      isEnabled: true
    };
    onRulesChange([...rules, newRule]);
    setNewPattern('');
    setNewReplacement('');
  };

  const handleDeleteRule = (id: string) => {
    onRulesChange(rules.filter(r => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    onRulesChange(rules.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPattern(e.target.value);
  };

  const handleReplacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewReplacement(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleAddRule();
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-section">
        <h3 className="tab-section-title">🔤 단어 바꾸기</h3>
        <p className="section-description">로그 내용에서 특정 단어를 찾아 바꿉니다. 규칙은 위에서 아래로 순차적으로 적용됩니다.</p>

        <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
           <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
             <input 
               type="text" 
               placeholder="찾을 단어" 
               className="tab-input"
               style={{ flex: 1 }}
               value={newPattern}
               onChange={handlePatternChange}
               onKeyDown={handleKeyDown}
             />
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</div>
             <input 
               type="text" 
               placeholder="바꿀 단어" 
               className="tab-input"
               style={{ flex: 1 }}
               value={newReplacement}
               onChange={handleReplacementChange}
               onKeyDown={handleKeyDown}
             />
           </div>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9em', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input 
                        type="checkbox" 
                        checked={isRegex} 
                        onChange={e => setIsRegex(e.target.checked)} 
                    /> 
                    정규식 (Regex)
                </label>
                {isRegex && (
                    <input 
                        type="text" 
                        value={regexFlags}
                        onChange={e => setRegexFlags(e.target.value)}
                        placeholder="Flags (e.g. g, i)"
                        className="tab-input"
                        style={{ width: '80px', padding: '4px 8px', fontSize: '0.85em' }}
                        title="Regex Flags"
                    />
                )}
             </div>
             <button className="desktop-btn desktop-btn-primary" onClick={handleAddRule} disabled={!newPattern}>
                추가
             </button>
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rules.map(rule => (
            <div key={rule.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px', 
                background: 'var(--bg-primary)', 
                borderRadius: '6px', 
                border: '1px solid var(--border-color)',
                opacity: rule.isEnabled !== false ? 1 : 0.6
            }}>
              <div 
                className={`tab-toggle ${rule.isEnabled !== false ? 'active' : ''}`} 
                onClick={() => handleToggleRule(rule.id)}
                style={{ transform: 'scale(0.8)', margin: '-4px' }}
              ></div>
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <div style={{ 
                    fontFamily: 'monospace', 
                    background: 'var(--bg-tertiary)', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--border-color-light)',
                    maxWidth: '40%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }} title={rule.pattern}>
                    {rule.pattern}
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>→</span>
                <div style={{ 
                    fontFamily: 'monospace', 
                    background: 'var(--bg-tertiary)', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--border-color-light)',
                    maxWidth: '40%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }} title={rule.replacement}>
                    {rule.replacement || '(빈 문자열)'}
                </div>
                {rule.isRegex && <span style={{ 
                    fontSize: '0.7em', 
                    background: 'var(--accent-secondary)', 
                    color: '#fff', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    marginLeft: 'auto'
                }}>Regex</span>}
              </div>
              
              <button 
                className="desktop-btn desktop-btn-danger desktop-btn-xs" 
                onClick={() => handleDeleteRule(rule.id)}
                title="삭제"
              >
                &times;
              </button>
            </div>
          ))}
          {rules.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                등록된 규칙이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReplacementTab;
