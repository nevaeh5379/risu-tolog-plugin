import { toBlob } from 'html-to-image';
import domtoimage from 'dom-to-image-more';
import JSZip from 'jszip';
import { createRoot } from 'react-dom/client';
import LogContainer from '../components/LogContainer';
import { convertWebMToAnimatedWebP } from '../../services/webmConverter';
import { getLogHtml } from './htmlGenerator';
import { collectCharacterAvatars } from './avatarService';
import type { CharInfo } from '../../types';
import html2canvas from 'html2canvas';
import { loadGlobalSettings } from './settingsService';
import { mergePNGsBinary } from './image/png';
import { mergeJPEGsBinary } from './image/jpeg';
import { mergeWebPsBinary } from './image/webp';

// 큰 메시지를 분할하여 캡처한 후 하나의 이미지로 병합하는 함수
const splitAndMergeAsOneFile = async (
    element: HTMLElement,
    maxHeight: number,
    resolution: number,
    format: 'png' | 'jpeg' | 'webp',
    imageLibrary: string,
    bgColor: string,
    onProgressUpdate: (update: { message?: string }) => void
): Promise<Blob> => {
    const totalHeight = element.offsetHeight;
    const totalWidth = element.offsetWidth;
    const numSections = Math.ceil(totalHeight / maxHeight);
    
    onProgressUpdate({ message: `큰 이미지 분할 캡처 중 (${numSections}개 섹션)...` });
    
    // 각 섹션을 캡처
    const blobs: Blob[] = [];
    for (let i = 0; i < numSections; i++) {
        const startY = i * maxHeight;
        const sectionHeight = Math.min(maxHeight, totalHeight - startY);
        
        // 임시 래퍼 생성
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = `${totalWidth}px`;
        wrapper.style.height = `${sectionHeight}px`;
        wrapper.style.overflow = 'hidden';
        wrapper.style.backgroundColor = bgColor;
        
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.top = `${-startY}px`;
        clone.style.left = '0';
        wrapper.appendChild(clone);
        
        document.body.appendChild(wrapper);
        
        try {
            let blob: Blob | null = null;
            const commonOptions = {
                pixelRatio: resolution,
                width: wrapper.offsetWidth,
                height: wrapper.offsetHeight,
            };
            
            onProgressUpdate({ message: `[섹션 ${i + 1}/${numSections}] 캡처 중...` });
            
            // WebP의 경우 PNG로 캡처 후 나중에 변환 (이미지 에셋 보존)
            const captureFormat = format === 'webp' ? 'png' : format;
            
            if (imageLibrary === 'html2canvas') {
                const canvas = await html2canvas(wrapper, { 
                    scale: resolution, 
                    useCORS: true, 
                    backgroundColor: bgColor,
                    width: commonOptions.width,
                    height: commonOptions.height
                });
                blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${captureFormat}`));
            } else if (imageLibrary === 'dom-to-image') {
                const libOptions = { ...commonOptions, bgcolor: bgColor };
                if (captureFormat === 'png') {
                    blob = await domtoimage.toBlob(wrapper, libOptions);
                } else { // jpeg
                    blob = await domtoimage.toBlob(wrapper, { ...libOptions, quality: 1.0 });
                }
            } else { // html-to-image
                const libOptions = { ...commonOptions, backgroundColor: bgColor };
                if (captureFormat === 'png') {
                    blob = await toBlob(wrapper, libOptions);
                } else { // jpeg
                    blob = await toBlob(wrapper, { ...libOptions, quality: 1.0 });
                }
            }
            
            if (!blob) throw new Error('Failed to capture section');
            
            // 실제 Blob 타입 확인 및 로깅
            console.log(`[Log Exporter] Section ${i + 1} captured: ${blob.type} (requested: image/${format})`);
            
            // dom-to-image와 html-to-image는 항상 PNG를 생성하므로
            // JPEG 요청 시에만 포맷 변환 (WebP는 병합 후 변환)
            if (blob.type === 'image/png' && format === 'jpeg') {
                console.log(`[Log Exporter] Converting PNG to JPEG...`);
                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const image = new Image();
                    image.crossOrigin = 'anonymous'; // CORS 설정
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = URL.createObjectURL(blob!);
                });
                
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { 
                    alpha: false,
                    willReadFrequently: false
                });
                if (!ctx) throw new Error('Canvas context not available');
                
                // 이미지 스무딩 비활성화 (픽셀 완벽 재현)
                ctx.imageSmoothingEnabled = false;
                
                // 이미지 그리기
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(img.src);
                
                blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
                });
            }
            
            blobs.push(blob);
            
        } finally {
            document.body.removeChild(wrapper);
        }
    }
    
    // 포맷에 따라 바이너리 레벨 병합 사용
    onProgressUpdate({ message: `이미지 병합 중...` });
    if (format === 'png') {
        console.log('[Log Exporter] Using PNG binary merge (no Canvas!)');
        return await mergePNGsBinary(blobs);
    } else if (format === 'jpeg') {
        console.log('[Log Exporter] Using JPEG binary merge (no Canvas!)');
        return await mergeJPEGsBinary(blobs);
    } else { // webp
        console.log('[Log Exporter] Using WebP merge (PNG binary merge + WebP conversion)');
        return await mergeWebPsBinary(blobs);
    }
};

// 큰 메시지를 분할하여 여러 개의 개별 파일로 저장하는 함수
const splitAndSaveAsSeparateFiles = async (
    element: HTMLElement,
    maxHeight: number,
    resolution: number,
    format: 'png' | 'jpeg' | 'webp',
    imageLibrary: string,
    bgColor: string,
    onProgressUpdate: (update: { message?: string }) => void,
    safeCharName: string,
    safeChatName: string,
    basePart: number,
    totalBaseParts: number
): Promise<void> => {
    const totalHeight = element.offsetHeight;
    const totalWidth = element.offsetWidth;
    const numSections = Math.ceil(totalHeight / maxHeight);
    
    onProgressUpdate({ message: `큰 이미지 분할 저장 중 (${numSections}개 섹션)...` });
    
    // 각 섹션을 개별 파일로 저장
    for (let i = 0; i < numSections; i++) {
        const startY = i * maxHeight;
        const sectionHeight = Math.min(maxHeight, totalHeight - startY);
        
        // 임시 래퍼 생성
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = `${totalWidth}px`;
        wrapper.style.height = `${sectionHeight}px`;
        wrapper.style.overflow = 'hidden';
        
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.top = `${-startY}px`;
        clone.style.left = '0';
        wrapper.appendChild(clone);
        
        document.body.appendChild(wrapper);
        
        try {
            let blob: Blob | null = null;
            const commonOptions = {
                pixelRatio: resolution,
                width: wrapper.offsetWidth,
                height: wrapper.offsetHeight,
            };
            
            onProgressUpdate({ message: `[섹션 ${i + 1}/${numSections}] 캡처 중...` });
            
            if (imageLibrary === 'html2canvas') {
                const canvas = await html2canvas(wrapper, { 
                    scale: resolution, 
                    useCORS: true, 
                    backgroundColor: bgColor,
                    width: commonOptions.width,
                    height: commonOptions.height
                });
                blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`));
            } else if (imageLibrary === 'dom-to-image') {
                const libOptions = { ...commonOptions, bgcolor: bgColor };
                if (format === 'png') {
                    blob = await domtoimage.toBlob(wrapper, libOptions);
                } else if (format === 'jpeg') {
                    blob = await domtoimage.toBlob(wrapper, { ...libOptions, quality: 1.0 });
                } else {
                    const canvas = await html2canvas(wrapper, { 
                        scale: resolution, 
                        useCORS: true, 
                        backgroundColor: bgColor,
                        width: commonOptions.width,
                        height: commonOptions.height
                    });
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
                }
            } else { // html-to-image
                const libOptions = { ...commonOptions, backgroundColor: bgColor };
                if (format === 'png') {
                    blob = await toBlob(wrapper, libOptions);
                } else if (format === 'jpeg') {
                    blob = await toBlob(wrapper, { ...libOptions, quality: 1.0 });
                } else {
                    const canvas = await html2canvas(wrapper, { 
                        scale: resolution, 
                        useCORS: true, 
                        backgroundColor: bgColor,
                        width: commonOptions.width,
                        height: commonOptions.height
                    });
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
                }
            }
            
            if (!blob) throw new Error('Failed to capture section');
            
            // 파일 저장
            const sectionNumber = totalBaseParts > 1 ? `${basePart + 1}_${i + 1}` : `${i + 1}`;
            const filename = `Risu_Log_${safeCharName}_${safeChatName}_part${sectionNumber}.${format}`;
            
            onProgressUpdate({ message: `[섹션 ${i + 1}/${numSections}] 파일 저장 중...` });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } finally {
            document.body.removeChild(wrapper);
        }
    }
};

