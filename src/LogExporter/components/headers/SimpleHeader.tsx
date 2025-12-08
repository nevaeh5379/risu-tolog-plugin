
import React from 'react';
import type { CharInfo, ColorPalette } from '../../../types';

interface LogHeaderProps {
  charInfo: CharInfo;
  color: ColorPalette;
  headerTags?: string;
}

const SimpleHeader: React.FC<LogHeaderProps> = ({ charInfo, color, headerTags }) => {
  const tags = headerTags ? headerTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  return (
    <header style={{
        paddingBottom: '1em',
        marginBottom: '2em',
        borderBottom: `2px solid ${color.text}`,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
    }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5em', color: color.text, fontWeight: 700 }}>{charInfo.name}</h1>
            <span style={{ color: color.textSecondary, fontSize: '0.9em' }}>{charInfo.chatName}</span>
        </div>
        
        {tags.length > 0 && (
            <div style={{ fontSize: '0.85em', color: color.textSecondary }}>
                {tags.join(' • ')}
            </div>
        )}
    </header>
  );
};

export default SimpleHeader;
