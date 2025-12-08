
import React, { lazy, Suspense } from 'react';
import type { ColorPalette, ThemeKey } from '../../types';
import DefaultFooter from './footers/DefaultFooter';

const SmartFooter = lazy(() => import('./footers/SmartFooter'));
const SimpleFooter = lazy(() => import('./footers/SimpleFooter'));
const ModernFooter = lazy(() => import('./footers/ModernFooter'));
const LogThemeFooter = lazy(() => import('./footers/LogThemeFooter'));

interface LogFooterProps {
  themeKey?: ThemeKey;
  color: ColorPalette;
  footerLeft?: string;
  footerCenter?: string;
  footerRight?: string;
}

const LogFooter: React.FC<LogFooterProps> = (props) => {
  const { themeKey } = props;

  let FooterComponent = DefaultFooter;

  // 테마별 푸터 선택 로직
  switch (themeKey) {
    case 'smart':
        FooterComponent = SmartFooter;
        break;
    case 'simple':
        FooterComponent = SimpleFooter;
        break;
    case 'modern':
        FooterComponent = ModernFooter;
        break;
    case 'log':
        FooterComponent = LogThemeFooter;
        break;
    // Basic 등은 DefaultFooter 사용
    default:
        FooterComponent = DefaultFooter;
        break;
  }

  return (
    <Suspense fallback={<div />}>
        <FooterComponent {...props} />
    </Suspense>
  );
};

export default LogFooter;
