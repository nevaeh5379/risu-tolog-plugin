import jpeg from 'jpeg-js';

// JPEG 파일을 바이너리 레벨에서 병합하는 함수
export const mergeJPEGsBinary = async (
    blobs: Blob[]
): Promise<Blob> => {
    console.log(`[JPEG Merge] Starting JPEG merge for ${blobs.length} images...`);
    
    // 모든 JPEG를 디코딩
    const decodedImages: { width: number; height: number; data: Uint8Array }[] = [];
    let totalHeight = 0;
    let width = 0;
    
    for (let i = 0; i < blobs.length; i++) {
        const buffer = await blobs[i].arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        try {
            const decoded = jpeg.decode(uint8Array, { useTArray: true });
            
            if (i === 0) {
                width = decoded.width;
            } else if (decoded.width !== width) {
                throw new Error(`Image ${i + 1} has different width: ${decoded.width} vs ${width}`);
            }
            
            decodedImages.push({
                width: decoded.width,
                height: decoded.height,
                data: decoded.data
            });
            
            totalHeight += decoded.height;
            console.log(`[JPEG Merge] Decoded image ${i + 1}: ${decoded.width}x${decoded.height}`);
            
        } catch (e) {
            console.error(`[JPEG Merge] Failed to decode JPEG ${i + 1}:`, e);
            throw e;
        }
    }
    
    console.log(`[JPEG Merge] Total dimensions: ${width}x${totalHeight}`);
    
    // 모든 이미지의 픽셀 데이터를 수직으로 병합
    const mergedData = new Uint8Array(width * totalHeight * 4); // RGBA
    let currentY = 0;
    
    for (const img of decodedImages) {
        const srcData = img.data;
        const dstOffset = currentY * width * 4;
        mergedData.set(srcData, dstOffset);
        currentY += img.height;
    }
    
    console.log(`[JPEG Merge] Encoding merged JPEG...`);
    
    // 병합된 데이터를 JPEG로 인코딩
    const encoded = jpeg.encode({
        data: mergedData,
        width: width,
        height: totalHeight
    }, 95); // 품질 95%
    
    console.log(`[JPEG Merge] Final JPEG size: ${encoded.data.length} bytes`);
    
    // Buffer를 Uint8Array로 변환
    const jpegData = new Uint8Array(encoded.data);
    return new Blob([jpegData], { type: 'image/jpeg' });
};
