import React, { lazy, Suspense } from 'react';
import type { CharInfo, ColorPalette } from '../../types';

const DefaultHeader = lazy(() => import('./headers/DefaultHeader'));
const CompactHeader = lazy(() => import('./headers/CompactHeader'));
const BannerHeader = lazy(() => import('./headers/BannerHeader'));

export type HeaderLayout = 'default' | 'compact' | 'banner';

interface LogHeaderProps {
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
};

const LogHeader: React.FC<LogHeaderProps> = (props) => {
  const { layout = 'default' } = props;
  const HeaderComponent = headerMap[layout] || DefaultHeader;

  return (
    <Suspense fallback={<div>Loading header...</div>}>
      <HeaderComponent {...props} />
    </Suspense>
  );
};

export default LogHeader;
