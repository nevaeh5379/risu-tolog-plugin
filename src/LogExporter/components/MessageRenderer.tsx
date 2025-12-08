
import React from 'react';
import type { MessageProps, ThemeKey } from '../../types';
import BasicMessage from './themes/BasicMessage';
import CustomMessage from './themes/CustomMessage';
import ModernMessage from './themes/ModernMessage';
import SmartMessage from './themes/SmartMessage';
import SimpleMessage from './themes/SimpleMessage';
import LogMessage from './themes/LogMessage';
import RawMessage from './themes/RawMessage';

const themeMap: Record<ThemeKey, React.FC<MessageProps>> = {
  basic: BasicMessage,
  custom: CustomMessage,
  modern: ModernMessage,
  smart: SmartMessage,
  simple: SimpleMessage,
  log: LogMessage,
  raw: RawMessage,
};

const MessageRenderer: React.FC<MessageProps> = (props) => {
  const { themeKey, isSelected, onSelect, index, isEditable } = props;
  const MessageComponent = themeMap[themeKey] || BasicMessage;

  const handleContainerClick = (e: React.MouseEvent) => {
    if (onSelect) {
      onSelect(index, e);
    }
  };

  // When the checkbox itself is clicked, we handle the selection
  // and stop it from bubbling to the container to avoid a double-trigger.
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(index, e);
    }
  };

  if (!isEditable) {
    return <MessageComponent {...props} onRendered={props.onRendered} />;
  }

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.2)' : undefined,
        borderRadius: '4px',
      }}
      onClick={handleContainerClick}
    >
      <input
        type="checkbox"
        checked={isSelected || false}
        onClick={handleCheckboxClick}
        readOnly // State is controlled by parent
        style={{ margin: '0 10px' }}
      />
      <div style={{ flex: 1 }}>
        <MessageComponent {...props} onRendered={props.onRendered} />
      </div>
    </div>
  );
};

export default MessageRenderer;
