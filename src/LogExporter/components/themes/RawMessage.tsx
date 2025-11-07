import React from 'react';
import type { MessageProps } from '../../../types';

const RawMessage: React.FC<MessageProps> = ({ node }) => {
  // This component renders the raw HTML of the message node.
  // It's intended for the 'html' format preview to become interactive.
  return <div dangerouslySetInnerHTML={{ __html: node.outerHTML }} />;
};

export default RawMessage;