export const saveAsImage = async (nodes: HTMLElement[] | HTMLElement, format: 'png' | 'jpeg' | 'webp', charName: string, chatName: string, options: any, backgroundColor?: string) => {
    const { 
        imageResolution: initialImageResolution = 1, 
        imageLibrary = 'html-to-image', 
        splitImage = 'none', 
        maxImageHeight: userMaxImageHeight = 10000,
        onProgressStart = (_message: string, _total?: number) => {},
        onProgressUpdate = (_update: { current?: number; message?: string }) => {},
        onProgressEnd = () => {},
        ...htmlOptions
    } = options;

    const BROWSER_MAX_HEIGHT = 16384;

    const renderImage = async (element: HTMLElement, resolution: number, part = 0, totalParts = 1) => {
        onProgressUpdate({ message: `[${part + 1}/${totalParts}] 이미지 데이터 생성 중...` });
        await new Promise(resolve => setTimeout(resolve, 50));
        const safeCharName = charName.replace(/[\/\?%\*:|"<>]/g, '-');
        const safeChatName = chatName.replace(/[\/\?%\*:|"<>]/g, '-');
        const filename = totalParts > 1 
            ? `Risu_Log_${safeCharName}_${safeChatName}_part${part + 1}.${format}`
            : `Risu_Log_${safeCharName}_${safeChatName}.${format}`;

        const bgColor = backgroundColor || '#1a1b26';

        try {
            let blob: Blob | null = null;
            
            const finalMaxHeight = Math.min(userMaxImageHeight, Math.floor(BROWSER_MAX_HEIGHT / resolution));
            const isTooTall = element.offsetHeight > finalMaxHeight;
            
            if (isTooTall && (splitImage === 'chunk' || splitImage === 'message')) {
                if (splitImage === 'chunk') {
                    blob = await splitAndMergeAsOneFile(
                        element,
                        finalMaxHeight,
                        resolution,
                        format,
                        imageLibrary,
                        bgColor,
                        onProgressUpdate
                    );
                } else { // splitImage === 'message'
                    await splitAndSaveAsSeparateFiles(
                        element,
                        finalMaxHeight,
                        resolution,
                        format,
                        imageLibrary,
                        bgColor,
                        onProgressUpdate,
                        safeCharName,
                        safeChatName,
                        part,
                        totalParts
                    );
                    return; 
                }
            } else {
                const commonOptions = {
                    pixelRatio: resolution,
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                };

                if (imageLibrary === 'html2canvas') {
                    const canvas = await html2canvas(element, { 
                        scale: resolution, 
                        useCORS: true, 
                        backgroundColor: bgColor,
                        width: commonOptions.width,
                        height: commonOptions.height
                    });
                    blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`));
                } else if (imageLibrary === 'dom-to-image') {
                    const libOptions = { ...commonOptions, bgcolor: bgColor };
                    if (format === 'png') {
                        blob = await domtoimage.toBlob(element, libOptions);
                    } else if (format === 'jpeg') {
                        blob = await domtoimage.toBlob(element, { ...libOptions, quality: 1.0 });
                    } else { // webp fallback
                        const canvas = await html2canvas(element, { 
                            scale: resolution, 
                            useCORS: true, 
                            backgroundColor: bgColor,
                            width: commonOptions.width,
                            height: commonOptions.height
                        });
                        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
                    }
                } else { // html-to-image
                    const libOptions = { ...commonOptions, backgroundColor: bgColor };
                    if (format === 'png') {
                        blob = await toBlob(element, libOptions);
                    } else if (format === 'jpeg') {
                        blob = await toBlob(element, { ...libOptions, quality: 1.0 });
                    } else { // webp fallback
                        const canvas = await html2canvas(element, { 
                            scale: resolution, 
                            useCORS: true, 
                            backgroundColor: bgColor,
                            width: commonOptions.width,
                            height: commonOptions.height
                        });
                        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
                    }
                }
            }

            if (!blob) {
                throw new Error('Failed to generate image blob.');
            }
            
            onProgressUpdate({ message: `[${part + 1}/${totalParts}] 파일 다운로드 중...` });
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error('Error saving image part:', error);
            alert(`이미지 파트 ${part + 1} 저장 중 오류가 발생했습니다.`);
        }
    };

    const getChunks = (nodesToChunk: HTMLElement[], resolutionForChunking: number) => {
        const chunks: { nodes: HTMLElement[] }[] = [];
        const effectiveMaxHeight = Math.floor(BROWSER_MAX_HEIGHT / resolutionForChunking);
        const maxNodeChunkHeight = Math.min(userMaxImageHeight, effectiveMaxHeight);

        if (splitImage === 'message') {
            let currentChunk: HTMLElement[] = [];
            let currentHeight = 0;
            const tempRenderDiv = document.createElement('div');
            tempRenderDiv.style.position = 'absolute';
            tempRenderDiv.style.top = '-9999px';
            tempRenderDiv.style.left = '-9999px';
            tempRenderDiv.style.width = `${htmlOptions.previewWidth || 900}px`;
            document.body.appendChild(tempRenderDiv);

            for (const node of nodesToChunk) {
                const nodeClone = node.cloneNode(true) as HTMLElement;
                tempRenderDiv.appendChild(nodeClone);
                const nodeHeight = nodeClone.offsetHeight;
                tempRenderDiv.removeChild(nodeClone);

                if (currentHeight + nodeHeight > maxNodeChunkHeight && currentChunk.length > 0) {
                    chunks.push({ nodes: currentChunk });
                    currentChunk = [node];
                    currentHeight = nodeHeight;
                } else {
                    currentChunk.push(node);
                    currentHeight += nodeHeight;
                }
            }
            if (currentChunk.length > 0) {
                chunks.push({ nodes: currentChunk });
            }
            document.body.removeChild(tempRenderDiv);
        } else {
            chunks.push({ nodes: nodesToChunk });
        }
        return chunks;
    }

    onProgressStart('분할 이미지 계산 중...', 1);
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!Array.isArray(nodes)) {
        const singleElement = nodes;
        const resolutionForChunking = initialImageResolution === 'auto' ? 1 : (initialImageResolution as number);
        const chunks = getChunks([singleElement], resolutionForChunking);

        onProgressStart(`이미지 생성 중...`, chunks.length);
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        try {
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const elementToRender = chunk.nodes[0];
                
                container.innerHTML = '';
                container.appendChild(elementToRender);

                let finalResolution: number;
                if (initialImageResolution === 'auto') {
                    const height = elementToRender.offsetHeight;
                    if (height > 0 && height * 4 <= BROWSER_MAX_HEIGHT) {
                        finalResolution = 4;
                    } else if (height > 0 && height * 3 <= BROWSER_MAX_HEIGHT) {
                        finalResolution = 3;
                    } else if (height > 0 && height * 2 <= BROWSER_MAX_HEIGHT) {
                        finalResolution = 2;
                    } else {
                        finalResolution = 1;
                    }
                } else {
                    finalResolution = initialImageResolution as number;
                }

                if (elementToRender.offsetHeight * finalResolution > BROWSER_MAX_HEIGHT) {
                    const oldRes = finalResolution;
                    finalResolution = Math.floor(BROWSER_MAX_HEIGHT / elementToRender.offsetHeight);
                    if (finalResolution < 1) finalResolution = 1;
                    onProgressUpdate({ message: `[경고] 해상도(${oldRes}x)가 너무 높아 ${finalResolution}x로 자동 조정됨.` });
                }
                
                await renderImage(elementToRender, finalResolution, i, chunks.length);
            }
        } finally {
            onProgressEnd();
            document.body.removeChild(container);
        }
        return;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
        const resolutionForChunking = initialImageResolution === 'auto' ? 1 : (initialImageResolution as number);
        const chunks = getChunks(nodes, resolutionForChunking);
        onProgressStart(`이미지 생성 중...`, chunks.length);
        await new Promise(resolve => setTimeout(resolve, 50));

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkNodes = chunk.nodes;
            onProgressUpdate({ current: i + 1, message: `[${i + 1}/${chunks.length}] 컴포넌트 렌더링 중...` });
            await new Promise(resolve => setTimeout(resolve, 50));

            await new Promise<void>(resolve => {
                const onReady = () => resolve();
                const props = {
                    nodes: chunkNodes,
                    charInfo: { name: charName, chatName: chatName, avatarUrl: options.charAvatarUrl },
                    selectedThemeKey: htmlOptions.theme,
                    selectedColorKey: htmlOptions.color,
                    showAvatar: htmlOptions.showAvatar,
                    showHeader: htmlOptions.showHeader,
                    showFooter: htmlOptions.showFooter,
                    showBubble: htmlOptions.showBubble,
                    embedImagesAsBlob: true,
                    globalSettings: loadGlobalSettings(),
                    onReady: onReady,
                    fontSize: htmlOptions.previewFontSize,
                    containerWidth: htmlOptions.previewWidth,
                    isForImageExport: true,
                };
                const root = createRoot(container);
                root.render(<LogContainer {...props} />);
            });

            const elementToRender = container.firstChild as HTMLElement;
            if (!elementToRender) continue;

            let finalResolution: number;
            if (initialImageResolution === 'auto') {
                const height = elementToRender.offsetHeight;
                if (height > 0 && height * 4 <= BROWSER_MAX_HEIGHT) {
                    finalResolution = 4;
                } else if (height > 0 && height * 3 <= BROWSER_MAX_HEIGHT) {
                    finalResolution = 3;
                } else if (height > 0 && height * 2 <= BROWSER_MAX_HEIGHT) {
                    finalResolution = 2;
                } else {
                    finalResolution = 1;
                }
                onProgressUpdate({ message: `[${i + 1}/${chunks.length}] 자동 해상도 결정: ${height}px -> ${finalResolution}x` });
            } else {
                finalResolution = initialImageResolution as number;
            }

            if (elementToRender.offsetHeight * finalResolution > BROWSER_MAX_HEIGHT) {
                const oldRes = finalResolution;
                finalResolution = Math.floor(BROWSER_MAX_HEIGHT / elementToRender.offsetHeight);
                if (finalResolution < 1) finalResolution = 1;
                onProgressUpdate({ message: `[경고] 해상도(${oldRes}x)가 너무 높아 ${finalResolution}x로 자동 조정됨.` });
            }

            await renderImage(elementToRender, finalResolution, i, chunks.length);
            container.innerHTML = '';
        }
    } catch (error) {
        console.error('Error preparing images:', error);
        alert('이미지 준비 중 오류가 발생했습니다.');
    } finally {
        onProgressEnd();
        document.body.removeChild(container);
    }
};

export const downloadImagesAsZip = async (
    nodes: Element[],
    charInfo: CharInfo,
    sequentialNaming = false,
    showAvatar = true,
    convertWebM = false,
) => {
    console.log(`[Log Exporter] downloadImagesAsZip: Media ZIP download started`);
    try {
        const zip = new JSZip();
        const mediaPromises: Promise<void>[] = [];
        let mediaCounter = 0;
        const addedUrls = new Set<string>();

        const hexToString = (hex: string) => {
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            return str;
        };

        const addMediaToZip = (el: HTMLImageElement | HTMLVideoElement) => {
            const isVideo = el.tagName === 'VIDEO';
            const src = isVideo ? (el.querySelector('source')?.src || el.src) : (el as HTMLImageElement).src;

            if (!src || src.startsWith('data:')) return;
            if (!sequentialNaming && addedUrls.has(src)) return;
            addedUrls.add(src);

            mediaCounter++;
            const baseFilename = `media_${String(mediaCounter).padStart(3, '0')}`;

            mediaPromises.push(
                fetch(src)
                    .then(res => {
                        if (!res.ok) throw new Error(`Media download failed: ${src}`);
                        return res.blob();
                    })
                    .then(async (blob) => {
                        const urlLower = src.toLowerCase();
                        const isWebMFromUrl = urlLower.includes('.webm') || urlLower.includes('2e7765626d');
                        const isWebMFromMime = blob.type.includes('webm');
                        const isWebM = isWebMFromUrl || isWebMFromMime;

                        if (convertWebM && isVideo && isWebM) {
                            console.log(`[Log Exporter] WebM file detected, converting to WebP: ${baseFilename}`);
                            try {
                                const file = new File([blob], 'video.webm', { type: 'video/webm' });
                                const webpBlob = await convertWebMToAnimatedWebP(file, null, null, 80);
                                zip.file(`${baseFilename}.webp`, webpBlob);
                                return;
                            } catch (e) {
                                console.error(`[Log Exporter] WebM conversion failed, saving original:`, e);
                            }
                        }

                        let extension: string | null = null;
                        const urlPath = src.split(/[?#]/)[0];
                        const filenamePart = urlPath.substring(urlPath.lastIndexOf('/') + 1);

                        const hexDotIndex = filenamePart.lastIndexOf('2e');
                        if (hexDotIndex !== -1 && hexDotIndex > 0) {
                            try {
                                const hexExt = filenamePart.substring(hexDotIndex + 2);
                                const decodedExt = hexToString(hexExt);
                                if (decodedExt.match(/^[a-z0-9]{1,5}$/i)) {
                                    extension = decodedExt;
                                }
                            } catch (e) {
                                console.warn('Failed to decode hex extension', e);
                            }
                        }

                        if (!extension) {
                            const lastDotIndex = urlPath.lastIndexOf('.');
                            if (lastDotIndex !== -1 && urlPath.length - lastDotIndex <= 5) {
                                extension = urlPath.substring(lastDotIndex + 1).toLowerCase();
                            }
                        }

                        if (!extension) {
                            console.error(`Could not find extension from URL, using default. URL: ${src}`);
                            extension = isVideo ? 'mp4' : 'png';
                        }

                        const filename = `${baseFilename}.${extension}`;
                        zip.file(filename, blob);
                    })
                    .catch(e => console.warn(`Failed to process/compress media: ${src}`, e))
            );
        };

        if (sequentialNaming) {
            const globalSettings = loadGlobalSettings();
            const baseHtml = await getLogHtml({
                nodes: nodes,
                charInfo: charInfo,
                selectedThemeKey: 'basic',
                selectedColorKey: 'dark',
                showAvatar: showAvatar,
                isForArca: true,
                embedImagesAsBlob: false,
                globalSettings: globalSettings,
            });
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = baseHtml;
            tempDiv.querySelectorAll('img, video').forEach(el => addMediaToZip(el as HTMLImageElement | HTMLVideoElement));
        } else {
             const globalSettings = loadGlobalSettings();
             const tempDiv = document.createElement('div');
            const html = await getLogHtml({
                nodes: nodes,
                charInfo: charInfo,
                selectedThemeKey: 'basic',
                selectedColorKey: 'dark',
                showAvatar: showAvatar,
                isForArca: false,
                embedImagesAsBlob: false,
                globalSettings: globalSettings,
            });
            tempDiv.innerHTML = html;

            if (showAvatar) {
                const avatarMap = await collectCharacterAvatars(Array.from(tempDiv.children), charInfo.name, false, globalSettings);
                for (const avatarUrl of avatarMap.values()) {
                    const fakeImg = document.createElement('img');
                    fakeImg.src = avatarUrl;
                    addMediaToZip(fakeImg);
                }
            }
            tempDiv.querySelectorAll('img, video').forEach(el => addMediaToZip(el as HTMLImageElement | HTMLVideoElement));
        }


        if (mediaPromises.length === 0) {
            alert("No images or videos to download in the log.");
            return;
        }

        await Promise.all(mediaPromises);
        const content = await zip.generateAsync({ type: "blob" });
        const safeCharName = charInfo.name.replace(/[\/\?%\*:|"<>]/g, '-');
        const safeChatName = charInfo.chatName.replace(/[\/\?%\*:|"<>]/g, '-');
        const zipFilename = `Risu_Log_Media_${safeCharName}_${safeChatName}${sequentialNaming ? '_Arca' : ''}.zip`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = zipFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error('[Log Exporter] Error creating ZIP file:', error);
        alert('An error occurred while creating the media ZIP file.');
    }
};