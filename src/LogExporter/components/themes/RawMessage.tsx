import React from 'react';
import type { MessageProps } from '../../../types';
import { useMessageProcessor } from '../../hooks/useMessageProcessor';

const RawMessage: React.FC<MessageProps> = (props) => {
  const { node, embedImagesAsBlob, color, imageScale, onRendered, replacementRules } = props;

  // We use allowHtmlRendering=true to ensure we use processRawHtmlContent
  // which preserves the structure (Raw) but applies replacements/image processing.
  const messageHtml = useMessageProcessor(
    node,
    embedImagesAsBlob,
    true,
    color,
    imageScale,
    onRendered,
    replacementRules
  );

  return <div className="raw-message-wrapper" dangerouslySetInnerHTML={{ __html: messageHtml }} />;
};

export default RawMessage;
