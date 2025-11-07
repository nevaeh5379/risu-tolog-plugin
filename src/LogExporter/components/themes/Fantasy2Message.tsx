
import React from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const Fantasy2Message: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, showAvatar, isForArca, embedImagesAsBlob, allowHtmlRendering, globalSettings, isEditable, onMessageUpdate } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, embedImagesAsBlob, allowHtmlRendering, color);

  if (!messageHtml || messageHtml.trim().length === 0) return null;

  const isUser = node.classList.contains('justify-end');
  const name = getNameFromNode(node as HTMLElement, globalSettings, charInfoName);
  const avatarSrc = props.avatarMap.get(name);
  const elfFont = `'Nanum Myeongjo', serif`;

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (onMessageUpdate) {
        onMessageUpdate(index, e.currentTarget.innerHTML);
    }
  };

  const avatarBaseStyle: React.CSSProperties = {
    width:'50px',height:'50px',minWidth:'50px',borderRadius:'50%',border:`3px solid ${color.avatarBorder}`, boxShadow: color.shadow, position: 'relative'
  };

  return (
    <>
      {index > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '2em auto', maxWidth: '70%' }}>
          <div style={{ flexGrow: 1, height: '2px', background: `linear-gradient(to right, transparent, ${color.separator}, transparent)`, borderRadius: '1px' }}></div>
          <div style={{ padding: '0 1.2em', color: color.separator, fontSize: '1.2em', position: 'relative' }}>
            <span style={{ textShadow: '0 0 10px rgba(52, 211, 153, 0.6)' }}>🌺</span>
            <div style={{ position: 'absolute', inset: 0, animation: 'pulse 2s infinite', opacity: 0.5 }}>
              <span style={{ color: color.separator }}>🌺</span>
            </div>
          </div>
          <div style={{ flexGrow: 1, height: '2px', background: `linear-gradient(to left, transparent, ${color.separator}, transparent)`, borderRadius: '1px' }}></div>
        </div>
      )}
      <div className="chat-message-container" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px', fontFamily: isForArca ? '' : elfFont, marginBottom: '2em', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>}
        <Avatar avatarSrc={avatarSrc} name={name} isUser={isUser} isForArca={isForArca} showAvatar={showAvatar} baseStyle={avatarBaseStyle} marginStyle={{}} />
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-5px', left: isUser ? 'auto' : '-8px', right: isUser ? '-8px' : 'auto', width: '3px', height: 'calc(100% + 10px)', background: color.border, borderRadius: '2px', opacity: 0.6 }}></div>
          <strong style={{ color: color.nameColor, fontWeight: 600, fontSize: '1.2em', textShadow: '0 0 8px rgba(52, 211, 153, 0.4)', letterSpacing: '1px', marginBottom: '0.8em', display: 'block', textAlign: isUser ? 'right' : 'left' }}>{name}</strong>
          <div style={{ background: isUser ? color.cardBgUser : color.cardBg, borderRadius: '15px', padding: '16px 20px', boxShadow: color.shadow, border: '1px solid rgba(52, 211, 153, 0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${color.nameColor}, transparent)` }}></div>
            <div style={{ color: color.text, lineHeight: 1.7, fontSize: '1.05em', position: 'relative', zIndex: 1 }} dangerouslySetInnerHTML={{ __html: messageHtml }} contentEditable={isEditable} onBlur={handleBlur} suppressContentEditableWarning={true} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Fantasy2Message;
