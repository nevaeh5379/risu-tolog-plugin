import React, { lazy, Suspense } from 'react';
import type { CharInfo, ColorPalette } from '../../types';

const DefaultHeader = lazy(() => import('./headers/DefaultHeader'));
const CompactHeader = lazy(() => import('./headers/CompactHeader'));
const BannerHeader = lazy(() => import('./headers/BannerHeader'));
const SmartHeader = lazy(() => import('./headers/SmartHeader'));
const SimpleHeader = lazy(() => import('./headers/SimpleHeader'));
const ModernHeader = lazy(() => import('./headers/ModernHeader'));
const LogThemeHeader = lazy(() => import('./headers/LogThemeHeader'));
const CoverHeader = lazy(() => import('./headers/CoverHeader'));

export type HeaderLayout = 'default' | 'compact' | 'banner' | 'smart' | 'cover';

interface LogHeaderProps {
  themeKey?: string; // 추가
  layout?: HeaderLayout;
  charInfo: CharInfo;
  color: ColorPalette;
  embedImagesAsBlob: boolean;
  showHeaderIcon?: boolean;
  headerTags?: string;
  headerBannerUrl?: string;
  headerBannerBlur?: boolean;
  headerBannerAlign?: number;
  isForExport?: boolean;
  isForArca?: boolean;
}

const headerMap = {
  default: DefaultHeader,
  compact: CompactHeader,
  banner: BannerHeader,
  smart: SmartHeader,
  cover: CoverHeader,
};

const LogHeader: React.FC<LogHeaderProps> = (props) => {
  const { layout = 'default', themeKey = 'basic' } = props;
  
  let HeaderComponent = DefaultHeader;

  // 테마에 따라 헤더 강제 지정 (기본 테마가 아닐 경우)
  if (themeKey === 'smart') {
    HeaderComponent = SmartHeader;
  } else if (themeKey === 'simple') {
    HeaderComponent = SimpleHeader;
  } else if (themeKey === 'modern') {
    HeaderComponent = ModernHeader;
  } else if (themeKey === 'log') {
    HeaderComponent = LogThemeHeader;
  } else if (themeKey === 'basic' || themeKey === 'custom') {
    // 기본/커스텀 테마는 사용자가 선택한 layout 따름
    HeaderComponent = headerMap[layout] || DefaultHeader;
  }

  return (
    <Suspense fallback={<div>Loading header...</div>}>
      <HeaderComponent {...props} />
    </Suspense>
  );
};

export default LogHeader;
