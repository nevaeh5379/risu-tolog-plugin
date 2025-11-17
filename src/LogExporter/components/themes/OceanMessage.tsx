
import React, { useRef, useEffect } from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const OceanMessage: React.FC<MessageProps> = (props) => {
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

  return (
    <div className="chat-message-container" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2em', position: 'relative', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: isUser ? 'auto' : 0, right: isUser ? 0 : 'auto', width: '2px', background: `linear-gradient(to bottom, ${color.nameColor}, transparent)`, opacity: 0.5 }}></div>
      {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>}
      <Avatar avatarSrc={avatarSrc} name={name} isUser={isUser} isForArca={isForArca} showAvatar={showAvatar} baseStyle={avatarBaseStyle} marginStyle={avatarMarginStyle} isForExport={isForExport} />
      <div style={{ flex: 1, position: 'relative' }}>
        <strong style={{ color: color.nameColor, fontWeight: 600, fontSize: '1em', display: 'block', marginBottom: '10px', textAlign: isUser ? 'right' : 'left', textShadow: '0 0 8px rgba(34, 211, 238, 0.4)' }}>{name}</strong>
        <div style={{ background: isUser ? color.cardBgUser : color.cardBg, borderRadius: '18px', padding: '16px 20px', boxShadow: color.shadow, border: '1px solid rgba(34, 211, 238, 0.3)', color: color.text, lineHeight: 1.75, wordWrap: 'break-word', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: `radial-gradient(ellipse at ${isUser ? 'right' : 'left'} top, rgba(34, 211, 238, 0.05), transparent 70%)`, pointerEvents: 'none' }}></div>
          <div ref={contentRef} style={{ position: 'relative', zIndex: 1 }} contentEditable={isEditable} onBlur={handleBlur} onClick={handleContentClick} suppressContentEditableWarning={true} />
        </div>
      </div>
    </div>
  );
};

export default OceanMessage;
