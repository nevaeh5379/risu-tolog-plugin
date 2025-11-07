import { mergePNGsBinary } from './png';
import imageCompression from 'browser-image-compression';

// WebP 파일을 바이너리 레벨에서 병합하는 함수
// 전략: PNG 바이너리 병합 → browser-image-compression으로 WebP 변환
export const mergeWebPsBinary = async (
    blobs: Blob[]
): Promise<Blob> => {
    console.log(`[WebP Merge] Starting WebP merge for ${blobs.length} images...`);
    console.log(`[WebP Merge] Strategy: PNG binary merge → browser-image-compression WebP encoding`);
    
    // 1. 모든 이미지를 PNG로 변환
    const pngBlobs: Blob[] = [];
    for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i];
        console.log(`[WebP Merge] Image ${i + 1}: ${blob.type}`);
        
        if (blob.type === 'image/png') {
            pngBlobs.push(blob);
        } else {
            console.log(`[WebP Merge] Converting to PNG for image ${i + 1}...`);
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = URL.createObjectURL(blob);
            });
            
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');
            
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(img.src);
            
            const pngBlob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), 'image/png');
            });
            pngBlobs.push(pngBlob);
        }
    }
    
    // 2. PNG 바이너리 병합 (Canvas 없이! 무제한 크기!)
    console.log(`[WebP Merge] Merging ${pngBlobs.length} PNGs using binary merge (no size limit)...`);
    const mergedPNG = await mergePNGsBinary(pngBlobs);
    console.log(`[WebP Merge] Merged PNG size: ${mergedPNG.size} bytes`);
    
    try {
        // 3. browser-image-compression으로 PNG → WebP 변환
        console.log(`[WebP Merge] Converting PNG to WebP using browser-image-compression...`);

        const options = {
            initialQuality: 0.95, // Squoosh의 quality: 95와 유사
            fileType: 'image/webp',
            useWebWorker: true,
        };

        const mergedPNGFile = new File([mergedPNG], "merged.png", {
            type: mergedPNG.type,
            lastModified: Date.now(),
        });

        const webpBlob = await imageCompression(mergedPNGFile, options);

        console.log(`[WebP Merge] Original PNG size: ${mergedPNG.size} bytes`);
        console.log(`[WebP Merge] Final WebP size: ${webpBlob.size} bytes`);
        console.log(`[WebP Merge] Compression ratio: ${((1 - webpBlob.size / mergedPNG.size) * 100).toFixed(1)}%`);

        return webpBlob;

    } catch (error) {
        console.error('[WebP Merge] browser-image-compression failed:', error);
        console.warn('[WebP Merge] Fallback: Returning as PNG instead of WebP');
        console.log('[WebP Merge] Note: PNG has no size limits and preserves quality');
        return mergedPNG;
    }
};
