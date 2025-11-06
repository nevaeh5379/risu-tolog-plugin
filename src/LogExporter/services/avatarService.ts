
import { getNameFromNode } from '../utils/domUtils';
import { imageUrlToBlob} from '../utils/imageUtils';

// This function is based on the logic that would be needed to replicate the original functionality.
// It assumes that avatar URLs are found in a specific way within the DOM nodes.
export const collectCharacterAvatars = async (
  nodes: Element[],
  charInfoName: string,
  isForArca: boolean,
  globalSettings: any // Added
): Promise<Map<string, string>> => {
  const avatarMap = new Map<string, string>();
  const avatarPromises = new Map<string, Promise<string>>();

  // In React, we wouldn't normally do this. This is a temporary solution to bridge the gap.
  const imageConversion = async (url: string) => {
      if (isForArca) return url; // For Arca, we don't convert
      try {
        // Blob URLs are more efficient for client-side display
        return await imageUrlToBlob(url);
      } catch (e) {
        console.error(`Failed to process image URL to blob: ${url}`, e);
        return '' // Return empty for failed conversions
      }
  }

  for (const node of nodes) {
    const name = getNameFromNode(node as HTMLElement, globalSettings, charInfoName);
    if (!avatarMap.has(name) && !avatarPromises.has(name)) {
      const avatarDiv = node.querySelector('[style*="background-image"]');
      let avatarUrl = ''
      if(avatarDiv) {
          const style = (avatarDiv as HTMLElement).style.backgroundImage;
          const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
          if(urlMatch && urlMatch[1]) {
              avatarUrl = urlMatch[1];
          }
      }

      if (avatarUrl) {
        avatarPromises.set(name, imageConversion(avatarUrl));
      }
    }
  }

  for (const [name, promise] of avatarPromises.entries()) {
    const url = await promise;
    avatarMap.set(name, url);
  }

  return avatarMap;
};
