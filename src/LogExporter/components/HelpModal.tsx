import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="log-exporter-modal-backdrop" onClick={onClose}>
        <div className="log-exporter-modal" style={{maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
            <div className="log-exporter-modal-header-bar">
                <span className="header-title">도움말</span>
                <button className="log-exporter-modal-close-btn" onClick={onClose}>&times;</button>
            </div>
            <div className="log-exporter-modal-content" style={{display: 'block', padding: '20px'}}>
                <p><strong>Ctrl + /</strong>: 도움말 보기</p>
                <p><strong>Esc</strong>: 모달 닫기</p>
                <p><strong>Ctrl + S</strong>: HTML 파일로 저장</p>
                <p><strong>Ctrl + C</strong>: HTML 소스 복사</p>
            </div>
        </div>
    </div>
  );
};

export default HelpModal;
