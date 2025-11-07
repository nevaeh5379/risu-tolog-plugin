import React, { useRef, useEffect, useState } from 'react';
import LogContainer from './LogContainer';
import type { LogContainerProps } from '../../types';
import { getLogHtml } from '../services/htmlGenerator';

interface PreviewPanelProps {
  settings: any;
  logContainerProps: Omit<LogContainerProps, 'onReady'>;
  otherFormatContent: string;
  selectedIndices: Set<number>;
  onSelectionChange: (newSelection: Set<number>) => void;
  onLastSelectedIndexChange: (index: number | null) => void;
  lastSelectedIndex: number | null;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onInvertSelection?: () => void;
  onDimensionsChange: (dims: { width: number, height: number, maxMessageHeight: number }) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  settings, 
  logContainerProps, 
  otherFormatContent,
  selectedIndices,
  onSelectionChange,
  onLastSelectedIndexChange,
  lastSelectedIndex,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onDimensionsChange,
}) => {
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const [rawHtmlContent, setRawHtmlContent] = useState('');

  const isBasicFormat = settings.format === 'basic' || !settings.format;

  const onReady = React.useCallback(() => {
    if (previewContentRef.current) {
      const element = previewContentRef.current;
      let maxMessageHeight = 0;
      const messageElements = element.querySelectorAll('.chat-message-container');
      messageElements.forEach(msg => {
          if ((msg as HTMLElement).offsetHeight > maxMessageHeight) {
              maxMessageHeight = (msg as HTMLElement).offsetHeight;
          }
      });

      onDimensionsChange({
        width: element.offsetWidth,
        height: element.offsetHeight,
        maxMessageHeight: maxMessageHeight,
      });
    }
  }, [onDimensionsChange]);

  const handleMessageSelect = (index: number, e: React.MouseEvent) => {
    const newSelection = new Set(selectedIndices);
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
    } else {
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
    }
    onSelectionChange(newSelection);
    onLastSelectedIndexChange(index);
  };

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
      return <LogContainer {...logContainerProps} onReady={onReady} selectedIndices={selectedIndices} onMessageSelect={handleMessageSelect} />;
    }
    return <div ref={shadowHostRef}></div>;
  };

  return (
    <>
        <div className="desktop-preview-toolbar">
            <span className="desktop-preview-toolbar-title">📱 미리보기</span>
            <div className="desktop-selection-controls">
                <button className="desktop-btn desktop-btn-xs desktop-btn-secondary" onClick={onSelectAll} title="모든 메시지 선택">전체 선택</button>
                <button className="desktop-btn desktop-btn-xs desktop-btn-secondary" onClick={onDeselectAll} title="모든 선택 해제">전체 해제</button>
                <button className="desktop-btn desktop-btn-xs desktop-btn-secondary" onClick={onInvertSelection} title="선택 상태 반전">선택 반전</button>
            </div>
        </div>
        <div className="desktop-preview-content" ref={previewContentRef}>
            <div className="log-exporter-modal-preview">
                {renderContent()}
            </div>
        </div>
    </>
  );
};

export default PreviewPanel;