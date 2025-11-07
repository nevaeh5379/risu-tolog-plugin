export interface CharInfo {
  name: string;
  chatName: string;
  avatarUrl: string;
}

export interface ColorPalette {
    name?: string;
  background: string;
  text: string;
  nameColor: string;
  border: string;
  avatarBorder: string;
  shadow: string;
  cardBg: string;
  cardBgUser: string;
  // 테마별 추가 색상
  quoteBg?: string;
  quoteText?: string;
  thoughtBg?: string;
  thoughtText?: string;
  soundBg?: string;
  soundText?: string;
  separator?: string;
  textSecondary?: string;
}

export interface ThemeInfo {
name: string;
description: string;
  color?: ColorPalette;
}

export type ThemeKey = 'basic' | 'modern' | 'fantasy' | 'fantasy2' | 'royal' | 'ocean' | 'sakura' | 'matrix' | 'log';
export type ColorKey =
  | 'dark'
  | 'classic'
  | 'light'
  | 'sepia'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'cyberpunk'
  | 'monochrome'
  | 'highcontrast'
  | 'darkcontrast';

// 메인 컴포넌트의 Props
export interface LogContainerProps {
  nodes: Element[];
  charInfo: CharInfo;
  selectedThemeKey?: ThemeKey;
  selectedColorKey?: ColorKey;
  showAvatar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  showBubble?: boolean;
  isForArca?: boolean;
  embedImagesAsBase64?: boolean;
  preCollectedAvatarMap?: Map<string, string>;
  allowHtmlRendering?: boolean;
  onReady?: () => void;
  globalSettings: any;
  fontSize?: number;
  containerWidth?: number;
  isEditable?: boolean;
  onMessageUpdate?: (index: number, newHtml: string) => void;
  selectedIndices?: Set<number>;
  onMessageSelect?: (index: number, e: React.MouseEvent) => void;
}

// 메시지 컴포넌트 Props
export interface MessageProps {
  node: Element;
  index: number;
  charInfoName: string;
  color: ColorPalette;
  themeKey: ThemeKey;
  avatarMap: Map<string, string>;
  showAvatar: boolean;
  showBubble: boolean;
  isForArca: boolean;
  embedImagesAsBase64: boolean;
  allowHtmlRendering: boolean;
  globalSettings: any;
  isEditable?: boolean;
  onMessageUpdate?: (index: number, newHtml: string) => void;
  isSelected?: boolean;
  onSelect?: (index: number, e: React.MouseEvent) => void;
}

export type LogNode = HTMLElement;

export interface ArcaImage {
  url: string;
  filename: string;
  isWebM: boolean;
}

export interface GlobalSettings {
  profileClasses: string[];
  participantNameClasses: string[];
  defaultClassesAdded?: boolean;
  uiTheme?: string;
  filteredParticipants?: string[];
}