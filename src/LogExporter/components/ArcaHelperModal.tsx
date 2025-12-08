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

const STEPS = [
    { id: 'intro', label: '이미지 저장', step: 1 },
    { id: 'paste_urls', label: 'URL 붙여넣기', step: 2 },
    { id: 'done', label: '완료', step: 3 },
];

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

  const getStepStatus = (stepId: string) => {
      const stepIndex = STEPS.findIndex(s => s.id === stepId);
      const currentStepIndex = STEPS.findIndex(s => s.id === step);
      if (stepIndex < currentStepIndex) return 'completed';
      if (stepIndex === currentStepIndex) return 'active';
      return 'pending';
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (isProcessing) {
        return (
            <div className="arca-helper-step arca-helper-processing">
                <div className="desktop-spinner"></div>
                <div className="processing-text">파일 생성 중...</div>
                <div className="processing-subtext">잠시만 기다려주세요.</div>
            </div>
        );
    }

    switch (step) {
      case 'intro':
        return (
          <div className="arca-helper-step">
            <div className="arca-instruction-card">
                <h3 className="arca-step-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    1단계: 이미지 파일 다운로드
                </h3>
                <p className="arca-step-desc">아카라이브에 업로드할 이미지들을 ZIP 파일로 묶어 다운로드합니다.</p>
                <ul className="arca-list">
                    <li className="arca-list-item">
                        <span className="arca-num-badge">1</span>
                        <span>하단의 <b>'이미지 ZIP 생성'</b> 버튼을 클릭하세요.</span>
                    </li>
                    <li className="arca-list-item">
                        <span className="arca-num-badge">2</span>
                        <span>다운로드된 ZIP 파일의 압축을 풀어주세요.</span>
                    </li>
                </ul>
            </div>
          </div>
        );
      case 'paste_urls':
        return (
          <div className="arca-helper-step">
            <div className="arca-instruction-card">
                <h3 className="arca-step-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    2단계: 이미지 URL 붙여넣기
                </h3>
                <p className="arca-step-desc">압축 푼 이미지들을 아카라이브 글쓰기 창에 업로드한 후, HTML 코드를 가져오세요.</p>
                <ul className="arca-list">
                    <li className="arca-list-item">
                        <span className="arca-num-badge">1</span>
                        <span>아카라이브 편집기를 <b>HTML 모드</b>로 전환합니다.</span>
                    </li>
                    <li className="arca-list-item">
                        <span className="arca-num-badge">2</span>
                        <span>업로드된 이미지 태그(<code>{'<img>'}</code>) 전체를 복사합니다.</span>
                    </li>
                </ul>
            </div>
            <textarea 
              className="arca-paste-area"
              value={pastedHtml}
              onChange={(e) => setPastedHtml(e.target.value)}
              placeholder="여기에 아카라이브 편집기에서 복사한 <img> 태그들을 붙여넣으세요..."
              spellCheck={false}
            />
          </div>
        );
      case 'done':
        return (
          <div className="arca-helper-step">
            <div className="arca-instruction-card">
                <h3 className="arca-step-title" style={{ color: 'var(--btn-success-bg)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    3단계: 최종 HTML 복사
                </h3>
                <p className="arca-step-desc">완성되었습니다! 아래 코드를 복사하여 아카라이브 <b>HTML 편집기</b>에 그대로 붙여넣으세요.</p>
            </div>
            <textarea 
              className="arca-paste-area"
              value={finalHtml} 
              readOnly
              spellCheck={false}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
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
        <div className="arca-stepper">
            {STEPS.map((s) => (
                <div key={s.id} className={`arca-step-item ${getStepStatus(s.id)}`}>
                    <div className="arca-step-circle">
                        {getStepStatus(s.id) === 'completed' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : s.step}
                    </div>
                    <span className="arca-step-label">{s.label}</span>
                </div>
            ))}
        </div>
        
        <div className="arca-content-body">
            {error && (
                <div className="arca-helper-error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
            {renderContent()}
        </div>
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
