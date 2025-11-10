
import React from 'react';
import type { MessageProps } from '../../../types';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const LogMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, allowHtmlRendering, globalSettings, isEditable, onMessageUpdate, imageScale } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, false, allowHtmlRendering, color, imageScale);

  if (!messageHtml || messageHtml.trim().length === 0) return null;

  const isUser = node.classList.contains('justify-end');
  const name = getNameFromNode(node as HTMLElement, globalSettings, charInfoName);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (onMessageUpdate) {
        onMessageUpdate(index, e.currentTarget.innerHTML);
    }
  };

  const lineNumber = String(index + 1).padStart(4, '0');
  const logBg = isUser ? color.cardBgUser : color.cardBg;
  const statusIcon = isUser ? '→' : '←';

  const tempMessageDiv = document.createElement('div');
  tempMessageDiv.innerHTML = messageHtml;
  tempMessageDiv.querySelectorAll('p').forEach(p => { 
      p.style.margin = '0'; 
      p.style.padding = '0';
  });
  const finalMessageHtml = tempMessageDiv.innerHTML;

  return (
    <div className="chat-message-container" style={{
      position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '8px',
      padding: '8px 12px', background: logBg, border: `1px solid ${color.border}`,
      marginBottom: '2px', fontFamily: 'Courier New, SF Mono, Monaco, Inconsolata, Fira Code, monospace',
      fontSize: '0.9em', transition: 'all 0.2s ease'
    }}>
      <div style={{ color: color.textSecondary, fontSize: '0.8em', width: '35px', flexShrink: 0, textAlign: 'right', paddingRight: '8px', borderRight: `1px solid ${color.border}`, opacity: 0.6 }}>
        {lineNumber}
      </div>
      <div style={{ color: color.nameColor, fontSize: '0.9em', width: '15px', flexShrink: 0, textAlign: 'center', fontWeight: 'bold' }}>
        {statusIcon}
      </div>
      <div style={{ color: color.nameColor, fontWeight: 'bold', width: '80px', flexShrink: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.85em' }}>
        [{name.toUpperCase()}]
      </div>
      <div style={{ color: color.text, flex: 1, lineHeight: 1.4, wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: finalMessageHtml }} contentEditable={isEditable} onBlur={handleBlur} suppressContentEditableWarning={true} />
      {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제">&times;</button>}
    </div>
  );
};

export default LogMessage;
