import { getNameFromNode } from '../utils/domUtils';

const loadGlobalSettings = () => {
    try {
        const settings = localStorage.getItem('logExporterGlobalSettings');
        const parsed = settings ? JSON.parse(settings) : {};
        if (!Array.isArray(parsed.profileClasses)) parsed.profileClasses = [];
        if (!Array.isArray(parsed.participantNameClasses)) parsed.participantNameClasses = [];
        return parsed;
    } catch (e) {
        console.error('[Log Exporter] Failed to load global settings:', e);
        return { profileClasses: [], participantNameClasses: [] };
    }
};

// This is a simplified version of the original generateBasicFormatLog function.
// It will be expanded later.
export const generateBasicLog = async (nodes: HTMLElement[], charName: string, chatName: string, charAvatarUrl: string, settings: any, themes: any, colors: any) => {
    let html = '';
    const globalSettings = loadGlobalSettings();

    const themeInfo = themes[settings.theme || 'basic'] || themes.basic;
    const colorPalette = settings.theme === 'basic' ? (colors[settings.color || 'dark'] || colors.dark) : (themeInfo.color || colors.dark);

    if (settings.showHeader !== false) {
        html += `
            <header style="text-align: center; padding-bottom: 1.5em; margin-bottom: 2em; border-bottom: 2px solid ${colorPalette.border};">
                <img src="${charAvatarUrl}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 1em; display: block; border: 3px solid ${colorPalette.avatarBorder}; box-shadow: ${colorPalette.shadow};" />
                <h1 style="color: ${colorPalette.nameColor}; margin: 0 0 0.25em 0; font-size: 1.8em; letter-spacing: 1px;">${charName}</h1>
                <p style="color: ${colorPalette.text}; opacity: 0.8; margin: 0; font-size: 0.9em;">${chatName}</p>
            </header>
        `;
    }

    for (const node of nodes) {
        const isUser = node.classList.contains('justify-end');
        const name = getNameFromNode(node, globalSettings, charName);
        const messageEl = node.querySelector('.prose, .chattext');
        const messageHtml = messageEl ? messageEl.innerHTML : '';

        html += `
            <div class="chat-message-container" style="display: flex; align-items: flex-start; margin-bottom: 20px; flex-direction: ${isUser ? 'row-reverse' : 'row'};">
                <div style="flex: 1;">
                    <strong style="color: ${colorPalette.nameColor}; font-weight: 600; display: block; margin-bottom: 8px; text-align: ${isUser ? 'right' : 'left'};">${name}</strong>
                    <div style="background-color: ${isUser ? colorPalette.cardBgUser : colorPalette.cardBg}; border-radius: 16px; padding: 14px 18px; color: ${colorPalette.text};">
                        ${messageHtml}
                    </div>
                </div>
            </div>
        `;
    }

    return html;
};

export const generateMarkdownLog = async (nodes: HTMLElement[], charName: string) => {
    let markdown = '';
    const globalSettings = loadGlobalSettings();
    for (const node of nodes) {
        const name = getNameFromNode(node, globalSettings, charName);
        const messageEl = node.querySelector('.prose, .chattext');
        const messageText = messageEl ? (messageEl as HTMLElement).innerText : '';
        markdown += `**${name}**\n\n${messageText}\n\n---\n\n`;
    }
    return markdown;
};

export const generateTextLog = async (nodes: HTMLElement[], charName: string) => {
    let text = '';
    const globalSettings = loadGlobalSettings();
    for (const node of nodes) {
        const name = getNameFromNode(node, globalSettings, charName);
        const messageEl = node.querySelector('.prose, .chattext');
        const messageText = messageEl ? (messageEl as HTMLElement).innerText : '';
        text += `${name}: ${messageText}\n\n`;
    }
    return text;
};

async function generateForceHoverCss(): Promise<string> {
    const newRules = new Set<string>();
    const hoverRegex = /:hover/g;

    const createImportantRule = (rule: CSSRule): string | null => {
        if (!(rule instanceof CSSStyleRule)) return null;
        const styleRule = rule as CSSStyleRule;

        if (!styleRule.selectorText || !hoverRegex.test(styleRule.selectorText)) return null;

        const newSelector = styleRule.selectorText
            .split(',')
            .map(part => `.expand-hover-globally ${part.trim().replace(hoverRegex, '')}`)
            .join(', ');

        let newDeclarations = '';
        for (let i = 0; i < styleRule.style.length; i++) {
            const propName = styleRule.style[i];
            const propValue = styleRule.style.getPropertyValue(propName);
            const propPriority = styleRule.style.getPropertyPriority(propName);
            newDeclarations += `${propName}: ${propValue} ${propPriority || '!important'}; `;
        }

        if (newSelector && newDeclarations) {
            return `${newSelector} { ${newDeclarations} }`;
        }
        return null;
    };

    for (const sheet of Array.from(document.styleSheets)) {
        try {
            if (!sheet.cssRules) continue;
            for (const rule of Array.from(sheet.cssRules)) {
                if (rule.type === CSSRule.MEDIA_RULE) {
                    const mediaRule = rule as CSSMediaRule;
                    let mediaRules = '';
                    for (const nestedRule of Array.from(mediaRule.cssRules)) {
                        const importantRule = createImportantRule(nestedRule);
                        if (importantRule) mediaRules += importantRule;
                    }
                    if (mediaRules) {
                        newRules.add(`@media ${mediaRule.conditionText} { ${mediaRules} }`);
                    }
                } else {
                    const importantRule = createImportantRule(rule);
                    if (importantRule) newRules.add(importantRule);
                }
            }
        } catch (e) {
            // ignore CORS errors
        }
    }
    return Array.from(newRules).join('\n');
}

export const generateHtmlPreview = async (nodes: HTMLElement[], settings: any) => {
    const getComprehensivePageCSS = async () => {
        const cssTexts = new Set<string>();
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                const rules = sheet.cssRules;
                for (const rule of Array.from(rules)) {
                    cssTexts.add(rule.cssText);
                }
            } catch (e) {
                console.warn(`Could not read styles from stylesheet: ${sheet.href}`, e);
            }
        }
        document.querySelectorAll('style').forEach(styleElement => {
            if (styleElement.id !== 'log-exporter-styles' && styleElement.textContent) {
                cssTexts.add(styleElement.textContent);
            }
        });
        return Array.from(cssTexts).join('\n');
    }

    const imageUrlToBase64 = async (url: string) => {
        try {
            if (!url || url.startsWith('data:')) return url;
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn(`Base64 conversion error for ${url}:`, error);
            return '';
        }
    }

    const clonedNodesHtml = await Promise.all(nodes.map(async (node) => {
        const clonedNode = node.cloneNode(true) as HTMLElement;
        if (settings.embedImages !== false) {
            for (const img of Array.from(clonedNode.querySelectorAll('img'))) {
                img.src = await imageUrlToBase64(img.src);
            }
        }
        return clonedNode.outerHTML;
    }));

    let fullCss = await getComprehensivePageCSS();
    let extraCss = '';
    if (settings.expandHover) {
        extraCss = await generateForceHoverCss();
    }

    const wrapperClass = settings.expandHover ? 'class="expand-hover-globally"' : '';

    return `
        <style>${fullCss}\n${extraCss}</style>
        <div ${wrapperClass}>
         ${clonedNodesHtml.join('')}
        </div>
    `;
};
