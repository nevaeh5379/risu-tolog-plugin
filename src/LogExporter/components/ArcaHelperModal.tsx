import React, { useState, useCallback } from 'react';
import { createZipFromMediaList } from '../../services/zipService';
import { copyToClipboard } from '../services/fileService';
import type { CharInfo, ArcaImage } from '../../types';
import { getLogHtml } from '../services/htmlGenerator';

interface ArcaHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageNodes: HTMLElement[];
  charInfo: CharInfo;
  settings: any;
  globalSettings: any;
  uiTheme: string;
  colorPalette: any;
}

type Step = 'intro' | 'paste_urls' | 'done';

const ArcaHelperModal: React.FC<ArcaHelperModalProps> = ({ isOpen, onClose, messageNodes, charInfo, settings, globalSettings, uiTheme, colorPalette }) => {
  const [step, setStep] = useState<Step>('intro');
  const [baseHtml, setBaseHtml] = useState('');
  const [images, setImages] = useState<ArcaImage[]>([]);
  const [pastedHtml, setPastedHtml] = useState('');
  const [finalHtml, setFinalHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRestart = () => {
    setStep('intro');
    setBaseHtml('');
    setImages([]);
    setPastedHtml('');
    setFinalHtml('');
    setError(null);
  };

  const handleClose = () => {
    handleRestart();
    onClose();
  };

  const generateInitialFiles = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const logHtml = await getLogHtml({
        nodes: messageNodes,
        charInfo,
        selectedThemeKey: settings.theme,
        color: colorPalette,
        showAvatar: settings.showAvatar,
        showHeader: settings.showHeader,
        showHeaderIcon: settings.showHeaderIcon,
        headerTags: settings.headerTags,
        headerLayout: settings.headerLayout,
        headerBannerUrl: settings.headerBannerUrl,
        headerBannerBlur: settings.headerBannerBlur,
        headerBannerAlign: settings.headerBannerAlign,
        showFooter: settings.showFooter,
        footerLeft: settings.footerLeft,
        footerCenter: settings.footerCenter,
        footerRight: settings.footerRight,
        showBubble: settings.showBubble,
        embedImagesAsBlob: false,
        globalSettings,
        isForExport: true,
        isForArca: true,
      });

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = logHtml;

      const collectedImages: ArcaImage[] = [];
      const processedUrls = new Set<string>();
      let mediaCounter = 0;
      
      // 1. Process Banner Header first
      const headerElement = tempDiv.querySelector('[data-is-banner-header="true"]') as HTMLDivElement;
      if (headerElement && headerElement.style.backgroundImage) {
        const style = headerElement.style.backgroundImage;
        const urlRegex = /url\("([^"]+)"\)/;
        const match = style.match(urlRegex);

        if (match && match[1]) {
            const bannerUrl = match[1];
            if (bannerUrl && !bannerUrl.startsWith('data:')) {
                processedUrls.add(bannerUrl);
                mediaCounter++;
                const extension = 'jpg';
                const filename = `${String(mediaCounter).padStart(3, '0')}.${extension}`;
                collectedImages.push({ url: bannerUrl, filename, isWebM: false });
                
                const placeholder = `__TOLOG_PLACEHOLDER_${bannerUrl}__`;
                headerElement.style.backgroundImage = style.replace(bannerUrl, placeholder);
            }
        }
      }

      // 2. Process other media elements
      const mediaElements = Array.from(tempDiv.querySelectorAll('img, video'));

      for (const el of mediaElements) {
        const isVideo = el.tagName === 'VIDEO';
        const src = isVideo ? ((el as HTMLVideoElement).querySelector('source')?.src || (el as HTMLVideoElement).src) : (el as HTMLImageElement).src;

        if (!src || src.startsWith('data:')) continue;

        if (!processedUrls.has(src)) {
          processedUrls.add(src);
          mediaCounter++;
          
          const urlLower = src.toLowerCase();
          const isWebM = urlLower.includes('.webm') || urlLower.includes('2e7765626d');
          let extension = isWebM && settings.convertWebM ? 'webp' : ((el as HTMLElement).dataset.extension || 'jpg');
          const filename = `${String(mediaCounter).padStart(3, '0')}.${extension}`;

          collectedImages.push({ url: src, filename, isWebM });
        }
        
        const placeholder = `__TOLOG_PLACEHOLDER_${src}__`;
        if (isVideo) {
          (el as HTMLVideoElement).src = placeholder;
          const source = el.querySelector('source');
          if (source) source.src = placeholder;
        } else {
          (el as HTMLImageElement).src = placeholder;
        }
      }

      setBaseHtml(tempDiv.innerHTML);
      setImages(collectedImages);

      if (collectedImages.length > 0) {
        const blob = await createZipFromMediaList(collectedImages, { convertWebM: settings.convertWebM });
        const safeCharName = charInfo.name.replace(/[\/\?%\*:|"<>]/g, '-');
        const zipFilename = `Arca_Images_${safeCharName}.zip`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = zipFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
      
      setStep('paste_urls');
    } catch (e: any) {      
      console.error('[Arca Helper] Step 1 failed:', e);
      setError(`파일 생성 중 오류가 발생했습니다: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [messageNodes, charInfo, settings, globalSettings, colorPalette]);

  const generateFinalHtml = () => {
    if (!pastedHtml) {
      setError('아카라이브 HTML 코드를 붙여넣어 주세요.');
      return;
    }
    setError(null);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pastedHtml;
    
    const newImageUrls = Array.from(tempDiv.querySelectorAll('img')).map(img => img.src);
    
    if (newImageUrls.length !== images.length) {
        setError(`이미지 개수가 일치하지 않습니다. 원본 (${images.length}개) vs 붙여넣은 코드 (${newImageUrls.length}개)`);
        return;
    }

    let finalOutputHtml = baseHtml;
    images.forEach((imageInfo, index) => {
      const placeholder = `__TOLOG_PLACEHOLDER_${imageInfo.url}__`;
      const newUrl = newImageUrls[index];
      if (newUrl) {
        finalOutputHtml = finalOutputHtml.replace(new RegExp(placeholder, 'g'), newUrl);
      }
    });

    setFinalHtml(finalOutputHtml);
    setStep('done');
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (isProcessing) {
        return (
            <div className="arca-helper-step arca-helper-processing">
                <div className="desktop-spinner"></div>
                <p>파일 생성 중...</p>
                <span>잠시만 기다려주세요.</span>
            </div>
        );
    }

    switch (step) {
      case 'intro':
        return (
          <div className="arca-helper-step">
            <h3>1단계: 이미지 파일 다운로드</h3>
            <p>아카라이브에 업로드할 이미지들을 ZIP 파일로 묶어 다운로드합니다.</p>
            <ol>
                <li>아래 버튼을 클릭하여 이미지 압축 파일을 받으세요.</li>
                <li>다음 단계로 자동 이동합니다.</li>
            </ol>
          </div>
        );
      case 'paste_urls':
        return (
          <div className="arca-helper-step">
            <h3>2단계: 이미지 URL 붙여넣기</h3>
            <p>먼저, 다운로드한 ZIP 파일의 압축을 풀고 아카라이브 글쓰기 창에 모든 이미지를 업로드하세요.</p>
            <ol>
              <li>아카라이브 편집기를 **HTML 모드**로 전환합니다.</li>
              <li>업로드된 이미지에 해당하는 `{'<img>'}` 태그 전체를 복사합니다.</li>
              <li>복사한 코드를 아래 입력창에 붙여넣습니다.</li>
            </ol>
            <textarea 
              className="desktop-input arca-paste-area"
              value={pastedHtml}
              onChange={(e) => setPastedHtml(e.target.value)}
              placeholder="여기에 아카라이브 편집기에서 복사한 {'<img>'} 태그들을 붙여넣으세요..."
            />
          </div>
        );
      case 'done':
        return (
          <div className="arca-helper-step">
            <h3>3단계: 최종 HTML 복사</h3>
            <p>완성되었습니다! 아래 코드를 복사하여 아카라이브 **HTML 편집기**에 그대로 붙여넣으세요.</p>
            <textarea 
              className="desktop-input arca-paste-area"
              value={finalHtml} 
              readOnly
            />
          </div>
        );
      default:
        return null;
    }
};


  return (
    <div className="log-exporter-modal arca-helper-modal" data-theme={uiTheme} onClick={(e) => e.stopPropagation()}>
      <div className="desktop-modal-header">
        <h2 className="desktop-modal-title">🚀 아카라이브 도우미</h2>
        <button onClick={handleClose} className="desktop-modal-close-btn">&times;</button>
      </div>
      
      <div className="desktop-modal-content">
        {error && <div className="arca-helper-error">{error}</div>}
        {renderContent()}
      </div>

      <div className="desktop-modal-footer">
        {step === 'intro' && <button onClick={generateInitialFiles} className="desktop-btn desktop-btn-primary" disabled={isProcessing}>이미지 ZIP 생성</button>}
        {step === 'paste_urls' && <button onClick={generateFinalHtml} className="desktop-btn desktop-btn-primary">최종 HTML 생성</button>}
        {step === 'done' && <button onClick={() => copyToClipboard(finalHtml)} className="desktop-btn desktop-btn-success">HTML 코드 복사</button>}
        {step !== 'intro' && <button onClick={handleRestart} className="desktop-btn desktop-btn-secondary">처음부터 다시</button>}
        <button onClick={handleClose} className="desktop-btn desktop-btn-secondary">닫기</button>
      </div>
    </div>
  );
};

export default ArcaHelperModal;
