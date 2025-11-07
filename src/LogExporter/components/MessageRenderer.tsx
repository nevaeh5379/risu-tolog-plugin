
import React from 'react';
import type { MessageProps, ThemeKey } from '../../types';
import BasicMessage from './themes/BasicMessage';
import ModernMessage from './themes/ModernMessage';
import FantasyMessage from './themes/FantasyMessage';
import Fantasy2Message from './themes/Fantasy2Message';
import RoyalMessage from './themes/RoyalMessage';
import OceanMessage from './themes/OceanMessage';
import SakuraMessage from './themes/SakuraMessage';
import MatrixMessage from './themes/MatrixMessage';
import LogMessage from './themes/LogMessage';
import RawMessage from './themes/RawMessage';

const themeMap: Record<ThemeKey, React.FC<MessageProps>> = {
  basic: BasicMessage,
  modern: ModernMessage,
  fantasy: FantasyMessage,
  fantasy2: Fantasy2Message,
  royal: RoyalMessage,
  ocean: OceanMessage,
  sakura: SakuraMessage,
  matrix: MatrixMessage,
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
    return <MessageComponent {...props} />;
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
      <div style={{ flex: 1, pointerEvents: 'none' }}>
        <MessageComponent {...props} />
      </div>
    </div>
  );
};

export default MessageRenderer;
