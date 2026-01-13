
import React, { useRef, useEffect } from 'react';
import type { MessageProps } from '../../../types';
import Avatar from '../Avatar';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';
import { getNameFromNode } from '../../utils/domUtils';

const SmartMessage: React.FC<MessageProps> = (props) => {
  const { node, index, charInfoName, color, showAvatar, isForArca, embedImagesAsBlob, allowHtmlRendering, globalSettings, isEditable, onMessageUpdate, imageScale, isForExport, replacementRules } = props;
  const originalMessageEl = node.querySelector('.prose, .chattext');
  const messageHtml = useMessageProcessor(originalMessageEl, embedImagesAsBlob, allowHtmlRendering, color, imageScale, props.onRendered, replacementRules);
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
    width: '42px',
    height: '42px',
    minWidth: '42px',
    borderRadius: '50%',
    border: 'none', // Smart themes usually don't use borders for avatars unless high contrast
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  };

  const avatarMarginStyle: React.CSSProperties = {
      margin: isUser ? '0 0 0 10px' : '0 10px 0 0'
  };
  
  // 스마트 테마는 조금 더 둥글고, 그라데이션과 블러를 활용
  const smartCardBg = isUser 
    ? `linear-gradient(135deg, ${color.cardBgUser} 0%, ${color.cardBgUser}CC 100%)`
    : `linear-gradient(135deg, ${color.cardBg} 0%, ${color.cardBg}CC 100%)`;
  
  // 테두리 반경: 말하는 쪽 꼬리 효과
  const borderRadius = isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px';

  return (
    <div className="chat-message-container" style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        marginBottom: '24px', 
        gap: '6px', 
        flexDirection: isUser ? 'row-reverse' : 'row',
        padding: '0 8px' // 모바일에서 여백 확보
    }}>
      <div style={{ position: 'relative', paddingTop: '0px' }}>
        <Avatar 
            avatarSrc={avatarSrc} 
            name={name} 
            isUser={isUser} 
            isForArca={isForArca} 
            showAvatar={showAvatar} 
            baseStyle={avatarBaseStyle} 
            marginStyle={avatarMarginStyle} 
            isForExport={isForExport} 
        />
        {isEditable && <button className="log-exporter-delete-msg-btn" data-message-index={index} title="메시지 삭제" style={{ width: '18px', height: '18px', fontSize: '12px', top: '-5px', right: isUser ? 'auto' : '-5px', left: isUser ? '-5px' : 'auto' }}>&times;</button>}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
        {!isUser && (
            <span style={{ 
                color: color.nameColor, 
                fontWeight: 600, 
                fontSize: '0.85em', 
                marginBottom: '4px',
                marginLeft: '4px',
                opacity: 0.9 
            }}>
                {name}
            </span>
        )}
        
        <div style={{ 
            borderRadius: borderRadius, 
            background: smartCardBg, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', // 은은한 그림자
            overflow: 'hidden',
            backdropFilter: 'blur(5px)', // 글래스모피즘 효과 (지원 브라우저)
            border: `1px solid ${color.border}40` // 투명도 있는 테두리
        }}>
            <div 
                ref={contentRef} 
                style={{ 
                    padding: '12px 16px', 
                    color: color.text, 
                    lineHeight: 1.7, 
                    wordWrap: 'break-word',
                    fontSize: '0.95em'
                }} 
                contentEditable={isEditable} 
                onBlur={handleBlur} 
                onClick={handleContentClick} 
                suppressContentEditableWarning={true} 
            />
        </div>
        
        {/* 여기에 타임스탬프가 있다면 좋을 것입니다 */}
      </div>
    </div>
  );
};

export default SmartMessage;
