const blobCache = new Map<string, string>();

const getBlobFromUrl = (url: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed for ' + url));
          }
        });
      };
      img.onerror = () => {
        // If the canvas method fails (e.g., tainted by CORS), fall back to a direct fetch.
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error(`Fallback fetch failed: ${res.statusText} for ${url}`);
            return res.blob();
          })
          .then(resolve)
          .catch(reject);
      };
      img.src = url;
    });
  };

export const imageUrlToBlob = async (url: string): Promise<string> => {
    if (!url || url.startsWith('blob:')) {
        return url;
    }
    if (blobCache.has(url)) {
        return blobCache.get(url)!;
    }

    try {
        const blob = await getBlobFromUrl(url);
        const blobUrl = URL.createObjectURL(blob);
        blobCache.set(url, blobUrl);
        return blobUrl;
    } catch (error) {
        console.error('Error converting image to blob:', error);
        return url; // Return original url on error to avoid broken images
    }
};

export const clearBlobUrlCache = () => {
    for (const blobUrl of blobCache.values()) {
        URL.revokeObjectURL(blobUrl);
    }
    blobCache.clear();
    console.log('[Log Exporter] Blob URL cache cleared.');
};