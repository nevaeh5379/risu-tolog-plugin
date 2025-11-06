// src/services/zipService.ts

import JSZip from 'jszip';
import { processChatLog } from '../utils/domParser'; // 예시 경로
import { getLogHtml } from '../LogExporter/services/htmlGenerator'; // 예시 경로
import { collectCharacterAvatars } from '../LogExporter/services/avatarService'; // 예시 경로
import { convertWebMToAnimatedWebP } from './webmConverter'; // 예시 경로

const loadGlobalSettings = () => {
    try {
        const settings = localStorage.getItem('logExporterGlobalSettings');
        const parsed = settings ? JSON.parse(settings) : {};
        if (!Array.isArray(parsed.profileClasses)) parsed.profileClasses = [];
        if (!Array.isArray(parsed.participantNameClasses)) parsed.participantNameClasses = [];
        return parsed;
    } catch (e) {
        console.error('[Log Exporter] Failed to load global settings:', e);
        return { profileClasses: [], participantNameClasses: [] };
    }
};

// 전역 alert 함수가 있다면, 타입을 선언해줍니다.
declare function alert(message: string, type: 'info' | 'error' | 'success'): void;

// addMediaToZip 함수에 전달될 수 있는 요소의 타입을 정의합니다.
type MediaElement = HTMLImageElement | HTMLVideoElement | { tagName: 'IMG', src: string };

/**
 * 제공된 노드들에서 이미지를 수집하여 ZIP 파일로 다운로드합니다.
 * @async
 * @param nodes - 이미지를 스캔할 DOM 노드 배열.
 * @param charName - 캐릭터 이름 (파일 이름에 사용).
 * @param chatName - 채팅 이름 (파일 이름에 사용).
 * @param sequentialNaming - 이미지 파일 이름을 순차적으로 지정할지 여부 (아카라이브용).
 * @param showAvatar - 아바타 이미지를 포함할지 여부.
 * @param convertWebM - WebM 비디오를 WebP로 변환할지 여부.
 */
