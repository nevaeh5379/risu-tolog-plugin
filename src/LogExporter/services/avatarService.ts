
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
      
      let avatarUrl = '';
      let avatarElement: HTMLElement | null = null;

      // 1. Try user-defined profile classes first
      if (globalSettings && Array.isArray(globalSettings.profileClasses)) {
        for (const cls of globalSettings.profileClasses) {
          if (!cls || typeof cls !== 'string') continue;
          try {
            const candidates = node.querySelectorAll<HTMLElement>(`.${CSS.escape(cls)}`);
            for (const candidate of Array.from(candidates)) {
              if (!candidate.closest('.prose, .chattext')) {
                avatarElement = candidate;
                break;
              }
            }
          } catch (e) { /* ignore invalid selectors */ }
          if (avatarElement) break;
        }
      }

      // 2. If not found, try the generic selector for background style
      if (!avatarElement) {
        const candidates = node.querySelectorAll<HTMLElement>('[style*="background"]');
        for (const candidate of Array.from(candidates)) {
          if (!candidate.closest('.prose, .chattext')) {
            avatarElement = candidate;
            break;
          }
        }
      }

      // 3. Extract URL from the found element
      if (avatarElement) {
        const style = avatarElement.style.backgroundImage;
        const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
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
