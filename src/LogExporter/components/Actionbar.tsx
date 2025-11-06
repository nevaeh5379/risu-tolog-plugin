import React, { useState } from 'react';
import { copyToClipboard, saveAsFile } from '../services/fileService';
import { saveAsImage } from '../services/imageService';
import { generateArcaContent } from '../services/arcaService';
import { THEMES, COLORS } from './constants';

interface ActionbarProps {
  charName: string;
  chatName: string;
  getPreviewContent: () => Promise<string>;
  messageNodes: HTMLElement[];
  settings: any;
  backgroundColor: string;
  charAvatarUrl: string;
}

const Actionbar: React.FC<ActionbarProps> = ({ charName, chatName, getPreviewContent, messageNodes, settings, backgroundColor, charAvatarUrl }) => {
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
        <button className="desktop-btn desktop-btn-primary" onClick={async () => {
            const arcaContent = await generateArcaContent(messageNodes, 'My Log', 'Check out my log!');
            copyToClipboard(arcaContent);
        }}>
            🚀 아카라이브용 복사
        </button>
    </div>
  );
};

export default Actionbar;