export async function downloadImagesAsZip(
  nodes: HTMLElement[],
  charName: string,
  chatName: string,
  sequentialNaming = false,
  showAvatar = true,
  convertWebM = false
): Promise<void> {
  console.log(`[Log Exporter] downloadImagesAsZip: 미디어 ZIP 다운로드 시작 (v6 - WebM to WebP Conversion)`);
  try {
    const zip = new JSZip();
    const mediaPromises: Promise<void>[] = [];
    let mediaCounter = 0;
    const addedUrls = new Set<string>();

    /**
     * 16진수 문자열을 일반 문자열로 변환합니다.
     * @param hex - 16진수 문자열
     * @returns 디코딩된 문자열
     */
    const hexToString = (hex: string): string => {
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return str;
    };

    const addMediaToZip = async (el: MediaElement) => {
      const isVideo = el.tagName === 'VIDEO';
      const src = isVideo ? ((el as HTMLVideoElement).querySelector('source')?.src || (el as HTMLVideoElement).src) : (el as HTMLImageElement).src;

      if (!src || src.startsWith('data:')) return;
      if (!sequentialNaming && addedUrls.has(src)) return;
      addedUrls.add(src);

      mediaCounter++;
      const baseFilename = `media_${String(mediaCounter).padStart(3, '0')}`;

      mediaPromises.push(
        fetch(src)
          .then(res => {
            if (!res.ok) throw new Error(`미디어 다운로드 실패: ${src}`);
            return res.blob();
          })
          .then(async (blob) => {
            const urlLower = src.toLowerCase();
            const isWebMFromUrl = urlLower.includes('.webm') || urlLower.includes('2e7765626d');
            const isWebMFromMime = blob.type.includes('webm');
            const isWebM = isWebMFromUrl || isWebMFromMime;

            console.log(`[Log Exporter] 파일 다운로드 완료:`, {
              src: src.substring(0, 100) + '...',
              isVideo,
              blobType: blob.type,
              convertWebM,
              isWebMFromUrl,
              isWebMFromMime,
              shouldConvert: convertWebM && isVideo && isWebM,
            });

            if (convertWebM && isVideo && isWebM) {
              console.log(`[Log Exporter] ✅ WebM 파일 감지, WebP로 변환 시작: ${baseFilename}`);
              try {
                const file = new File([blob], 'video.webm', { type: 'video/webm' });
                const webpBlob = await convertWebMToAnimatedWebP(file, null, null, 80);
                console.log(`[Log Exporter] ✅ WebM → WebP 변환 완료: ${baseFilename}.webp (크기: ${(webpBlob.size / 1024).toFixed(2)} KB)`);
                zip.file(`${baseFilename}.webp`, webpBlob);
                return;
              } catch (e) {
                console.error(`[Log Exporter] ❌ WebM 변환 실패, 원본 저장:`, e);
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
                  console.log(`[Log Exporter] 16진수 인코딩된 확장자 감지: .${extension}`);
                }
              } catch (e) {
                console.warn('16진수 확장자 디코딩 실패', e);
              }
            }

            if (!extension) {
              const lastDotIndex = urlPath.lastIndexOf('.');
              if (lastDotIndex !== -1 && urlPath.length - lastDotIndex <= 5) {
                extension = urlPath.substring(lastDotIndex + 1).toLowerCase();
              }
            }

            if (!extension) {
              console.error(`URL에서 확장자를 찾을 수 없어 기본값 사용. URL: ${src}`);
              extension = isVideo ? 'mp4' : 'png';
            }

            const filename = `${baseFilename}.${extension}`;
            console.log(`[Log Exporter] 파일 저장: ${filename}`);
            zip.file(filename, blob);
          })
          .catch(e => console.warn(`미디어 처리/압축 실패: ${src}`, e))
      );
    };

    if (sequentialNaming) {
      const selectedChatIdx: string = document.querySelector('button[data-risu-chat-idx].bg-selected')?.getAttribute('data-risu-chat-idx') ?? '0';
      if (selectedChatIdx === null) {
          throw new Error("선택된 채팅을 찾을 수 없습니다.");
      }
      const { charAvatarUrl } = await processChatLog(parseInt(selectedChatIdx, 10));
      const charInfoForLog = { name: charName, chatName: chatName, avatarUrl: charAvatarUrl };
      const globalSettings = loadGlobalSettings();
      const baseHtml = await getLogHtml({nodes, charInfo: charInfoForLog, selectedThemeKey: 'basic', selectedColorKey: 'dark', showAvatar, showHeader: true, showFooter: false, showBubble: true, isForArca: true, embedImagesAsBase64: false, preCollectedAvatarMap: new Map(), globalSettings});
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = baseHtml;
      
      tempDiv.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img, video').forEach(el => addMediaToZip(el));
    } else {
      if (showAvatar) {
        const globalSettings = loadGlobalSettings();
        const avatarMap = await collectCharacterAvatars(nodes, charName, false, globalSettings);
        for (const avatarUrl of avatarMap.values()) {
          if (avatarUrl) {
            const fakeImg: MediaElement = { tagName: 'IMG', src: avatarUrl };
            await addMediaToZip(fakeImg);
          }
        }
      }
      for (const node of nodes) {
        node.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img, video').forEach(el => addMediaToZip(el));
      }
    }

    if (mediaPromises.length === 0) {
      alert("다운로드할 이미지나 비디오가 로그에 없습니다.", "info");
      return;
    }

    await Promise.all(mediaPromises);
    const content = await zip.generateAsync({ type: "blob" });
    const safeCharName = charName.replace(/[\/\\?%*:|"<>]/g, '-');
    const safeChatName = chatName.replace(/[\/\\?%*:|"<>]/g, '-');
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
    alert('미디어 ZIP 파일 생성 중 오류가 발생했습니다.', 'error');
  }
}