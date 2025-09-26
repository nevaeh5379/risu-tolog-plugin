//@name Chat Log Exporter
//@display-name 채팅 로그 HTML 변환기
//@version 0.0.1
//@description 채팅 로그를 HTML, 이미지(PNG), 마크다운, 텍스트 등 다양한 형식으로 내보냅니다. 통합 미리보기 모달에서 테마 변경, 참가자/UI 필터링 등 상세 옵션을 설정할 수 있습니다. 특히 아카라이브용 HTML 변환 기능을 제공하여, 이미지 업로드와 게시물 작성을 획기적으로 간소화합니다.

// --- 플러그인 충돌 방지 패치 ---
if (globalThis.__pluginApis__ && globalThis.__pluginApis__.setArg) {
    const originalSetArg = globalThis.__pluginApis__.setArg;
    /**
     * 다른 플러그인과의 충돌을 방지하기 위해 `setArg` 함수를 래핑합니다.
     * `setArg`의 첫 번째 인자가 문자열이 아닌 경우 경고를 출력하고 실행을 중단합니다.
     * @param {string} arg - 인수 이름.
     * @param {*} value - 인수에 설정할 값.
     * @returns {*} 원본 `setArg` 함수의 반환 값.
     */
    globalThis.__pluginApis__.setArg = function (arg, value) {
        if (typeof arg !== 'string') {
            console.warn('Chat Log Exporter: A plugin called setArg with an invalid argument. Crash prevented. Arg:', arg);
            return;
        }
        return originalSetArg.call(this, arg, value);
    };
}

// --- 테마 정의 ---
const THEMES = {
    dark: {
        name: '다크 (기본)',
        background: '#1a1b26',
        cardBg: '#24283b',
        cardBgUser: '#414868',
        text: '#c0caf5',
        textSecondary: '#8a98c9',
        nameColor: '#7aa2f7',
        border: '#414868',
        quoteBg: 'rgba(187, 154, 247, 0.15)',
        quoteText: '#d8e2ff',
        thoughtBg: 'rgba(122, 162, 247, 0.15)',
        thoughtText: '#a9d1ff',
        soundBg: 'rgba(158, 206, 106, 0.15)',
        soundText: '#b8e090',
        shadow: '0 4px 6px rgba(0,0,0,0.3)',
        avatarBorder: '#565f89'
    },
    light: {
        name: '라이트',
        background: '#ffffff',
        cardBg: '#f8f9fa',
        cardBgUser: '#e3f2fd',
        text: '#212529',
        textSecondary: '#6c757d',
        nameColor: '#0066cc',
        border: '#dee2e6',
        quoteBg: 'rgba(108, 117, 125, 0.1)',
        quoteText: '#495057',
        thoughtBg: 'rgba(0, 102, 204, 0.1)',
        thoughtText: '#004085',
        soundBg: 'rgba(40, 167, 69, 0.1)',
        soundText: '#155724',
        shadow: '0 2px 4px rgba(0,0,0,0.1)',
        avatarBorder: '#0066cc'
    },
    sepia: {
        name: '세피아',
        background: '#f4f1ea',
        cardBg: '#fff8f0',
        cardBgUser: '#f5e6d3',
        text: '#3a3029',
        textSecondary: '#6b5d4f',
        nameColor: '#8b4513',
        border: '#d4c5b0',
        quoteBg: 'rgba(139, 69, 19, 0.1)',
        quoteText: '#704214',
        thoughtBg: 'rgba(160, 82, 45, 0.1)',
        thoughtText: '#8b4513',
        soundBg: 'rgba(107, 142, 35, 0.1)',
        soundText: '#556b2f',
        shadow: '0 2px 4px rgba(139,69,19,0.2)',
        avatarBorder: '#a0522d'
    },
    ocean: {
        name: '오션',
        background: '#0a192f',
        cardBg: '#172a45',
        cardBgUser: '#1e3a5f',
        text: '#ccd6f6',
        textSecondary: '#8892b0',
        nameColor: '#64ffda',
        border: '#233554',
        quoteBg: 'rgba(100, 255, 218, 0.1)',
        quoteText: '#64ffda',
        thoughtBg: 'rgba(99, 179, 237, 0.1)',
        thoughtText: '#63b3ed',
        soundBg: 'rgba(255, 107, 107, 0.1)',
        soundText: '#ff6b6b',
        shadow: '0 4px 6px rgba(0,0,0,0.4)',
        avatarBorder: '#64ffda'
    },
    forest: {
        name: '포레스트',
        background: '#1a2f1a',
        cardBg: '#2d4a2b',
        cardBgUser: '#3e5c3a',
        text: '#e8f5e9',
        textSecondary: '#a5d6a7',
        nameColor: '#81c784',
        border: '#4a6741',
        quoteBg: 'rgba(129, 199, 132, 0.15)',
        quoteText: '#a5d6a7',
        thoughtBg: 'rgba(102, 187, 106, 0.15)',
        thoughtText: '#81c784',
        soundBg: 'rgba(255, 193, 7, 0.15)',
        soundText: '#ffd54f',
        shadow: '0 4px 6px rgba(0,0,0,0.3)',
        avatarBorder: '#66bb6a'
    },
    sunset: {
        name: '선셋',
        background: '#2d1b69',
        cardBg: '#4a2c7a',
        cardBgUser: '#6b3aa0',
        text: '#ffd4e5',
        textSecondary: '#d4a5a5',
        nameColor: '#ff9a9e',
        border: '#6b3aa0',
        quoteBg: 'rgba(255, 154, 158, 0.15)',
        quoteText: '#ffd4e5',
        thoughtBg: 'rgba(250, 208, 196, 0.15)',
        thoughtText: '#fad0c4',
        soundBg: 'rgba(254, 200, 154, 0.15)',
        soundText: '#fec89a',
        shadow: '0 4px 8px rgba(45,27,105,0.4)',
        avatarBorder: '#ff9a9e'
    },
    cyberpunk: {
        name: '사이버펑크',
        background: '#0a0e27',
        cardBg: '#1a1e3a',
        cardBgUser: '#2d1b69',
        text: '#00ffff',
        textSecondary: '#ff00ff',
        nameColor: '#ffff00',
        border: '#ff00ff',
        quoteBg: 'rgba(255, 0, 255, 0.2)',
        quoteText: '#ff00ff',
        thoughtBg: 'rgba(0, 255, 255, 0.2)',
        thoughtText: '#00ffff',
        soundBg: 'rgba(255, 255, 0, 0.2)',
        soundText: '#ffff00',
        shadow: '0 0 20px rgba(255,0,255,0.5)',
        avatarBorder: '#00ffff'
    },
    monochrome: {
        name: '모노크롬',
        background: '#1a1a1a',
        cardBg: '#2a2a2a',
        cardBgUser: '#3a3a3a',
        text: '#e0e0e0',
        textSecondary: '#a0a0a0',
        nameColor: '#ffffff',
        border: '#4a4a4a',
        quoteBg: 'rgba(255, 255, 255, 0.1)',
        quoteText: '#ffffff',
        thoughtBg: 'rgba(200, 200, 200, 0.1)',
        thoughtText: '#d0d0d0',
        soundBg: 'rgba(160, 160, 160, 0.1)',
        soundText: '#b0b0b0',
        shadow: '0 2px 4px rgba(0,0,0,0.5)',
        avatarBorder: '#808080'
    },
    highcontrast: {
        name: '하이 콘트라스트',
        background: '#000000',
        cardBg: '#111111',
        cardBgUser: '#1e1e1e',
        text: '#ffffff',
        textSecondary: '#d0d0d0',
        nameColor: '#ffffff',
        border: '#3d3d3d',
        quoteBg: 'rgba(255,255,255,0.08)',
        quoteText: '#ffffff',
        thoughtBg: 'rgba(255,255,255,0.08)',
        thoughtText: '#ffffff',
        soundBg: 'rgba(255,255,255,0.08)',
        soundText: '#ffffff',
        shadow: '0 0 0 1px rgba(255,255,255,0.04), 0 4px 8px rgba(0,0,0,0.8)',
        avatarBorder: '#ffffff'
    },
    darkcontrast: {
        name: '다크 하이 콘트라스트',
        background: '#0b0f19',
        cardBg: '#1b2330',
        cardBgUser: '#263246',
        text: '#ffffff',
        textSecondary: '#c7d6ff',
        nameColor: '#8fbaff',
        border: '#3d5b99',
        quoteBg: 'rgba(143,186,255,0.15)',
        quoteText: '#ffffff',
        thoughtBg: 'rgba(120,160,255,0.18)',
        thoughtText: '#ffffff',
        soundBg: 'rgba(255,200,120,0.18)',
        soundText: '#ffd9a0',
        shadow: '0 0 0 1px rgba(255,255,255,0.05), 0 6px 14px rgba(0,0,0,0.65)',
        avatarBorder: '#6ba8ff'
    }
};

const CHAT_ITEM_SELECTOR = 'button[data-risu-chat-idx]';
const MESSAGE_CONTAINER_SELECTOR = '.chat-message-container';

