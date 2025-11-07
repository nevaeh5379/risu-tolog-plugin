import React, { useRef, useEffect, useState } from 'react';
import LogContainer from './LogContainer';
import type { LogContainerProps } from '../../types';
import { getLogHtml } from '../services/htmlGenerator';

interface PreviewPanelProps {
  settings: any;
  logContainerProps: Omit<LogContainerProps, 'onReady'>;
  otherFormatContent: string; 
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ settings, logContainerProps, otherFormatContent }) => {
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const [rawHtmlContent, setRawHtmlContent] = useState('');

  const isBasicFormat = settings.format === 'basic' || !settings.format;

  useEffect(() => {
    if (settings.rawHtmlView) {
      if (isBasicFormat) {
        getLogHtml(logContainerProps).then(setRawHtmlContent);
      } else {
        setRawHtmlContent(otherFormatContent);
      }
    }
  }, [settings.rawHtmlView, logContainerProps, otherFormatContent, isBasicFormat]);

  useEffect(() => {
    if (shadowHostRef.current && !isBasicFormat && !settings.rawHtmlView) {
        if (!shadowHostRef.current.shadowRoot) {
            shadowHostRef.current.attachShadow({ mode: 'open' });
        }
        const shadowRoot = shadowHostRef.current.shadowRoot!;
        shadowRoot.innerHTML = `
            <style>
                :host {
                    all: initial;
                    display: block;
                }
                img, video {
                    max-width: 100%;
                    height: auto;
                    display: block;
                }
            </style>
            ${otherFormatContent}
        `;
    }
  }, [otherFormatContent, isBasicFormat, settings.rawHtmlView]);

  const renderContent = () => {
    if (settings.rawHtmlView) {
      return <textarea readOnly style={{width: '100%', height: '100%', whiteSpace: 'pre-wrap', wordWrap: 'break-word', backgroundColor: '#1a1b26', color: '#c0caf5', border: 'none'}} value={rawHtmlContent}></textarea>;
    }
    if (isBasicFormat) {
      return <LogContainer {...logContainerProps} />;
    }
    return <div ref={shadowHostRef}></div>;
  };

  return (
    <>
        <div className="desktop-preview-toolbar">
            <span className="desktop-preview-toolbar-title">📱 미리보기</span>
        </div>
        <div className="desktop-preview-content">
            <div className="log-exporter-modal-preview">
                {renderContent()}
            </div>
        </div>
    </>
  );
};

export default PreviewPanel;