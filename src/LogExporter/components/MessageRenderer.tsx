
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
};

const MessageRenderer: React.FC<MessageProps> = (props) => {
  const { themeKey } = props;
  const MessageComponent = themeMap[themeKey] || BasicMessage;
  return <MessageComponent {...props} />;
};

export default MessageRenderer;
