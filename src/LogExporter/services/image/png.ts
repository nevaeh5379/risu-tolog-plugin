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

// PNG 파일을 바이너리 레벨에서 병합하는 함수
export const mergePNGsBinary = async (
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
