
import React from 'react';
import type { ColorPalette } from '../../types';

interface LogFooterProps {
  color: ColorPalette;
  footerLeft?: string;
  footerCenter?: string;
  footerRight?: string;
}

const LogFooter: React.FC<LogFooterProps> = ({ color, footerLeft, footerCenter, footerRight }) => {
  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: '3em',
    paddingTop: '1.5em',
    borderTop: `1px solid ${color.border}`,
    fontSize: '0.8em',
    color: color.text,
    opacity: 0.6,
  };

  const partStyle: React.CSSProperties = {
    flex: 1,
  };

  return (
    <footer style={footerStyle}>
      <div style={{ ...partStyle, textAlign: 'left' }}>{footerLeft}</div>
      <div style={{ ...partStyle, textAlign: 'center' }}>{footerCenter}</div>
      <div style={{ ...partStyle, textAlign: 'right' }}>{footerRight}</div>
    </footer>
  );
};

export default LogFooter;
