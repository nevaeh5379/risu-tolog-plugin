
import React from 'react';
import type { CharInfo, ColorPalette } from '../../../types';

interface LogHeaderProps {
  charInfo: CharInfo;
  color: ColorPalette;
  headerTags?: string;
}

const ModernHeader: React.FC<LogHeaderProps> = ({ charInfo, color, headerTags }) => {
  const tags = headerTags ? headerTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  return (
    <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        padding: '24px',
        marginBottom: '2.5em',
        backgroundColor: color.cardBg,
        borderRadius: '12px',
        border: `1px solid ${color.border}`,
        boxShadow: color.shadow
    }}>
        {/* 아바타 영역 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
            <img 
                src={charInfo.avatarUrl} 
                data-log-exporter-avatar="true" 
                style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '10px', // 모던함: 완전 원형보다는 둥근 사각형
                    objectFit: 'cover', 
                    display: 'block',
                    border: `1px solid ${color.border}`
                }} 
            />
            <div style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#10b981', // 접속 상태 표시 같은 느낌
                border: `3px solid ${color.cardBg}`
            }} />
        </div>

        {/* 정보 영역 */}
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h1 style={{ 
                    margin: 0, 
                    fontSize: '1.6em', 
                    color: color.nameColor, 
                    fontWeight: 700,
                    letterSpacing: '-0.02em'
                }}>
                    {charInfo.name}
                </h1>
                {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {tags.map((tag, index) => (
                            <span key={index} style={{ 
                                fontSize: '0.75em', 
                                color: color.textSecondary, 
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: `1px solid ${color.border}`
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <p style={{ 
                margin: 0, 
                color: color.text, 
                opacity: 0.8, 
                fontSize: '0.95em',
                lineHeight: 1.5
            }}>
                {charInfo.chatName}
            </p>
        </div>
    </header>
  );
};

export default ModernHeader;
