import React, { useState } from 'react';
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
}

const Actionbar: React.FC<ActionbarProps> = ({ charName, chatName, getPreviewContent, messageNodes, settings, backgroundColor, charAvatarUrl, onOpenArcaHelper, onProgressStart, onProgressUpdate, onProgressEnd, onSaveLogData, onLoadLogData }) => {
    const [imageFormat, setImageFormat] = useState<'png' | 'jpeg' | 'webp'>('png');

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
        const fullOptions = {
            ...settings,
            charAvatarUrl,
            themes: THEMES,
            colors: COLORS,
            onProgressStart,
            onProgressUpdate,
            onProgressEnd,
        };
        await saveAsImage(messageNodes, imageFormat, charName, chatName, fullOptions, backgroundColor);
    };

  return (
    <div className="desktop-action-bar">
        <button className="desktop-btn desktop-btn-primary" onClick={handleCopyHtml}>
            📋 HTML 복사
        </button>
        <button className="desktop-btn desktop-btn-secondary" onClick={handleSaveHtml}>
            💾 HTML 파일로 저장
        </button>
        <div className="desktop-image-save-group">
            <button className="desktop-btn desktop-btn-success" onClick={handleSaveAsImage}>
                🖼️ 이미지로 저장
            </button>
            <select value={imageFormat} onChange={(e) => setImageFormat(e.target.value as any)} className="desktop-select">
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
            </select>
        </div>
        <button className="desktop-btn desktop-btn-warning" onClick={onOpenArcaHelper}>
            🚀 아카라이브 도우미
        </button>
        <button className="desktop-btn desktop-btn-secondary" onClick={onSaveLogData}>
            📦 로그 데이터 저장
        </button>
        <button className="desktop-btn desktop-btn-secondary" onClick={onLoadLogData}>
            📂 로그 데이터 불러오기
        </button>
    </div>
  );
};

export default Actionbar;
