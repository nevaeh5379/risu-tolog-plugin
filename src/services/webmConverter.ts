
// --- 아카라이브 연동 기능 추가 ---

/**
 * WebM 비디오를 Animated WebP로 변환합니다.
 * @async
 * @param {File} file - WebM 비디오 파일
 * @param {number|null} fps - 프레임 레이트 (null이면 원본 유지, 기본값: 10)
 * @param {number|null} maxWidth - 최대 너비 (null이면 원본 유지, 기본값: 500)
 * @param {number} quality - 품질 (1-100, 기본값: 80)
 * @returns {Promise<Blob>} WebP 이미지 Blob
 */
export async function convertWebMToAnimatedWebP(
    file: File,
    fps: number | null = 10,
    maxWidth: number | null = 500,
    quality: number = 80
): Promise<Blob> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;

    await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('비디오를 로드할 수 없습니다.'));
    });

    const { duration, videoWidth: originalWidth, videoHeight: originalHeight } = video;

    const targetFps = fps || 30; // 원본 fps를 정확히 알 수 없으므로 30fps로 추정
    const frameInterval = 1 / targetFps;

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (maxWidth && originalWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = originalHeight * (maxWidth / originalWidth);
    }

    console.log('[WebM Converter] 변환 시작:', {
        원본: `${originalWidth}x${originalHeight}`,
        변환후: `${Math.round(newWidth)}x${Math.round(newHeight)}`,
        fps: targetFps,
        quality,
        duration: `${duration.toFixed(2)}초`
    });

    const frames: ImageData[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas 2D context를 가져올 수 없습니다.');
    }

    canvas.width = Math.round(newWidth);
    canvas.height = Math.round(newHeight);

    let frameCount = 0;
    const totalFrames = Math.floor(duration * targetFps);

    console.log(`[WebM Converter] 프레임 추출 중... (총 ${totalFrames}개 예상)`);

    for (let time = 0; time < duration; time += frameInterval) {
        video.currentTime = time;

        await new Promise<void>(resolve => {
            video.onseeked = () => resolve();
        });

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);

        frameCount++;

        if (frameCount % Math.max(1, Math.floor(totalFrames / 10)) === 0) {
            console.log(`[WebM Converter] 진행: ${frameCount}/${totalFrames} (${Math.round(frameCount / totalFrames * 100)}%)`);
        }
    }

    console.log(`[WebM Converter] 프레임 추출 완료: ${frames.length}개`);

    const delayMs = Math.round(frameInterval * 1000);
    const webpData = await encodeAnimatedWebP(frames, canvas.width, canvas.height, delayMs, quality);

    URL.revokeObjectURL(video.src);

    console.log(`[WebM Converter] 인코딩 완료`);

    return new Blob([webpData], { type: 'image/webp' });
}

async function encodeAnimatedWebP(
    frames: ImageData[],
    width: number,
    height: number,
    delay: number,
    quality: number
): Promise<ArrayBuffer> {
    const chunks: ArrayBuffer[] = [];

    chunks.push(createRIFFHeader());
    chunks.push(createVP8XChunk(width, height, true));
    chunks.push(createANIMChunk(0xFFFFFF, 0));

    for (let i = 0; i < frames.length; i++) {
        const frameData = await encodeFrameToWebP(frames[i], width, height, quality);
        const anmf = createANMFChunk(frameData, delay, width, height);
        chunks.push(anmf);
    }

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const result = new Uint8Array(totalSize);
    let offset = 0;

    for (const chunk of chunks) {
        result.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
    }

    const view = new DataView(result.buffer);
    view.setUint32(4, totalSize - 8, true);

    return result.buffer;
}

function createRIFFHeader(): ArrayBuffer {
    const buffer = new ArrayBuffer(12);
    const view = new DataView(buffer);
    const encoder = new TextEncoder();

    new Uint8Array(buffer, 0, 4).set(encoder.encode('RIFF'));
    view.setUint32(4, 0, true); // Placeholder for file size
    new Uint8Array(buffer, 8, 4).set(encoder.encode('WEBP'));

    return buffer;
}

