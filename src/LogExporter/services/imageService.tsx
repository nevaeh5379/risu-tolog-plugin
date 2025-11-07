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
import pako from 'pako';

// CRC32 계산 함수
const crc32 = (data: Uint8Array): number => {
    let crc = -1;
    for (let i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
};

// CRC32 테이블
const crc32Table = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }
    return table;
})();

// PNG 청크 생성 함수
const createPNGChunk = (type: string, data: Uint8Array): Uint8Array => {
    const typeBytes = new TextEncoder().encode(type);
    const chunk = new Uint8Array(4 + 4 + data.length + 4);
    const view = new DataView(chunk.buffer);
    
    // Length
    view.setUint32(0, data.length);
    
    // Type
    chunk.set(typeBytes, 4);
    
    // Data
    chunk.set(data, 8);
    
    // CRC
    const crcData = new Uint8Array(4 + data.length);
    crcData.set(typeBytes, 0);
    crcData.set(data, 4);
    view.setUint32(8 + data.length, crc32(crcData));
    
    return chunk;
};

// PNG 파일을 바이너리 레벨에서 병합하는 함수
const mergePNGsBinary = async (
    blobs: Blob[]
): Promise<Blob> => {
    // 모든 PNG Blob을 ArrayBuffer로 변환
    const buffers = await Promise.all(blobs.map(blob => blob.arrayBuffer()));
    
    if (buffers.length === 0) throw new Error('No images to merge');
    
    // 첫 번째 이미지 정보 파싱
    const firstView = new DataView(buffers[0]);
    
    // IHDR 파싱
    const ihdrData = new Uint8Array(buffers[0], 16, 13);
    const width = firstView.getUint32(16);
    const bitDepth = ihdrData[8];
    const colorType = ihdrData[9];
    const compression = ihdrData[10];
    const filter = ihdrData[11];
    const interlace = ihdrData[12];
    
    // 각 픽셀의 바이트 수 계산
    let bytesPerPixel = 0;
    switch (colorType) {
        case 0: bytesPerPixel = bitDepth / 8; break; // Grayscale
        case 2: bytesPerPixel = (bitDepth / 8) * 3; break; // RGB
        case 4: bytesPerPixel = (bitDepth / 8) * 2; break; // Grayscale + Alpha
        case 6: bytesPerPixel = (bitDepth / 8) * 4; break; // RGBA
        default: bytesPerPixel = 4; break;
    }
    
    // 각 스캔라인의 바이트 수 (필터 바이트 포함)
    const bytesPerScanline = 1 + (width * bytesPerPixel);
    
    console.log(`[PNG Merge] Width: ${width}, ColorType: ${colorType}, BitDepth: ${bitDepth}, BytesPerPixel: ${bytesPerPixel}, BytesPerScanline: ${bytesPerScanline}`);
    
    // PNG 필터 디코딩 함수
    const decodePNGFilters = (data: Uint8Array, width: number, height: number, bpp: number): Uint8Array => {
        const bytesPerLine = width * bpp;
        const decoded = new Uint8Array(height * bytesPerLine);
        
        for (let y = 0; y < height; y++) {
            const filterType = data[y * bytesPerScanline];
            const scanlineStart = y * bytesPerScanline + 1; // 필터 바이트 건너뛰기
            const scanline = data.subarray(scanlineStart, scanlineStart + bytesPerLine);
            const decodedStart = y * bytesPerLine;
            
            if (filterType === 0) {
                // None: 그대로 복사
                decoded.set(scanline, decodedStart);
            } else if (filterType === 1) {
                // Sub: 왼쪽 픽셀 더하기
                for (let x = 0; x < bytesPerLine; x++) {
                    const left = x >= bpp ? decoded[decodedStart + x - bpp] : 0;
                    decoded[decodedStart + x] = (scanline[x] + left) & 0xFF;
                }
            } else if (filterType === 2) {
                // Up: 위 픽셀 더하기
                for (let x = 0; x < bytesPerLine; x++) {
                    const up = y > 0 ? decoded[decodedStart - bytesPerLine + x] : 0;
                    decoded[decodedStart + x] = (scanline[x] + up) & 0xFF;
                }
            } else if (filterType === 3) {
                // Average: 왼쪽과 위의 평균 더하기
                for (let x = 0; x < bytesPerLine; x++) {
                    const left = x >= bpp ? decoded[decodedStart + x - bpp] : 0;
                    const up = y > 0 ? decoded[decodedStart - bytesPerLine + x] : 0;
                    decoded[decodedStart + x] = (scanline[x] + ((left + up) >> 1)) & 0xFF;
                }
            } else if (filterType === 4) {
                // Paeth: Paeth predictor
                for (let x = 0; x < bytesPerLine; x++) {
                    const left = x >= bpp ? decoded[decodedStart + x - bpp] : 0;
                    const up = y > 0 ? decoded[decodedStart - bytesPerLine + x] : 0;
                    const upLeft = (y > 0 && x >= bpp) ? decoded[decodedStart - bytesPerLine + x - bpp] : 0;
                    decoded[decodedStart + x] = (scanline[x] + paethPredictor(left, up, upLeft)) & 0xFF;
                }
            }
        }
        
        return decoded;
    };
    
    // Paeth predictor 함수
    const paethPredictor = (a: number, b: number, c: number): number => {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        if (pa <= pb && pa <= pc) return a;
        if (pb <= pc) return b;
        return c;
    };
    
    // 필터 없이 인코딩 (모든 스캔라인에 필터 타입 0 추가)
    const encodePNGWithNoFilter = (pixelData: Uint8Array, width: number, height: number, bpp: number): Uint8Array => {
        const bytesPerLine = width * bpp;
        const encoded = new Uint8Array(height * (1 + bytesPerLine));
        
        for (let y = 0; y < height; y++) {
            encoded[y * (1 + bytesPerLine)] = 0; // 필터 타입 0 (None)
            const srcStart = y * bytesPerLine;
            const dstStart = y * (1 + bytesPerLine) + 1;
            encoded.set(pixelData.subarray(srcStart, srcStart + bytesPerLine), dstStart);
        }
        
        return encoded;
    };
    
    // 모든 이미지의 압축 해제된 픽셀 데이터 수집
    const allDecodedPixels: Uint8Array[] = [];
    let totalHeight = 0;
    
    for (let imgIdx = 0; imgIdx < buffers.length; imgIdx++) {
        const buffer = buffers[imgIdx];
        const view = new DataView(buffer);
        
        // 현재 이미지 높이
        const imgHeight = view.getUint32(20);
        totalHeight += imgHeight;
        
        console.log(`[PNG Merge] Image ${imgIdx + 1}: height=${imgHeight}`);
        
        // IDAT 청크들 수집
        let offset = 8; // PNG 서명 건너뛰기
        const idatChunks: Uint8Array[] = [];
        
        while (offset < buffer.byteLength) {
            const length = view.getUint32(offset);
            const type = String.fromCharCode(...new Uint8Array(buffer, offset + 4, 4));
            
            if (type === 'IDAT') {
                const chunkData = new Uint8Array(buffer, offset + 8, length);
                idatChunks.push(chunkData);
            }
            
            if (type === 'IEND') break;
            
            offset += 12 + length;
        }
        
        // IDAT 데이터 합치기
        const totalIDATLength = idatChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedIDAT = new Uint8Array(totalIDATLength);
        let pos = 0;
        for (const chunk of idatChunks) {
            combinedIDAT.set(chunk, pos);
            pos += chunk.length;
        }
        
        // zlib 압축 해제
        try {
            const inflated = pako.inflate(combinedIDAT);
            
            // 데이터 크기 검증
            const expectedSize = imgHeight * bytesPerScanline;
            if (inflated.length !== expectedSize) {
                console.warn(`[PNG Merge] Image ${imgIdx + 1}: Expected ${expectedSize} bytes, got ${inflated.length} bytes`);
            }
            
            // PNG 필터 디코딩 (필터 바이트 제거하고 원본 픽셀로 복원)
            console.log(`[PNG Merge] Decoding filters for image ${imgIdx + 1}...`);
            const decodedPixels = decodePNGFilters(inflated, width, imgHeight, bytesPerPixel);
            allDecodedPixels.push(decodedPixels);
            
        } catch (e) {
            console.error(`[PNG Merge] Failed to inflate image ${imgIdx + 1}:`, e);
            throw e;
        }
    }
    
    // 모든 디코딩된 픽셀 데이터를 하나로 합치기
    const totalPixelDataLength = allDecodedPixels.reduce((sum, data) => sum + data.length, 0);
    const mergedPixelData = new Uint8Array(totalPixelDataLength);
    let currentPos = 0;
    
    console.log(`[PNG Merge] Total height: ${totalHeight}, Total pixel data length: ${totalPixelDataLength}`);
    
    for (let i = 0; i < allDecodedPixels.length; i++) {
        const pixelData = allDecodedPixels[i];
        mergedPixelData.set(pixelData, currentPos);
        currentPos += pixelData.length;
        console.log(`[PNG Merge] Merged decoded pixels ${i + 1}: ${pixelData.length} bytes at offset ${currentPos - pixelData.length}`);
    }
    
    // 필터 없이 다시 인코딩 (모든 스캔라인에 필터 타입 0 추가)
    console.log(`[PNG Merge] Encoding with no filter...`);
    const encodedData = encodePNGWithNoFilter(mergedPixelData, width, totalHeight, bytesPerPixel);
    
    // zlib로 다시 압축
    console.log(`[PNG Merge] Compressing merged data (${encodedData.length} bytes)...`);
    const compressed = pako.deflate(encodedData, { level: 9 });
    console.log(`[PNG Merge] Compressed size: ${compressed.length} bytes`);
    
    // 새 PNG 파일 생성
    const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // 새 IHDR 생성 (높이만 변경)
    const newIHDR = new Uint8Array(13);
    const ihdrView = new DataView(newIHDR.buffer);
    ihdrView.setUint32(0, width);
    ihdrView.setUint32(4, totalHeight);
    newIHDR[8] = bitDepth;
    newIHDR[9] = colorType;
    newIHDR[10] = compression;
    newIHDR[11] = filter;
    newIHDR[12] = interlace;
    
    const ihdrChunk = createPNGChunk('IHDR', newIHDR);
    const idatChunk = createPNGChunk('IDAT', compressed);
    const iendChunk = createPNGChunk('IEND', new Uint8Array(0));
    
    // 최종 PNG 파일 조립
    const totalLength = PNG_SIGNATURE.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
    const finalPNG = new Uint8Array(totalLength);
    
    let offset = 0;
    finalPNG.set(PNG_SIGNATURE, offset);
    offset += PNG_SIGNATURE.length;
    finalPNG.set(ihdrChunk, offset);
    offset += ihdrChunk.length;
    finalPNG.set(idatChunk, offset);
    offset += idatChunk.length;
    finalPNG.set(iendChunk, offset);
    
    console.log(`[PNG Merge] Final PNG size: ${totalLength} bytes`);
    
    return new Blob([finalPNG], { type: 'image/png' });
};

