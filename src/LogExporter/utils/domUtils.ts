// src/LogExporter/utils/domUtils.ts

// Assuming global settings are loaded and passed in.
export const getNameFromNode = (node: HTMLElement, globalSettings: any, charName = 'Assistant'): string => {
    const escapeSelector = (selector: string) => {
        return selector.replace(/[!"#$%&'()*+,./:;<=>?@[\]^`{|}~]/g, '\$&');
    };

    if (globalSettings && Array.isArray(globalSettings.participantNameClasses)) {
        for (const cls of globalSettings.participantNameClasses) {
            if (!cls || typeof cls !== 'string') continue;
            try {
                const escapedCls = escapeSelector(cls);
                const el = node.querySelector(`.${escapedCls}`);
                if (el && el.textContent && el.textContent.trim()) {
                    return el.textContent.trim();
                }
            } catch (e) {
                console.warn(`[Log Exporter] Invalid class selector for participant name: ${cls}`, e);
            }
        }
    }
    
    const nameEl = node.querySelector('.unmargin.text-xl');
    if (nameEl && nameEl.textContent?.trim()) return nameEl.textContent.trim();

    if (node.classList.contains('justify-end')) return '사용자';
    return charName;
}

export interface UIClassInfo {
    name: string;
    displayName: string;
    hasImage: boolean;
}

export function collectUIClasses(nodes: HTMLElement[]): UIClassInfo[] {
    const CONTENT_CLASSES_TO_PRESERVE = [
        'x-risu-regex-quote-block',
        'x-risu-regex-thought-block',
        'x-risu-regex-sound-block'
    ];

    const IMAGE_RELATED_CLASSES_TO_EXCLUDE = [
        'x-risu-image-container',
        'x-risu-image-cell',
        'x-risu-asset-table',
        'x-risu-in-table'
    ];

    const classDetails = new Map<string, { hasImage: boolean, parent: string | null }>();
    const classHierarchy = new Map<string, string[]>();

    nodes.forEach(node => {
        node.querySelectorAll('*[class*="x-risu-"]').forEach(el => {
            const currentClasses = Array.from(el.classList)
                .filter(c => c.startsWith('x-risu-') && 
                             !CONTENT_CLASSES_TO_PRESERVE.includes(c) && 
                             !IMAGE_RELATED_CLASSES_TO_EXCLUDE.includes(c));

            if (currentClasses.length === 0) return;

            const containsImage = el.querySelector('img') !== null || el.querySelector('video') !== null;

            let parentEl = el.parentElement;
            let parentRisuClass: string | null = null;
            while (parentEl && parentEl !== node) {
                const parentClasses = Array.from(parentEl.classList)
                    .filter(c => c.startsWith('x-risu-') && 
                                 !CONTENT_CLASSES_TO_PRESERVE.includes(c) &&
                                 !IMAGE_RELATED_CLASSES_TO_EXCLUDE.includes(c));
                if (parentClasses.length > 0) {
                    parentRisuClass = parentClasses[0];
                    break;
                }
                parentEl = parentEl.parentElement;
            }

            currentClasses.forEach(className => {
                if (!classDetails.has(className)) {
                    classDetails.set(className, { hasImage: false, parent: null });
                }
                const details = classDetails.get(className)!;
                if (containsImage) {
                    details.hasImage = true;
                }
                if (parentRisuClass && !details.parent) {
                    details.parent = parentRisuClass;
                }
            });
        });
    });

    const topLevelClasses: string[] = [];
    for (const [className, details] of classDetails.entries()) {
        if (details.parent && classDetails.has(details.parent)) {
            if (!classHierarchy.has(details.parent)) {
                classHierarchy.set(details.parent, []);
            }
            classHierarchy.get(details.parent)!.push(className);
        } else {
            topLevelClasses.push(className);
        }
    }

    const result: UIClassInfo[] = [];
    const buildDisplayList = (classNames: string[], depth: number) => {
        classNames.sort().forEach(className => {
            const details = classDetails.get(className);
            if (!details) return;

            let displayName = '  '.repeat(depth * 2) + (depth > 0 ? '└ ' : '') + className;
            if (details.hasImage) {
                displayName += ' (이미지 포함)';
            }

            result.push({
                name: className,
                displayName: displayName,
                hasImage: details.hasImage,
            });

            if (classHierarchy.has(className)) {
                buildDisplayList(classHierarchy.get(className)!, depth + 1);
            }
        });
    };

    buildDisplayList(topLevelClasses, 0);
    return result;
}

export function filterWithCustomClasses(node: HTMLElement, selectedClasses: string[], globalSettings: any): HTMLElement {
    const tempEl = node.cloneNode(true) as HTMLElement;
    const profileClasses = globalSettings.profileClasses || [];

    const IMAGE_PROTECTED_CLASSES = [
        'x-risu-image-container', 'x-risu-image-cell',
        'x-risu-asset-table', 'x-risu-in-table'
    ];

    const findMainAvatarElement = (parentNode: HTMLElement): HTMLElement | null => {
        if (profileClasses && Array.isArray(profileClasses)) {
            for (const cls of profileClasses) {
                const candidates = parentNode.querySelectorAll<HTMLElement>(`.${CSS.escape(cls)}`);
                for (const candidate of Array.from(candidates)) {
                    if (!candidate.closest('.prose, .chattext')) {
                        return candidate;
                    }
                }
            }
        }
        const fallbackAvatarEl = parentNode.querySelector<HTMLElement>('.shadow-lg.rounded-md[style*="background"]');
        if (fallbackAvatarEl && !fallbackAvatarEl.closest('.prose, .chattext')) {
            return fallbackAvatarEl;
        }
        return null;
    };

    const mainAvatarElement = findMainAvatarElement(tempEl);

    if (mainAvatarElement) {
        mainAvatarElement.setAttribute('data-protected-avatar', 'true');
    }

    if (selectedClasses.length > 0) {
        selectedClasses.forEach(className => {
            const matchedElements = tempEl.querySelectorAll<HTMLElement>(`.${CSS.escape(className)}`);
            matchedElements.forEach(el => {
                if (mainAvatarElement && el.contains(mainAvatarElement)) {
                    return;
                }
                if (el.hasAttribute('data-protected-avatar')) {
                    return;
                }
                if (el.hasAttribute('data-tolog-avatar')) {
                    return;
                }
                if (el.querySelector('[data-tolog-avatar]')) {
                    return;
                }
                if (profileClasses.includes(className)) {
                    el.remove();
                    return;
                }
                if (IMAGE_PROTECTED_CLASSES.includes(className)) {
                    return;
                }
                el.remove();
            });
        });
    }

    if (mainAvatarElement) {
        mainAvatarElement.removeAttribute('data-protected-avatar');
    }

    return tempEl;
}