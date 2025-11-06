import React, { useRef, useEffect } from 'react';

interface PreviewPanelProps {
  previewContent: string;
  settings: any;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ previewContent, settings }) => {
  const shadowHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shadowHostRef.current && !settings.rawHtmlView) {
        if (!shadowHostRef.current.shadowRoot) {
            shadowHostRef.current.attachShadow({ mode: 'open' });
        }
        shadowHostRef.current.shadowRoot!.innerHTML = previewContent;
    }
  }, [previewContent, settings.rawHtmlView]);

  return (
    <div className="desktop-preview-panel">
        <div className="desktop-preview-toolbar">
            <span className="desktop-preview-toolbar-title">📱 미리보기</span>
        </div>
        <div className="desktop-preview-content">
            <div className="log-exporter-modal-preview">
                {settings.rawHtmlView ? (
                    <textarea readOnly style={{width: '100%', height: '100%', whiteSpace: 'pre-wrap', wordWrap: 'break-word', backgroundColor: '#1a1b26', color: '#c0caf5', border: 'none'}} value={previewContent}></textarea>
                ) : (
                    <div ref={shadowHostRef}></div>
                )}
            </div>
        </div>
    </div>
  );
};

export default PreviewPanel;
