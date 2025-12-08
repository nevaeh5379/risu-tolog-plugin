
import React from 'react';
import type { ColorPalette } from '../../../types';

interface FooterProps {
  color: ColorPalette;
  footerLeft?: string;
  footerCenter?: string;
  footerRight?: string;
}

const SmartFooter: React.FC<FooterProps> = ({ color, footerLeft, footerCenter, footerRight }) => {
  return (
    <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2em',
        padding: '1.5em 2em',
        background: color.cardBg, // 카드 배경색 사용
        backdropFilter: 'blur(10px)',
        borderRadius: '16px 16px 0 0', // 상단 둥글게
        fontSize: '0.85em',
        color: color.textSecondary,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
    }}>
      <div style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{footerLeft}</div>
      <div style={{ flex: 1, textAlign: 'center', opacity: 0.8 }}>{footerCenter}</div>
      <div style={{ flex: 1, textAlign: 'right', fontWeight: 500 }}>{footerRight}</div>
    </footer>
  );
};

export default SmartFooter;
