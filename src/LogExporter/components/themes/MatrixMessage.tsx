
import React, { useRef, useEffect } from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const MatrixMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, showAvatar, globalSettings, isEditable, onMessageUpdate, allowHtmlRendering, isForArca, imageScale, isForExport } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, false, allowHtmlRendering, color, imageScale);
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
    <div className="chat-message-container" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5em', fontFamily: 'Courier New, monospace', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ position: 'relative' }}>
        <Avatar avatarSrc={avatarSrc} name={name} isUser={isUser} isForArca={isForArca} showAvatar={showAvatar} baseStyle={avatarBaseStyle} marginStyle={avatarMarginStyle} isForExport={isForExport} />
        {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: color.nameColor, fontWeight: 'bold', fontSize: '0.9em', marginBottom: '5px', textAlign: isUser ? 'right' : 'left', textShadow: `0 0 5px ${color.nameColor}`, fontFamily: 'Courier New, monospace' }}>&gt; {name.toUpperCase()}</div>
        <div style={{ background: isUser ? color.cardBgUser : color.cardBg, border: `1px solid ${color.border}`, padding: '12px 15px', color: color.text, lineHeight: 1.6, wordWrap: 'break-word', fontFamily: 'Courier New, monospace', fontSize: '0.9em', textShadow: `0 0 3px ${color.text}`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: color.nameColor, opacity: 0.6 }}></div>
          <div ref={contentRef} contentEditable={isEditable} onBlur={handleBlur} onClick={handleContentClick} suppressContentEditableWarning={true} />
        </div>
      </div>
    </div>
  );
};

export default MatrixMessage;
