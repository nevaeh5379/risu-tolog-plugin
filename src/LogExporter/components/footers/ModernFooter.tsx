
import React from 'react';
import type { ColorPalette } from '../../../types';

interface FooterProps {
  color: ColorPalette;
  footerLeft?: string;
  footerCenter?: string;
  footerRight?: string;
}

const ModernFooter: React.FC<FooterProps> = ({ color, footerLeft, footerCenter, footerRight }) => {
  return (
    <footer style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        marginTop: '3em',
        padding: '1.5em 0',
        borderTop: `1px solid ${color.border}`,
        fontSize: '0.8em',
        color: color.textSecondary
    }}>
      <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
         <span style={{ width: '8px', height: '8px', background: color.nameColor, borderRadius: '50%', display: 'inline-block' }}></span>
         {footerLeft}
      </div>
      <div style={{ textAlign: 'center', fontWeight: 600, letterSpacing: '1px' }}>
         {footerCenter?.toUpperCase()}
      </div>
      <div style={{ textAlign: 'right', opacity: 0.7 }}>
         {footerRight}
      </div>
    </footer>
  );
};

export default ModernFooter;
