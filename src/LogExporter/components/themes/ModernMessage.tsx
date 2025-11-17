
import React, { useRef, useEffect } from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const ModernMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, showAvatar, isForArca, embedImagesAsBlob, allowHtmlRendering, globalSettings, isEditable, onMessageUpdate, imageScale, isForExport } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, embedImagesAsBlob, allowHtmlRendering, color, imageScale);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && messageHtml !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = messageHtml;
    }
  }, [messageHtml]);

  if (!messageHtml || messageHtml.trim().length === 0) return null;

  const isUser = node.classList.contains('justify-end');
  const name = getNameFromNode(node as HTMLElement, globalSettings, charInfoName);
  const avatarSrc = props.avatarMap.get(name);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (onMessageUpdate && e.currentTarget.innerHTML !== messageHtml) {
        onMessageUpdate(index, e.currentTarget.innerHTML);
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (isEditable) {
      e.stopPropagation();
    }
  };

  const avatarBaseStyle: React.CSSProperties = {
    width:'48px',height:'48px',minWidth:'48px',borderRadius:'50%',boxShadow:color.shadow || 'none',border:`2px solid ${color.avatarBorder}`
  };
  const avatarMarginStyle: React.CSSProperties = {
      margin: isUser ? '0 0 0 12px' : '0 12px 0 0'
  };
  
  const modernCardBg = isUser 
    ? `linear-gradient(135deg, ${color.cardBgUser} 0%, #3a3e44 100%)`
    : color.cardBg;

  return (
    <div className="chat-message-container" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px', gap: '16px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ position: 'relative' }}>
        <Avatar avatarSrc={avatarSrc} name={name} isUser={isUser} isForArca={isForArca} showAvatar={showAvatar} baseStyle={avatarBaseStyle} marginStyle={avatarMarginStyle} isForExport={isForExport} />
        {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>}
      </div>
      <div style={{ flex: 1, borderRadius: '8px', background: modernCardBg, boxShadow: color.shadow, overflow: 'hidden' }}>
        <strong style={{ color: color.nameColor, fontWeight: 600, fontSize: '0.9em', display: 'block', padding: '10px 14px', backgroundColor: 'rgba(0,0,0,0.15)', textAlign: isUser ? 'right' : 'left' }}>{name}</strong>
        <div ref={contentRef} style={{ padding: '14px', color: color.text, lineHeight: 1.8, wordWrap: 'break-word' }} contentEditable={isEditable} onBlur={handleBlur} onClick={handleContentClick} suppressContentEditableWarning={true} />
      </div>
    </div>
  );
};

export default ModernMessage;
