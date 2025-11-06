
import React from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const RoyalMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, showAvatar, isForArca, embedImagesAsBase64, allowHtmlRendering, globalSettings } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, embedImagesAsBase64, allowHtmlRendering, color);

  if (!messageHtml || messageHtml.trim().length === 0) return null;

  const isUser = node.classList.contains('justify-end');
  const name = getNameFromNode(node as HTMLElement, globalSettings, charInfoName);
  const avatarSrc = props.avatarMap.get(name);
  const royalFont = `'Nanum Myeongjo', serif`;

  const avatarBaseStyle: React.CSSProperties = {
    width:'55px',height:'55px',minWidth:'55px',borderRadius:'50%',border:`3px solid ${color.avatarBorder}`, boxShadow: color.shadow, position: 'relative'
  };

  return (
    <>
      {index > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '2.5em auto', maxWidth: '60%' }}>
          <div style={{ flexGrow: 1, height: '1px', background: `linear-gradient(to right, transparent, ${color.separator}, transparent)` }}></div>
          <span style={{ padding: '0 1em', color: color.separator, fontSize: '1.4em', textShadow: '0 0 15px rgba(168, 85, 247, 0.6)' }}>♦</span>
          <div style={{ flexGrow: 1, height: '1px', background: `linear-gradient(to left, transparent, ${color.separator}, transparent)` }}></div>
        </div>
      )}
      <div className="chat-message-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: isForArca ? '' : royalFont, textAlign: 'center', marginBottom: '3em' }}>
        <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>
        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '2px', background: `linear-gradient(90deg, transparent, ${color.nameColor}, transparent)`, opacity: 0.6 }}></div>
        <Avatar avatarSrc={avatarSrc} name={name} isUser={isUser} isForArca={isForArca} showAvatar={showAvatar} baseStyle={avatarBaseStyle} marginStyle={{}} />
        <strong style={{ color: color.nameColor, fontWeight: 500, fontSize: '1.5em', marginTop: '1em', letterSpacing: '2px', textShadow: '0 0 12px rgba(251, 191, 36, 0.5)' }}>{name}</strong>
        <div style={{ background: isUser ? color.cardBgUser : color.cardBg, color: color.text, lineHeight: 1.8, fontSize: '1.1em', textAlign: 'justify', marginTop: '1.5em', maxWidth: '95%', padding: '20px 25px', borderRadius: '15px', border: '2px solid transparent', backgroundClip: 'padding-box', boxShadow: color.shadow, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: '-2px', background: 'linear-gradient(45deg, #7c3aed, #fbbf24, #7c3aed)', borderRadius: '17px', zIndex: -1 }}></div>
          <div dangerouslySetInnerHTML={{ __html: messageHtml }} />
        </div>
      </div>
    </>
  );
};

export default RoyalMessage;
