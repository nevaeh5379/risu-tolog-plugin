import { useState, useEffect } from 'react';
import { imageUrlToBlob } from '../utils/imageUtils';
import type { ColorPalette } from '../../types';

export const useMessageProcessor = (
  originalMessageEl: Element | null,
  embedImagesAsBlob: boolean,
  allowHtmlRendering: boolean,
  color: ColorPalette,
  imageScale?: number
) => {
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    if (!originalMessageEl) return;

    const process = async () => {
      if (allowHtmlRendering) {
        setProcessedContent(await processRawHtmlContent(originalMessageEl, embedImagesAsBlob));
      } else {
        setProcessedContent(await processMessageContent(originalMessageEl, embedImagesAsBlob, color, imageScale));
      }
    };

    process();
  }, [originalMessageEl, embedImagesAsBlob, allowHtmlRendering, color, imageScale]);

  return processedContent;
};

const processRawHtmlContent = async (originalMessageEl: Element, embedImages: boolean): Promise<string> => {
    const clonedContentEl = originalMessageEl.cloneNode(true) as HTMLElement;
    clonedContentEl.querySelectorAll('button, .log-exporter-msg-btn-group').forEach(btn => btn.remove());

    const mediaPromises = Array.from(clonedContentEl.querySelectorAll('img, [style*="background-image"]')).map(async (el) => {
        const element = el as HTMLElement;
        if (element.tagName === 'IMG') {
            const img = element as HTMLImageElement;
            if (img.src && embedImages && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
                try {
                    img.src = await imageUrlToBlob(img.src);
                } catch (e) { /* ignore */ }
            }
        } else {
            const style = element.getAttribute('style');
            const urlMatch = style?.match(/url\(["'"]?(.+?)["'"]?\)/);
            if (urlMatch?.[1] && embedImages && !urlMatch[1].startsWith('data:') && !urlMatch[1].startsWith('blob:')) {
                try {
                    const convertedUrl = await imageUrlToBlob(urlMatch[1]);
                    element.style.backgroundImage = `url("${convertedUrl}")`;
                } catch (e) { /* ignore */ }
            }
        }
    });

    await Promise.all(mediaPromises);
    return clonedContentEl.outerHTML.trim();
};

const processMessageContent = async (originalMessageEl: Element, embedImages: boolean, color: ColorPalette, imageScale?: number): Promise<string> => {
    let contentSourceEl = originalMessageEl.cloneNode(true) as HTMLElement;
    contentSourceEl.querySelectorAll('script, style, .log-exporter-msg-btn-group').forEach(el => el.remove());

    const bgImagePromises = Array.from(contentSourceEl.querySelectorAll('[style*="background-image"]')).map(async (el) => {
        const style = el.getAttribute('style');
        const urlMatch = style?.match(/url\(["'"]?(.+?)["'"]?\)/);
        if (urlMatch?.[1]) {
            const img = document.createElement('img');
            img.src = embedImages ? await imageUrlToBlob(urlMatch[1]) : urlMatch[1];
            el.parentNode?.insertBefore(img, el);
            el.remove();
        }
    });
    await Promise.all(bgImagePromises);

    if (imageScale && imageScale !== 100) {
        contentSourceEl.querySelectorAll('img, video').forEach(el => {
            const media = el as HTMLImageElement | HTMLVideoElement;
            media.style.maxWidth = `${imageScale}%`;
            media.style.width = `${imageScale}%`;
            media.style.height = 'auto';
        });
    }

    const styleBlock = (el: Element, bg: string | undefined, textColor: string | undefined, border: string | null = null) => {
        const newBlock = document.createElement('div');
        newBlock.innerHTML = `<div style="padding:0; margin:0;">${el.innerHTML}</div>`;
        Object.assign(newBlock.style, { padding: '0.75em 1em', margin: '0.75em 0', borderRadius: '4px', borderLeft: `3px solid ${border || 'transparent'}`, backgroundColor: bg, color: textColor });
        el.replaceWith(newBlock);
    };

    contentSourceEl.querySelectorAll('.x-risu-regex-quote-block').forEach(el => styleBlock(el, color.quoteBg, color.quoteText, color.quoteText));
    contentSourceEl.querySelectorAll('.x-risu-regex-thought-block').forEach(el => styleBlock(el, color.thoughtBg, color.thoughtText));

    contentSourceEl.querySelectorAll('mark[risu-mark^="quote"]').forEach(markEl => {
        const mark = markEl as HTMLElement;
        Object.assign(mark.style, { backgroundColor: color.quoteBg, color: color.quoteText, padding: '0.1em 0.3em', borderRadius: '3px', textDecoration: 'none' });
    });

    return contentSourceEl.innerHTML.trim();
};