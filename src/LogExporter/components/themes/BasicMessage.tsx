
import React, { useRef, useEffect } from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const BasicMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, showBubble, showAvatar, isForArca, embedImagesAsBlob, allowHtmlRendering, globalSettings, isEditable, onMessageUpdate, imageScale, isForExport } = props;
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

  const avatarBaseStyle: React.CSSProperties = {
    width:'48px',height:'48px',minWidth:'48px',borderRadius:'50%',boxShadow:color.shadow || 'none',border:`2px solid ${color.avatarBorder}`
  };
  const avatarMarginStyle: React.CSSProperties = {
      margin: isUser ? '0 0 0 12px' : '0 12px 0 0'
  };

  const cardBgColor = isUser ? color.cardBgUser : color.cardBg;

  const handleContentClick = (e: React.MouseEvent) => {
    if (isEditable) {
      e.stopPropagation();
    }
  };

  return (
    <div className="chat-message-container" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', marginBottom: '28px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>}
      <Avatar avatarSrc={avatarSrc} name={name} isUser={isUser} isForArca={isForArca} showAvatar={showAvatar} baseStyle={avatarBaseStyle} marginStyle={avatarMarginStyle} isForExport={isForExport} />
      <div style={{ flex: 1 }}>
        <strong style={{ color: `${color.nameColor} !important`, fontWeight: 600, fontSize: '0.95em', display: 'block', marginBottom: '8px', textAlign: isUser ? 'right' : 'left' }}>{name}</strong>
        {showBubble ? (
          <div ref={contentRef} style={{ backgroundColor: cardBgColor, borderRadius: '16px', padding: '14px 18px', boxShadow: color.shadow, border: `1px solid ${color.border}`, color: color.text, lineHeight: 1.8, wordWrap: 'break-word', position: 'relative' }} contentEditable={isEditable} onBlur={handleBlur} onClick={handleContentClick} suppressContentEditableWarning={true} />
        ) : (
          <div ref={contentRef} style={{ color: color.text, lineHeight: 1.8, wordWrap: 'break-word', padding: '0 4px' }} contentEditable={isEditable} onBlur={handleBlur} onClick={handleContentClick} suppressContentEditableWarning={true} />
        )}
      </div>
    </div>
  );
};

export default BasicMessage;
