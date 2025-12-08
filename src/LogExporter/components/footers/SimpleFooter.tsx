
import React from 'react';
import type { ColorPalette } from '../../../types';

interface FooterProps {
  color: ColorPalette;
  footerLeft?: string;
  footerCenter?: string;
  footerRight?: string;
}

const SimpleFooter: React.FC<FooterProps> = ({ color, footerLeft, footerCenter, footerRight }) => {
  return (
    <footer style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '2em',
        paddingTop: '1em',
        borderTop: `1px dashed ${color.border}`,
        fontSize: '0.75em',
        color: color.text,
        opacity: 0.5,
        fontFamily: 'monospace'
    }}>
      {footerLeft && <span>{footerLeft}</span>}
      {footerCenter && <span>{footerCenter}</span>}
      {footerRight && <span>{footerRight}</span>}
    </footer>
  );
};

export default SimpleFooter;
