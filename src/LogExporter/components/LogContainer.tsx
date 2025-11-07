
import React, { useEffect, useState } from 'react';
import type { LogContainerProps, ColorPalette } from '../../types';
import { THEMES, COLORS } from './constants';
import { collectCharacterAvatars } from '../services/avatarService';
import LogHeader from './LogHeader';
import LogFooter from './LogFooter';
import MessageRenderer from './MessageRenderer';

import { getNameFromNode } from '../utils/domUtils';

const LogContainer: React.FC<LogContainerProps> = (props) => {
  const {
    nodes,
    charInfo,
    selectedThemeKey = 'basic',
    selectedColorKey = 'dark',
    showAvatar = true,
    showHeader = true,
    showFooter = true,
    showBubble = true,
    isForArca = false,
    embedImagesAsBase64 = true,
    preCollectedAvatarMap,
    allowHtmlRendering = false,
    onReady,
    globalSettings,
  } = props;

  const [avatarMap, setAvatarMap] = useState<Map<string, string>>(preCollectedAvatarMap || new Map());
  const [isReady, setIsReady] = useState(false);

  const themeInfo = THEMES[selectedThemeKey] || THEMES.basic;
  const color: ColorPalette = (selectedThemeKey === 'basic') ? (COLORS[selectedColorKey] || COLORS.dark) : (themeInfo.color || COLORS.dark);

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
      margin: '16px auto',
      maxWidth: '900px',
      backgroundColor: color.background,
      borderRadius: selectedThemeKey === 'log' ? '8px' : '12px',
      overflow: 'hidden',
      padding: selectedThemeKey === 'log' ? 0 : '24px 32px',
      border: selectedThemeKey === 'log' ? 'none' : `1px solid ${color.border}`,
      boxShadow: selectedThemeKey === 'log' ? 'none' : (color.shadow || 'none'),
  };

  const filteredNodes = nodes.filter(node => {
    // 메시지 노드인지 간단히 확인 (더 정교한 방법이 필요할 수 있음)
    const isMessageNode = node.querySelector('.prose, .chattext');
    if (isMessageNode) {
      const name = getNameFromNode(node as HTMLElement, globalSettings, charInfo.name);
      if (globalSettings?.filteredParticipants?.includes(name)) {
        return false; // 필터링 목록에 있으면 제외
      }
    }
    return true; // 그 외 모든 노드는 포함
  });

  return (
    <div style={containerStyle}>
      {showHeader && <LogHeader charInfo={charInfo} color={color} embedImagesAsBase64={embedImagesAsBase64} />}
      <main>
        {filteredNodes.map((node, index) => (
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
            embedImagesAsBase64={embedImagesAsBase64}
            allowHtmlRendering={allowHtmlRendering}
            globalSettings={globalSettings}
          />
        ))}
      </main>
      {showFooter && <LogFooter color={color} />}
    </div>
  );
};

export default LogContainer;
