
import React, { useEffect, useState } from 'react';
import type { LogContainerProps, ColorPalette } from '../../types';
import { THEMES, COLORS } from './constants';
import { collectCharacterAvatars } from '../services/avatarService';
import LogHeader from './LogHeader';
import LogFooter from './LogFooter';
import MessageRenderer from './MessageRenderer';


const LogContainer: React.FC<LogContainerProps> = (props) => {
  const {
    nodes,
    charInfo,
    selectedThemeKey = 'basic',
    selectedColorKey = 'dark',
    color: colorProp,
    customCss,
    showAvatar = true,
    showHeader = true,
    showHeaderIcon,
    headerTags,
    headerLayout,
    headerBannerUrl,
    headerBannerBlur,
    headerBannerAlign,
    showFooter = true,
    footerLeft,
    footerCenter,
    footerRight,
    showBubble = true,
    isForArca = false,
    embedImagesAsBlob = true,
    preCollectedAvatarMap,
    allowHtmlRendering = false,
    onReady,
    globalSettings,
    fontSize,
    containerWidth,
    imageScale,
    selectedIndices,
    onMessageSelect,
    isForImageExport,
    isForExport,
  } = props;

  const [avatarMap, setAvatarMap] = useState<Map<string, string>>(preCollectedAvatarMap || new Map());
  const [isReady, setIsReady] = useState(false);

  const themeInfo = THEMES[selectedThemeKey] || THEMES.basic;
  const color: ColorPalette = colorProp 
    || ((selectedThemeKey === 'basic' || selectedThemeKey === 'custom') ? (COLORS[selectedColorKey] || COLORS.dark) : (themeInfo.color || COLORS.dark));

  useEffect(() => {
    let isMounted = true;
    if (!preCollectedAvatarMap) {
      collectCharacterAvatars(nodes, charInfo.name, isForArca, globalSettings).then(map => {
        if (isMounted) {
          setAvatarMap(map);
          setIsReady(true);
        }
      });
    } else {
      setIsReady(true);
    }
    return () => { isMounted = false; };
  }, [nodes, charInfo.name, isForArca, preCollectedAvatarMap, globalSettings]);

  useEffect(() => {
    if (isReady && onReady) {
      // Use a microtask to ensure the DOM is updated before the callback fires
      Promise.resolve().then(onReady);
    }
  }, [isReady, onReady]);

  const containerStyle: React.CSSProperties = {
      margin: isForImageExport ? '0' : '16px auto',
      maxWidth: containerWidth ? `${containerWidth}px` : '900px',
      fontSize: fontSize ? `${fontSize}px` : '16px',
      backgroundColor: color.background,
      borderRadius: selectedThemeKey === 'log' ? '8px' : '12px',
      overflow: 'hidden',
      padding: selectedThemeKey === 'log' ? 0 : '24px 32px',
      border: selectedThemeKey === 'log' ? 'none' : `1px solid ${color.border}`,
      boxShadow: selectedThemeKey === 'log' ? 'none' : (color.shadow || 'none'),
  };

  return (
    <div style={containerStyle}>
      {selectedThemeKey === 'custom' && customCss && <style>{customCss}</style>}
      {showHeader && <LogHeader 
        layout={headerLayout} 
        charInfo={charInfo} 
        color={color} 
        embedImagesAsBlob={embedImagesAsBlob} 
        showHeaderIcon={showHeaderIcon} 
        headerTags={headerTags} 
        headerBannerUrl={headerBannerUrl}
        headerBannerBlur={headerBannerBlur}
        headerBannerAlign={headerBannerAlign}
        isForExport={isForExport}
        isForArca={isForArca}
      />}
      <main>
        {nodes.map((node, index) => (
          <MessageRenderer
            key={index} // It's better to have a unique key from the message data
            node={node}
            index={index}
            charInfoName={charInfo.name}
            color={color}
            themeKey={selectedThemeKey}
            avatarMap={avatarMap}
            showAvatar={showAvatar}
            showBubble={showBubble}
            isForArca={isForArca}
            embedImagesAsBlob={embedImagesAsBlob}
            allowHtmlRendering={allowHtmlRendering}
            globalSettings={globalSettings}
            imageScale={imageScale}
            isEditable={props.isEditable}
            onMessageUpdate={props.onMessageUpdate}
            isSelected={selectedIndices?.has(index)}
            onSelect={onMessageSelect}
            isForExport={isForExport}
          />
        ))}
      </main>
      {showFooter && <LogFooter color={color} footerLeft={footerLeft} footerCenter={footerCenter} footerRight={footerRight} />}
    </div>
  );
};

export default LogContainer;
