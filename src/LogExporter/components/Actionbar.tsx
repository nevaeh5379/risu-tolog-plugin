import React from 'react';
import { copyToClipboard, saveAsFile } from '../services/fileService';
import { saveAsImage } from '../services/imageService';
import { THEMES, COLORS } from './constants';

interface ActionbarProps {
  charName: string;
  chatName: string;
  getPreviewContent: () => Promise<string>;
  messageNodes: HTMLElement[];
  settings: any;
  backgroundColor: string;
  charAvatarUrl: string;
  onOpenArcaHelper?: () => void;
  onProgressStart: (message: string, total?: number) => void;
  onProgressUpdate: (update: { current?: number; message?: string }) => void;
  onProgressEnd: () => void;
  onSaveLogData: () => void;
  onLoadLogData: () => void;
  onDeleteSelected?: () => void;
  hasSelection?: boolean;
}

const Actionbar: React.FC<ActionbarProps> = ({ charName, chatName, getPreviewContent, messageNodes, settings, backgroundColor, charAvatarUrl, onOpenArcaHelper, onProgressStart, onProgressUpdate, onProgressEnd, onSaveLogData, onLoadLogData, onDeleteSelected, hasSelection }) => {

    const handleCopyHtml = async () => {
        const content = await getPreviewContent();
        copyToClipboard(content);
    };

    const handleSaveHtml = async () => {
        const content = await getPreviewContent();
        const safeCharName = charName.replace(/[\/\?%\*:|"<>]/g, '-');
        const safeChatName = chatName.replace(/[\/\?%\*:|"<>]/g, '-');
        const filename = `Risu_Log_${safeCharName}_${safeChatName}.html`;
        saveAsFile(filename, content, 'text/html;charset=utf-8');
    };

    const handleSaveAsImage = async () => {
        const imageFormat = settings.imageFormat || 'png';
        const fullOptions = {
            ...settings,
            charAvatarUrl,
            themes: THEMES,
            colors: COLORS,
            onProgressStart,
            onProgressUpdate,
            onProgressEnd,
        };
        
        if (settings.format !== 'basic') {
            const content = await getPreviewContent();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const elementToCapture = tempDiv.querySelector('div');
            
            if (!elementToCapture) {
                alert('이미지를 생성할 콘텐츠가 없습니다.');
                return;
            }

            await saveAsImage(elementToCapture, imageFormat, charName, chatName, fullOptions, backgroundColor);
        } else {
            await saveAsImage(messageNodes, imageFormat, charName, chatName, fullOptions, backgroundColor);
        }
    };

  return (
    <div className="desktop-action-bar">
        <button className="desktop-btn desktop-btn-primary" onClick={handleCopyHtml} title="HTML을 클립보드에 복사">
            📋 HTML 복사
        </button>
        <button className="desktop-btn desktop-btn-secondary" onClick={handleSaveHtml} title="HTML 파일로 저장">
            💾 HTML 저장
        </button>
        <button className="desktop-btn desktop-btn-success" onClick={handleSaveAsImage} title="이미지 파일로 저장">
            🖼️ 이미지 저장
        </button>
        <button className="desktop-btn desktop-btn-warning" onClick={onOpenArcaHelper} title="아카라이브 업로드 도우미">
            🚀 아카 도우미
        </button>
        <div style={{flex: 1}}></div>
        <button className="desktop-btn desktop-btn-secondary" onClick={onSaveLogData} title="로그 데이터를 JSON으로 저장">
            📦 데이터 저장
        </button>
        <button className="desktop-btn desktop-btn-secondary" onClick={onLoadLogData} title="저장된 로그 데이터 불러오기">
            📂 데이터 불러오기
        </button>
        {settings.isEditable && (
            <button 
                className="desktop-btn desktop-btn-danger"
                onClick={onDeleteSelected}
                disabled={!hasSelection}
                title={!hasSelection ? '삭제할 메시지를 선택하세요' : '선택한 메시지 삭제'}
                style={{opacity: !hasSelection ? 0.5 : 1, cursor: !hasSelection ? 'not-allowed' : 'pointer'}}
            >
                🗑️ 선택 삭제
            </button>
        )}
    </div>
  );
};

export default Actionbar;
