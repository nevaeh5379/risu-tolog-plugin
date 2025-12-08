
import React from 'react';
import type { ColorPalette } from '../../../types';

interface FooterProps {
  color: ColorPalette;
  footerLeft?: string;
  footerCenter?: string;
  footerRight?: string;
}

const LogThemeFooter: React.FC<FooterProps> = ({ color, footerLeft, footerCenter, footerRight }) => {
  return (
    <footer style={{
        marginTop: '2em',
        padding: '1em',
        backgroundColor: '#1e1e1e',
        color: '#6a9955',
        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        fontSize: '0.85em',
        borderLeft: `4px solid ${color.nameColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    }}>
      <div>
        <span style={{ color: '#569cd6' }}>&gt; SYSTEM:</span> End of transmission.
      </div>
      {(footerLeft || footerCenter || footerRight) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7, marginTop: '0.5em', fontSize: '0.9em' }}>
             <span>{footerLeft}</span>
             <span>{footerCenter}</span>
             <span>{footerRight}</span>
          </div>
      )}
    </footer>
  );
};

export default LogThemeFooter;
