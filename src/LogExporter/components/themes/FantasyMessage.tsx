
import React from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const FantasyMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, showAvatar, isForArca, embedImagesAsBlob, allowHtmlRendering, globalSettings, isEditable, onMessageUpdate } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, embedImagesAsBlob, allowHtmlRendering, color);

  if (!messageHtml || messageHtml.trim().length === 0) return null;

  const isUser = node.classList.contains('justify-end');
  const name = getNameFromNode(node as HTMLElement, globalSettings, charInfoName);
  const avatarSrc = props.avatarMap.get(name);

  const fantasyFont = `'Nanum Myeongjo', serif`;

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (onMessageUpdate) {
        onMessageUpdate(index, e.currentTarget.innerHTML);
    }
  };

  const avatarBaseStyle: React.CSSProperties = {
    width:'52px',height:'52px',minWidth:'52px',borderRadius:'50%',border:`2px solid ${color.avatarBorder}`, boxShadow: '0 0 12px rgba(255, 201, 120, 0.5)', margin: '0 auto'
  };

  return (
    <>
      {index > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '2.2em auto', maxWidth: '50%' }}>
          <div style={{ flexGrow: 1, height: '1px', background: `linear-gradient(to right, transparent, ${color.separator}, transparent)`, width: '100%', margin: 'auto' }}></div>
          <span style={{ padding: '0 0.8em', color: color.separator, fontSize: '1.3em', fontFamily: fantasyFont, textShadow: '0 0 8px rgba(175,192,255,0.4)', margin: '0 auto' }}>✦</span>
          <div style={{ flexGrow: 1, height: '1px', background: `linear-gradient(to left, transparent, ${color.separator}, transparent)`, width: '100%', margin: 'auto' }}></div>
        </div>
      )}
      <div className="chat-message-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: isForArca ? '' : fantasyFont, textAlign: 'center', marginBottom: '28px' }}>
        {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>}
        <Avatar avatarSrc={avatarSrc} name={name} isUser={isUser} isForArca={isForArca} showAvatar={showAvatar} baseStyle={avatarBaseStyle} marginStyle={{}} />
        <strong style={{ color: color.nameColor, fontWeight: 400, fontSize: '1.4em', marginTop: '0.6em', letterSpacing: '1.5px', textShadow: '0 0 10px rgba(255, 201, 120, 0.6)' }}>{name}</strong>
        <div style={{ color: color.text, lineHeight: 1.85, fontSize: '1.1em', textAlign: 'justify', marginTop: '1.2em', maxWidth: '95%', marginLeft: 'auto', marginRight: 'auto', backgroundColor: isUser ? color.cardBgUser : color.cardBg, padding: '14px 18px', border: `1px solid ${color.border}`, boxShadow: color.shadow }} dangerouslySetInnerHTML={{ __html: messageHtml }} contentEditable={isEditable} onBlur={handleBlur} suppressContentEditableWarning={true} />
      </div>
    </>
  );
};

export default FantasyMessage;