function createVP8XChunk(width: number, height: number, hasAnimation: boolean): ArrayBuffer {
    const buffer = new ArrayBuffer(18);
    const view = new DataView(buffer);
    const encoder = new TextEncoder();

    new Uint8Array(buffer, 0, 4).set(encoder.encode('VP8X'));
    view.setUint32(4, 10, true); // Chunk size
    view.setUint8(8, hasAnimation ? 0x02 : 0x00); // Flags
    view.setUint8(9, 0);
    view.setUint8(10, 0);
    view.setUint8(11, 0);

    const w = Math.round(width) - 1;
    view.setUint8(12, w & 0xFF);
    view.setUint8(13, (w >> 8) & 0xFF);
    view.setUint8(14, (w >> 16) & 0xFF);

    const h = Math.round(height) - 1;
    view.setUint8(15, h & 0xFF);
    view.setUint8(16, (h >> 8) & 0xFF);
    view.setUint8(17, (h >> 16) & 0xFF);

    return buffer;
}

function createANIMChunk(bgColor: number, loopCount: number): ArrayBuffer {
    const buffer = new ArrayBuffer(14);
    const view = new DataView(buffer);
    const encoder = new TextEncoder();

    new Uint8Array(buffer, 0, 4).set(encoder.encode('ANIM'));
    view.setUint32(4, 6, true); // Chunk size
    view.setUint32(8, bgColor, false);
    view.setUint16(12, loopCount, true);

    return buffer;
}

async function encodeFrameToWebP(
    imageData: ImageData,
    width: number,
    height: number,
    quality: number
): Promise<Uint8Array> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context from canvas');
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/webp', quality / 100);
    });

    if (!blob) throw new Error('Could not create blob from canvas');

    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    let offset = 12;
    while (offset < data.length) {
        const chunkType = String.fromCharCode(...data.slice(offset, offset + 4));
        const chunkSize = new DataView(data.buffer, offset + 4, 4).getUint32(0, true);

        if (chunkType === 'VP8 ' || chunkType === 'VP8L') {
            return data.slice(offset);
        }

        offset += 8 + chunkSize + (chunkSize % 2);
    }

    throw new Error('VP8/VP8L chunk not found in WebP frame.');
}

function createANMFChunk(
    frameData: Uint8Array,
    duration: number,
    width: number,
    height: number
): ArrayBuffer {
    const frameDataSize = frameData.byteLength;
    const payloadSize = 16 + frameDataSize;
    const chunkSize = payloadSize + (payloadSize % 2);
    const buffer = new ArrayBuffer(8 + chunkSize);
    const view = new DataView(buffer);
    const encoder = new TextEncoder();

    new Uint8Array(buffer, 0, 4).set(encoder.encode('ANMF'));
    view.setUint32(4, payloadSize, true);

    view.setUint32(8, 0, true); // X, Y position
    view.setUint16(12, 0, true);

    const w = Math.round(width) - 1;
    view.setUint8(14, w & 0xFF);
    view.setUint8(15, (w >> 8) & 0xFF);
    view.setUint8(16, (w >> 16) & 0xFF);

    const h = Math.round(height) - 1;
    view.setUint8(17, h & 0xFF);
    view.setUint8(18, (h >> 8) & 0xFF);
    view.setUint8(19, (h >> 16) & 0xFF);

    view.setUint8(20, duration & 0xFF);
    view.setUint8(21, (duration >> 8) & 0xFF);
    view.setUint8(22, (duration >> 16) & 0xFF);
    view.setUint8(23, 0); // Blending and disposal flags

    new Uint8Array(buffer, 24).set(new Uint8Array(frameData));

    if (payloadSize % 2 === 1) {
        view.setUint8(8 + payloadSize, 0); // Padding
    }

    return buffer;
}
