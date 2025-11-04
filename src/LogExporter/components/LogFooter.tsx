
import React from 'react';
import type { ColorPalette } from '../../types';

interface LogFooterProps {
  color: ColorPalette;
}

const LogFooter: React.FC<LogFooterProps> = ({ color }) => {
  return (
    <footer style={{ textAlign: 'center', marginTop: '3em', paddingTop: '1.5em', borderTop: `1px solid ${color.border}`, fontSize: '0.8em', color: color.text, opacity: 0.6 }}>
      Created by Log Plugin
    </footer>
  );
};

export default LogFooter;
