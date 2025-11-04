
import React from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const SakuraMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, showAvatar, isForArca, embedImagesAsBase64, allowHtmlRendering } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, embedImagesAsBase64, allowHtmlRendering, color);

  if (!messageHtml || messageHtml.trim().length === 0) return null;

  const isUser = node.classList.contains('justify-end');
  const name = getNameFromNode(node, charInfoName);
  const avatarSrc = props.avatarMap.get(name);

  const avatarBaseStyle: React.CSSProperties = {
    width:'48px',height:'48px',minWidth:'48px',borderRadius:'50%',boxShadow:color.shadow || 'none',border:`2px solid ${color.avatarBorder}`
  };
  const avatarMarginStyle: React.CSSProperties = {
      margin: isUser ? '0 0 0 12px' : '0 12px 0 0'
  };

  return (
    <>
      {index > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '1.8em auto', maxWidth: '65%' }}>
          <div style={{ flexGrow: 1, height: '1px', background: `linear-gradient(to right, transparent, ${color.separator}, transparent)` }}></div>
          <span style={{ padding: '0 0.8em', color: color.separator, fontSize: '1.1em' }}>🌸</span>
          <div style={{ flexGrow: 1, height: '1px', background: `linear-gradient(to left, transparent, ${color.separator}, transparent)` }}></div>
        </div>
      )}
      <div className="chat-message-container" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', marginBottom: '2em', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>
        <Avatar avatarSrc={avatarSrc} name={name} isUser={isUser} isForArca={isForArca} showAvatar={showAvatar} baseStyle={avatarBaseStyle} marginStyle={avatarMarginStyle} />
        <div style={{ flex: 1 }}>
          <strong style={{ color: `${color.nameColor} !important`, fontWeight: 600, fontSize: '0.95em', display: 'block', marginBottom: '8px', textAlign: isUser ? 'right' : 'left', textShadow: '0 0 6px rgba(244, 114, 182, 0.3)' }}>{name}</strong>
          <div style={{ background: isUser ? color.cardBgUser : color.cardBg, borderRadius: '20px', padding: '15px 18px', boxShadow: color.shadow, border: '1px solid rgba(244, 114, 182, 0.2)', color: `${color.text} !important`, lineHeight: 1.7, wordWrap: 'break-word', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50%', right: '-50%', width: '100%', height: '200%', background: 'radial-gradient(circle, rgba(244, 114, 182, 0.05), transparent 60%)', pointerEvents: 'none', animation: 'float 6s ease-in-out infinite' }}></div>
            <div style={{ position: 'relative', zIndex: 1 }} dangerouslySetInnerHTML={{ __html: messageHtml }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default SakuraMessage;
