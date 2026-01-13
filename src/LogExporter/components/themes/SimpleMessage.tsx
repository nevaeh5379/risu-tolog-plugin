
import React, { useRef, useEffect } from 'react';
import type { MessageProps } from '../../../types';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const SimpleMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, allowHtmlRendering, globalSettings, isEditable, onMessageUpdate, imageScale, replacementRules } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, props.embedImagesAsBlob, allowHtmlRendering, color, imageScale, props.onRendered, replacementRules);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && messageHtml !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = messageHtml;
    }
  }, [messageHtml]);

  if (!messageHtml || messageHtml.trim().length === 0) return null;

  const isUser = node.classList.contains('justify-end');
  const name = getNameFromNode(node as HTMLElement, globalSettings, charInfoName);
  
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (onMessageUpdate && e.currentTarget.innerHTML !== messageHtml) {
        onMessageUpdate(index, e.currentTarget.innerHTML);
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (isEditable) e.stopPropagation();
  };

  // Simple 테마: 아바타 없음, 최소한의 스타일
  return (
    <div className="chat-message-container" style={{ 
        marginBottom: '1.5em', 
        paddingLeft: isUser ? '2em' : '0', 
        paddingRight: isUser ? '0' : '2em',
        textAlign: isUser ? 'right' : 'left'
    }}>
        <div style={{ 
            color: color.nameColor, 
            fontWeight: 'bold', 
            fontSize: '0.9em', 
            marginBottom: '0.2em',
            opacity: 0.8
        }}>
            {name}
        </div>
        <div 
            ref={contentRef} 
            style={{ 
                color: color.text, 
                lineHeight: 1.6,
                fontSize: '1em' 
            }} 
            contentEditable={isEditable} 
            onBlur={handleBlur} 
            onClick={handleContentClick} 
            suppressContentEditableWarning={true} 
        />
        {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} style={{ float: isUser ? 'left' : 'right', opacity: 0.3 }}>&times;</button>}
    </div>
  );
};

export default SimpleMessage;
