import { toPng, toJpeg } from 'html-to-image';
import domtoimage from 'dom-to-image-more';
import JSZip from 'jszip';
import { convertWebMToAnimatedWebP } from '../../services/webmConverter';
import { getLogHtml } from './htmlGenerator';
import { collectCharacterAvatars } from './avatarService';
import type { CharInfo } from '../../types';
import html2canvas from 'html2canvas';
import { imageUrlToBase64 } from '../utils/imageUtils';
import { generateBasicLog } from './logGenerator';

const toAbsoluteUrl = (url: string) => {
    try {
        return new URL(url, window.location.href).href;
    } catch (e) {
        console.error('Invalid URL:', url, e);
        return url;
    }
};

export const saveAsImage = async (nodes: HTMLElement[], format: 'png' | 'jpeg' | 'webp', charName: string, chatName: string, options: any, backgroundColor?: string) => {
    const { 
        imageResolution = 1, 
        imageLibrary = 'html-to-image', 
        splitImage = false, 
        maxImageHeight = 10000,
        ...htmlOptions
    } = options;

    const renderImage = async (element: HTMLElement, part = 0, totalParts = 1) => {
        const safeCharName = charName.replace(/[\/\?%\*:|"<>]/g, '-');
        const safeChatName = chatName.replace(/[\/\?%\*:|"<>]/g, '-');
        const filename = totalParts > 1 
            ? `Risu_Log_${safeCharName}_${safeChatName}_part${part + 1}.${format}`
            : `Risu_Log_${safeCharName}_${safeChatName}.${format}`;

        let dataUrl: string;
        const bgColor = backgroundColor || '#1a1b26';

        try {
            if (imageLibrary === 'html2canvas') {
                const canvas = await html2canvas(element, { scale: imageResolution, useCORS: true, backgroundColor: bgColor });
                dataUrl = canvas.toDataURL(`image/${format}`);
            } else if (imageLibrary === 'dom-to-image') {
                const libOptions = { pixelRatio: imageResolution, bgcolor: bgColor };
                if (format === 'png') {
                    dataUrl = await domtoimage.toPng(element, libOptions);
                } else if (format === 'jpeg') {
                    dataUrl = await domtoimage.toJpeg(element, { ...libOptions, quality: 1.0 });
                } else {
                    const canvas = await html2canvas(element, { scale: imageResolution, useCORS: true, backgroundColor: bgColor });
                    dataUrl = canvas.toDataURL('image/webp');
                }
            } else { // html-to-image
                const libOptions = { pixelRatio: imageResolution, backgroundColor: bgColor };
                if (format === 'png') {
                    dataUrl = await toPng(element, libOptions);
                } else if (format === 'jpeg') {
                    dataUrl = await toJpeg(element, libOptions);
                } else {
                    const canvas = await html2canvas(element, { scale: imageResolution, useCORS: true, backgroundColor: bgColor });
                    dataUrl = canvas.toDataURL('image/webp');
                }
            }

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error saving image part:', error);
            alert(`이미지 파트 ${part + 1} 저장 중 오류가 발생했습니다.`);
        }
    };

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.all = 'initial';
    document.body.appendChild(container);

    try {
        const chunks: HTMLElement[][] = [];
        if (splitImage) {
            let currentChunk: HTMLElement[] = [];
            let currentHeight = 0;

            for (const node of nodes) {
                const nodeHeight = (node as HTMLElement).offsetHeight;
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
        } else {
            chunks.push(nodes);
        }

        for (let i = 0; i < chunks.length; i++) {
            const chunkNodes = chunks[i];
            const htmlContent = await generateBasicLog(chunkNodes, charName, chatName, options.charAvatarUrl, htmlOptions, options.themes, options.colors);

            const tempDoc = document.createElement('div');
            tempDoc.innerHTML = htmlContent;

            const promises: Promise<void>[] = [];

            // Image Base64 embedding
            tempDoc.querySelectorAll('img').forEach((img) => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('data:')) {
                    promises.push(
                        imageUrlToBase64(toAbsoluteUrl(src)).then((base64) => { img.src = base64; })
                    );
                }
            });
            tempDoc.querySelectorAll('[style*="background-image"]').forEach((el) => {
                const style = (el as HTMLElement).style;
                const bgImage = style.backgroundImage;
                const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (urlMatch && urlMatch[1] && !urlMatch[1].startsWith('data:')) {
                    const url = urlMatch[1];
                    promises.push(
                        imageUrlToBase64(toAbsoluteUrl(url)).then((base64) => { style.backgroundImage = `url(${base64})`; })
                    );
                }
            });

            // Video to Image conversion
            tempDoc.querySelectorAll('video').forEach((video) => {
                promises.push(new Promise<void>((resolve) => {
                    const canvas = document.createElement('canvas');
                    const videoSrc = video.querySelector('source')?.src || video.src;
                    if (!videoSrc) { resolve(); return; }

                    const newVideo = document.createElement('video');
                    newVideo.crossOrigin = 'anonymous';
                    newVideo.src = toAbsoluteUrl(videoSrc);

                    newVideo.addEventListener('loadeddata', () => { newVideo.currentTime = 0; });
                    newVideo.addEventListener('seeked', () => {
                        canvas.width = newVideo.videoWidth;
                        canvas.height = newVideo.videoHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(newVideo, 0, 0, canvas.width, canvas.height);
                            const img = document.createElement('img');
                            img.src = canvas.toDataURL();
                            img.style.width = video.style.width || `${canvas.width}px`;
                            img.style.height = video.style.height || `${canvas.height}px`;
                            video.parentNode?.replaceChild(img, video);
                        }
                        resolve();
                    });
                    newVideo.addEventListener('error', () => {
                        console.warn('Failed to load video for thumbnailing:', newVideo.src);
                        resolve();
                    });
                }));
            });

            await Promise.all(promises);

            container.innerHTML = tempDoc.innerHTML;

            let elementToRender: HTMLElement | null = null;
            for (const child of Array.from(container.childNodes)) {
                if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName !== 'STYLE') {
                    elementToRender = child as HTMLElement;
                    break;
                }
            }
            if (!elementToRender) continue;

            let finalElementToRender = elementToRender;
            if (imageLibrary === 'html-to-image') {
                const clonedEl = elementToRender.cloneNode(true) as HTMLElement;
                clonedEl.style.margin = '0';
                container.innerHTML = '';
                container.appendChild(clonedEl);
                finalElementToRender = clonedEl;
            }

            await renderImage(finalElementToRender, i, chunks.length);
        }

    } catch (error) {
        console.error('Error preparing images:', error);
        alert('이미지 준비 중 오류가 발생했습니다.');
    } finally {
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
            const baseHtml = await getLogHtml({
                nodes: nodes,
                charInfo: charInfo,
                selectedThemeKey: 'basic',
                selectedColorKey: 'dark',
                showAvatar: showAvatar,
                isForArca: true,
            });
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = baseHtml;
            tempDiv.querySelectorAll('img, video').forEach(el => addMediaToZip(el as HTMLImageElement | HTMLVideoElement));
        } else {
             const tempDiv = document.createElement('div');
            const html = await getLogHtml({
                nodes: nodes,
                charInfo: charInfo,
                selectedThemeKey: 'basic',
                selectedColorKey: 'dark',
                showAvatar: showAvatar,
                isForArca: false,
            });
            tempDiv.innerHTML = html;

            if (showAvatar) {
                const avatarMap = await collectCharacterAvatars(Array.from(tempDiv.children), charInfo.name, false);
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