(async () => {
    async function getFullPageCSS() {
        console.log('[Log Exporter] getFullPageCSS: 페이지의 모든 CSS 추출 시작');
        let css = [];
        for (const sheet of document.styleSheets) {
            try {
                // sheet.cssRules 접근 시 보안 오류가 발생할 수 있어 try-catch로 감쌉니다.
                const rules = sheet.cssRules;
                for (const rule of rules) {
                    css.push(rule.cssText);
                }
            } catch (e) {
                console.warn(`[Log Exporter] 스타일시트를 읽을 수 없습니다 (CORS): ${sheet.href}`, e);
            }
        }
        console.log(`[Log Exporter] getFullPageCSS: CSS 추출 완료.`);
        return css.join('\n');
    }
    /**
     * 페이지에서 모든 채팅 메시지 노드를 수집하고 문서 순서대로 정렬합니다.
     * '.chat-message-container'와 사이드바나 모달 외부에 있는 독립적인 '.risu-chat' 요소를 모두 포함합니다.
     * @returns {HTMLElement[]} 정렬된 메시지 노드의 배열.
     */
    function getAllMessageNodes() {
        console.log('[Log Exporter] getAllMessageNodes: 모든 메시지 노드 수집 시작');
        const containers = Array.from(document.querySelectorAll('.chat-message-container'));
        const allRisuChats = Array.from(document.querySelectorAll('.risu-chat'));
        const standaloneMessageChats = allRisuChats.filter(chat =>
            (chat.querySelector('.prose') || chat.querySelector('.chattext')) &&
            !chat.closest('.log-exporter-modal') &&
            chat.closest('.risu-sidebar') === null &&
            chat.closest('.chat-message-container') === null
        );

        let messageNodes = [...containers, ...standaloneMessageChats];

        messageNodes.sort((a, b) => {
            const position = a.compareDocumentPosition(b);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
        });

        console.log(`[Log Exporter] getAllMessageNodes: 총 ${messageNodes.length}개의 메시지 노드 발견`);
        return messageNodes;
    }

    /**
     * 원본 요소에서 계산된 스타일을 복제된 요소와 그 자식 요소들에게 인라인 스타일로 적용합니다.
     * @param {HTMLElement} originalElem - 스타일의 원본이 되는 요소.
     * @param {HTMLElement} clonedElem - 스타일을 적용받을 복제된 요소.
     */
    function applyInlineStyles(originalElem, clonedElem) {
        console.log('[Log Exporter] applyInlineStyles: 스타일 인라인 적용 시작', { originalElem, clonedElem });
        const allOriginalElements = [originalElem, ...originalElem.querySelectorAll('*')];
        const allClonedElements = [clonedElem, ...clonedElem.querySelectorAll('*')];

        if (allOriginalElements.length !== allClonedElements.length) { return; }

        for (let i = allClonedElements.length - 1; i >= 0; i--) {
            const clonedEl = allClonedElements[i];
            const originalEl = allOriginalElements[i];
            if (!originalEl) continue;

            const computedStyle = window.getComputedStyle(originalEl);

            const styleToCopy = [
                'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-align',
                'line-height', 'letter-spacing', 'text-transform', 'text-shadow', 'white-space', 'word-break',
                'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
                'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius',
                'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                'box-shadow', 'opacity', 'vertical-align', 'object-fit', 'display', 'position',
                'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
                'flex', 'flex-direction', 'justify-content', 'align-items', 'flex-wrap',
                'overflow', 'overflow-x', 'overflow-y', 'text-overflow', 'cursor'
            ];
            styleToCopy.forEach(prop => {
                clonedEl.style[prop] = computedStyle[prop];
            });

            const marginLeft = computedStyle.marginLeft;
            const marginRight = computedStyle.marginRight;
            if (parseFloat(marginLeft) > 0 && Math.abs(parseFloat(marginLeft) - parseFloat(marginRight)) < 1) {
                clonedEl.style.display = 'block';
                clonedEl.style.marginLeft = 'auto';
                clonedEl.style.marginRight = 'auto';
            } else {
                clonedEl.style.marginLeft = marginLeft;
                clonedEl.style.marginRight = marginRight;
            }
            clonedEl.style.marginTop = computedStyle.marginTop;
            clonedEl.style.marginBottom = computedStyle.marginBottom;
            clonedEl.style.position = computedStyle.position === 'absolute' ? 'relative' : computedStyle.position;
            if (clonedEl.style.position === 'relative') clonedEl.style.inset = 'auto';
        }
    }

    const { getChar, onUnload } = globalThis.__pluginApis__;
    if (!getChar || !onUnload) {
        console.error("Chat Log Exporter: 필수 API를 찾을 수 없습니다.");
        return;
    }

    let observer = null;
    let htmlToImagePromise = null;
    let originalDefine = null;
    let originalRequire = null;

    /**
     * html-to-image 라이브러리가 로드되었는지 확인하고, 로드되지 않았다면 CDN에서 동적으로 로드합니다.
     * AMD 로더와의 충돌을 피하기 위해 `define`과 `require`를 일시적으로 비활성화합니다.
     * @returns {Promise<void>} 라이브러리 로드가 완료되면 resolve되는 Promise.
     */
    function ensureHtmlToImage() {
        console.log('[Log Exporter] ensureHtmlToImage: html-to-image 라이브러리 확인/로드 시작');
        if (typeof window.__htmlToImageLib !== 'undefined' && window.__htmlToImageLib) {
            console.log('[Log Exporter] ensureHtmlToImage: 이미 로드됨 (캐시된 라이브러리 사용)');
            return Promise.resolve();
        }
        if (typeof window.htmlToImage !== 'undefined' && !window.__htmlToImageLib) {
            window.__htmlToImageLib = window.htmlToImage;
            return Promise.resolve();
        }
        if (htmlToImagePromise) {
            return htmlToImagePromise;
        }

        htmlToImagePromise = new Promise(async (resolve, reject) => {
            console.log('[Log Exporter] html-to-image 라이브러리 로드 시작...');
            try {
                const response = await fetch('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js');
                if (!response.ok) {
                    throw new Error(`CDN에서 스크립트를 가져오는 데 실패했습니다: ${response.statusText}`);
                }
                const libraryCode = await response.text();

                const wrappedCode = `
                    (() => {
                        const define_backup = window.define;
                        const require_backup = window.require;
                        window.define = undefined;
                        window.require = undefined;
                        try {
                            ${libraryCode}
                        } catch (e) {
                            console.error("[Log Exporter] 주입된 html-to-image 코드 실행 중 오류 발생:", e);
                        } finally {
                            window.define = define_backup;
                            window.require = require_backup;
                        }
                    })();
                `;

                const script = document.createElement('script');
                script.textContent = wrappedCode;
                document.head.appendChild(script);
                document.head.removeChild(script);

                if (typeof window.htmlToImage !== 'undefined') {
                    console.log('[Log Exporter] html-to-image 라이브러리가 성공적으로 로드되었습니다.');
                    window.__htmlToImageLib = window.htmlToImage;
                    resolve();
                } else {
                    throw new Error('코드를 주입하여 실행했지만 htmlToImage 객체가 생성되지 않았습니다.');
                }
            } catch (error) {
                console.error('[Log Exporter] html-to-image 라이브러리 동적 로드에 최종 실패했습니다.', error);
                htmlToImagePromise = null;
                reject(error);
            }
        });

        return htmlToImagePromise;
    }
    let jszipPromise = null;
    /**
     * JSZip 라이브러리가 로드되었는지 확인하고, 로드되지 않았다면 CDN에서 동적으로 로드합니다.
     * AMD 로더와의 충돌을 피하기 위해 `define`과 `require`를 일시적으로 비활성화합니다.
     * @returns {Promise<void>} 라이브러리 로드가 완료되면 resolve되는 Promise.
     */
    function ensureJSZip() {
        console.log('[Log Exporter] ensureJSZip: JSZip 라이브러리 확인/로드 시작');
        if (typeof window.JSZip !== 'undefined') {
            console.log('[Log Exporter] ensureJSZip: 이미 로드됨');
            return Promise.resolve();
        }
        if (jszipPromise) {
            return jszipPromise;
        }
        jszipPromise = new Promise(async (resolve, reject) => {
            console.log('[Log Exporter] JSZip 라이브러리 로드 시작...');
            try {
                const response = await fetch('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
                if (!response.ok) {
                    throw new Error(`JSZip CDN에서 스크립트를 가져오는 데 실패했습니다: ${response.statusText}`);
                }
                const libraryCode = await response.text();

                const wrappedCode = `
                    (() => {
                        const define_backup = window.define;
                        const require_backup = window.require;
                        window.define = undefined;
                        window.require = undefined;
                        try {
                            ${libraryCode}
                        } catch (e) {
                            console.error("[Log Exporter] 주입된 JSZip 코드 실행 중 오류 발생:", e);
                        } finally {
                            window.define = define_backup;
                            window.require = require_backup;
                        }
                    })();
                `;

                const script = document.createElement('script');
                script.textContent = wrappedCode;
                document.head.appendChild(script);
                document.head.removeChild(script);

                if (typeof window.JSZip !== 'undefined') {
                    console.log('[Log Exporter] JSZip 라이브러리가 성공적으로 로드되었습니다.');
                    resolve();
                } else {
                    throw new Error('코드를 주입하여 실행했지만 JSZip 객체가 생성되지 않았습니다.');
                }
            } catch (error) {
                console.error('[Log Exporter] JSZip 라이브러리 동적 로드에 최종 실패했습니다.', error);
                jszipPromise = null;
                reject(error);
            }
        });
        return jszipPromise;
    }

    /**
     * 제공된 노드들에서 이미지를 수집하여 ZIP 파일로 다운로드합니다.
     * @async
     * @param {HTMLElement[]} nodes - 이미지를 스캔할 DOM 노드 배열.
     * @param {string} charName - 캐릭터 이름 (파일 이름에 사용).
     * @param {string} chatName - 채팅 이름 (파일 이름에 사용).
     * @param {boolean} [sequentialNaming=false] - 이미지 파일 이름을 순차적으로 지정할지 여부 (아카라이브용).
     * @param {boolean} [showAvatar=true] - 아바타 이미지를 포함할지 여부.
     */
    async function downloadImagesAsZip(nodes, charName, chatName, sequentialNaming = false, showAvatar = true) {
        console.log(`[Log Exporter] downloadImagesAsZip: 이미지 ZIP 다운로드 시작. 순차 이름 지정: ${sequentialNaming}`);
        try {
            await ensureJSZip();
            const zip = new window.JSZip();
            const imagePromises = [];
            let imageCounter = 0;
            const addedUrls = new Set(); // 중복 추가 방지

            const addImageToZip = (src) => {
                if (!src || src.startsWith('data:')) return;

                // 일반 모드(sequentialNaming=false)에서만 중복을 체크하고 건너뛴다.
                // 아카라이브 모드에서는 모든 이미지 요소를 파일로 만들어야 순서가 맞는다.
                if (!sequentialNaming) {
                    if (addedUrls.has(src)) return;
                    addedUrls.add(src);
                }

                imageCounter++;
                const filename = sequentialNaming
                    ? `image_${imageCounter}.png`
                    : `image_${String(imageCounter).padStart(3, '0')}.png`;

                imagePromises.push(
                    fetch(src)
                        .then(res => {
                            if (!res.ok) throw new Error(`Failed to fetch ${src}`);
                            return res.blob();
                        })
                        .then(blob => zip.file(filename, blob))
                        .catch(e => console.warn(`Failed to fetch or zip image: ${src}`, e))
                );
            };

            // 아카라이브 모드에서는 순서가 중요하므로, HTML 생성 후 순서대로 수집
            if (sequentialNaming) {
                const baseHtml = await generateBasicFormatLog(nodes, 'dark', false, showAvatar, true); // embedImagesAsBase64=false
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = baseHtml;

                // 단일 쿼리로 모든 이미지 요소를 문서 순서대로 수집하여 순서 불일치 문제 해결
                tempDiv.querySelectorAll('img, [style*="url("]').forEach(el => {
                    if (el.tagName === 'IMG') {
                        if (el.src) addImageToZip(el.src);
                    } else { // 배경 이미지
                        const style = el.getAttribute('style');
                        const urlMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
                        if (urlMatch && urlMatch[1]) {
                            addImageToZip(urlMatch[1]);
                        }
                    }
                });
            } else {
                // 일반 모드에서는 모든 참가자 아바타를 먼저 추가
                if (showAvatar) {
                    const avatarMap = await collectCharacterAvatars(nodes, false);
                    for (const avatarUrl of avatarMap.values()) {
                        addImageToZip(avatarUrl);
                    }
                }

                for (const node of nodes) {
                    node.querySelectorAll('img').forEach(img => { if (img.src) addImageToZip(img.src); });
                    const elementsWithBg = node.querySelectorAll('[style*="background-image"]');
                    for (const el of elementsWithBg) {
                        const style = el.style.backgroundImage;
                        const urlMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
                        if (urlMatch && urlMatch[1]) addImageToZip(urlMatch[1]);
                    }
                }
            }

            if (imagePromises.length === 0) {
                alert("다운로드할 이미지가 로그에 없습니다.", "info");
                return;
            }

            await Promise.all(imagePromises);

            const content = await zip.generateAsync({ type: "blob" });

            const safeCharName = charName.replace(/[\/\\?%*:|"<>]/g, '-');
            const safeChatName = chatName.replace(/[\/\\?%*:|"<>]/g, '-');
            const zipFilename = `Risu_Log_Images_${safeCharName}_${safeChatName}${sequentialNaming ? '_Arca' : ''}.zip`;

            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = zipFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('[Log Exporter] Error creating ZIP file:', error);
            alert('이미지 ZIP 파일 생성 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 로그 내보내기 모달에 필요한 CSS 스타일을 문서의 <head>에 주입합니다.
     * 이미 스타일이 주입된 경우 중복 실행을 방지합니다.
     */
    function injectModalStyles() {
        console.log('[Log Exporter] injectModalStyles: 모달 스타일 주입 시도');
        if (document.getElementById('log-exporter-styles')) return;
        console.log('[Log Exporter] injectModalStyles: 새로운 스타일 주입');
        const style = document.createElement('style');
        style.id = 'log-exporter-styles';
        style.innerHTML = `
            .log-exporter-modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); z-index: 10001; display: flex; align-items: center; justify-content: center; }
            .log-exporter-modal { background-color: #24283b; color: #c0caf5; border-radius: 10px; width: 90%; max-width: 1200px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 5px 15px rgba(0,0,0,0.3); overflow: hidden; }
            .log-exporter-modal-header { padding: 12px 18px; font-size: 1.15em; font-weight: bold; border-bottom: 1px solid #414868; }
            .log-exporter-modal-content { padding: 15px; display: flex; flex-direction: row; gap: 15px; overflow-y: hidden; flex-grow: 1; }
            .log-exporter-left-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 100%; }
            .log-exporter-right-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: hidden; max-height: 100%; }
            .log-exporter-modal-options { display: flex; gap: 8px; align-items: center; background: #1f2335; padding: 8px 10px; border-radius: 5px; flex-wrap: wrap; }
            .log-exporter-modal-options label { cursor: pointer; user-select: none; display: inline-flex; align-items: center; }
            .log-exporter-modal-preview { flex-grow: 1; background-color: #1a1b26; border: 1px solid #414868; border-radius: 5px; padding: 12px; overflow-y: auto; min-height: 150px; max-height: none; }
            .log-exporter-modal-preview pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace; font-size: 0.9em; margin: 0; color: #c0caf5; }
            .log-exporter-modal-footer { padding: 12px 18px; border-top: 1px solid #414868; display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
            .log-exporter-modal-btn { background-color: #414868; color: #c0caf5; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; white-space: nowrap; }
            .log-exporter-modal-btn:hover { background-color: #565f89; }
            .log-exporter-modal-btn.primary { background-color: #7aa2f7; color: #1a1b26; }
            .log-exporter-modal-btn.primary:hover { background-color: #9eceff; }
            @media (max-width: 992px) { /* Tablet breakpoint: revert to column layout */
                .log-exporter-modal-content { flex-direction: column; overflow-y: auto; }
                .log-exporter-left-panel, .log-exporter-right-panel { max-height: none; overflow-y: visible; flex: none; width: 100%; }
                .log-exporter-modal-preview { max-height: 40vh; } /* Restore max-height for column layout */
            }
            .log-exporter-modal-btn.image-save { background-color: #9ece6a; color: #1a1b26; }
            .log-exporter-modal-btn.image-save:hover { background-color: #b8e090; }
            .log-exporter-modal-btn:disabled { background-color: #565f89; cursor: not-allowed; }
            .log-exporter-msg-btn { margin-left: 8px; cursor: pointer; color: #a0a0a0; transition: color 0.2s; font-size: 20px; line-height: 1; background: none; border: none; padding: 0;}
            .log-exporter-msg-btn:hover { color: #7aa2f7; }
            #filter-controls { display: none; margin-left: auto; align-items: center; gap: 15px; }
            #theme-selector { padding: 4px 8px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
            #theme-selector:hover { border-color: #565f89; }
            .arca-helper-section { display: none; flex-direction: column; gap: 8px; background-color: #1a1b26; padding: 12px; border-radius: 8px; border: 1px solid #7aa2f7; margin-top: 8px; }
            .arca-helper-section h4 { margin: 0 0 8px 0; color: #7aa2f7; }
            .arca-helper-section textarea { width: 100%; height: 100px; background-color: #1f2335; color: #c0caf5; border: 1px solid #414868; border-radius: 5px; padding: 8px; font-family: monospace; font-size: 0.9em; resize: vertical; }
            .arca-helper-section button { align-self: center; }
            @media (max-width: 768px) {
                #image-export-controls { flex-direction: column; align-items: stretch !important; gap: 10px !important; margin-left: 0 !important; width: 100%; }
                #image-export-controls > label { justify-content: space-between; }
                #image-export-controls > button { width: 100%; }
            }
            @media (max-width: 640px) {
                .log-exporter-modal { width: 95%; max-width: none; } 
                .log-exporter-modal-header { padding: 12px 15px; font-size: 1.1em; }
                .log-exporter-modal-content { padding: 15px; flex-direction: column; }
                .log-exporter-left-panel, .log-exporter-right-panel { max-height: none; overflow-y: visible; flex: none; width: 100%; }
                .log-exporter-modal-btn { padding: 8px 12px; font-size: 0.9em; }
                .log-exporter-modal-options { flex-direction: column; align-items: stretch; } 
                .log-exporter-modal-footer { justify-content: center; } 
                #filter-controls { margin-left: 0; flex-direction: column; gap: 10px; align-items: stretch; } 
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 이미지 URL을 받아 Base64 데이터 URI로 변환합니다.
     * CORS 문제를 피하기 위해 fetch를 사용하며, 실패 시 투명한 1x1 GIF를 반환합니다.
     * @async
     * @param {string} url - 변환할 이미지의 URL.
     * @returns {Promise<string>} Base64로 인코딩된 데이터 URI.
     */
    async function imageUrlToBase64(url) {
        console.log(`[Log Exporter] imageUrlToBase64: URL을 Base64로 변환 중: ${url}`);
        try {
            if (!url || url === 'undefined' || url === 'null') return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            if (url.startsWith('data:image')) return url;
            let normalizedUrl = url.startsWith('//') ? 'https:' + url : (url.startsWith('/') ? window.location.origin + url : url);
            const response = await fetch(new URL(normalizedUrl, window.location.origin).href);
            if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==');
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn(`[Log Exporter] Base64 conversion error for ${url}:`, error);
            return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        }
    }

    /**
     * 지정된 채팅 인덱스에 대한 채팅 로그를 처리합니다.
     * 채팅을 활성화하고, 캐릭터 정보와 모든 메시지 노드를 수집하여 반환합니다.
     * @async
     * @param {number} chatIndex - 처리할 채팅의 인덱스.
     * @returns {Promise<{charName: string, chatName: string, charAvatarUrl: string, messageNodes: HTMLElement[]}>} 캐릭터 및 채팅 정보와 메시지 노드 배열을 포함하는 객체.
     * @throws {Error} 채팅 버튼, 캐릭터 정보, 또는 메시지를 찾을 수 없는 경우.
     */
    async function processChatLog(chatIndex) {
        console.log(`[Log Exporter] processChatLog: 채팅 로그 처리 시작, 인덱스: ${chatIndex}`);
        const chatButton = document.querySelector(`button[data-risu-chat-idx="${chatIndex}"]`);
        if (!chatButton) throw new Error("채팅 버튼을 찾을 수 없습니다.");

        if (!chatButton.classList.contains('bg-selected')) {
            chatButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        const character = getChar();
        if (!character) throw new Error("캐릭터 정보를 불러올 수 없습니다.");
        const targetChat = character.chats[chatIndex];

        let charAvatarUrl = character.avatar;

        const activeIndicator = document.querySelector('.rs-sidebar div[class*="bg-white"][class*="!h-"]');
        if (activeIndicator) {
            const characterContainer = activeIndicator.closest('div[role="listitem"]');
            if (characterContainer) {
                const sidebarAvatarImg = characterContainer.querySelector('img.sidebar-avatar');
                if (sidebarAvatarImg && sidebarAvatarImg.src && !sidebarAvatarImg.src.endsWith('none.webp')) {
                    charAvatarUrl = sidebarAvatarImg.src;
                }
            }
        }

        let messageNodes = getAllMessageNodes();
        console.log(`[Log Exporter] Found ${messageNodes.length} messages`);

        messageNodes = messageNodes.reverse();

        if (messageNodes.length === 0) {
            throw new Error("채팅 메시지를 찾을 수 없습니다.");
        }

        return { charName: character.name, chatName: targetChat.name, charAvatarUrl, messageNodes };
    }

    /**
     * 제공된 DOM 노드들과 관련된 모든 CSS 규칙을 문서의 스타일시트에서 추출합니다.
     * @async
     * @param {HTMLElement[]} nodes - CSS를 추출할 DOM 노드 배열.
     * @returns {Promise<string>} 추출된 모든 CSS 규칙을 포함하는 문자열.
     */
    async function extractCssForNodes(nodes) {
        console.log(`[Log Exporter] extractCssForNodes: ${nodes.length}개 노드에 대한 CSS 추출 시작`);
        const classSet = new Set();
        const tagSet = new Set();
        const idSet = new Set();
        
        nodes.forEach(node => {
            node.querySelectorAll('*').forEach(el => {
                // 클래스 수집
                el.classList.forEach(c => classSet.add(c));
                // 태그명 수집
                tagSet.add(el.tagName.toLowerCase());
                // ID 수집
                if (el.id) idSet.add(el.id);
            });
        });

        const classSelectors = Array.from(classSet);
        const tagSelectors = Array.from(tagSet);
        const idSelectors = Array.from(idSet);
        const cssRules = new Set();

        for (const sheet of document.styleSheets) {
            try {
                if (!sheet.cssRules) continue;
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText) {
                        const selector = rule.selectorText;
                        // 클래스, 태그, ID 중 하나라도 매치되면 포함
                        const hasClassMatch = classSelectors.some(c => selector.includes(`.${c}`));
                        const hasTagMatch = tagSelectors.some(t => selector.includes(t));
                        const hasIdMatch = idSelectors.some(id => selector.includes(`#${id}`));
                        
                        if (hasClassMatch || hasTagMatch || hasIdMatch) {
                            cssRules.add(rule.cssText);
                        }
                    }
                }
            } catch (e) {
                console.warn(`[Log Exporter] Could not read styles from stylesheet: ${sheet.href}`, e);
            }
        }
        console.log(`[Log Exporter] extractCssForNodes: ${cssRules.size}개의 CSS 규칙 발견`);
        return Array.from(cssRules).join('\n');
    }

       /**
     * 생성된 HTML 콘텐츠를 기반으로 완전한 HTML 파일을 만들어 사용자에게 다운로드합니다.
     * @async
     * @param {string} charName - 캐릭터 이름.
     * @param {string} chatName - 채팅 이름.
     * @param {string} messagesHtml - 채팅 메시지의 HTML 콘텐츠.
     */
    async function generateAndDownloadHtmlFile(charName, chatName, messagesHtml,charAvatarUrl) {
        console.log(`[Log Exporter] generateAndDownloadHtmlFile: HTML 파일 생성 및 다운로드 시작 (전체 스타일 복제 모드)`);
        
        // 1. 페이지의 모든 CSS를 가져옵니다.
        const fullCss = await getFullPageCSS();
        // 2. 현재 적용된 테마 변수(빨간색 테마 등)를 <html> 태그에서 가져옵니다.
        const htmlTagStyle = document.documentElement.getAttribute('style') || ''
        const headerHtml = await getHeaderHtml(charAvatarUrl, charName, chatName);
        const finalHtml = `<!DOCTYPE html>
<html lang="ko" style="${htmlTagStyle}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>채팅 로그: ${charName} - ${chatName}</title>
    <style>
        /* RisuAI 페이지의 모든 스타일을 그대로 주입 */
        ${fullCss}

         /* 내보내기용 추가 스타일 (스크롤 문제 해결) */
    html, body {
        overflow: auto !important;
        height: auto !important;
    }
        body { 
            padding: 20px; 
            background-color: var(--risu-theme-bgcolor, #1a1b26); /* 현재 RisuAI 테마의 배경색 적용 */
        }
        .chat-log-wrapper { 
            max-width: 900px; 
            margin: 0 auto; 
        }
        /* 불필요한 UI 숨기기 */
        .log-exporter-btn-group, .log-exporter-msg-btn-group {
            display: none !important;
        }
    </style>
</head>
<body>
    <div class="chat-log-wrapper">
     ${headerHtml}
        ${messagesHtml}
    </div>
</body>
</html>`;

        const safeCharName = charName.replace(/[\/\\?%*:|"<>]/g, '-');
        const safeChatName = chatName.replace(/[\/\\?%*:|"<>]/g, '-');
        const filename = `Risu_Log_${safeCharName}_${safeChatName}.html`;

        const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 메시지 노드 배열로부터 HTML 문자열을 생성합니다. (안전 최종 버전)
     * 이 함수는 노드를 그대로 복제하고, 필요한 경우 이미지만 Base64로 변환합니다.
     * 내용을 파괴하는 모든 종류의 재구성 로직을 완전히 제거했습니다.
     * @async
     * @param {HTMLElement[]} nodes - HTML로 변환할 메시지 노드 배열.
     * @param {boolean} [applyStyles=false] - (현재 'HTML' 모드에서는 사용되지 않음)
     * @param {boolean} [embedImagesAsBase64=true] - 이미지를 Base64로 인코딩하여 포함할지 여부.
     * @returns {Promise<string>} 생성된 HTML 문자열.
     */
    async function generateHtmlFromNodes(nodes, applyStyles = true, embedImagesAsBase64 = true) {
        console.log(`[Log Exporter] generateHtmlFromNodes: ${nodes.length}개 노드로부터 HTML 생성 시작. 스타일 적용: ${applyStyles}, Base64 임베드: ${embedImagesAsBase64}`);

        let finalHtml = '';
        for (const node of nodes) {
            if (node.querySelector('textarea')) {
                console.log('[Log Exporter] Skipping message with textarea');
                continue;
            }

            const clonedNode = node.cloneNode(true);
            clonedNode.querySelector('.log-exporter-msg-btn-group')?.remove();

            const proseElContentCheck = clonedNode.querySelector('.prose, .chattext');
            // if (proseElContentCheck && proseElContentCheck.innerHTML.trim().replace(/<!--(.*?)-->/g, '').length === 0) {
            //     const tempDiv = node.cloneNode(true);
            //     tempDiv.querySelector('.unmargin.text-xl')?.remove();
            //     tempDiv.querySelector('.flex-grow.flex.items-center.justify-end')?.remove();
            //     const restoredText = tempDiv.textContent.trim();
            //     if (restoredText) {
            //         proseElContentCheck.innerHTML = `<p>${restoredText.replace(/\n/g, '<br>')}</p>`;
            //     }
            // }

            const avatarSelector = '.shadow-lg.rounded-md[style*="background"]';
            const originalAvatarEl = node.querySelector(avatarSelector);
            const clonedAvatarEl = clonedNode.querySelector(avatarSelector);

            if (originalAvatarEl && clonedAvatarEl) {
                const computedStyle = window.getComputedStyle(originalAvatarEl);
                let imageUrl = null;

                const inlineStyle = originalAvatarEl.getAttribute('style');
                if (inlineStyle && inlineStyle.includes('url(')) {
                    const match = inlineStyle.match(/url\(["']?([^"')]+)["']?\)/);
                    if (match && match[1]) {
                        imageUrl = match[1];
                    }
                }

                if (!imageUrl) {
                    const bgImage = computedStyle.backgroundImage;
                    if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
                        const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
                        if (match && match[1]) {
                            imageUrl = match[1];
                        }
                    }
                }

                Object.assign(clonedAvatarEl.style, {
                    height: computedStyle.height || '3.5rem',
                    width: computedStyle.width || '3.5rem',
                    minWidth: computedStyle.minWidth || '3.5rem',
                    borderRadius: computedStyle.borderRadius || '0.375rem',
                    flexShrink: '0',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                });

                if (imageUrl) {
                    if (embedImagesAsBase64) {
                        const base64Url = await imageUrlToBase64(imageUrl);
                        clonedAvatarEl.style.backgroundImage = `url("${base64Url}")`;
                    } else {
                        clonedAvatarEl.style.backgroundImage = `url("${imageUrl}")`;
                    }
                    clonedAvatarEl.innerHTML = '';
                } else {
                    clonedAvatarEl.style.backgroundColor = '#6b7280';
                    clonedAvatarEl.style.display = 'flex';
                    clonedAvatarEl.style.alignItems = 'center';
                    clonedAvatarEl.style.justifyContent = 'center';
                    clonedAvatarEl.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                }
            }

            const elementsWithInlineBackground = clonedNode.querySelectorAll('[style*="background"]');
            for (const el of elementsWithInlineBackground) {
                if (el === clonedAvatarEl) continue;

                const style = el.getAttribute('style');
                if (style && style.includes('url(')) {
                    const urlMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
                    if (urlMatch && urlMatch[1]) {
                        if (embedImagesAsBase64) {
                            let url = urlMatch[1];
                            url = url.replace(/&quot;/g, '"');
                            const base64Url = await imageUrlToBase64(url);
                            const newStyle = style.replace(/url\(["']?[^"')]+["']?\)/, `url("${base64Url}")`);
                            el.setAttribute('style', newStyle);
                        }
                    }
                }
            }

            if (applyStyles) {
                const originalProseEl = node.querySelector('.prose, .chattext');
                const clonedProseEl = clonedNode.querySelector('.prose, .chattext');
                if (originalProseEl && clonedProseEl) {
                    applyInlineStyles(originalProseEl, clonedProseEl);
                }
                
                // 참가자 이름 색상 스타일 강제 적용
                const nameEl = clonedNode.querySelector('.unmargin.text-xl');
                if (nameEl) {
                    const computedStyle = window.getComputedStyle(nameEl);
                    const isUser = node.classList.contains('justify-end');
                    const theme = THEMES.dark; // 기본 다크 테마 사용
                    const nameColor = isUser ? theme.nameColor : theme.nameColor;
                    
                    nameEl.style.color = nameColor;
                    nameEl.style.fontWeight = '600';
                    nameEl.style.fontSize = '0.95em';
                    nameEl.style.display = 'block';
                    nameEl.style.marginBottom = '8px';
                    nameEl.style.textAlign = isUser ? 'right' : 'left';
                }
            } else {
                clonedNode.querySelectorAll('[style]').forEach(el => {
                    if (el === clonedAvatarEl) return;
                    const style = el.getAttribute('style');
                    if (style && !style.includes('background') && !style.includes('width')) {
                        el.removeAttribute('style');
                    }
                });
                
                // 스타일 미적용 시에도 참가자 이름 색상은 기본값으로 설정
                const nameEl = clonedNode.querySelector('.unmargin.text-xl');
                if (nameEl) {
                    const isUser = node.classList.contains('justify-end');
                    const theme = THEMES.dark;
                    nameEl.style.color = theme.nameColor;
                    nameEl.style.fontWeight = '600';
                    nameEl.style.fontSize = '0.95em';
                }
            }

            for (const img of clonedNode.querySelectorAll('img')) {
                if (img.src && embedImagesAsBase64) {
                    img.src = await imageUrlToBase64(img.src);
                }
                if (!applyStyles) {
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                }
            }

            clonedNode.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
            });

            finalHtml += clonedNode.outerHTML;
        }
        console.log('[Log Exporter] generateHtmlFromNodes: HTML 생성 완료');

        return finalHtml;
    }

    const CONTENT_CLASSES = [
        'x-risu-regex-quote-block',
        'x-risu-regex-thought-block',
        'x-risu-regex-sound-block'
    ];

    const UI_CLASSES = [
        'x-risu-base-container',
        'x-risu-chapel-container',
        'x-risu-succubus-container',
        'x-risu-image-container',
        'x-risu-button-container',
        'x-risu-base-button',
        'x-risu-chapel-button',
        'x-risu-succubus-button'
    ];

    // [추가] 아바타와 일반 이미지를 구분하기 위한 데이터 속성
    const AVATAR_ATTR = 'data-tolog-avatar';

    // [추가] 아바타와 일반 이미지에 적용될 최종 스타일 정의
    const ARCA_IMG_STYLES = {
        avatar: (theme, isUser) => {
            const margin = isUser ? 'margin-left:12px;' : 'margin-right:12px;';
            return `width:48px; height:48px; min-width:48px; flex-shrink:0; border-radius:50%; object-fit:cover; border:2px solid ${theme.avatarBorder}; box-shadow:${theme.shadow}; ${margin}`;
        },
        content: `max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 12px 0;`
    };


    /**
     * 메시지 노드에서 아바타 이미지 URL을 추출합니다.
     * @param {HTMLElement} node - 검사할 메시지 노드.
     * @returns {string|null} 아바타 URL 또는 찾지 못한 경우 null.
     */
    function extractAvatarFromNode(node) {
        const avatarEl = node.querySelector('.shadow-lg.rounded-md[style*="background"]');
        if (avatarEl) {
            const style = avatarEl.getAttribute('style');
            if (style && style.includes('url(')) {
                const match = style.match(/url\(["']?([^"')]+)["']?\)/);
                if (match && match[1]) {
                    return match[1];
                }
            }
        }
        return null;
    }

    /**
     * 메시지 노드들로부터 모든 참가자의 이름과 아바타 URL 맵을 생성합니다.
     * @async
     * @param {HTMLElement[]} nodes - 스캔할 메시지 노드 배열.
     * @param {boolean} [useBase64=true] - 아바타 URL을 Base64로 인코딩할지 여부.
     * @returns {Promise<Map<string, string>>} 참가자 이름을 키로, 아바타 소스(URL 또는 Base64)를 값으로 갖는 맵.
     */
    async function collectCharacterAvatars(nodes, useBase64 = true) {
        console.log(`[Log Exporter] collectCharacterAvatars: 캐릭터 아바타 수집 시작. Base64 사용: ${useBase64}`);
        const avatarMap = new Map();

        for (const node of nodes) {
            const nameEl = node.querySelector('.unmargin.text-xl');
            if (nameEl) {
                const name = nameEl.textContent.trim();
                if (!avatarMap.has(name)) {
                    const avatarUrl = extractAvatarFromNode(node);
                    if (avatarUrl) {
                        const avatarSrc = useBase64 ? await imageUrlToBase64(avatarUrl) : avatarUrl;
                        avatarMap.set(name, avatarSrc);
                    }
                }
            }
        }

        console.log(`[Log Exporter] collectCharacterAvatars: ${avatarMap.size}개의 고유 아바타 수집 완료`);
        return avatarMap;
    }

        /**
         * 채팅 메시지 노드 배열로부터 '기본' 형식의 HTML 채팅 로그를 생성합니다.
         * 테마, 이미지 임베딩, 아바타 표시 여부 등을 설정할 수 있습니다.
         * @async
         * @param {HTMLElement[]} nodes - DOM 노드의 배열.
         * @param {string} [selectedTheme='dark'] - 사용할 테마 ('dark' 또는 THEMES의 다른 키).
         * @param {boolean} [embedImagesAsBase64=true] - 이미지를 base64 데이터 URI로 임베드할지 여부.
         * @param {boolean} [showAvatar=true] - 아바타를 표시할지 여부.
         * @param {boolean} [useBubbleDesign=true] - 말풍선 디자인을 사용할지 여부.
         * @returns {Promise<string>} 포맷된 채팅 로그를 나타내는 HTML 문자열을 resolve하는 Promise.
         */
        async function generateBasicFormatLog(nodes, selectedTheme = 'dark', embedImagesAsBase64 = true, showAvatar = true, useBubbleDesign = true) {
        console.log(`[Log Exporter] generateBasicFormatLog: '기본' 형식 로그 생성 시작. 테마: ${selectedTheme}, 아바타 표시: ${showAvatar}`);
        const theme = THEMES[selectedTheme] || THEMES.dark;
        let log = '';
        
        const avatarMap = await collectCharacterAvatars(nodes, embedImagesAsBase64);

        for (const node of nodes) {
            if (node.querySelector('textarea')) continue;

            let name = '';
            const nameEl = node.querySelector('.unmargin.text-xl');
            if (nameEl) {
                name = nameEl.textContent.trim();
            } else {
                name = node.classList.contains('justify-end') ? 'User' : 'Assistant';
            }

            const messageEl = node.querySelector('.prose, .chattext');
            if (!messageEl) continue;

            let contentSourceEl = messageEl.cloneNode(true);

            const styleBlock = (el, bg, color, border = null) => {
                const p = document.createElement('p');
                p.innerHTML = el.innerHTML;
                Object.assign(p.style, {
                    backgroundColor: bg,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontStyle: 'italic',
                    color: color,
                    margin: '0.5em 0'
                });
                if (border) p.style.borderLeft = `3px solid ${border}`;
                el.replaceWith(p);
            };
            contentSourceEl.querySelectorAll('.x-risu-regex-quote-block').forEach(el => styleBlock(el, theme.quoteBg, theme.quoteText, theme.quoteText));
            contentSourceEl.querySelectorAll('.x-risu-regex-thought-block').forEach(el => styleBlock(el, theme.thoughtBg, theme.thoughtText));
            contentSourceEl.querySelectorAll('.x-risu-regex-sound-block').forEach(el => styleBlock(el, theme.soundBg, theme.soundText));

            for (const img of contentSourceEl.querySelectorAll('img')) {
                if (img.src) {
                    if (embedImagesAsBase64) {
                        img.src = await imageUrlToBase64(img.src); 
                    }
                    Object.assign(img.style, {
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        display: 'block',
                        margin: '12px auto',
                        boxShadow: theme.shadow
                    });
                }
            }

            contentSourceEl.querySelectorAll('script, style, .log-exporter-msg-btn-group').forEach(el => el.remove());
            contentSourceEl.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
            });
            
            contentSourceEl.querySelectorAll('mark[risu-mark^="quote"]').forEach(markEl => {
                markEl.style.fontStyle = 'italic';
                markEl.style.color = theme.quoteText;
                if (markEl.style.backgroundColor === '') {
                    markEl.style.backgroundColor = theme.quoteBg;
                }
            });

            let messageHtml = contentSourceEl.innerHTML.trim();
            
            if (messageHtml.length === 0) continue;

            const isUser = node.classList.contains('justify-end');
            const cardBgColor = isUser ? theme.cardBgUser : theme.cardBg;
            const avatarSrc = avatarMap.get(name);
            let avatarHtml = '';
            
            if (showAvatar) {
                const createAvatarDiv = (src, isUser) => {
                    const margin = isUser ? 'margin-left:12px;' : 'margin-right:12px;';
                    const baseStyle = `width:48px;height:48px;min-width:48px;border-radius:50%;box-shadow:${theme.shadow};border:2px solid ${theme.avatarBorder};${margin}`;
                    if (src) { // [수정] 아바타 식별을 위한 data-tolog-avatar 속성 추가
                        return `<div ${AVATAR_ATTR} style="${baseStyle}background:url('${src}');background-size:cover;background-position:center;"></div>`;
                    } else {
                        const bgColor = isUser ? theme.textSecondary : theme.avatarBorder;
                        const letter = isUser ? 'U' : name.charAt(0).toUpperCase();
                        return `<div ${AVATAR_ATTR} style="${baseStyle}background-color:${bgColor};display:flex;align-items:center;justify-content:center;"><span style="color:${theme.background};font-weight:bold;font-size:1.2em;">${letter}</span></div>`;
                    }
                };
                avatarHtml = createAvatarDiv(avatarSrc, isUser);
            }

            let logEntry = '';
            logEntry += '<div class="chat-message-container" style="display:flex;align-items:flex-start;margin-bottom:28px;' + (isUser ? 'flex-direction:row-reverse;' : '') + '">';
            logEntry += avatarHtml;
            logEntry += '<div style="flex:1;">';
            const namePadding = showAvatar ? '4px;' : '0;';
            logEntry += '<strong style="color:' + theme.nameColor + ';font-weight:600;font-size:0.95em;display:block;margin-bottom:8px;padding-left:' + (isUser ? '0;' : namePadding) + 'padding-right:' + (isUser ? namePadding : '0;') + 'text-align:' + (isUser ? 'right;' : 'left;') + '">' + name + '</strong>';
            const bubbleStyle = useBubbleDesign 
    ? 'background-color:' + cardBgColor + ';border-radius:16px;padding:14px 18px;box-shadow:' + theme.shadow + ';border:1px solid ' + theme.border + ';'
    : 'padding:4px 0;';

logEntry += '<div style="color:' + theme.text + ';line-height:1.8;word-wrap:break-word;position:relative;' + bubbleStyle + (isUser ? 'margin-left:auto;' : '') + '">' + messageHtml + '</div>';;
            logEntry += '</div></div>';
            
            log += logEntry;
        }

        // [수정] 이제 이 함수는 순수한 로그 HTML 덩어리만 반환합니다.
        // 전체 로그를 배경과 둥근 모서리가 있는 컨테이너로 감싸기
        const containerStyle = `
            background-color: ${theme.background};
            border-radius: 16px;
            padding: 24px;
            box-shadow: ${theme.shadow};
            border: 1px solid ${theme.border};
            margin: 16px auto;
            max-width: 900px;
        `;
        
        console.log(`[Log Exporter] generateBasicFormatLog: '기본' 형식 로그 생성 완료.`);
        return `<div style="${containerStyle}">${log}</div>`;
    }

    /**
     * 메시지 노드 배열로부터 마크다운 또는 일반 텍스트 형식의 로그를 생성합니다.
     * @async
     * @param {HTMLElement[]} nodes - 변환할 메시지 노드 배열.
     * @param {string} format - 출력 형식 ('markdown' 또는 'text').
     * @returns {Promise<string>} 생성된 로그 문자열.
     */
    async function generateFormattedLog(nodes, format) {
        console.log(`[Log Exporter] generateFormattedLog: 형식화된 로그 생성 시작. 형식: ${format}`);
        let log = '';

        for (const node of nodes) {
            if (node.querySelector('textarea')) {
                continue;
            }

            let name = '';
            const nameEl = node.querySelector('.unmargin.text-xl');
            if (nameEl) {
                name = nameEl.textContent.trim();
            }

            let message = '';
            const messageEl = node.querySelector('.prose, .chattext');

            if (messageEl) {
                const tempEl = messageEl.cloneNode(true);
                tempEl.querySelectorAll('.log-exporter-msg-btn-group').forEach(el => el.remove());
                message = tempEl.textContent.trim().replace(/\n\s*\n/g, '\n\n');
            }

            if (!message) continue;

            if (!name) {
                name = node.classList.contains('justify-end') ? 'User' : 'Assistant';
            }

            if (format === 'markdown') {
                log += `**${name}:** ${message}\n\n---\n\n`;
            } else {
                log += `[${name}]\n${message}\n\n${'─'.repeat(40)}\n\n`;
            }
        }

        return log.trim();
    }

    /**
     * 제공된 콘텐츠를 클립보드에 복사합니다.
     * Clipboard API를 우선적으로 사용하고, 실패 시 execCommand로 폴백합니다.
     * @async
     * @param {string} content - 복사할 콘텐츠.
     * @param {string} [format='text'] - 콘텐츠의 형식 ('text' 또는 'html').
     * @returns {Promise<boolean>} 복사 성공 여부.
     */
    async function copyToClipboard(content, format = 'text') {
        console.log(`[Log Exporter] copyToClipboard: 클립보드에 복사 시도. 형식: ${format}`);
        if (navigator.clipboard && window.isSecureContext) {
            try {
                if (format === 'html') {
                    const htmlBlob = new Blob([content], { type: 'text/html' });
                    const textBlob = new Blob([content.replace(/<[^>]*>/g, '')], { type: 'text/plain' });

                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'text/html': htmlBlob,
                            'text/plain': textBlob
                        })
                    ]);
                } else {
                    await navigator.clipboard.writeText(content);
                }
                return true;
            } catch (err) {
                console.warn('Clipboard API failed, falling back.', err);
                return copyUsingExecCommand(content, format);
            }
        }
        return copyUsingExecCommand(content, format);
    }

    /**
     * execCommand를 사용하여 클립보드에 복사하는 폴백 함수입니다.
     * @param {string} content - 복사할 콘텐츠.
     * @param {string} format - 콘텐츠의 형식 ('text' 또는 'html').
     * @returns {boolean} 복사 성공 여부.
     */
    function copyUsingExecCommand(content, format) {
        console.log('[Log Exporter] copyUsingExecCommand: execCommand를 사용한 폴백 복사 시도');
        const textArea = document.createElement("textarea");
        textArea.value = format === 'html' ? content : content;
        textArea.style.cssText = 'position: fixed; top: -9999px; left: -9999px;';
        document.body.appendChild(textArea);
        textArea.select();

        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) {
            console.error('execCommand failed', err);
        }

        document.body.removeChild(textArea);
        return success;
    }

        /**
     * 미리보기 컨테이너를 이미지 파일로 저장합니다.
     * 단일 파일 저장 시에도 분할 저장 시에 안정적으로 동작했던 toCanvas()를 먼저 호출하는 방식으로 통일하여
     * 라이브러리의 내부적인 toDataURL() 오류를 근본적으로 회피합니다.
     * @async
     * @param {HTMLElement} previewContainer - 캡처할 미리보기 컨테이너 요소.
     * @param {Function} onProgress - 진행 상황을 보고하는 콜백 함수.
     * @param {{cancelled: boolean}} cancellationToken - 작업 취소를 위한 토큰 객체.
     * @param {string} charName - 캐릭터 이름 (파일 이름에 사용).
     * @param {string} chatName - 채팅 이름 (파일 이름에 사용).
     * @param {boolean} [useHighRes=false] - 고해상도로 캡처할지 여부.
     * @param {number} [baseFontSize=16] - 캡처 시 사용할 기본 폰트 크기.
     * @param {number} [imageWidth=900] - 캡처할 이미지의 너비.
     * @returns {Promise<boolean>} 저장 성공 여부.
     */
    async function savePreviewAsImage(previewContainer, onProgress, cancellationToken, charName, chatName, useHighRes = false, baseFontSize = 16, imageWidth = 900) {
        console.log(`[Log Exporter] savePreviewAsImage: 미리보기를 이미지로 저장 시작. 고해상도: ${useHighRes}, 폰트: ${baseFontSize}px, 너비: ${imageWidth}px`);
        const MAX_SAFE_CANVAS_HEIGHT = 65000;

        let captureTarget = previewContainer.firstElementChild; // let으로 변경
        if (!captureTarget) return false;

        const rootHtml = document.documentElement;
        const originalStyles = {
            preview: { width: previewContainer.style.width, height: previewContainer.style.height, maxHeight: previewContainer.style.maxHeight, overflowY: previewContainer.style.overflowY, padding: previewContainer.style.padding, border: previewContainer.style.border },
            target: { transform: captureTarget.style.transform, width: captureTarget.style.width },
            rootHtml: { fontSize: rootHtml.style.fontSize }
        };

        const domReplacements = [];
        const originalCaptureTarget = captureTarget; // 원본 컨테이너 참조 저장

        try {
            await ensureHtmlToImage();
            const htmlToImage = window.__htmlToImageLib || window.htmlToImage;

            // --- 비디오 프레임 캡처 로직 (동일) ---
            onProgress('비디오 프레임 캡처 중...', 5, 100);
            const videoElements = Array.from(previewContainer.querySelectorAll('video'));
            // ... (기존 비디오 캡처 코드와 동일하게 유지) ...
            const frameCapturePromises = videoElements.map(videoEl => {
                return new Promise(async (resolve) => {
                    const videoSrc = videoEl.querySelector('source')?.src || videoEl.src;
                    if (!videoSrc) return resolve();
                    let objectURL = '';
                    try {
                        const response = await fetch(videoSrc);
                        if (!response.ok) throw new Error('Failed to fetch');
                        const videoBlob = await response.blob();
                        objectURL = URL.createObjectURL(videoBlob);
                        const tempVideo = document.createElement('video');
                        tempVideo.muted = true;
                        tempVideo.src = objectURL;
                        tempVideo.addEventListener('seeked', () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = tempVideo.videoWidth;
                            canvas.height = tempVideo.videoHeight;
                            canvas.getContext('2d').drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                            const imgDoppelganger = new Image();
                            imgDoppelganger.src = canvas.toDataURL();
                            imgDoppelganger.className = videoEl.className;
                            imgDoppelganger.style.cssText = videoEl.style.cssText;
                            imgDoppelganger.style.width = '100%';
                            imgDoppelganger.style.height = 'auto';
                            domReplacements.push({ original: videoEl, parent: videoEl.parentNode, replacement: imgDoppelganger, objectURL: objectURL });
                            resolve();
                        });
                        tempVideo.addEventListener('loadeddata', () => { tempVideo.currentTime = 0; });
                        tempVideo.addEventListener('error', () => resolve());
                    } catch (e) { resolve(); }
                });
            });
            await Promise.all(frameCapturePromises);
            domReplacements.forEach(({ parent, original, replacement }) => {
                if (parent && parent.contains(original)) parent.replaceChild(replacement, original);
            });
            await new Promise(resolve => setTimeout(resolve, 100));


            // --- 캡처 준비 (동일) ---
            onProgress('렌더링 준비 중...', 10, 100);
            // [수정] 폰트 로딩이 완료될 때까지 기다립니다.
            await document.fonts.ready;

            const pixelRatio = useHighRes ? (window.devicePixelRatio || 2) : 1;
            rootHtml.style.fontSize = `${baseFontSize}px`;
            captureTarget.style.width = `${imageWidth}px`;
            Object.assign(previewContainer.style, { height: 'auto', maxHeight: 'none', overflowY: 'visible', border: 'none', padding: '0', width: `${imageWidth}px` });
            
            // [수정] 브라우저가 레이아웃을 안정적으로 계산하도록 여러 프레임과 약간의 지연을 줍니다.
            await new Promise(resolve => requestAnimationFrame(resolve));
            await new Promise(resolve => setTimeout(resolve, 100)); // 추가 지연

            const totalHeight = captureTarget.scrollHeight;
            const totalWidth = captureTarget.scrollWidth;
            const MAX_CHUNK_HEIGHT = Math.floor(MAX_SAFE_CANVAS_HEIGHT / pixelRatio) - 100;
            const commonOptions = { quality: 1.0, pixelRatio, backgroundColor: captureTarget.style.backgroundColor || '#1a1b26' };

            if (totalHeight <= MAX_CHUNK_HEIGHT) {
                // --- 단일 이미지 저장 (동일) ---
                onProgress('이미지 생성 중...', 50, 100);
                if (cancellationToken.cancelled) throw new Error("Cancelled");
                // [수정] 높이를 명시적으로 설정하여 라이브러리가 올바르게 인식하도록 합니다.
                previewContainer.style.height = `${totalHeight}px`; 
                captureTarget.style.height = `${totalHeight}px`;
                await new Promise(resolve => requestAnimationFrame(resolve));
                const canvas = await htmlToImage.toCanvas(previewContainer, { ...commonOptions, width: totalWidth, height: totalHeight });
                downloadImage(canvas.toDataURL('image/png', 1.0), charName, chatName);
            } else {
                // --- [핵심] 분할 저장 로직 (컨테이너 교체 방식) ---
                const messageContainers = Array.from(originalCaptureTarget.querySelectorAll('.chat-message-container'));
                const confirmMsg = confirm(`[알림] 로그가 너무 길어 단일 이미지로 만들 수 없습니다.\n\n메시지 그룹별로 여러 개의 이미지 파일로 나누어 저장합니다.\n\n계속하시겠습니까?`);
                if (!confirmMsg) return false;

                // 그룹 분할 로직 (동일)
                const groups = [];
                let currentGroup = [], accumulatedHeight = 0;
                for (const msg of messageContainers) {
                    const msgHeight = msg.offsetHeight + parseInt(window.getComputedStyle(msg).marginBottom);
                    if (currentGroup.length > 0 && accumulatedHeight + msgHeight > MAX_CHUNK_HEIGHT) {
                        groups.push([...currentGroup]);
                        currentGroup = [msg];
                        accumulatedHeight = msgHeight;
                    } else {
                        currentGroup.push(msg);
                        accumulatedHeight += msgHeight;
                    }
                }
                if (currentGroup.length > 0) groups.push(currentGroup);

                // 각 그룹을 새로운 컨테이너에서 렌더링 및 캡처
                for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
                    if (cancellationToken.cancelled) throw new Error("Cancelled");
                    const groupMessages = groups[groupIdx];
                    onProgress(`그룹 ${groupIdx + 1}/${groups.length} 렌더링 중...`, groupIdx, groups.length);

                    // 1. 현재 그룹을 위한 새로운 '무대(컨테이너)' 생성
                    const groupContainer = originalCaptureTarget.cloneNode(false); // 껍데기만 복사

                    // 2. 새 무대에 현재 그룹의 메시지만 (복제하여) 추가
                    groupMessages.forEach(msg => {
                        groupContainer.appendChild(msg.cloneNode(true));
                    });
                    
                    // 3. 기존 무대를 새로운 무대로 DOM에서 교체
                    previewContainer.replaceChild(groupContainer, captureTarget);
                    captureTarget = groupContainer; // 현재 캡처 대상을 새 무대로 업데이트

                    // 4. 브라우저가 새 무대를 렌더링하도록 강제 동기화
                    await new Promise(resolve => setTimeout(resolve, 50)); // 렌더링을 위한 짧은 지연
                    await new Promise(resolve => requestAnimationFrame(resolve));
                    const _ = captureTarget.scrollHeight; // reflow 강제
                    await new Promise(resolve => requestAnimationFrame(resolve));

                    // 5. 캡처 및 저장
                    const visibleHeight = captureTarget.scrollHeight;
                    // [수정] 분할 캡처 시에도 컨테이너와 타겟의 높이를 명시적으로 설정합니다.
                    previewContainer.style.height = `${visibleHeight}px`;
                    const groupOptions = { ...commonOptions, width: totalWidth, height: visibleHeight }; 
                    const canvas = await htmlToImage.toCanvas(previewContainer, groupOptions);
                    onProgress(`그룹 ${groupIdx + 1}/${groups.length} 저장 중...`, groupIdx + 1, groups.length);
                    downloadImage(canvas.toDataURL('image/png', 1.0), charName, chatName, { partNumber: groupIdx + 1, showCompletionAlert: false });
                    await new Promise(r => setTimeout(r, 200));
                }

                if (!cancellationToken.cancelled) {
                    alert(`${groups.length}개의 이미지로 분할하여 저장되었습니다.`, 'success');
                }
            }
            return true;

        } catch (e) {
            if (e.message !== "Cancelled") {
                console.error('[Log Exporter] Image save error:', e);
                alert('이미지 저장 중 알 수 없는 오류가 발생했습니다. 개발자 콘솔(F12)을 확인해주세요.', 'error');
            }
            return false;
        } finally {
            // --- 최종 정리 ---
            // 루프가 끝난 후, 현재의 captureTarget(마지막 그룹)을 원래의 전체 로그 컨테이너로 복원
            if (previewContainer.contains(captureTarget) && captureTarget !== originalCaptureTarget) {
                 previewContainer.replaceChild(originalCaptureTarget, captureTarget);
            }
            // 비디오 프레임 캡처용 이미지 DOM 정리
            domReplacements.forEach(({ original, parent, replacement, objectURL }) => {
                if (parent && parent.contains(replacement)) parent.replaceChild(original, replacement);
                if (objectURL) URL.revokeObjectURL(objectURL);
            });
            // 원본 스타일 복원
            Object.assign(previewContainer.style, originalStyles.preview);
            Object.assign(originalCaptureTarget.style, originalStyles.target); // 원본 컨테이너에 스타일 복원
            originalCaptureTarget.style.height = ''; // 추가된 높이 스타일 초기화
            rootHtml.style.fontSize = originalStyles.rootHtml.fontSize;
        }
    } 
    /**
     * 데이터 URL을 받아 이미지 파일로 다운로드합니다.
     * @param {string} dataUrl - 다운로드할 이미지의 데이터 URL.
     * @param {string} charName - 캐릭터 이름 (파일 이름에 사용).
     * @param {string} chatName - 채팅 이름 (파일 이름에 사용).
     * @param {object} [options={}] - 추가 옵션.
     * @param {number|null} [options.partNumber=null] - 분할된 파일의 파트 번호.
     * @param {boolean} [options.showCompletionAlert=true] - 완료 알림 표시 여부.
     */
    function downloadImage(dataUrl, charName, chatName, options = {}) {
        console.log(`[Log Exporter] downloadImage: 이미지 다운로드. 파트: ${options.partNumber || 'N/A'}`);
        const { partNumber = null, showCompletionAlert = true } = options;

        const safeCharName = charName.replace(/[\/\\?%*:|"<>]/g, '-');
        const safeChatName = chatName.replace(/[\/\\?%*:|"<>]/g, '-');
        const baseFilename = `Risu_Log_${safeCharName}_${safeChatName}`;
        const finalFilename = partNumber ? `${baseFilename}_part_${partNumber}.png` : `${baseFilename}.png`;

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (showCompletionAlert) {
            alert('채팅 로그가 이미지 파일로 저장되었습니다.', 'success');
        }
    }

    /**
     * 문서에 로드된 웹 폰트의 @font-face 규칙을 수집하고, 폰트 파일을 Base64로 인코딩하여 CSS 문자열로 반환합니다.
     * 이는 외부 폰트가 이미지 캡처에 포함되도록 보장합니다.
     * @async
     * @returns {Promise<string>} 임베드된 폰트 규칙을 포함하는 CSS 문자열.
     */
    async function getFontEmbedCss() {
        console.log('[Log Exporter] getFontEmbedCss: 폰트 임베딩 CSS 생성 시작');
        const fontFaces = [];
        const fontURLs = new Set();

        const processCssRules = async (rules) => {
            for (const rule of rules) {
                if (rule.type === CSSRule.FONT_FACE_RULE) {
                    const srcMatch = rule.cssText.match(/url\("(.+?)"\)/);
                    if (srcMatch && srcMatch[1]) {
                        const url = srcMatch[1];
                        if (!fontURLs.has(url)) {
                            fontURLs.add(url);
                            try {
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const base64 = await new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                                const newCssText = rule.cssText.replace(url, base64);
                                fontFaces.push(newCssText);
                            } catch (e) {
                                console.warn(`[Log Exporter] Could not fetch font: ${url}`, e);
                                fontFaces.push(rule.cssText);
                            }
                        }
                    } else {
                        fontFaces.push(rule.cssText);
                    }
                }
            }
        };

        for (const sheet of document.styleSheets) {
            try {
                if (sheet.cssRules) {
                    await processCssRules(sheet.cssRules);
                }
            } catch (e) {
                console.warn(`[Log Exporter] Could not read font rules from stylesheet: ${sheet.href}`, e);
            }
        }
        console.log(`[Log Exporter] getFontEmbedCss: ${fontFaces.length}개의 폰트 규칙 처리 완료`);
        return fontFaces.join('\n');
    }

    /**
     * 메시지 노드에서 RisuAI 관련 UI 클래스들을 수집하고 계층 구조로 정리합니다.
     * 이는 사용자가 필터링할 UI 요소를 선택하는 데 사용됩니다.
     * @param {HTMLElement[]} nodes - 클래스를 수집할 메시지 노드 배열.
     * @returns {{name: string, displayName: string, hasImage: boolean}[]} UI 클래스 정보 객체의 배열.
     */
    function collectUIClasses(nodes) {
        console.log('[Log Exporter] collectUIClasses: RisuAI UI 클래스 수집 시작');
        const CONTENT_CLASSES_TO_PRESERVE = [
            'x-risu-regex-quote-block',
            'x-risu-regex-thought-block',
            'x-risu-regex-sound-block'
        ];

        const classDetails = new Map();
        const classHierarchy = new Map();

        nodes.forEach(node => {
            node.querySelectorAll('*[class*="x-risu-"]').forEach(el => {
                const currentClasses = Array.from(el.classList)
                    .filter(c => c.startsWith('x-risu-') && !CONTENT_CLASSES_TO_PRESERVE.includes(c));

                if (currentClasses.length === 0) return;

                const containsImage = el.querySelector('img') !== null;

                let parentEl = el.parentElement;
                let parentRisuClass = null;
                while (parentEl && parentEl !== node) {
                    const parentClasses = Array.from(parentEl.classList)
                        .filter(c => c.startsWith('x-risu-') && !CONTENT_CLASSES_TO_PRESERVE.includes(c));
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
                    const details = classDetails.get(className);
                    if (containsImage) {
                        details.hasImage = true;
                    }
                    if (parentRisuClass && !details.parent) {
                        details.parent = parentRisuClass;
                    }
                });
            });
        });

        const imageRelatedClasses = ['x-risu-asset-table', 'x-risu-image-cell', 'x-risu-in-table'];

        const topLevelClasses = [];
        for (const [className, details] of classDetails.entries()) {
            if (imageRelatedClasses.includes(className)) continue;

            if (details.parent && classDetails.has(details.parent)) {
                if (!classHierarchy.has(details.parent)) {
                    classHierarchy.set(details.parent, []);
                }
                classHierarchy.get(details.parent).push(className);
            } else {
                topLevelClasses.push(className);
            }
        }

        const result = [];
        const buildDisplayList = (classNames, depth) => {
            classNames.sort().forEach(className => {
                const details = classDetails.get(className);
                if (!details) return;

                let displayName = ' '.repeat(depth * 2) + (depth > 0 ? '└ ' : '') + className;
                if (details.hasImage) {
                    displayName += ' (이미지 포함)';
                }

                result.push({
                    name: className,
                    displayName: displayName,
                    hasImage: details.hasImage,
                });

                if (classHierarchy.has(className)) {
                    buildDisplayList(classHierarchy.get(className), depth + 1);
                }
            });
        };

        buildDisplayList(topLevelClasses, 0);

        console.log(`[Log Exporter] collectUIClasses: ${result.length}개의 UI 클래스 발견`);
        return result;
    }

    /**
     * 노드를 복제하고 선택된 CSS 클래스를 가진 요소들을 제거하여 필터링합니다.
     * @param {HTMLElement} node - 필터링할 원본 노드.
     * @param {string[]} selectedClasses - 제거할 요소의 CSS 클래스 이름 배열.
     * @returns {HTMLElement} 필터링된 복제 노드.
     */
    function filterWithCustomClasses(node, selectedClasses) {
        const tempEl = node.cloneNode(true);

        if (selectedClasses.length > 0) {
            selectedClasses.forEach(className => {
                tempEl.querySelectorAll(`.${className}`).forEach(el => {
                    el.remove();
                });
            });
        }

        return tempEl;
    }

    // --- 아카라이브 연동 기능 추가 ---
    /**
     * 아카라이브용 HTML 템플릿을 생성합니다.
     * <img> 태그를 고유한 자리표시자 주석으로 교체합니다.
     */
    async function generateArcaLiveTemplate(nodes, themeKey = 'dark', showAvatar = true, useBubbleDesign = true) {
        console.log('[Log Exporter] generateArcaLiveTemplate: 아카라이브용 템플릿 생성 시작');
        let imageCounter = 0;

        const baseHtml = await generateBasicFormatLog(nodes, themeKey, false, showAvatar, useBubbleDesign);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = baseHtml;

        // 모든 이미지 요소(<img> 및 배경 이미지)를 문서 순서대로 찾아 자리표시자로 교체합니다.
        // 이렇게 하면 이미지와 자리표시자의 순서가 정확히 일치하게 됩니다.
        tempDiv.querySelectorAll('img, [style*="url("]').forEach(el => {
            // el.parentNode 체크는 중첩된 구조에서 안전성을 더해주지만, 현재 구조에서는 필수는 아닙니다.
            if (el.parentNode) {
                 imageCounter++;
                // [수정] 아바타 여부를 확인하고, 그에 맞는 자리표시자 생성
                const isAvatar = el.hasAttribute(AVATAR_ATTR);
                const isUser = isAvatar && el.parentElement.style.flexDirection === 'row-reverse';
                const placeholderType = isAvatar ? `ARCA_AVATAR_PLACEHOLDER_${isUser}` : 'ARCA_IMG_PLACEHOLDER';
                const placeholder = document.createComment(` ${placeholderType}_${imageCounter} `);
                 el.replaceWith(placeholder);
            }
        });

        console.log(`[Log Exporter] generateArcaLiveTemplate: 템플릿 생성 완료. 이미지 개수: ${imageCounter}`);
        return tempDiv.innerHTML;
    }

    /**
     * 로그 내보내기 옵션을 설정하고 미리보기를 제공하는 메인 모달을 표시합니다.
     * @async
     * @param {number} chatIndex - 내보낼 채팅의 인덱스.
     * @param {object} [options={}] - 추가 옵션.
     * @param {number} [options.startIndex] - 로그를 시작할 메시지의 인덱스.
     * @param {boolean} [options.singleMessage] - 단일 메시지만 내보낼지 여부.
     */
    async function showCopyPreviewModal(chatIndex, options = {}) {
        console.log(`[Log Exporter] showCopyPreviewModal: 미리보기 모달 표시 시작. 채팅 인덱스: ${chatIndex}, 옵션:`, options);
        try {
            let { charName, chatName, charAvatarUrl, messageNodes } = await processChatLog(chatIndex);

            const { startIndex, singleMessage } = options;
            if (typeof startIndex === 'number') {
                if (singleMessage) {
                    messageNodes = [messageNodes[startIndex]];
                    chatName += ` (메시지 #${startIndex + 1})`;
                } else {
                    messageNodes = messageNodes.slice(startIndex);
                    chatName += ` (메시지 #${startIndex + 1}부터)`;
                }
            }

            const participants = new Set();
            const getNameFromNode = (node) => {
                const nameEl = node.querySelector('.unmargin.text-xl');
                if (nameEl) return nameEl.textContent.trim();
                if (node.classList.contains('justify-end')) return '사용자';
                return charName;
            };

            messageNodes.forEach(node => {
                const name = getNameFromNode(node);
                if (name) participants.add(name);
            });

            let participantCheckboxesHtml = '';
            participants.forEach(name => {
                const safeName = name.replace(/"/g, '&quot;');
                participantCheckboxesHtml += `
                <label style="margin-right: 15px;">
                    <input type="checkbox" class="participant-filter-checkbox" data-name="${safeName}" checked> ${name}
                </label>
            `;
            });

            const uiClasses = collectUIClasses(messageNodes);

            let customFilterHtml = '';
            if (uiClasses.length > 0) {
                customFilterHtml = `
                <div id="custom-filter-section" style="display: none; border: 1px solid #414868; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>RisuAI UI 요소 필터 (체크된 항목이 제거됩니다):</strong>
                        <div>
                            <button id="select-all-filters" class="log-exporter-modal-btn" style="padding: 2px 6px; font-size: 0.8em;">전체 선택</button>
                            <button id="deselect-all-filters" class="log-exporter-modal-btn" style="padding: 2px 6px; font-size: 0.8em;">전체 해제</button>
                        </div>
                    </div>
                    <div style="max-height: 150px; overflow-y: auto; border: 1px solid #2a2f41; padding: 8px; margin-top: 5px; background: #1a1b26;">
                        ${uiClasses.map(classInfo => `
                            <label style="display: block; margin-bottom: 4px; cursor: pointer;">
                                <input type="checkbox" class="custom-filter-class" data-class="${classInfo.name}" 
                                    ${!classInfo.hasImage ? 'checked' : ''}>
                                <span style="font-size: 0.85em; margin-left: 5px; font-family: monospace;">${classInfo.displayName}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>`;
            }

            const modal = document.createElement('div');
            modal.className = 'log-exporter-modal-backdrop';
            modal.innerHTML = `
            <div class="log-exporter-modal">
                <div class="log-exporter-modal-header">로그 내보내기 옵션</div>
                <div class="log-exporter-modal-content">
                    <div class="log-exporter-left-panel">
                        <div class="log-exporter-modal-options">
                            <strong>형식:</strong>
                            <label><input type="radio" name="log-format" value="html"> HTML</label>
                            <label><input type="radio" name="log-format" value="basic" checked> 기본</label>
                            <label><input type="radio" name="log-format" value="markdown"> 마크다운</label>
                            <label><input type="radio" name="log-format" value="text"> 일반 텍스트</label>
                            <div id="theme-selector-container" style="display: none; margin-left: auto; align-items: center; gap: 10px;">
                                <label for="theme-selector" style="font-size: 0.9em;">테마:</label>
                                <select id="theme-selector">
                                    ${Object.entries(THEMES).map(([key, theme]) =>
                    `<option value="${key}" ${key === 'dark' ? 'selected' : ''}>${theme.name}</option>`
                ).join('')}
                                </select>
                            </div>
                            <div id="image-scale-controls" style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
                                <label for="image-scale-slider" title="미리보기의 모든 이미지 크기를 조절합니다." style="font-size:0.9em;">이미지 크기:</label>
                                <input type="range" id="image-scale-slider" min="10" max="100" value="100" step="5" style="width: 80px;">
                                <span id="image-scale-value" style="font-size: 0.9em; width: 35px; text-align: right;">100%</span>
                            </div>
                            <div id="html-style-controls" style="display:inline-flex; align-items:center;">
                                <label><input type="checkbox" id="style-toggle-checkbox"> 스타일 인라인 적용</label>
                            </div>
                            <div id="filter-controls">
                                <label><input type="checkbox" id="filter-toggle-checkbox" checked> UI 필터링 적용</label>
                                ${uiClasses.length > 0 ? `
                                    <button id="custom-filter-toggle" class="log-exporter-modal-btn" style="margin-left: 10px; padding: 3px 8px; font-size: 0.85em;">
                                        커스텀 필터 설정 ▼
                                    </button>
                                ` : ''}
                            </div>
                            <div id="avatar-toggle-controls" style="display: none; align-items: center; gap: 8px; margin-left: 10px;">
                                <label style="font-size:0.9em;">
                                    <input type="checkbox" id="avatar-toggle-checkbox"> 아바타 표시
                                </label>
                                <label style="font-size:0.9em; margin-left: 10px;">
            <input type="checkbox" id="bubble-toggle-checkbox" checked> 말풍선 디자인 사용
        </label>
                            </div>
                        </div>
                        ${customFilterHtml}
                        <div style="background: #1f2335; padding: 10px; border-radius: 5px;">
                            <strong>참가자 필터:</strong>
                            <div id="participant-filter-container" style="display: flex; flex-wrap: wrap; margin-top: 8px;">
                                ${participantCheckboxesHtml}
                            </div>
                        </div>
                        <div class="arca-helper-section" id="arca-helper-section">
                            <h4>아카라이브 HTML 변환기</h4>
                            <ol style="font-size: 0.9em; padding-left: 20px; margin: 0 0 8px 0; line-height: 1.6;">
                                <li><b>이미지 준비:</b> 아래 <b>'1. 이미지 ZIP 다운로드'</b> 버튼을 눌러 로그에 포함된 이미지들을 모두 다운로드하세요. (이미지 이름이 순서대로 저장됩니다)</li>
                                <li><b>이미지 업로드:</b> 아카라이브 글쓰기 에디터를 <b>'HTML 모드'</b>로 변경하고, 다운로드한 이미지들을 모두 업로드하세요.</li>
                                <li><b>소스 붙여넣기:</b> 이미지 업로드 후, 에디터의 <b>HTML 소스 전체</b>를 복사하여 아래 <b>'3. 아카라이브 소스'</b> 칸에 붙여넣으세요.</li>
                                <li><b>변환 및 완료:</b> <b>'변환'</b> 버튼을 누르세요. 생성된 <b>'4. 최종 결과물'</b>을 복사하여 아카라이브 에디터에 붙여넣으면 완료됩니다.</li>
                            </ol>
                            <button class="log-exporter-modal-btn image-save" id="arca-download-zip-btn" style="align-self: flex-start;">1. 이미지 ZIP 다운로드</button>
                            <label><b>2. 템플릿 HTML (자동 생성됨)</b></label>
                            <textarea id="arca-template-html" readonly></textarea>
                            <label><b>3. 아카라이브 소스 (이미지 업로드 후 에디터에서 복사)</b></label>
                            <textarea id="arca-source-html" placeholder="아카라이브 HTML 에디터의 전체 내용을 여기에 붙여넣으세요."></textarea>
                            <button class="log-exporter-modal-btn primary" id="arca-convert-btn">변환</button>
                            <label><b>4. 최종 결과물 (복사하여 사용)</b></label>
                            <textarea id="arca-final-html" readonly></textarea>
                        </div>
                    </div>
                    <div class="log-exporter-right-panel">
                        <strong>미리보기:</strong>
                        <div class="log-exporter-modal-preview"><div style="text-align:center;color:#8a98c9;">로그 데이터 생성 중...</div></div>
                    </div>
                </div>
                <div class="log-exporter-modal-footer" id="log-exporter-footer">
                    <button class="log-exporter-modal-btn" id="log-exporter-close">닫기</button>
                    <button class="log-exporter-modal-btn" id="log-exporter-raw-toggle" style="display: none;">HTML Raw 보기</button>
                    <button class="log-exporter-modal-btn" id="log-exporter-save-file">HTML 파일로 저장</button>
                    <button class="log-exporter-modal-btn" id="arca-helper-toggle-btn" style="background-color: #bb9af7; color: #1a1b26; display: none;">아카라이브 변환기</button>
                    
                    <!-- [복원] 이미지 저장 옵션 UI -->
                    <div id="image-export-controls" style="display: flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap; font-size: 0.9em;">
                        <label><input type="checkbox" id="image-high-res-checkbox" checked>고해상도</label>
                        <label>폰트:<input type="number" id="image-font-size-input" value="26" min="12" max="40" style="width: 45px; margin-left: 4px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 4px; text-align: center;"></label>
                        <label>너비:<input type="number" id="image-width-input" value="700" min="600" max="1200" step="50" style="width: 60px; margin-left: 4px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 4px; text-align: center;"></label>
                        <button class="log-exporter-modal-btn image-save" id="log-exporter-save-image">이미지로 저장</button>    
                    </div>
                    
                    <button class="log-exporter-modal-btn" id="log-exporter-download-zip" style="background-color: #e0af68; color: #1a1b26;">이미지 ZIP 다운로드</button>
                    <button class="log-exporter-modal-btn primary" id="log-exporter-copy">텍스트(서식 포함) 복사</button>
                </div>
                <div class="log-exporter-modal-footer" id="log-exporter-progress-footer" style="display: none; flex-direction: column; align-items: stretch; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
                        <span id="progress-status-text">이미지 처리 중...</span>
                        <span id="progress-percentage-text">0%</span>
                    </div>
                    <progress id="export-progress-bar" value="0" max="100" style="width: 100%; height: 10px;"></progress>
                    <button class="log-exporter-modal-btn" id="log-exporter-cancel-image" style="background-color: #f7768e; color: #1a1b26;">취소</button>
                </div>
            </div>`;
            document.body.appendChild(modal);
          
            // [추가] 아바타 토글 컨트롤 변수 정의 (ReferenceError 방지)
            const avatarToggleControls = modal.querySelector('#avatar-toggle-controls');
            const avatarToggleCheckbox = modal.querySelector('#avatar-toggle-checkbox');

            const previewEl = modal.querySelector('.log-exporter-modal-preview');
            const imageScaleControls = modal.querySelector('#image-scale-controls');
            const imageScaleSlider = modal.querySelector('#image-scale-slider');
            const imageScaleValue = modal.querySelector('#image-scale-value');
            const saveFileBtn = modal.querySelector('#log-exporter-save-file');
            const saveImageControls = modal.querySelector('#image-export-controls');
            const htmlStyleControls = modal.querySelector('#html-style-controls');
            const styleToggleCheckbox = modal.querySelector('#style-toggle-checkbox');
            const filterControls = modal.querySelector('#filter-controls');
            const filterToggleCheckbox = modal.querySelector('#filter-toggle-checkbox');
            const themeSelector = modal.querySelector('#theme-selector');
            const themeSelectorContainer = modal.querySelector('#theme-selector-container');

            const arcaHelperSection = modal.querySelector('#arca-helper-section');
            const arcaHelperToggleBtn = modal.querySelector('#arca-helper-toggle-btn');
            const arcaDownloadZipBtn = modal.querySelector('#arca-download-zip-btn');
            const arcaTemplateHtml = modal.querySelector('#arca-template-html');
            const arcaSourceHtml = modal.querySelector('#arca-source-html');
            const arcaConvertBtn = modal.querySelector('#arca-convert-btn');
            const arcaFinalHtml = modal.querySelector('#arca-final-html');

            /**
             * 미리보기 내의 이미지 크기를 슬라이더 값에 따라 조절합니다.
             */
            const applyImageScaling = () => {
                const scale = imageScaleSlider.value;
                imageScaleValue.textContent = `${scale}%`;
                previewEl.querySelectorAll('img').forEach(img => {
                    img.style.maxWidth = `${scale}%`;
                    img.style.height = 'auto';
                });
            };
            imageScaleSlider.addEventListener('input', applyImageScaling);

            /**
             * 참가자 필터 체크박스 상태에 따라 표시할 메시지 노드 배열을 반환합니다.
             * @returns {HTMLElement[]} 필터링된 메시지 노드 배열.
             */
            const getFilteredNodes = () => {
                const hiddenNames = Array.from(modal.querySelectorAll('.participant-filter-checkbox:not(:checked)'))
                    .map(cb => cb.dataset.name);
                if (hiddenNames.length === 0) return messageNodes;
                return messageNodes.filter(node => {
                    const name = getNameFromNode(node);
                    return !hiddenNames.includes(name);
                });
            };

            const [charAvatarBase64, extractedCss] = await Promise.all([
                imageUrlToBase64(charAvatarUrl),
                extractCssForNodes(messageNodes)
            ]);

            /**
             * 주어진 콘텐츠를 감싸는 전체 HTML 구조를 생성합니다. (헤더 포함)
             * @param {string} content - 삽입할 메인 HTML 콘텐츠.
             * @param {string} [theme='dark'] - 사용할 테마.
             * @returns {string} 완전한 HTML 래퍼 문자열.
             */
            const buildFullHtml = (content, theme = 'dark', applyStyles = true) => {
                const selectedTheme = THEMES[theme] || THEMES.dark;
                
                // 참가자 이름 색상을 강제로 적용하기 위해 content를 수정
                let modifiedContent = content;
                
                // 참가자 이름 요소들을 찾아서 색상을 강제 적용
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                
                // 모든 참가자 이름 요소에 색상 스타일 강제 적용
                tempDiv.querySelectorAll('.unmargin.text-xl').forEach(nameEl => {
                    const parentNode = nameEl.closest('.chat-message-container');
                    const isUser = parentNode && parentNode.classList.contains('justify-end');
                    const nameColor = selectedTheme.nameColor;
                    
                    nameEl.style.color = nameColor + ' !important';
                    nameEl.style.fontWeight = '600';
                    nameEl.style.fontSize = '0.95em';
                    nameEl.style.display = 'block';
                    nameEl.style.marginBottom = '8px';
                    nameEl.style.textAlign = isUser ? 'right' : 'left';
                });
                
                modifiedContent = tempDiv.innerHTML;
                
                // CSS 스타일 블록 생성
                const layoutCss = `
                    .chat-message-container { display: flex; align-items: flex-start; margin: 16px 0; gap: 10px; }
                    .chat-message-container.justify-end { flex-direction: row-reverse; }
                    .chat-message-container > div:first-child:not(.flex-grow) { flex-shrink: 0; }
                    img[alt="user avatar"] { width: 40px; height: 40px; border-radius: 9999px; object-fit: cover; }
                    .chat-message-container > .flex-grow { display: flex; flex-direction: column; max-width: calc(100% - 50px); }
                    .justify-end > .flex-grow { align-items: flex-end; }
                    .chat-user-name { font-weight: bold; margin-bottom: 4px; color: #a9b1d6; font-size: 0.9em; }
                    .prose { padding: 10px 15px; border-radius: 12px; background-color: #24283b; word-break: break-word; max-width: 100%;}
                    .justify-end .prose { background-color: #414868; }
                    .prose p { margin: 0.5em 0 !important;}
                    .prose p { margin: 0.5em 0; }
                `;
                
                const styleBlock = applyStyles
                    ? layoutCss + `
                       img { max-width: 100%; height: auto; }
                       .prose a { color: #bb9af7; }
                       .x-risu-post-toggle { display: none; }
                       .x-risu-post-toggle:checked + .x-risu-post-row + .x-risu-post-content-wrapper { display: block; }
                       .x-risu-post-title-label { cursor: pointer; }
                       .x-risu-post-content-wrapper { display: none; }
                      `
                    : layoutCss + extractedCss;
                
                return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>채팅 로그: ${charName} - ${chatName}</title><style>
                    * { box-sizing: border-box; }
                    body { background-color: ${selectedTheme.background}; color: ${selectedTheme.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 10px; margin: 0; }
                    .chat-log-wrapper { max-width: 900px; margin: 0 auto; }
                    ${styleBlock}
                </style></head><body><div class="chat-log-wrapper"><header style="text-align:center; padding-bottom:15px; margin-bottom:20px; border-bottom:2px solid ${selectedTheme.border};"><img src="${charAvatarBase64}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block;"><h1 style="color:${selectedTheme.nameColor};">${charName}</h1><p style="color:${selectedTheme.textSecondary};">${chatName}</p></header><div>${modifiedContent}</div></div></body></html>`;
            };

            let isRawMode = false;
            let lastGeneratedHtml = '';
/**
     * 페이지에 로드된 모든 스타일시트의 CSS 규칙을 문자열로 추출합니다.
     * @async
     * @returns {Promise<string>} 모든 CSS 규칙을 포함하는 문자열.
     */
    
            /**
             * 사용자의 선택(포맷, 테마, 필터 등)이 변경될 때마다 미리보기 영역을 업데이트합니다.
             * @async
             */
            async function updatePreview() {
                console.log('[Log Exporter] updatePreview: 미리보기 업데이트 시작 (Shadow DOM 방식)');
                arcaHelperSection.style.display = 'none';
                const bubbleToggleCheckbox = modal.querySelector('#bubble-toggle-checkbox');
                const selectedFormat = modal.querySelector('input[name="log-format"]:checked').value;
                const selectedTheme = themeSelector.value;
                updateAvatarOptionVisibility();

                arcaHelperToggleBtn.style.display = (selectedFormat === 'basic') ? 'inline-block' : 'none';

                const isImageFormat = selectedFormat === 'html' || selectedFormat === 'basic';
                imageScaleControls.style.display = isImageFormat ? 'flex' : 'none';
                saveImageControls.style.display = isImageFormat ? 'flex' : 'none';
                htmlStyleControls.style.display = selectedFormat === 'html' ? 'none' : 'inline-flex';

                previewEl.innerHTML = `<div style="text-align:center;color:#8a98c9;">미리보기 생성 중...</div>`;
                let filteredNodes = getFilteredNodes();

                const customFilterSection = modal.querySelector('#custom-filter-section');
                if (selectedFormat !== 'html' && filterToggleCheckbox.checked && customFilterSection) {
                    const selectedClasses = Array.from(modal.querySelectorAll('.custom-filter-class:checked')).map(cb => cb.dataset.class);
                    if (selectedClasses.length > 0) {
                        filteredNodes = filteredNodes.map(node => filterWithCustomClasses(node, selectedClasses));
                    }
                }

                const rawBtn = modal.querySelector('#log-exporter-raw-toggle');
                rawBtn.style.display = (selectedFormat === 'html' || selectedFormat === 'basic') ? 'inline-block' : 'none';

                previewEl.style.backgroundColor = THEMES.dark.background;

                if (selectedFormat === 'html') {
                    filterControls.style.display = 'none';
                    themeSelectorContainer.style.display = 'none';
                    if (customFilterSection) customFilterSection.style.display = 'none';
                    saveFileBtn.style.display = 'inline-block';

                    const fullCss = await getFullPageCSS();
                    // 이름 폰트 하드코딩을 없애기 위해, generateHtmlFromNodes의 두 번째 인자를 'false'로 전달
                    const messagesHtml = await generateHtmlFromNodes(filteredNodes, false, true); 
                    const themeBgColor = getComputedStyle(document.documentElement).getPropertyValue('--risu-theme-bgcolor').trim() || '#1a1b26';
                    const headerHtml = await getHeaderHtml(charAvatarUrl, charName, chatName);
                    const htmlTagStyle = document.documentElement.getAttribute('style') || '';
                    lastGeneratedHtml = `<!DOCTYPE html><html lang="ko" style="${htmlTagStyle}"><head><meta charset="UTF-8"><title>Chat Log</title><style>${fullCss} body { padding: 20px; } .chat-log-wrapper { max-width: 900px; margin: 0 auto; } .log-exporter-msg-btn-group { display:none!important; }</style></head><body><div class="chat-log-wrapper">${headerHtml}${messagesHtml}</div></body></html>`;

                    if (isRawMode) {
                        previewEl.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.85em;">${lastGeneratedHtml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
                    } else {
                        previewEl.innerHTML = ''; 
                        
                        const shadowHost = document.createElement('div');
                        const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

                        shadowRoot.innerHTML = `
                            <style>
                                ${fullCss}
                                .preview-wrapper {
                                    background-color: ${themeBgColor};
                                    padding: 20px;
                                }
                                .chat-log-wrapper { max-width: 900px; margin: 0 auto; }
                                /* 미리보기 내에서 불필요한 UI 숨기기 */
                                .log-exporter-msg-btn-group { display: none !important; }
                            </style>
                            <div class="preview-wrapper">
                                <div class="chat-log-wrapper">${headerHtml}${messagesHtml}</div>
                            </div>
                        `;
                        previewEl.appendChild(shadowHost);
                    }
                } else if (selectedFormat === 'basic') {
                    filterControls.style.display = 'flex';
                    themeSelectorContainer.style.display = 'flex';
                    saveFileBtn.style.display = 'none';
                    const content = await generateBasicFormatLog(filteredNodes, selectedTheme, true, avatarToggleCheckbox.checked, bubbleToggleCheckbox.checked);
                    lastGeneratedHtml = content;
                    const theme = THEMES[selectedTheme] || THEMES.dark;
                    previewEl.style.backgroundColor = theme.background;

                    if (isRawMode) {
                        previewEl.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.85em;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
                    } else {
                        previewEl.innerHTML = content;
                    }
                } else { // Text / Markdown
                    filterControls.style.display = 'flex';
                    themeSelectorContainer.style.display = 'none';
                    saveImageControls.style.display = 'none';
                    saveFileBtn.style.display = 'none';
                    const content = await generateFormattedLog(filteredNodes, selectedFormat);
                    previewEl.innerHTML = `<pre>${content.replace(/</g, "&lt;")}</pre>`;
                }

                if (!isRawMode && selectedFormat === 'basic') {
                    applyImageScaling();
                }
                console.log('[Log Exporter] updatePreview: 미리보기 업데이트 완료');
            }

            const rawToggleBtn = modal.querySelector('#log-exporter-raw-toggle');
            rawToggleBtn.addEventListener('click', () => {
                isRawMode = !isRawMode;
                rawToggleBtn.textContent = isRawMode ? 'HTML 미리보기' : 'HTML Raw 보기';
                rawToggleBtn.classList.toggle('primary', isRawMode);
                updatePreview();
            });

            const customFilterToggle = modal.querySelector('#custom-filter-toggle');
            const customFilterSection = modal.querySelector('#custom-filter-section');

            if (customFilterToggle && customFilterSection) {
                customFilterToggle.addEventListener('click', () => {
                    const isVisible = customFilterSection.style.display !== 'none';
                    customFilterSection.style.display = isVisible ? 'none' : 'block';
                    customFilterToggle.textContent = isVisible ? '커스텀 필터 설정 ▼' : '커스텀 필터 설정 ▲';
                });
                modal.querySelectorAll('.custom-filter-class').forEach(cb => cb.addEventListener('change', updatePreview));
                modal.querySelector('#select-all-filters')?.addEventListener('click', () => {
                    modal.querySelectorAll('.custom-filter-class').forEach(cb => cb.checked = true); updatePreview();
                });
                modal.querySelector('#deselect-all-filters')?.addEventListener('click', () => {
                    modal.querySelectorAll('.custom-filter-class').forEach(cb => cb.checked = false); updatePreview();
                });
            }

            /**
             * 선택된 로그 형식에 따라 아바타 표시 옵션 UI의 가시성을 제어합니다.
             */
            function updateAvatarOptionVisibility() {
                const selectedFormat = modal.querySelector('input[name="log-format"]:checked').value;
                avatarToggleControls.style.display = (selectedFormat === 'basic') ? 'flex' : 'none';
            }

            modal.querySelectorAll('input[name="log-format"], #style-toggle-checkbox, #filter-toggle-checkbox, .participant-filter-checkbox, #avatar-toggle-checkbox, #bubble-toggle-checkbox').forEach(el => {
    el.addEventListener('change', updatePreview);
});
            themeSelector.addEventListener('change', updatePreview);

            updatePreview();

            const closeModal = () => modal.remove();
            modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
            modal.querySelector('#log-exporter-close').addEventListener('click', closeModal);

            saveFileBtn.addEventListener('click', async () => {
                try {
                    const filteredNodes = getFilteredNodes();
                    const useStyled = styleToggleCheckbox.checked;
                    const showAvatar = avatarToggleCheckbox.checked;
                    const messagesHtml = await generateHtmlFromNodes(filteredNodes, useStyled, true);
                    await generateAndDownloadHtmlFile(charName, chatName, messagesHtml,charAvatarUrl);
                    closeModal();
                } catch (e) { console.error('[Log Exporter] File save error from modal:', e); }
            });

            const footer = modal.querySelector('#log-exporter-footer');
            const progressFooter = modal.querySelector('#log-exporter-progress-footer');
            const progressBar = modal.querySelector('#export-progress-bar');
            const progressStatusText = modal.querySelector('#progress-status-text');
            const progressPercentageText = modal.querySelector('#progress-percentage-text');
            const cancelBtn = modal.querySelector('#log-exporter-cancel-image');

            // [복원] 이미지 저장 옵션 요소들
            const saveImageBtn = modal.querySelector('#log-exporter-save-image');
            const highResCheckbox = modal.querySelector('#image-high-res-checkbox');
            const fontSizeInput = modal.querySelector('#image-font-size-input');
            const imageWidthInput = modal.querySelector('#image-width-input');
            let cancellationToken = { cancelled: false };

            const updateProgress = (status, value, max) => {
                if (cancellationToken.cancelled) return;
                progressStatusText.textContent = status;
                progressBar.value = value;
                progressBar.max = max;
                progressPercentageText.textContent = `${Math.round((value / max) * 100)}%`;
            };

            // [수정] 이미지 저장 버튼 클릭 시 옵션 값들 읽어서 전달
            saveImageBtn.addEventListener('click', async () => {
                cancellationToken.cancelled = false;
                footer.style.display = 'none';
                progressFooter.style.display = 'flex';
                updateProgress('이미지 생성 준비 중...', 0, 100);

                const useHighRes = highResCheckbox.checked;
                const baseFontSize = parseInt(fontSizeInput.value) || 16;
                const imageWidth = parseInt(imageWidthInput.value) || 900;

                const success = await savePreviewAsImage(previewEl, updateProgress, cancellationToken, charName, chatName, useHighRes, baseFontSize, imageWidth);

                footer.style.display = 'flex';
                progressFooter.style.display = 'none';
                if (success) closeModal();
                else if (!cancellationToken.cancelled) alert("이미지 저장이 실패했거나 중단되었습니다.", "error");
            });

            cancelBtn.addEventListener('click', () => {
                cancellationToken.cancelled = true;
                console.log('[Log Exporter] Image export cancelled by user.');
            });

            modal.querySelector('#log-exporter-download-zip').addEventListener('click', async () => {
                const filteredNodes = getFilteredNodes();
                const btn = modal.querySelector('#log-exporter-download-zip');
                const originalText = btn.textContent;
                btn.textContent = '처리 중...';
                btn.disabled = true;
                const showAvatar = avatarToggleCheckbox.checked;
                // [수정] 아카라이브 모드 감지 로직을 제거하고 항상 일반 다운로드(sequentialNaming=false)를 수행합니다.
                await downloadImagesAsZip(filteredNodes, charName, chatName, false, showAvatar);
                btn.textContent = originalText;
                btn.disabled = false;
            });

            // [추가] 아카라이브용 ZIP 다운로드 버튼 이벤트 리스너
            arcaDownloadZipBtn.addEventListener('click', async () => {
                const filteredNodes = getFilteredNodes();
                const btn = arcaDownloadZipBtn;
                const originalText = btn.textContent;
                btn.textContent = '처리 중...';
                btn.disabled = true;
                const showAvatar = avatarToggleCheckbox.checked;
                // 아카라이브용으로 순차 이름(sequentialNaming=true)을 지정하여 ZIP 다운로드
                await downloadImagesAsZip(filteredNodes, charName, chatName, true, showAvatar);
                btn.textContent = originalText;
                btn.disabled = false;
            });

            arcaHelperToggleBtn.addEventListener('click', async () => {
                const isVisible = arcaHelperSection.style.display === 'flex';
                const footerControlsToToggle = [
                    modal.querySelector('#log-exporter-raw-toggle'),
                    modal.querySelector('#log-exporter-save-file'),
                    modal.querySelector('#log-exporter-copy'),
                    modal.querySelector('#log-exporter-download-zip'),
                    ...modal.querySelectorAll('#image-export-controls button, #image-export-controls input')
                ];
                // 좌측 패널의 컨트롤 (아카라이브 변환기 제외)
                const leftPanel = modal.querySelector('.log-exporter-left-panel');
                const controlsInLeftPanel = leftPanel.querySelectorAll('input, select, button');
                const leftPanelControlsToToggle = Array.from(controlsInLeftPanel).filter(el => !arcaHelperSection.contains(el));

                const allControlsToToggle = [...footerControlsToToggle, ...leftPanelControlsToToggle];

                if (isVisible) {
                    arcaHelperSection.style.display = 'none';
                    arcaHelperToggleBtn.textContent = '아카라이브 변환기';
                    arcaHelperToggleBtn.style.backgroundColor = '#bb9af7';
                    allControlsToToggle.forEach(el => el.disabled = false);
                } else {
                    arcaHelperSection.style.display = 'flex';
                    arcaHelperToggleBtn.textContent = '변환기 닫기';
                    arcaHelperToggleBtn.style.backgroundColor = '#f7768e';
                    allControlsToToggle.forEach(el => el.disabled = true);

                    const filteredNodes = getFilteredNodes();

                    const customFilterSection = modal.querySelector('#custom-filter-section');
                    let nodesForTemplate = filteredNodes;
                    if (filterToggleCheckbox.checked && customFilterSection) {
                        const selectedClasses = Array.from(modal.querySelectorAll('.custom-filter-class:checked'))
                            .map(cb => cb.dataset.class);
                        if (selectedClasses.length > 0) nodesForTemplate = filteredNodes.map(node => filterWithCustomClasses(node, selectedClasses));
                    }

                    const selectedTheme = themeSelector.value;
                    const showAvatar = avatarToggleCheckbox.checked;
                    const useBubbleDesign = modal.querySelector('#bubble-toggle-checkbox').checked;
                    const template = await generateArcaLiveTemplate(nodesForTemplate, selectedTheme, showAvatar, useBubbleDesign);
                    arcaTemplateHtml.value = template;
                }
            });

            arcaConvertBtn.addEventListener('click', () => {
                const template = arcaTemplateHtml.value;
                const source = arcaSourceHtml.value;

                if (!template || !source) {
                    alert('템플릿 HTML과 아카라이브 소스 HTML을 모두 입력해주세요.', 'error');
                    return;
                }

                const imageUrls = [...source.matchAll(/<img[^>]+src="([^"]+)"/g)].map(match => match[1]);

                if (imageUrls.length === 0) {
                    alert('아카라이브 소스에서 이미지 URL을 찾을 수 없습니다. 이미지를 올바르게 업로드했는지 확인해주세요.', 'error');
                    return;
                }

                let finalHtml = template;
                let usedUrlCount = 0;

                // [수정] 아바타와 일반 이미지를 구분하여 처리하는 정규식으로 변경
                finalHtml = finalHtml.replace(/<!--\s*(ARCA_IMG_PLACEHOLDER|ARCA_AVATAR_PLACEHOLDER_(true|false))_(\d+)\s*-->/g, (match, type, isUserStr, p3) => {
                    const index = parseInt(p3, 10) - 1;
                    if (index < imageUrls.length) {
                        usedUrlCount++;
                        const imageUrl = imageUrls[index];
                        if (type.startsWith('ARCA_AVATAR_PLACEHOLDER')) {
                            const isUser = isUserStr === 'true';
                            const theme = THEMES[themeSelector.value] || THEMES.dark;
                            return `<img src="${imageUrl}" style="${ARCA_IMG_STYLES.avatar(theme, isUser)}">`;
                        } else {
                            return `<img src="${imageUrl}" style="${ARCA_IMG_STYLES.content}">`;
                        }
                    }
                    return match;
                });

					// 후처리: td border=0, 이미지 max-width 슬라이더 값 반영, title 태그 제거
					try {
						const scale = (typeof imageScaleSlider !== 'undefined' && imageScaleSlider && imageScaleSlider.value) ? imageScaleSlider.value : '100';
						const tempContainer = document.createElement('div');
						tempContainer.innerHTML = finalHtml;

						// title 태그 제거
						tempContainer.querySelectorAll('title').forEach(el => el.remove());

						// 모든 td 태그에 border="0" 부여 (기존 border 속성 제거 후 설정)
						tempContainer.querySelectorAll('td').forEach(td => {
							td.style.border = '0px';
						});

						// 이미지 max-width를 슬라이더 값으로 통일, 높이는 auto 유지
						tempContainer.querySelectorAll('img').forEach(img => {
							img.style.maxWidth = `${scale}%`;
							img.style.height = 'auto';
						});

						finalHtml = tempContainer.innerHTML;
					} catch (e) {
						console.warn('[Arca Convert] post-process failed:', e);
					}

					arcaFinalHtml.value = finalHtml;
                alert(`변환 완료! ${usedUrlCount}개의 이미지 위치가 교체되었습니다. 최종 결과물을 복사하여 사용하세요.`, 'success');
            });

            modal.querySelector('#log-exporter-copy').addEventListener('click', async () => {
                let filteredNodes = getFilteredNodes();
                const selectedFormat = modal.querySelector('input[name="log-format"]:checked').value;
                const selectedTheme = themeSelector.value;

                if (selectedFormat !== 'html' && filterToggleCheckbox.checked && customFilterSection) {
                    const selectedClasses = Array.from(modal.querySelectorAll('.custom-filter-class:checked')).map(cb => cb.dataset.class);
                    if (selectedClasses.length > 0) {
                        filteredNodes = filteredNodes.map(node => filterWithCustomClasses(node, selectedClasses));
                    }
                }

                const showAvatar = avatarToggleCheckbox.checked;
                /**
                 * 클립보드 복사를 위해 서식이 포함된 HTML을 생성합니다.
                 * 이미지 태그는 제거하고, 외부 링크는 유지합니다.
                 * @param {HTMLElement[]} nodes - HTML로 변환할 노드.
                 * @param {string} format - 'html' 또는 'basic'.
                 * @param {string} theme - 'basic' 형식일 때 사용할 테마.
                 * @returns {Promise<string>} 생성된 HTML 문자열.
                 */
                const generateHtmlForCopy = async (nodes, format, theme) => {
                    let htmlContent;
                    if (format === 'html') {
                        htmlContent = await generateHtmlFromNodes(nodes, styleToggleCheckbox.checked, false);
                    } else if (format === 'basic') {
                        htmlContent = await generateBasicFormatLog(nodes, theme, false, showAvatar);
                    } else {
                        return '';
                    }
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlContent;
                    tempDiv.querySelectorAll('img').forEach(img => img.remove());
                    tempDiv.querySelectorAll('[style*="background-image"]').forEach(el => el.style.backgroundImage = 'none');

                    // --- 수정된 부분 ---
                    // 클립보드 복사 시 P 태그에 인라인 마진 스타일을 강제로 적용하여 서식 깨짐 방지
                    tempDiv.querySelectorAll('.prose p, .chattext p, div[style*="line-height"] p').forEach(p => {
                        if (!p.style.margin && !p.style.marginTop && !p.style.marginBottom) {
                            p.style.setProperty('margin-top', '0.5em', 'important');
                            p.style.setProperty('margin-bottom', '0.5em', 'important');
                        }
                    });
                    
                    // 참가자 이름 색상 강제 적용
                    const selectedThemeObj = THEMES[theme] || THEMES.dark;
                    tempDiv.querySelectorAll('.unmargin.text-xl').forEach(nameEl => {
                        const parentNode = nameEl.closest('.chat-message-container');
                        const isUser = parentNode && parentNode.classList.contains('justify-end');
                        const nameColor = selectedThemeObj.nameColor;
                        
                        nameEl.style.color = nameColor + ' !important';
                        nameEl.style.fontWeight = '600';
                        nameEl.style.fontSize = '0.95em';
                        nameEl.style.display = 'block';
                        nameEl.style.marginBottom = '8px';
                        nameEl.style.textAlign = isUser ? 'right' : 'left';
                    });
                    // --- 수정 끝 ---

                    if (format === 'basic') {
                        const selectedThemeObj = THEMES[theme] || THEMES.dark;
                        tempDiv.querySelectorAll('[style*="background: url"]').forEach(el => {
                            el.style.background = selectedThemeObj.avatarBorder;
                        });
                    }

                    return (format === 'html') ? buildFullHtml(tempDiv.innerHTML, 'dark', styleToggleCheckbox.checked) : tempDiv.innerHTML;
                };

                let toCopy, copyFormat;

                if (isRawMode && (selectedFormat === 'html' || selectedFormat === 'basic')) {
                    toCopy = lastGeneratedHtml;
                    copyFormat = 'text';
                } else if (selectedFormat === 'html' || selectedFormat === 'basic') {
                    const htmlBody = await generateHtmlForCopy(filteredNodes, selectedFormat, selectedTheme);
                    const fullHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;">${htmlBody}</body></html>`;
                    toCopy = fullHtml;
                    copyFormat = 'html';
                } else {
                    toCopy = await generateFormattedLog(filteredNodes, selectedFormat);
                    copyFormat = 'text';
                }

                const success = await copyToClipboard(toCopy, copyFormat);
                if (success) {
                    const copyBtn = modal.querySelector('#log-exporter-copy');
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '✓ 복사 완료!';
                    copyBtn.style.backgroundColor = '#9ece6a';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.style.backgroundColor = '';
                    }, 2000);
                } else {
                    alert("복사에 실패했습니다. 수동으로 복사해주세요.", "error");
                }
            });

        } catch (e) {
            console.error('[Log Exporter] Modal open error:', e);
            alert(`오류 발생: ${e.message}`, "error");
        }
    }

    /**
     * 채팅 목록과 각 메시지에 '내보내기' 관련 버튼들을 주입합니다.
     * 이미 버튼이 있는 경우 중복 주입을 방지합니다.
     */
    function injectButtons() {
        console.log('[Log Exporter] injectButtons: UI에 내보내기 버튼 주입 시도');
        document.querySelectorAll(CHAT_ITEM_SELECTOR).forEach(item => {
            if (item.closest('.log-exporter-modal')) return;

            if (item.querySelector('.log-exporter-btn-group')) return;
            const chatIndex = parseInt(item.getAttribute('data-risu-chat-idx'), 10);
            if (isNaN(chatIndex)) return;
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'log-exporter-btn-group';
            Object.assign(buttonGroup.style, { display: 'flex', alignItems: 'center', marginRight: '8px', gap: '4px' });

            const btn = document.createElement('div');
            btn.innerHTML = '📋';
            btn.title = '채팅 로그 내보내기';
            Object.assign(btn.style, { cursor: 'pointer', fontSize: '18px', lineHeight: '1', color: '#a0a0a0', transition: 'color 0.2s' });
            btn.addEventListener('mouseover', () => btn.style.color = '#7aa2f7');
            btn.addEventListener('mouseout', () => btn.style.color = '#a0a0a0');
            btn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); showCopyPreviewModal(chatIndex); });
            buttonGroup.appendChild(btn);

            const existingControls = item.querySelector('.auto-title-btn, .flex-grow.flex.justify-end');
            if (existingControls) {
                existingControls.classList.contains('auto-title-btn') ? existingControls.before(buttonGroup) : existingControls.prepend(buttonGroup);
            }
        });

        const allMessageNodes = getAllMessageNodes();
        allMessageNodes.forEach((node, index) => {
            if (node.closest('.log-exporter-modal')) return;

            const controls = node.querySelector('.flex-grow.flex.items-center.justify-end');
            if (!controls || controls.querySelector('.log-exporter-msg-btn-group')) return;
            if (node.querySelector('textarea')) return;

            const chatIndexStr = node.querySelector('[data-chat-index]')?.getAttribute('data-chat-index');
            if (chatIndexStr === null) return;

            const currentChatIndex = parseInt(document.querySelector('button[data-risu-chat-idx].bg-selected')?.getAttribute('data-risu-chat-idx'));
            if (isNaN(currentChatIndex)) return;

            const messageIndexInUI = allMessageNodes.length - 1 - index;

            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'log-exporter-msg-btn-group';
            buttonGroup.style.display = 'flex';

            const createMsgButton = (emoji, title, onClick) => {
                const btn = document.createElement('button');
                btn.innerHTML = emoji; btn.title = title; btn.className = 'log-exporter-msg-btn';
                btn.addEventListener('click', e => {
                    e.stopPropagation(); e.preventDefault();
                    onClick(currentChatIndex, messageIndexInUI);
                });
                return btn;
            };

            buttonGroup.appendChild(createMsgButton('📄', '이 메시지만 내보내기', (chatIdx, msgIdx) => showCopyPreviewModal(chatIdx, { startIndex: msgIdx, singleMessage: true })));
            buttonGroup.appendChild(createMsgButton('📑', '이 메시지부터 내보내기', (chatIdx, msgIdx) => showCopyPreviewModal(chatIdx, { startIndex: msgIdx, singleMessage: false })));

            const copyButton = controls.querySelector('.button-icon-copy');
            if (copyButton) copyButton.before(buttonGroup);
            else controls.prepend(buttonGroup);
        });
    }

    /**
     * DOM 변경을 감지하여 'injectButtons' 함수를 호출하는 MutationObserver를 시작합니다.
     * 이를 통해 동적으로 추가되는 채팅 메시지에도 버튼이 주입됩니다.
     */
    function startObserver() {
        if (observer) observer.disconnect();
        console.log('[Log Exporter] startObserver: DOM 변경 감지를 위한 MutationObserver 시작');
        observer = new MutationObserver(() => setTimeout(injectButtons, 300));
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(injectButtons, 500);
    }

    onUnload(() => {
        if (observer) observer.disconnect();
        if (originalDefine && window.define !== originalDefine) {
            window.define = originalDefine;
        }
        if (originalRequire && window.require !== originalRequire) {
            window.require = originalRequire;
        }
        document.querySelectorAll('.log-exporter-btn-group, .log-exporter-msg-btn-group').forEach(btn => btn.remove());
        document.querySelector('.log-exporter-modal-backdrop')?.remove();
        document.getElementById('log-exporter-styles')?.remove();
        console.log('Chat Log Exporter 플러그인이 언로드되었습니다.');
    });

    injectModalStyles();
    ensureHtmlToImage().catch(e => console.error(e));
    ensureJSZip().catch(e => console.error(e));
    startObserver();
    
async function getHeaderHtml(charAvatarUrl, charName, chatName) {
    const charAvatarBase64 = await imageUrlToBase64(charAvatarUrl)
    const headerHtml = `
            <header style="text-align:center; padding-bottom:15px; margin-bottom:20px; border-bottom: 2px solid var(--risu-theme-borderc, #414868);">
                <img src="${charAvatarBase64}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin:0 auto 10px; display:block; border: 2px solid var(--risu-theme-darkbutton, #565f89);">
                <h1 class="unmargin text-2xl font-bold" style="color: var(--risu-theme-textcolor, #c0caf5); margin-bottom: 4px;">${charName}</h1>
                <p class="text-sm" style="color: var(--risu-theme-textcolor2, #8a98c9);">${chatName}</p>
            </header>
        `;
    return headerHtml;
}
})();

