import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    disableAnimations,
  } = props;

  const [avatarMap, setAvatarMap] = useState<Map<string, string>>(preCollectedAvatarMap || new Map());
  const [isAvatarReady, setIsAvatarReady] = useState(false);

  const renderedIndicesRef = useRef<Set<number>>(new Set());
  const [allMessagesReady, setAllMessagesReady] = useState(false);

  const handleMessageRendered = useCallback((index: number) => {
    renderedIndicesRef.current.add(index);
    // nodes.length check ensures we wait for all messages
    if (renderedIndicesRef.current.size >= nodes.length) {
        setAllMessagesReady(true);
    }
  }, [nodes.length]);

  const themeInfo = THEMES[selectedThemeKey] || THEMES.basic;
  const color: ColorPalette = colorProp 
    || ((selectedThemeKey === 'basic' || selectedThemeKey === 'custom') ? (COLORS[selectedColorKey] || COLORS.dark) : (themeInfo.color || COLORS.dark));

  useEffect(() => {
    let isMounted = true;
    if (!preCollectedAvatarMap) {
      collectCharacterAvatars(nodes, charInfo.name, isForArca, globalSettings).then(map => {
        if (isMounted) {
          setAvatarMap(map);
          setIsAvatarReady(true);
        }
      });
    } else {
      setIsAvatarReady(true);
    }
    return () => { isMounted = false; };
  }, [nodes, charInfo.name, isForArca, preCollectedAvatarMap, globalSettings]);

  useEffect(() => {
    if (nodes.length === 0) {
        setAllMessagesReady(true);
    } else {
       // Reset ready state if nodes change (though typically they don't in export)
       // Actually, if nodes change, we should reset renderedIndicesRef too?
       // For the export use case, nodes are static. For preview, it updates.
       // In preview, onReady isn't usually used.
       if (renderedIndicesRef.current.size >= nodes.length) {
           setAllMessagesReady(true);
       } else {
           setAllMessagesReady(false);
       }
    }
  }, [nodes.length]);


  useEffect(() => {
    if (isAvatarReady && allMessagesReady && onReady) {
      // Use a microtask to ensure the DOM is updated before the callback fires
      Promise.resolve().then(onReady);
    }
  }, [isAvatarReady, allMessagesReady, onReady]);

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
      {disableAnimations && (
        <style>{`
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        `}</style>
      )}
      {selectedThemeKey === 'raw' && (
        <style>{`
          .raw-message-wrapper .prose, 
          .raw-message-wrapper .chattext {
            font-size: 1em !important;
            line-height: inherit;
          }
        `}</style>
      )}
      {selectedThemeKey === 'custom' && customCss && <style>{customCss}</style>}
      {showHeader && <LogHeader 
        themeKey={selectedThemeKey} // 테마 키 전달
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
            onRendered={() => handleMessageRendered(index)}
            replacementRules={props.replacementRules}
          />
        ))}
      </main>
      {showFooter && <LogFooter themeKey={selectedThemeKey} color={color} footerLeft={footerLeft} footerCenter={footerCenter} footerRight={footerRight} />}
    </div>
  );
};

export default LogContainer;