// 여러 이미지 Blob을 픽셀 단위로 병합하는 함수 (Canvas 사용)
const mergeImageBlobsDirectly = async (
    blobs: Blob[],
    totalWidth: number,
    totalHeight: number,
    format: 'png' | 'jpeg' | 'webp'
): Promise<Blob> => {
    // 각 Blob을 Image로 로드
    const images = await Promise.all(blobs.map(blob => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }));
    
    // Canvas 크기 제한 확인
    const MAX_CANVAS_DIMENSION = 16384;
    
    // 전체 높이가 제한을 초과하면 여러 개의 큰 Canvas로 나누기
    if (totalHeight > MAX_CANVAS_DIMENSION) {
        // 16384px 이하의 청크들로 나누기
        const numChunks = Math.ceil(totalHeight / MAX_CANVAS_DIMENSION);
        const chunkHeight = Math.ceil(totalHeight / numChunks);
        
        console.warn(`[Log Exporter] Total height ${totalHeight}px exceeds Canvas limit. Creating ${numChunks} merged images.`);
        
        // 각 청크별로 Canvas 생성하여 저장
        const mergedBlobs: Blob[] = [];
        let currentChunkY = 0;
        
        for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: false });
            if (!ctx) throw new Error('Canvas context not available');
            
            const actualChunkHeight = Math.min(chunkHeight, totalHeight - currentChunkY);
            canvas.width = totalWidth;
            canvas.height = actualChunkHeight;
            
            // 현재 청크에 포함될 이미지들 그리기
            let currentY = 0;
            for (const img of images) {
                const imgY = currentY - currentChunkY;
                
                // 이 이미지가 현재 청크 범위에 있는지 확인
                if (imgY + img.height > 0 && imgY < actualChunkHeight) {
                    // 이미지의 일부 또는 전체가 현재 청크에 포함됨
                    const sourceY = Math.max(0, currentChunkY - currentY);
                    const sourceHeight = Math.min(img.height - sourceY, actualChunkHeight - Math.max(0, imgY));
                    const destY = Math.max(0, imgY);
                    
                    ctx.drawImage(
                        img,
                        0, sourceY, // source x, y
                        img.width, sourceHeight, // source width, height
                        0, destY, // dest x, y
                        totalWidth, sourceHeight // dest width, height
                    );
                }
                
                currentY += img.height;
                URL.revokeObjectURL(img.src);
            }
            
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), `image/${format}`);
            });
            mergedBlobs.push(blob);
            currentChunkY += chunkHeight;
        }
        
        // 여러 개로 나눠진 경우 첫 번째 것만 반환 (또는 모두 저장)
        // TODO: 여러 파일로 저장하는 로직 필요
        return mergedBlobs[0];
    }
    
    // 전체 높이가 제한 이내면 하나의 Canvas에 모두 그리기
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('Canvas context not available');
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    
    // 모든 이미지를 순서대로 그리기
    let currentY = 0;
    for (const img of images) {
        ctx.drawImage(img, 0, currentY);
        currentY += img.height;
        URL.revokeObjectURL(img.src);
    }
    
    // 최종 Blob으로 변환
    const finalBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), `image/${format}`);
    });
    
    return finalBlob;
};

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
            const libOptions = { pixelRatio: resolution, bgcolor: bgColor };
            
            onProgressUpdate({ message: `[섹션 ${i + 1}/${numSections}] 캡처 중...` });
            
            if (imageLibrary === 'html2canvas') {
                const canvas = await html2canvas(wrapper, { 
                    scale: resolution, 
                    useCORS: true, 
                    backgroundColor: bgColor,
                    width: totalWidth,
                    height: sectionHeight
                });
                blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`));
            } else if (imageLibrary === 'dom-to-image') {
                if (format === 'png') {
                    blob = await domtoimage.toBlob(wrapper, libOptions);
                } else if (format === 'jpeg') {
                    blob = await domtoimage.toBlob(wrapper, { ...libOptions, quality: 1.0 });
                } else {
                    const canvas = await html2canvas(wrapper, { 
                        scale: resolution, 
                        useCORS: true, 
                        backgroundColor: bgColor 
                    });
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
                }
            } else { // html-to-image
                const libOptionsWithBg = { pixelRatio: resolution, backgroundColor: bgColor };
                if (format === 'png') {
                    blob = await toBlob(wrapper, libOptionsWithBg);
                } else if (format === 'jpeg') {
                    blob = await toBlob(wrapper, { ...libOptionsWithBg, quality: 1.0 });
                } else {
                    const canvas = await html2canvas(wrapper, { 
                        scale: resolution, 
                        useCORS: true, 
                        backgroundColor: bgColor 
                    });
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
                }
            }
            
            if (!blob) throw new Error('Failed to capture section');
            blobs.push(blob);
            
        } finally {
            document.body.removeChild(wrapper);
        }
    }
    
    // PNG인 경우 바이너리 레벨에서 병합, 그 외는 Canvas 사용
    onProgressUpdate({ message: `이미지 병합 중...` });
    if (format === 'png') {
        console.log('[Log Exporter] Using PNG binary merge (no Canvas!)');
        return await mergePNGsBinary(blobs);
    } else {
        console.log('[Log Exporter] Using Canvas merge for JPEG/WebP');
        return await mergeImageBlobsDirectly(
            blobs,
            totalWidth * resolution,
            totalHeight * resolution,
            format
        );
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
    const numSections = Math.ceil(totalHeight / maxHeight);
    
    onProgressUpdate({ message: `큰 이미지 분할 저장 중 (${numSections}개 섹션)...` });
    
    // 각 섹션을 개별 파일로 저장
    for (let i = 0; i < numSections; i++) {
        const startY = i * maxHeight;
        const sectionHeight = Math.min(maxHeight, totalHeight - startY);
        
        // 임시 래퍼 생성
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = `${element.offsetWidth}px`;
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
            const libOptions = { pixelRatio: resolution, bgcolor: bgColor };
            
            onProgressUpdate({ message: `[섹션 ${i + 1}/${numSections}] 캡처 중...` });
            
            if (imageLibrary === 'html2canvas') {
                const canvas = await html2canvas(wrapper, { 
                    scale: resolution, 
                    useCORS: true, 
                    backgroundColor: bgColor,
                    width: element.offsetWidth,
                    height: sectionHeight
                });
                blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`));
            } else if (imageLibrary === 'dom-to-image') {
                if (format === 'png') {
                    blob = await domtoimage.toBlob(wrapper, libOptions);
                } else if (format === 'jpeg') {
                    blob = await domtoimage.toBlob(wrapper, { ...libOptions, quality: 1.0 });
                } else {
                    const canvas = await html2canvas(wrapper, { 
                        scale: resolution, 
                        useCORS: true, 
                        backgroundColor: bgColor 
                    });
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp'));
                }
            } else { // html-to-image
                const libOptionsWithBg = { pixelRatio: resolution, backgroundColor: bgColor };
                if (format === 'png') {
                    blob = await toBlob(wrapper, libOptionsWithBg);
                } else if (format === 'jpeg') {
                    blob = await toBlob(wrapper, { ...libOptionsWithBg, quality: 1.0 });
                } else {
                    const canvas = await html2canvas(wrapper, { 
                        scale: resolution, 
                        useCORS: true, 
                        backgroundColor: bgColor 
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
            
            // 높이가 maxImageHeight를 초과하는 경우 처리
            const isTooTall = element.offsetHeight > maxImageHeight;
            
            if (isTooTall && splitImage === 'chunk') {
                // 청크 단위: 분할 캡처 후 하나의 파일로 병합
                blob = await splitAndMergeAsOneFile(
                    element,
                    maxImageHeight,
                    resolution,
                    format,
                    imageLibrary,
                    bgColor,
                    onProgressUpdate
                );
            } else if (isTooTall && splitImage === 'message') {
                // 메시지 단위: 여러 파일로 분할 저장
                await splitAndSaveAsSeparateFiles(
                    element,
                    maxImageHeight,
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
                return; // 이미 저장 완료했으므로 함수 종료
            } else {
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
        const chunks: { nodes: HTMLElement[] }[] = [];
        if (splitImage === 'chunk') {
            // 청크 단위 분할: 전체를 하나의 청크로
            let allNodes: HTMLElement[] = [];
            for (const node of nodesToChunk) {
                allNodes.push(node);
            }
            chunks.push({ nodes: allNodes });
        } else if (splitImage === 'message') {
            // 메시지 단위 분할: 메시지를 maxImageHeight 기준으로 그룹화
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

                // 단일 메시지가 너무 큰 경우 또는 현재 청크에 추가하면 초과하는 경우
                if (currentHeight + nodeHeight > maxImageHeight && currentChunk.length > 0) {
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
            // 분할 안함
            chunks.push({ nodes: nodesToChunk });
        }
        return chunks;
    }

    onProgressStart('분할 이미지 계산 중...', 1);
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!Array.isArray(nodes)) {
        const singleElement = nodes;
        const chunks: { nodes: HTMLElement[] }[] = [];
        if (splitImage === 'chunk') {
            // 청크 단위: 전체를 하나로
            chunks.push({ nodes: [singleElement] });
        } else if (splitImage === 'message') {
            // 메시지 단위: messageContainer 내의 메시지들을 분할
            const messageContainer = singleElement.querySelector('#log-html-preview-container');
            if (messageContainer) {
                const messageNodes = Array.from(messageContainer.children) as HTMLElement[];
                chunks.push(...getChunks(messageNodes));
            } else {
                chunks.push({ nodes: [singleElement] });
            }
        } else {
            chunks.push({ nodes: [singleElement] });
        }

        onProgressStart(`이미지 생성 중...`, chunks.length);
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        try {
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkNodes = chunk.nodes;
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