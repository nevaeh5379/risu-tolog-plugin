
import React from 'react';
import type { CharInfo, ColorPalette } from '../../../types';

interface LogHeaderProps {
  charInfo: CharInfo;
  color: ColorPalette;
  headerTags?: string;
}

const LogThemeHeader: React.FC<LogHeaderProps> = ({ charInfo, color, headerTags }) => {
  const tags = headerTags ? headerTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  const today = new Date().toISOString().split('T')[0];

  return (
    <header style={{
        marginBottom: '2em',
        padding: '1.5em',
        backgroundColor: '#1e1e1e',
        color: '#cccccc',
        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        fontSize: '0.9em',
        borderLeft: `4px solid ${color.nameColor}`,
        lineHeight: 1.6
    }}>
        <div style={{ marginBottom: '0.5em' }}>
            <span style={{ color: '#569cd6' }}>&gt; TARGET_ID:</span> <span style={{ color: '#ce9178' }}>"{charInfo.name}"</span>
        </div>
        <div style={{ marginBottom: '0.5em' }}>
            <span style={{ color: '#569cd6' }}>&gt; CONTEXT:</span> <span style={{ color: '#ce9178' }}>"{charInfo.chatName}"</span>
        </div>
        <div style={{ marginBottom: '0.5em' }}>
            <span style={{ color: '#569cd6' }}>&gt; DATE:</span> <span style={{ color: '#b5cea8' }}>{today}</span>
        </div>
        {tags.length > 0 && (
             <div>
                <span style={{ color: '#569cd6' }}>&gt; TAGS:</span> [{tags.map(t => `'${t}'`).join(', ')}]
             </div>
        )}
        <div style={{ marginTop: '1em', borderTop: '1px dashed #444', paddingTop: '0.5em', color: '#6a9955' }}>
            // Recording started...
        </div>
    </header>
  );
};

export default LogThemeHeader;
