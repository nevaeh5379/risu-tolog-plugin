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

export const saveAsImage = async (nodes: HTMLElement[] | HTMLElement, format: 'png' | 'jpeg' | 'webp', charName: string, chatName: string, options: any, backgroundColor?: string) => {
    const { 
        imageResolution: initialImageResolution = 1, 
        imageLibrary = 'html-to-image', 
        splitImage = false, 
        maxImageHeight = 10000,
        onProgressStart = (_message: string, _total?: number) => {},
        onProgressUpdate = (_update: { current?: number; message?: string }) => {},
        onProgressEnd = () => {},
        ...htmlOptions
    } = options;

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
            const libOptions = { pixelRatio: resolution, bgcolor: bgColor };

            if (imageLibrary === 'html2canvas') {
                const canvas = await html2canvas(element, { scale: resolution, useCORS: true, backgroundColor: bgColor });
                blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`));
            } else if (imageLibrary === 'dom-to-image') {
                if (format === 'png') {
                    blob = await domtoimage.toBlob(element, libOptions);
                } else if (format === 'jpeg') {
                    blob = await domtoimage.toBlob(element, { ...libOptions, quality: 1.0 });
                } else { // webp fallback
                    const canvas = await html2canvas(element, { scale: resolution, useCORS: true, backgroundColor: bgColor });
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
                }
            } else { // html-to-image
                const libOptionsWithBg = { pixelRatio: resolution,  backgroundColor: bgColor };
                if (format === 'png') {
                    blob = await toBlob(element, libOptionsWithBg);
                } else if (format === 'jpeg') {
                    blob = await toBlob(element, { ...libOptionsWithBg, quality: 1.0 });
                } else { // webp fallback
                    const canvas = await html2canvas(element, { scale: resolution, useCORS: true, backgroundColor: bgColor });
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
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

    const getChunks = (nodesToChunk: HTMLElement[]) => {
        const chunks: HTMLElement[][] = [];
        if (splitImage) {
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

                if (currentHeight + nodeHeight > maxImageHeight && currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = [];
                    currentHeight = 0;
                }
                currentChunk.push(node);
                currentHeight += nodeHeight;
            }
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            document.body.removeChild(tempRenderDiv);
        } else {
            chunks.push(nodesToChunk);
        }
        return chunks;
    }

    onProgressStart('분할 이미지 계산 중...', 1);
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!Array.isArray(nodes)) {
        const singleElement = nodes;
        const chunks: HTMLElement[][] = [];
        if (splitImage) {
            const messageContainer = singleElement.querySelector('#log-html-preview-container');
            if (messageContainer) {
                const messageNodes = Array.from(messageContainer.children) as HTMLElement[];
                chunks.push(...getChunks(messageNodes));
            } else {
                chunks.push([singleElement]);
            }
        } else {
            chunks.push([singleElement]);
        }

        onProgressStart(`이미지 생성 중...`, chunks.length);
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        try {
            for (let i = 0; i < chunks.length; i++) {
                const chunkNodes = chunks[i];
                let elementToRender: HTMLElement;

                if (chunkNodes.length === 1 && chunkNodes[0] === singleElement) {
                    // This is the non-split case for a single element
                    elementToRender = singleElement;
                } else {
                    // Reconstruct the HTML view for the chunk
                    const messageContainer = singleElement.querySelector('#log-html-preview-container');
                    const styleContent = singleElement.querySelector('style')?.innerHTML || '';
                    const wrapperClass = singleElement.className || '';
                    const messageContainerStyle = messageContainer?.getAttribute('style') || '';
                    
                    const chunkHtml = chunkNodes.map(n => n.outerHTML).join('');
                    const fullChunkHtml = `
                        <style>${styleContent}</style>
                        <div class="${wrapperClass}">
                            <div id="log-html-preview-container" style="${messageContainerStyle}">
                                ${chunkHtml}
                            </div>
                        </div>
                    `;
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = fullChunkHtml;
                    elementToRender = tempDiv.querySelector('div') as HTMLElement;
                }
                
                container.innerHTML = '';
                container.appendChild(elementToRender);

                await renderImage(elementToRender, initialImageResolution as number, i, chunks.length);
            }
        } finally {
            onProgressEnd();
            document.body.removeChild(container);
        }
        return;
    }

    // This is for 'basic' format
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
        const chunks = getChunks(nodes);
        onProgressStart(`이미지 생성 중...`, chunks.length);
        await new Promise(resolve => setTimeout(resolve, 50));

        for (let i = 0; i < chunks.length; i++) {
            const chunkNodes = chunks[i];
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
                if (height >= 10000) {
                    finalResolution = 3;
                } else if (height >= 5000) {
                    finalResolution = 2;
                } else {
                    finalResolution = 1;
                }
                onProgressUpdate({ message: `[${i + 1}/${chunks.length}] 자동 해상도 결정: ${height}px -> ${finalResolution}x` });
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                finalResolution = initialImageResolution as number;
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