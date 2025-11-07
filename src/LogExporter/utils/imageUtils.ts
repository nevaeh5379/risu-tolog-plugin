const blobCache = new Map<string, string>();

export const imageUrlToBlob = async (url: string): Promise<string> => {
    if (!url || url.startsWith('blob:')) {
        return url;
    }
    if (blobCache.has(url)) {
        return blobCache.get(url)!;
    }

    try {
        const response = await fetch(url);
        const blob = await response.blob();
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