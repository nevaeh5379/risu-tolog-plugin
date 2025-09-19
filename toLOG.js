//@name Chat Log Exporter
//@display-name 채팅 로그 HTML 변환기
//@version 11.0 Final with Hybrid Styling (Text Filtering + UI Controls + Basic Format)
//@description [통합 UI 버전] 모든 로그 내보내기 기능을 하나의 미리보기 모달로 통합합니다. 텍스트/마크다운 출력 시 UI 필터링 강도를 조절할 수 있으며, 이미지 포함 및 스타일이 적용된 '기본' 형식을 지원합니다.

// --- 플러그인 충돌 방지 패치 ---
// 다른 플러그인에서 setArg API를 잘못된 인수로 호출하여 발생할 수 있는 충돌을 방지합니다.
// setArg가 호출될 때 첫 번째 인수가 문자열인지 확인하여 안정성을 높입니다.
if (globalThis.__pluginApis__ && globalThis.__pluginApis__.setArg) {
    const originalSetArg = globalThis.__pluginApis__.setArg;
    globalThis.__pluginApis__.setArg = function (arg, value) {
        if (typeof arg !== 'string') {
            console.warn('Auto Title Patcher: A plugin called setArg with an invalid argument. Crash prevented. Arg:', arg);
            return;
        }
        return originalSetArg.call(this, arg, value);
    };
}
const CHAT_ITEM_SELECTOR = 'button[data-risu-chat-idx]';
const MESSAGE_CONTAINER_SELECTOR = '.chat-message-container';

(async () => {
    /**
        * [신규] 채팅 메시지를 나타내는 모든 DOM 노드를 일관된 방식으로 가져옵니다.
        * DOM에 나타나는 순서(최신 메시지가 위)대로 반환합니다.
        * @returns {HTMLElement[]} 메시지 노드 배열.
        */
    function getAllMessageNodes() {
        const containers = Array.from(document.querySelectorAll('.chat-message-container'));
        const allRisuChats = Array.from(document.querySelectorAll('.risu-chat'));
        const standaloneMessageChats = allRisuChats.filter(chat =>
            (chat.querySelector('.prose') || chat.querySelector('.chattext')) &&
            !chat.closest('.log-exporter-modal') &&
            chat.closest('.risu-sidebar') === null &&
            chat.closest('.chat-message-container') === null
        );

        let messageNodes = [...containers, ...standaloneMessageChats];

        // 문서 순서대로 정렬하여 일관성을 보장합니다.
        messageNodes.sort((a, b) => {
            const position = a.compareDocumentPosition(b);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
        });

        return messageNodes;
    }
    /**
     * 원본 DOM 요소의 계산된 스타일(computed style)을 복제된 요소에 인라인 스타일로 적용합니다.
     * HTML 내보내기 시 원본의 디자인을 최대한 유지하기 위해 사용됩니다.
     * @param {HTMLElement} originalElem - 스타일의 원본이 되는 요소입니다.
     * @param {HTMLElement} clonedElem - 스타일을 적용받을 복제된 요소입니다.
     */
    function applyInlineStyles(originalElem, clonedElem) {
        // 원본과 복제된 요소 및 모든 하위 요소를 배열로 만듭니다.
        const allOriginalElements = [originalElem, ...originalElem.querySelectorAll('*')];
        const allClonedElements = [clonedElem, ...clonedElem.querySelectorAll('*')];

        if (allOriginalElements.length !== allClonedElements.length) { return; }

        // 하위 요소부터 순회하며 스타일을 적용해야 상속 문제를 줄일 수 있습니다.
        for (let i = allClonedElements.length - 1; i >= 0; i--) {
            const clonedEl = allClonedElements[i];
            const originalEl = allOriginalElements[i];
            if (!originalEl) continue;

            const computedStyle = window.getComputedStyle(originalEl);

            // 내보낼 HTML에 중요한 시각적 스타일 속성 목록입니다.
            const styleToCopy = [
                'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-align',
                'line-height', 'letter-spacing', 'text-transform', 'text-shadow', 'white-space', 'word-break',
                'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
                'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius',
                'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                'box-shadow', 'opacity', 'vertical-align', 'object-fit'
            ];
            styleToCopy.forEach(prop => {
                clonedEl.style[prop] = computedStyle[prop];
            });

            // 좌우 마진이 'auto'인 중앙 정렬을 처리합니다.
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
            // 절대 위치(absolute)는 레이아웃을 깨뜨릴 수 있으므로 상대 위치(relative)로 변경합니다.
            clonedEl.style.position = computedStyle.position === 'absolute' ? 'relative' : computedStyle.position;
            if (clonedEl.style.position === 'relative') clonedEl.style.inset = 'auto';
        }
    }

    // --- Main Plugin Logic ---
    const { getChar, onUnload } = globalThis.__pluginApis__;
    if (!getChar || !onUnload) {
        console.error("Chat Log Exporter: 필수 API를 찾을 수 없습니다.");
        return;
    }

    let observer = null;
    const CHAT_ITEM_SELECTOR = 'button[data-risu-chat-idx]';
    const MESSAGE_CONTAINER_SELECTOR = '.chat-message-container';

    // [변경] domToImagePromise -> htmlToImagePromise 변수명 변경
    let htmlToImagePromise = null;
    let originalDefine = null;
    let originalRequire = null;
    /**
     * [변경] 외부 라이브러리인 'html-to-image'가 로드되었는지 확인하고, 로드되지 않았다면 동적으로 로드합니다.
     * Promise를 반환하여 라이브러리 로드가 완료될 때까지 기다릴 수 있도록 합니다. 이미지 저장 기능에 필수적입니다.
     * @returns {Promise<void>} 라이브러리 로드가 완료되면 resolve되는 Promise.
     */
    function ensureHtmlToImage() {
        if (!htmlToImagePromise) {
            htmlToImagePromise = new Promise((resolve, reject) => {
                // 이미 로드되었는지 확인
                if (typeof window.htmlToImage !== 'undefined') {
                    console.log('[Log Exporter] html-to-image already loaded');
                    return resolve();
                }

                console.log('[Log Exporter] Loading html-to-image library...');

                // AMD를 임시 저장 (한 번만)
                if (!originalDefine) {
                    originalDefine = window.define;
                    originalRequire = window.require;
                }

                // AMD를 임시로 비활성화
                window.define = undefined;
                window.require = undefined;

                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js';

                script.onload = () => {
                    // 라이브러리 로드 직후 바로 복원
                    if (originalDefine) {
                        window.define = originalDefine;
                        window.require = originalRequire;
                    }

                    // 로드 확인 및 전역 변수 고정
                    setTimeout(() => {
                        if (typeof window.htmlToImage !== 'undefined') {
                            console.log('[Log Exporter] html-to-image loaded successfully');
                            // 전역 스코프에 확실히 고정
                            window.__htmlToImageLib = window.htmlToImage;
                            resolve();
                        } else {
                            reject(new Error('html-to-image 객체를 찾을 수 없습니다'));
                        }
                    }, 100);
                };

                script.onerror = () => {
                    // 오류 시에도 AMD 복원
                    if (originalDefine) {
                        window.define = originalDefine;
                        window.require = originalRequire;
                    }
                    console.error('[Log Exporter] Failed to load html-to-image.');
                    reject(new Error('html-to-image 로드 실패'));
                };

                document.head.appendChild(script);
            });
        }
        return htmlToImagePromise;
    }

    /**
     * 플러그인에서 사용하는 모달 창의 CSS 스타일을 문서에 주입합니다.
     * 스타일이 이미 존재하는 경우 중복 주입을 방지합니다.
     */
    function injectModalStyles() {
        if (document.getElementById('log-exporter-styles')) return;
        const style = document.createElement('style');
        style.id = 'log-exporter-styles';
        style.innerHTML = `
            .log-exporter-modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); z-index: 10001; display: flex; align-items: center; justify-content: center; }
            .log-exporter-modal { background-color: #24283b; color: #c0caf5; border-radius: 10px; width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 5px 15px rgba(0,0,0,0.3); overflow: hidden; }
            .log-exporter-modal-header { padding: 15px 20px; font-size: 1.2em; font-weight: bold; border-bottom: 1px solid #414868; }
            .log-exporter-modal-content { padding: 20px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; flex-grow: 1; }
            .log-exporter-modal-options { display: flex; gap: 10px; align-items: center; background: #1f2335; padding: 10px; border-radius: 5px; flex-wrap: wrap; }
            .log-exporter-modal-options label { cursor: pointer; user-select: none; display: inline-flex; align-items: center; }
            .log-exporter-modal-preview { flex-grow: 1; background-color: #1a1b26; border: 1px solid #414868; border-radius: 5px; padding: 15px; overflow-y: auto; min-height: 200px; max-height: 40vh; }
            .log-exporter-modal-preview pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace; font-size: 0.9em; margin: 0; color: #c0caf5; }
            .log-exporter-modal-footer { padding: 15px 20px; border-top: 1px solid #414868; display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
            .log-exporter-modal-btn { background-color: #414868; color: #c0caf5; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; white-space: nowrap; }
            .log-exporter-modal-btn:hover { background-color: #565f89; }
            .log-exporter-modal-btn.primary { background-color: #7aa2f7; color: #1a1b26; }
            .log-exporter-modal-btn.primary:hover { background-color: #9eceff; }
            .log-exporter-modal-btn.image-save { background-color: #9ece6a; color: #1a1b26; }
            .log-exporter-modal-btn.image-save:hover { background-color: #b8e090; }
            .log-exporter-modal-btn:disabled { background-color: #565f89; cursor: not-allowed; }
            .log-exporter-msg-btn { margin-left: 8px; cursor: pointer; color: #a0a0a0; transition: color 0.2s; font-size: 20px; line-height: 1; background: none; border: none; padding: 0;}
            .log-exporter-msg-btn:hover { color: #7aa2f7; }
            #filter-controls { display: none; margin-left: auto; align-items: center; gap: 15px; }
            @media (max-width: 640px) { .log-exporter-modal { width: 95%; max-width: none; } .log-exporter-modal-options { flex-direction: column; align-items: stretch; } .log-exporter-modal-footer { justify-content: center; } #filter-controls { margin-left: 0; flex-direction: column; gap: 10px; align-items: stretch; } }
        `;
        document.head.appendChild(style);
    }

    /**
     * 이미지 URL을 Base64 데이터 URI로 변환합니다.
     * 외부 이미지를 내보낸 파일(HTML, 이미지)에 직접 포함시켜, 파일이 독립적으로 표시될 수 있도록 합니다.
     * 다양한 URL 형식과 오류 상황을 처리합니다.
     * @param {string} url - 변환할 이미지의 URL.
     * @returns {Promise<string>} Base64 데이터 URI. 오류 발생 시 투명한 1x1 GIF 이미지 데이터를 반환합니다.
     */
    async function imageUrlToBase64(url) {
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
 * 지정된 인덱스의 채팅 로그 데이터를 수집합니다.
 * 해당 채팅을 활성화하고, 캐릭터 정보(이름, 아바타)와 모든 메시지 DOM 노드를 가져와 객체로 반환합니다.
 * @param {number} chatIndex - 수집할 채팅의 인덱스.
 * @returns {Promise<object>} 채팅 데이터 객체 { charName, chatName, charAvatarUrl, messageNodes }.
 */
    async function processChatLog(chatIndex) {
        const chatButton = document.querySelector(`button[data-risu-chat-idx="${chatIndex}"]`);
        if (!chatButton) throw new Error("채팅 버튼을 찾을 수 없습니다.");

        // 채팅이 선택되지 않았다면 클릭하고 UI가 업데이트될 시간을 줍니다.
        if (!chatButton.classList.contains('bg-selected')) {
            chatButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000)); // 대기 시간을 넉넉하게 줍니다.
        } else {
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        const character = getChar();
        if (!character) throw new Error("캐릭터 정보를 불러올 수 없습니다.");
        const targetChat = character.chats[chatIndex];

        // --- 아바타 URL 로드 (제공해주신 코드 기반) ---
        let charAvatarUrl = character.avatar; // 1. API 값을 기본으로 설정

        // 2. UI에서 더 나은 해상도의 활성화된 아바타를 찾습니다.
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

        // DOM 순서는 최신 메시지가 위 -> reverse()를 통해 시간순(오래된 것부터)으로 정렬
        messageNodes = messageNodes.reverse();

        if (messageNodes.length === 0) {
            throw new Error("채팅 메시지를 찾을 수 없습니다.");
        }

        return { charName: character.name, chatName: targetChat.name, charAvatarUrl, messageNodes };
    }

    /**
     * 주어진 DOM 노드 배열과 그 자식 요소에 적용되는 모든 CSS 규칙을 추출합니다.
     * '스타일 인라인 적용' 옵션을 해제했을 때, 필요한 스타일만 포함된 <style> 블록을 생성하기 위해 사용됩니다.
     * @param {HTMLElement[]} nodes - CSS를 추출할 DOM 노드의 배열.
     * @returns {Promise<string>} 추출된 모든 CSS 규칙을 포함하는 문자열.
     */
    async function extractCssForNodes(nodes) {
        const classSet = new Set();
        nodes.forEach(node => {
            node.querySelectorAll('*').forEach(el => {
                el.classList.forEach(c => classSet.add(c));
            });
        });

        const classSelectors = Array.from(classSet);
        const cssRules = new Set();

        for (const sheet of document.styleSheets) {
            try {
                if (!sheet.cssRules) continue;
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText && classSelectors.some(c => rule.selectorText.includes(`.${c}`))) {
                        cssRules.add(rule.cssText);
                    }
                }
            } catch (e) {
                console.warn(`[Log Exporter] Could not read styles from stylesheet: ${sheet.href}`, e);
            }
        }
        return Array.from(cssRules).join('\n');
    }

    /**
     * 수집된 채팅 데이터와 스타일을 기반으로 완전한 HTML 파일을 생성하고, 사용자가 다운로드할 수 있도록 합니다.
     * Blob과 Object URL을 사용하여 다운로드 링크를 동적으로 생성합니다.
     * @param {string} charName - 캐릭터 이름.
     * @param {string} chatName - 채팅방 이름.
     * @param {string} charAvatarUrl - 캐릭터 아바타 URL.
     * @param {string} messagesHtml - 메시지들의 HTML 내용.
     * @param {boolean} applyStyles - 스타일 인라인 적용 여부.
     * @param {string} [extractedCss=''] - 추출된 CSS (applyStyles가 false일 경우 사용).
     */
    async function generateAndDownloadHtmlFile(charName, chatName, charAvatarUrl, messagesHtml, applyStyles, extractedCss = '') {
        const charAvatarBase64 = await imageUrlToBase64(charAvatarUrl);
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

        const finalHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>채팅 로그: ${charName} - ${chatName}</title><style>
            * { box-sizing: border-box; }
            body { background-color: #1a1b26; color: #cad3f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 10px; margin: 0; }
            .chat-log-wrapper { max-width: 900px; margin: 0 auto; }
            ${styleBlock}
        </style></head><body><div class="chat-log-wrapper"><header style="text-align:center; padding-bottom:15px; margin-bottom:20px; border-bottom:2px solid #414868;"><img src="${charAvatarBase64}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block;"><h1>${charName}</h1><p>${chatName}</p></header><div>${messagesHtml}</div></div></body></html>`;

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
 * 채팅 메시지 DOM 노드 배열을 HTML 문자열로 변환합니다.
 * 각 노드를 복제하여 이미지를 Base64로 인코딩하고, 불필요한 UI 요소(버튼 등)를 제거/대체합니다.
 * `applyStyles` 옵션에 따라 인라인 스타일을 적용할지 여부를 결정합니다.
 * @param {HTMLElement[]} nodes - 변환할 메시지 DOM 노드 배열.
 * @param {boolean} [applyStyles=true] - 인라인 스타일 적용 여부.
 * @returns {Promise<string>} 변환된 HTML 문자열.
 */
    async function generateHtmlFromNodes(nodes, applyStyles = true) {
        console.log(`[Log Exporter] generateHtmlFromNodes called with ${nodes.length} nodes`);

        let finalHtml = '';
        for (const node of nodes) {
            if (node.querySelector('textarea')) {
                console.log('[Log Exporter] Skipping message with textarea');
                continue;
            }

            const clonedNode = node.cloneNode(true);
            clonedNode.querySelector('.log-exporter-msg-btn-group')?.remove();

            // --- 수정된 아바타 처리 로직 시작 (v2) ---

            // 1. 원본과 복제된 노드에서 아바타 요소를 클래스 이름으로 찾습니다.
            //    RisuAI 아바타는 보통 이 클래스 조합을 가집니다.
            const avatarSelector = '.shadow-lg.rounded-md[style*="background"]';
            const originalAvatarEl = node.querySelector(avatarSelector);
            const clonedAvatarEl = clonedNode.querySelector(avatarSelector);

            if (originalAvatarEl && clonedAvatarEl) {
                const computedStyle = window.getComputedStyle(originalAvatarEl);
                const bgImage = computedStyle.backgroundImage;

                // 2. 기본 스타일을 명시적으로 설정합니다.
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

                // 3. 배경 이미지가 있으면 Base64로 변환하여 적용합니다.
                if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
                    const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
                    if (urlMatch && urlMatch[1]) {
                        const base64Url = await imageUrlToBase64(urlMatch[1]);
                        clonedAvatarEl.style.backgroundImage = `url("${base64Url}")`;
                    }
                } else {
                    // 4. 배경 이미지가 없는 경우를 대비한 폴백(fallback) 처리
                    clonedAvatarEl.style.backgroundColor = '#6b7280';
                    clonedAvatarEl.style.display = 'flex';
                    clonedAvatarEl.style.alignItems = 'center';
                    clonedAvatarEl.style.justifyContent = 'center';
                    clonedAvatarEl.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                }
            }
            // --- 수정된 아바타 처리 로직 끝 ---

            const elementsWithInlineBackground = clonedNode.querySelectorAll('[style*="background"]');
            for (const el of elementsWithInlineBackground) {
                if (el === clonedAvatarEl) continue; // 아바타는 이미 처리했으므로 건너뜁니다.

                const style = el.getAttribute('style');
                if (style && style.includes('url(')) {
                    const urlMatch = style.match(/url\(["']?([^"')]+)["']?\)/);
                    if (urlMatch && urlMatch[1]) {
                        let url = urlMatch[1];
                        url = url.replace(/&quot;/g, '"');
                        const base64Url = await imageUrlToBase64(url);
                        const newStyle = style.replace(/url\(["']?[^"')]+["']?\)/, `url("${base64Url}")`);
                        el.setAttribute('style', newStyle);
                    }
                }
            }

            if (applyStyles) {
                const originalProseEl = node.querySelector('.prose, .chattext');
                const clonedProseEl = clonedNode.querySelector('.prose, .chattext');
                if (originalProseEl && clonedProseEl) {
                    applyInlineStyles(originalProseEl, clonedProseEl);
                }
            } else {
                clonedNode.querySelectorAll('[style]').forEach(el => {
                    if (el === clonedAvatarEl) return; // 아바타 스타일은 유지
                    const style = el.getAttribute('style');
                    if (style && !style.includes('background') && !style.includes('width')) {
                        el.removeAttribute('style');
                    }
                });
            }

            for (const img of clonedNode.querySelectorAll('img')) {
                if (img.src) img.src = await imageUrlToBase64(img.src);
                if (!applyStyles) {
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                }
            }

            clonedNode.querySelectorAll('button').forEach(btn => {
                if (btn.classList.contains('x-risu-tab-button')) return;
                const buttonText = btn.textContent.trim();
                const metaButtons = ['Plugin', 'System', 'Model', 'API'];
                if (buttonText && metaButtons.some(meta => buttonText.toLowerCase().includes(meta.toLowerCase()))) {
                    btn.remove();
                    return;
                }

                // 버튼을 <span>으로 교체하는 대신, 비활성화하고 클릭 이벤트를 막습니다.
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
                // 이제 이 버튼은 스크립트의 다른 부분(applyInlineStyles)에서 스타일이 복사됩니다.
            });

            finalHtml += clonedNode.outerHTML;
        }
        console.log('[Log Exporter] Generated HTML for', finalHtml ? 'messages' : '0 messages');

        return finalHtml;
    }
    /**
     * [신규] 메시지 DOM 노드에서 UI 관련 요소를 지능적으로 필터링합니다.
     * @param {HTMLElement} elementToFilter - 필터링을 적용할 원본 DOM 요소.
     * @param {object} options - 필터링 옵션 { complexityThreshold }.
     * @returns {HTMLElement} 필터링이 적용된 복제된 DOM 요소.
     */
    function filterUiElementsFromNode(elementToFilter, options = {}) {
        const { complexityThreshold = 25 } = options;
        const tempEl = elementToFilter.cloneNode(true);

        // 이미지 개수 확인
        const imgCount = tempEl.querySelectorAll('img').length;
        console.log('[Log Exporter] filterUiElementsFromNode - images before filter:', imgCount);

        const childCountThreshold = Math.max(3, 30 - Math.floor(complexityThreshold / 2));
        const textDensityMultiplier = Math.max(5, 40 - Math.floor(complexityThreshold / 2));
        const keywordThreshold = Math.max(2, Math.floor(8 - complexityThreshold / 8));

        // 이미지를 포함한 요소는 제거하지 않음
        tempEl.querySelectorAll('table, details, summary, select, input, style, script, button, title, label, ul').forEach(el => {
            if (!el.querySelector('img') && el.tagName !== 'IMG') {
                el.remove();
            }
        });

        const uiKeywords = ['게시판', '정보', '설정', '퀘스트', '프로필', '새로고침', '글쓰기', '조회', '추천', '등록일', '작성자'];
        const allDivs = tempEl.querySelectorAll('div');
        for (let i = allDivs.length - 1; i >= 0; i--) {
            const div = allDivs[i];
            if (!div.parentElement) continue;

            // 이미지를 포함한 div는 제거하지 않음
            if (div.querySelector('img')) continue;

            if (keywordThreshold < 8) {
                const text = div.textContent;
                let keywordCount = 0;
                uiKeywords.forEach(keyword => { if (text.includes(keyword)) keywordCount++; });
                if (keywordCount >= keywordThreshold) {
                    div.remove();
                    continue;
                }
            }
        }

        const allElements = tempEl.querySelectorAll('div, span, p');
        for (let i = allElements.length - 1; i >= 0; i--) {
            const el = allElements[i];
            if (!el.parentElement) continue;

            // 이미지를 포함한 요소는 건너뛰기
            if (el.querySelector('img') || el.tagName === 'IMG') continue;

            if (el.matches('[class*="quote"], [class*="thought"], [class*="sound"]')) continue;

            const descendantCount = el.children.length;
            const textLength = el.textContent.trim().length;
            const containsParagraphs = el.querySelector('p');

            if (descendantCount > childCountThreshold && textLength < descendantCount * textDensityMultiplier && !containsParagraphs) {
                el.remove();
                continue;
            }

            if (descendantCount === 0 && textLength > 0 && textLength < 50 && !containsParagraphs) {
                const cleanedText = el.textContent.trim();

                const uiTextPattern = /:|\d+\s*\/\s*\d+|^\?{2,}$/;
                const isAllCapsAbbreviation = /^[A-Z]{2,5}$/.test(cleanedText);
                const isDateTimeMeta = /\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}/.test(cleanedText);

                if (complexityThreshold > 15 && (uiTextPattern.test(cleanedText) || isAllCapsAbbreviation || isDateTimeMeta)) {
                    el.remove();
                    continue;
                }
            }
        }

        // 필터링 후 이미지 개수 확인
        const imgCountAfter = tempEl.querySelectorAll('img').length;
        console.log('[Log Exporter] filterUiElementsFromNode - images after filter:', imgCountAfter);

        return tempEl;
    }
    /**
     * [수정] '기본' 형식을 위한 로그 문자열을 생성합니다.
     * UI 필터링을 지원하며, 가독성을 높인 카드 스타일의 HTML을 생성합니다.
     * @param {HTMLElement[]} nodes - 변환할 메시지 DOM 노드 배열.
     * @param {object} [options={}] - 추가 옵션 (필터링 여부 및 강도).
     * @returns {Promise<string>} 형식화된 로그 HTML 문자열.
     */
    async function generateBasicFormatLog(nodes, options = {}) {
    const { useFilter = false, complexityThreshold = 25 } = options;
    let log = '';

    for (const node of nodes) {
        if (node.querySelector('textarea')) continue;

        let name = '';
        const nameEl = node.querySelector('.chat-user-name') || node.querySelector('[class*="user-name"]');
        if (nameEl) {
            name = nameEl.textContent.trim();
        } else {
            name = node.classList.contains('justify-end') ? 'User' : 'Assistant';
        }

        const messageEl = node.querySelector('.prose') || node.querySelector('[class*="prose"]');
        if (!messageEl) continue;

        let contentSourceEl;
        if (useFilter) {
            contentSourceEl = filterUiElementsFromNode(messageEl, { complexityThreshold });
        } else {
            contentSourceEl = messageEl.cloneNode(true);
        }

        // 모든 이미지를 Base64로 변환
        for (const img of contentSourceEl.querySelectorAll('img')) {
            if (img.src) {
                img.src = await imageUrlToBase64(img.src);
                Object.assign(img.style, {
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    display: 'block',
                    marginTop: '10px',
                    marginBottom: '10px'
                });
            }
        }

        contentSourceEl.querySelectorAll('button, script, style, .log-exporter-msg-btn-group').forEach(el => {
            if (!el.querySelector('img') && el.tagName !== 'IMG') {
                el.remove();
            }
        });

        const messageHtml = contentSourceEl.innerHTML.trim();
        if (messageHtml.length === 0) continue;
        
        const isUser = node.classList.contains('justify-end');
        const cardBgColor = isUser ? '#414868' : '#24283b';
        const nameColor = '#e0e7ff';  // 밝은 라벤더색으로 변경
        const textColor = '#ffffff';   // 순수 하얀색으로 변경

        log += `
            <div style="margin-bottom: 24px;">
              <strong style="color: ${nameColor}; font-weight: bold; font-size: 0.95em; display: block; margin-bottom: 6px; padding-left: 4px;">${name}</strong>
              <div style="background-color: ${cardBgColor}; color: ${textColor}; border-radius: 12px; padding: 12px 16px; line-height: 1.65; word-wrap: break-word; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                ${messageHtml}
              </div>
            </div>
        `;
    }
    
    return `<div style="padding: 20px 15px; background-color: #1a1b26; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">${log}</div>`;
}

    /**
     * 채팅 메시지 DOM 노드를 '일반 텍스트' 또는 '마크다운' 형식의 문자열로 변환합니다.
     * UI 필터링 옵션이 활성화된 경우, 복잡도(complexity) 설정에 따라 대화와 관련 없는 UI 텍스트(버튼, 메타데이터 등)를 지능적으로 제거합니다.
     * @param {HTMLElement[]} nodes - 변환할 메시지 DOM 노드 배열.
     * @param {'text'|'markdown'} format - 출력 형식.
     * @param {object} [options={}] - 추가 옵션 (필터링 여부 및 강도).
     * @returns {Promise<string>} 형식화된 로그 문자열.
     */
    async function generateFormattedLog(nodes, format, options = {}) {
        const { useFilter = true, complexityThreshold = 25 } = options;
        let log = '';
        console.log('[Log Exporter] Generating formatted log for', nodes.length, 'messages');
        for (const node of nodes) {
            if (node.querySelector('textarea')) {
                console.log('[Log Exporter] Skipping message with textarea');
                continue;
            }
            const chatIdx = node.querySelector('[data-chat-index]')?.getAttribute('data-chat-index');
            console.log('[Log Exporter] Processing text for message index:', chatIdx);
            let name = '';
            const nameEl = node.querySelector('.chat-user-name') || node.querySelector('[class*="user-name"]');
            if (nameEl) {
                name = nameEl.textContent.trim();
            }

            let message = '';
            const messageEl = node.querySelector('.prose') || node.querySelector('[class*="prose"]');

            if (messageEl) {
                if ((format === 'text' || format === 'markdown') && useFilter) {
                    const tempEl = messageEl.cloneNode(true);

                    const childCountThreshold = Math.max(3, 30 - Math.floor(complexityThreshold / 2));
                    const textDensityMultiplier = Math.max(5, 40 - Math.floor(complexityThreshold / 2));
                    const keywordThreshold = Math.max(2, Math.floor(8 - complexityThreshold / 8));

                    tempEl.querySelectorAll('table, details, summary, select, input, style, script, button, title, label, ul').forEach(el => el.remove());

                    const uiKeywords = ['게시판', '정보', '설정', '퀘스트', '프로필', '새로고침', '글쓰기', '조회', '추천', '등록일', '작성자'];
                    const allDivs = tempEl.querySelectorAll('div');
                    for (let i = allDivs.length - 1; i >= 0; i--) {
                        const div = allDivs[i];
                        if (!div.parentElement) continue;
                        if (keywordThreshold < 8) {
                            const text = div.textContent;
                            let keywordCount = 0;
                            uiKeywords.forEach(keyword => { if (text.includes(keyword)) keywordCount++; });
                            if (keywordCount >= keywordThreshold) {
                                div.remove();
                                continue;
                            }
                        }
                    }

                    const allElements = tempEl.querySelectorAll('div, span, p');
                    for (let i = allElements.length - 1; i >= 0; i--) {
                        const el = allElements[i];
                        if (!el.parentElement) continue;
                        if (el.matches('[class*="quote"], [class*="thought"], [class*="sound"]')) continue;

                        const descendantCount = el.children.length;
                        const textLength = el.textContent.trim().length;
                        const containsParagraphs = el.querySelector('p');

                        if (descendantCount > childCountThreshold && textLength < descendantCount * textDensityMultiplier && !containsParagraphs) {
                            el.remove();
                            continue;
                        }

                        if (descendantCount === 0 && textLength > 0 && textLength < 50 && !containsParagraphs) {
                            const cleanedText = el.textContent.trim();

                            const uiTextPattern = /:|\d+\s*\/\s*\d+|^\?{2,}$/;
                            const isAllCapsAbbreviation = /^[A-Z]{2,5}$/.test(cleanedText);
                            const isDateTimeMeta = /\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}/.test(cleanedText);

                            if (complexityThreshold > 15 && (uiTextPattern.test(cleanedText) || isAllCapsAbbreviation || isDateTimeMeta)) {
                                el.remove();
                                continue;
                            }
                        }
                    }

                    message = tempEl.textContent.trim();
                    message = message.replace(/\n\s*\n/g, '\n\n');

                } else {
                    message = messageEl.textContent.trim();
                }
            }

            if (!name && !message) continue;
            if (message.length === 0) continue;

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
     * 주어진 콘텐츠를 사용자의 클립보드에 복사합니다.
     * 최신 Clipboard API를 우선적으로 사용하며, HTML 형식 복사도 지원합니다.
     * API 사용이 불가능할 경우 구형 `execCommand` 방식으로 대체 작동합니다.
     * @param {string} content - 복사할 내용.
     * @param {'text'|'html'} [format='text'] - 복사할 콘텐츠의 형식.
     * @returns {Promise<boolean>} 복사 성공 여부.
     */
    async function copyToClipboard(content, format = 'text') {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                if (format === 'html') {
                    const blob = new Blob([content], { type: 'text/html' });
                    await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
                } else {
                    await navigator.clipboard.writeText(content);
                }
                return true;
            } catch (err) { console.warn('Clipboard API failed, falling back.', err); }
        }
        const textArea = document.createElement("textarea");
        textArea.value = format === 'html' ? content.replace(/<[^>]*>/g, '') : content;
        Object.assign(textArea.style, { position: 'fixed', top: '-9999px', left: '-9999px' });
        document.body.appendChild(textArea);
        textArea.select();
        let success = false;
        try { success = document.execCommand('copy'); } catch (err) { console.error('execCommand failed', err); }
        document.body.removeChild(textArea);
        return success;
    }

    /**
 * [최종 완성형] 자동 분할 저장 기능을 탑재한 버전.
 * 1. 캔버스 크기 제한 초과 시, 사용자에게 확인을 받은 후 여러 개의 이미지 파일로 자동 분할하여 저장합니다.
 * 2. 각 분할 이미지 저장 시 명확한 진행 상황을 UI에 표시합니다.
 * 3. 0KB 파일 오류를 근본적으로 해결하고, 아무리 긴 로그라도 이미지로 저장할 수 있는 대안을 제공합니다.
 * 4. 모든 이전 안정화 기능(리소스 로딩, 렌더링 대기 등)은 그대로 유지됩니다.
 */
    async function savePreviewAsImage(previewContainer, onProgress, cancellationToken, charName, chatName, useHighRes = false, baseFontSize = 16, imageWidth = 900) {

        const MAX_SAFE_CANVAS_HEIGHT = 65535;

        const collectResourceUrls = (element) => { /* ... */ };
        const loadResourcesInBatches = async (resources) => { /* ... */ };
        const collectResourceUrls_body = `
            const resources = []; const images = Array.from(element.getElementsByTagName('img'));
            images.forEach(img => { if (img.src && !img.src.startsWith('data:')) resources.push({ type: 'image', url: img.src }); });
            for (const sheet of document.styleSheets) { try { if (!sheet.cssRules) continue; for (const rule of sheet.cssRules) { if (rule.type === CSSRule.FONT_FACE_RULE) { const srcMatch = rule.cssText.match(/url\\("(.+?)"\\)/); if (srcMatch && srcMatch[1]) resources.push({ type: 'font', url: srcMatch[1], originalCss: rule.cssText }); } } } catch (e) {} }
            const uniqueUrls = new Set(); return resources.filter(res => { if (uniqueUrls.has(res.url)) return false; uniqueUrls.add(res.url); return true; });
        `;
        const loadResourcesInBatches_body = `
            const BATCH_SIZE = 8; let loadedCount = 0; const totalCount = resources.length; const fontCssList = [];
            for (let i = 0; i < totalCount; i += BATCH_SIZE) { if (cancellationToken.cancelled) throw new Error("Cancelled"); const batch = resources.slice(i, i + BATCH_SIZE);
                const promises = batch.map(resource => new Promise(async (resolve) => { try { if (resource.type === 'image') { const img = new Image(); img.onload = img.onerror = resolve; img.src = resource.url; } else if (resource.type === 'font') { const response = await fetch(resource.url); const blob = await response.blob(); const base64 = await new Promise(r => { const reader = new FileReader(); reader.onloadend = () => r(reader.result); reader.readAsDataURL(blob); }); fontCssList.push(resource.originalCss.replace(resource.url, base64)); resolve(); } } catch (e) { resolve(); } }));
                await Promise.all(promises); loadedCount += batch.length; onProgress(\`리소스 로딩 중... (\${loadedCount}/\${totalCount})\`, loadedCount, totalCount); await new Promise(resolve => setTimeout(resolve, 20));
            } return fontCssList.join('\\n');
        `;
        const _collectResourceUrls = new Function('element', collectResourceUrls_body);
        const _loadResourcesInBatches = new Function('resources', 'cancellationToken', 'onProgress', `return (async () => { ${loadResourcesInBatches_body} })();`);


        const captureTarget = previewContainer.firstElementChild;
        if (!captureTarget) return false;

        const rootHtml = document.documentElement;
        const originalStyles = {
            preview: { width: previewContainer.style.width, height: previewContainer.style.height, maxHeight: previewContainer.style.maxHeight, overflowY: previewContainer.style.overflowY, padding: previewContainer.style.padding, border: previewContainer.style.border },
            target: { transform: captureTarget.style.transform, width: captureTarget.style.width },
            rootHtml: { fontSize: rootHtml.style.fontSize }
        };

        try {
            await ensureHtmlToImage();
            const htmlToImage = window.__htmlToImageLib || window.htmlToImage;

            onProgress('리소스 목록 수집 중...', 0, 100);
            const resourcesToLoad = _collectResourceUrls(captureTarget);
            const fontEmbedCSS = await _loadResourcesInBatches(resourcesToLoad, cancellationToken, onProgress);
            if (cancellationToken.cancelled) return false;

            onProgress('렌더링 준비 중...', 90, 100);
            const pixelRatio = useHighRes ? (window.devicePixelRatio || 2) : 1;

            // [수정] 하드코딩된 값 대신, 전달받은 매개변수를 사용
            rootHtml.style.fontSize = `${baseFontSize}px`;
            captureTarget.style.width = `${imageWidth}px`;
            Object.assign(previewContainer.style, { height: 'auto', maxHeight: 'none', overflowY: 'visible', border: 'none', padding: '0', width: `${imageWidth}px` });

            await new Promise(resolve => requestAnimationFrame(resolve));

            const totalHeight = captureTarget.scrollHeight;
            const totalWidth = captureTarget.scrollWidth;
            const MAX_CHUNK_HEIGHT = 8000;
            const options = { quality: 1.0, pixelRatio, backgroundColor: '#1a1b26', fontEmbedCSS, width: totalWidth, height: MAX_CHUNK_HEIGHT };

            if (totalHeight * pixelRatio <= MAX_SAFE_CANVAS_HEIGHT) {
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = totalWidth * pixelRatio;
                finalCanvas.height = totalHeight * pixelRatio;
                const ctx = finalCanvas.getContext('2d');
                Object.assign(previewContainer.style, { height: `${MAX_CHUNK_HEIGHT}px`, width: `${totalWidth}px`, overflow: 'hidden' });
                const numChunks = Math.ceil(totalHeight / MAX_CHUNK_HEIGHT);

                const processChunk = async (chunkIndex) => {
                    if (cancellationToken.cancelled) throw new Error("Cancelled");
                    if (chunkIndex >= numChunks) return;
                    const chunkY = chunkIndex * MAX_CHUNK_HEIGHT;
                    onProgress(`이미지 분할 생성 중... (${chunkIndex + 1}/${numChunks})`, chunkIndex, numChunks);
                    captureTarget.style.transform = `translateY(-${chunkY}px)`;
                    await new Promise(resolve => requestAnimationFrame(resolve));
                    const chunkCanvas = await htmlToImage.toCanvas(previewContainer, options);
                    const heightToDraw = Math.min(MAX_CHUNK_HEIGHT, totalHeight - chunkY);
                    const sourceHeight = heightToDraw * pixelRatio;
                    ctx.drawImage(chunkCanvas, 0, 0, chunkCanvas.width, sourceHeight, 0, chunkY * pixelRatio, chunkCanvas.width, sourceHeight);
                    await new Promise(resolve => setTimeout(resolve, 20));
                    await processChunk(chunkIndex + 1);
                };
                await processChunk(0);
                if (cancellationToken.cancelled) throw new Error("Cancelled");
                onProgress('이미지 병합 및 finalizing...', numChunks, numChunks);
                downloadImage(finalCanvas.toDataURL('image/png', 1.0), charName, chatName);

            } else {
                const numImages = Math.ceil(totalHeight / MAX_CHUNK_HEIGHT);
                const userConfirmed = confirm(`[알림] 로그가 너무 길어 단일 이미지로 만들 수 없습니다.\n\n대신 ${numImages}개의 이미지 파일로 분할하여 저장합니다. 계속하시겠습니까?`);
                if (!userConfirmed) return false;

                Object.assign(previewContainer.style, { height: `${MAX_CHUNK_HEIGHT}px`, width: `${totalWidth}px`, overflow: 'hidden' });

                const saveChunkAsImage = async (chunkIndex) => {
                    if (cancellationToken.cancelled) throw new Error("Cancelled");
                    if (chunkIndex >= numImages) return;
                    const chunkY = chunkIndex * MAX_CHUNK_HEIGHT;
                    onProgress(`이미지 ${chunkIndex + 1}/${numImages} 저장 중...`, chunkIndex, numImages);
                    captureTarget.style.transform = `translateY(-${chunkY}px)`;
                    await new Promise(resolve => requestAnimationFrame(resolve));
                    const chunkCanvas = await htmlToImage.toCanvas(previewContainer, options);
                    const heightToDraw = Math.min(MAX_CHUNK_HEIGHT, totalHeight - chunkY);

                    const finalChunkCanvas = document.createElement('canvas');
                    finalChunkCanvas.width = totalWidth * pixelRatio;
                    finalChunkCanvas.height = heightToDraw * pixelRatio;
                    const chunkCtx = finalChunkCanvas.getContext('2d');
                    chunkCtx.drawImage(chunkCanvas, 0, 0, finalChunkCanvas.width, finalChunkCanvas.height, 0, 0, finalChunkCanvas.width, finalChunkCanvas.height);

                    downloadImage(finalChunkCanvas.toDataURL('image/png', 1.0), charName, chatName, { partNumber: chunkIndex + 1, showCompletionAlert: false });

                    await new Promise(resolve => setTimeout(resolve, 500));
                    await saveChunkAsImage(chunkIndex + 1);
                };
                await saveChunkAsImage(0);
                if (cancellationToken.cancelled) throw new Error("Cancelled");
                alert(`${numImages}개의 이미지 파일로 분할하여 저장되었습니다.`, 'success');
            }
            return true;

        } catch (e) {
            if (e.message !== "Cancelled") console.error('[Log Exporter] Image save error:', e);
            return false;
        } finally {
            Object.assign(previewContainer.style, originalStyles.preview);
            Object.assign(captureTarget.style, originalStyles.target);
            Object.assign(rootHtml.style, originalStyles.rootHtml);
        }
    }
    /**
 * [수정됨] 이미지 다운로드 헬퍼 함수. 분할 저장을 위해 파트 번호를 지원하고, 완료 알림을 제어할 수 있습니다.
 */
    function downloadImage(dataUrl, charName, chatName, options = {}) {
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
     * [신규 추가] 문서에 로드된 모든 @font-face 규칙을 수집합니다.
     * html-to-image 라이브러리가 웹 폰트를 올바르게 렌더링하도록 돕습니다.
     * @returns {Promise<string>} 모든 @font-face CSS 규칙을 포함하는 문자열.
     */
    async function getFontEmbedCss() {
        const fontFaces = [];
        const fontURLs = new Set(); // 중복된 URL 로드를 방지하기 위함

        // CSS 규칙에서 폰트 정보를 추출하는 함수
        const processCssRules = async (rules) => {
            for (const rule of rules) {
                if (rule.type === CSSRule.FONT_FACE_RULE) {
                    const srcMatch = rule.cssText.match(/url\("(.+?)"\)/);
                    if (srcMatch && srcMatch[1]) {
                        const url = srcMatch[1];
                        if (!fontURLs.has(url)) {
                            fontURLs.add(url);
                            try {
                                // 폰트 파일을 fetch하여 Base64로 변환합니다.
                                const response = await fetch(url);
                                const blob = await response.blob();
                                const base64 = await new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                                // CSS 텍스트의 URL을 Base64 데이터로 교체합니다.
                                const newCssText = rule.cssText.replace(url, base64);
                                fontFaces.push(newCssText);
                            } catch (e) {
                                console.warn(`[Log Exporter] Could not fetch font: ${url}`, e);
                                // 실패 시 원본 CSS 규칙이라도 추가
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
        return fontFaces.join('\n');
    }

/**
 * [개선됨] 메시지 노드들에서 사용된 모든 x-risu 클래스명을 수집하고,
 * 부모-자식 계층 구조와 이미지 포함 여부를 분석하여 구조화된 객체 배열로 반환합니다.
 * @param {HTMLElement[]} nodes - 분석할 메시지 DOM 노드의 배열.
 * @returns {{name: string, displayName: string, hasImage: boolean}[]} 클래스 정보 객체 배열.
 */
function collectUIClasses(nodes) {
    const classDetails = new Map();
    const classHierarchy = new Map();

    // 1단계: 모든 x-risu 클래스와 그 속성(이미지, 부모) 수집
    nodes.forEach(node => {
        node.querySelectorAll('*[class*="x-risu-"]').forEach(el => {
            const currentClasses = Array.from(el.classList).filter(c => c.startsWith('x-risu-'));
            if (currentClasses.length === 0) return;

            const containsImage = el.querySelector('img') !== null;
            
            let parentEl = el.parentElement;
            let parentRisuClass = null;
            while(parentEl && parentEl !== node) {
                const parentClasses = Array.from(parentEl.classList).filter(c => c.startsWith('x-risu-'));
                if (parentClasses.length > 0) {
                    parentRisuClass = parentClasses[0]; // 가장 가까운 첫 번째 부모 클래스를 대표로 삼음
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
    
    // 2단계: 계층 구조(부모-자식 관계) 정리
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

    // 3단계: 최종 출력 배열 생성 (계층 구조에 따라 재귀적으로)
    const result = [];
    const buildDisplayList = (classNames, depth) => {
        classNames.sort().forEach(className => {
            const details = classDetails.get(className);
            if (!details) return;

            let displayName = ' '.repeat(depth * 2) + (depth > 0 ? '└ ' : '') + className;
            if (details.hasImage) {
                displayName += ' (이미지 포함 되어 있음)';
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

    return result;
}

    /**
     * [신규] 사용자가 선택한 클래스들을 기반으로 요소를 필터링합니다.
     * 이미지는 보존하면서 UI 요소만 제거합니다.
     */
    function filterWithCustomClasses(node, selectedClasses) {
        const tempEl = node.cloneNode(true);

        // 모든 이미지와 이미지 컨테이너를 찾아서 저장
        const imageContainers = [];
        tempEl.querySelectorAll('img').forEach((img, index) => {
            // 이미지를 포함하는 x-risu 컨테이너 찾기
            let container = img.closest('[class*="x-risu-"]');

            // 컨테이너가 있으면 전체를 저장, 없으면 이미지만 저장
            const toSave = container || img;
            const placeholder = document.createElement('div');
            placeholder.setAttribute('data-image-placeholder', index);
            placeholder.style.display = 'none';

            imageContainers.push({
                element: toSave.cloneNode(true),
                parent: toSave.parentElement,
                nextSibling: toSave.nextSibling
            });

            toSave.parentElement.insertBefore(placeholder, toSave);
            toSave.remove();
        });

        // 선택된 클래스를 가진 요소들 제거 (이미지는 이미 안전하게 저장됨)
        selectedClasses.forEach(className => {
            tempEl.querySelectorAll(`.${className}`).forEach(el => {
                el.remove();
            });
        });

        // 이미지 및 이미지 컨테이너 복원
        tempEl.querySelectorAll('[data-image-placeholder]').forEach(placeholder => {
            const index = parseInt(placeholder.getAttribute('data-image-placeholder'));
            const saved = imageContainers[index];
            if (saved && saved.element) {
                placeholder.replaceWith(saved.element);
            }
        });

        return tempEl;
    }

    /**
* 로그 내보내기 옵션을 설정하고 결과를 미리 볼 수 있는 메인 모달 창을 표시합니다.
* 이 함수는 모달의 생성, 이벤트 리스너 설정, 미리보기 업데이트 등 모든 UI 상호작용을 총괄합니다.
* 사용자의 선택에 따라 다른 형식(HTML, 텍스트, 마크다운)의 로그를 생성하고 내보내기/복사 기능을 실행합니다.
* @param {number} chatIndex - 내보낼 채팅의 인덱스.
* @param {object} [options={}] - 추가 옵션 (특정 메시지부터 내보내기 등).
*/
    async function showCopyPreviewModal(chatIndex, options = {}) {
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
                if (node.classList.contains('justify-end')) return '사용자';
                const nameEl = node.querySelector('.unmargin.text-xl');
                return nameEl ? nameEl.textContent.trim() : charName;
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

            // x-risu UI 클래스 수집
            const uiClasses = collectUIClasses(messageNodes);

            // 일반적으로 필터링하면 좋은 x-risu 클래스들
            const defaultFilterClasses = [
                'x-risu-a-status-window',
                'x-risu-game-alert-content',
                'x-risu-hunter-container',
                'x-risu-regex-game-system-alert-wrapper'
            ];

            // 커스텀 필터 체크박스 HTML 생성
            let customFilterHtml = '';
if (uiClasses.length > 0) {
    customFilterHtml = `
    <div id="custom-filter-section" style="display: none; ...">
        <strong>RisuAI UI 요소 필터:</strong>
        <div style="max-height: 200px; overflow-y: auto; ...">
            ${uiClasses.map(classInfo => `
                <label style="display: flex; align-items: center; ...">
                    <input type="checkbox" class="custom-filter-class" data-class="${classInfo.name}" 
                           ${!classInfo.hasImage ? 'checked' : ''}>
                    <span style="font-size: 0.85em; margin-left: 5px; font-family: monospace;">${classInfo.displayName}</span>
                </label>
            `).join('')}
        </div>
        ...
    </div>`;
}

            const modal = document.createElement('div');
            modal.className = 'log-exporter-modal-backdrop';
            modal.innerHTML = `
            <div class="log-exporter-modal">
                <div class="log-exporter-modal-header">로그 내보내기 옵션</div>
                <div class="log-exporter-modal-content">
                    <div class="log-exporter-modal-options">
                        <strong>형식:</strong>
                        <label><input type="radio" name="log-format" value="html" checked> HTML</label>
                        <label><input type="radio" name="log-format" value="basic"> 기본</label>
                        <label><input type="radio" name="log-format" value="markdown"> 마크다운</label>
                        <label><input type="radio" name="log-format" value="text"> 일반 텍스트</label>
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
                            <div id="filter-slider-container" style="display: flex; align-items: center; gap: 8px;">
                                <label for="filter-strength-slider" title="값이 높을수록 더 많은 UI를 제거합니다.">필터 강도:</label>
                                <input type="range" id="filter-strength-slider" min="1" max="50" value="25" step="1" style="width: 80px;">
                                <span id="filter-strength-value" style="font-size: 0.9em; width: 20px;">25</span>
                            </div>
                        </div>
                    </div>
                    ${customFilterHtml}
                    <div style="background: #1f2335; padding: 10px; border-radius: 5px;">
                        <strong>참가자 필터:</strong>
                        <div id="participant-filter-container" style="display: flex; flex-wrap: wrap; margin-top: 8px;">
                            ${participantCheckboxesHtml}
                        </div>
                    </div>
                    <strong>미리보기:</strong>
                    <div class="log-exporter-modal-preview"><div style="text-align:center;color:#8a98c9;">로그 데이터 생성 중...</div></div>
                </div>
                <div class="log-exporter-modal-footer" id="log-exporter-footer">
                    <button class="log-exporter-modal-btn" id="log-exporter-close">닫기</button>
                    <button class="log-exporter-modal-btn" id="log-exporter-save-file">HTML 파일로 저장</button>
                    
                    <div id="image-export-controls" style="display: flex; align-items: center; gap: 15px; margin-left: auto; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <label for="image-font-size" style="font-size: 0.9em; color: #a9b1d6;" title="이미지의 기준 폰트 크기를 조절합니다.">폰트:</label>
                            <input type="number" id="image-font-size" value="16" step="1" style="width: 45px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 3px; padding: 2px;">
                            <span style="font-size: 0.9em; color: #a9b1d6;">px</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <label for="image-width" style="font-size: 0.9em; color: #a9b1d6;" title="이미지의 가로 너비를 조절합니다.">너비:</label>
                            <input type="number" id="image-width" value="400" step="10" style="width: 60px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 3px; padding: 2px;">
                            <span style="font-size: 0.9em; color: #a9b1d6;">px</span>
                        </div>
                        <label style="font-size: 0.9em; color: #a9b1d6; cursor: pointer;" title="체크 시 원본 해상도로 저장하여 매우 선명하지만, 처리 시간이 길어집니다.">
                            <input type="checkbox" id="high-res-toggle"> 고해상도
                        </label>
                        <button class="log-exporter-modal-btn image-save" id="log-exporter-save-image">이미지로 저장</button>
                    </div>
                    
                    <button class="log-exporter-modal-btn primary" id="log-exporter-copy">클립보드에 복사</button>
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
            const filterSliderContainer = modal.querySelector('#filter-slider-container');
            const filterSlider = modal.querySelector('#filter-strength-slider');
            const filterValueDisplay = modal.querySelector('#filter-strength-value');
            const applyImageScaling = () => {
                const scale = imageScaleSlider.value;
                imageScaleValue.textContent = `${scale}%`;
                // 미리보기 안의 모든 이미지에 max-width 스타일 적용
                previewEl.querySelectorAll('img').forEach(img => {
                    img.style.maxWidth = `${scale}%`;
                    img.style.height = 'auto'; // 종횡비 유지를 위해 height는 auto로 설정
                });
            };
            imageScaleSlider.addEventListener('input', applyImageScaling);
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

            const buildFullHtml = (content) => {
                return `<div style="padding:15px;background-color:#1a1b26;max-width:900px;width:100%;margin:auto;font-family:sans-serif;line-height:1.6;color:#c0caf5;box-sizing:border-box;">
                <div style="text-align:center;padding-bottom:15px;margin-bottom:20px; border-bottom:1px solid #414868;">
                    <img src="${charAvatarBase64}" alt="${charName}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin:0 auto 10px;border:2px solid #414868;display:block;">
                    <h2 style="margin:0 0 5px 0;font-size:1.5em;color:#c0caf5;font-weight:bold;">${charName}</h2>
                    <p style="margin:0;color:#8a98c9;font-size:0.95em;">${chatName}</p>
                </div>
                <div>${content}</div>
            </div>`;
            };

            // updatePreview를 먼저 함수 선언문으로 정의
            async function updatePreview() {
                const selectedFormat = modal.querySelector('input[name="log-format"]:checked').value;
                const isImageFormat = selectedFormat === 'html' || selectedFormat === 'basic';
                imageScaleControls.style.display = isImageFormat ? 'flex' : 'none';

                previewEl.innerHTML = `<div style="text-align:center;color:#8a98c9;">미리보기 생성 중...</div>`;
                let filteredNodes = getFilteredNodes();

                // 커스텀 필터 적용
                const customFilterSection = modal.querySelector('#custom-filter-section');
                if (filterToggleCheckbox.checked && customFilterSection) {
                    const selectedClasses = Array.from(modal.querySelectorAll('.custom-filter-class:checked'))
                        .map(cb => cb.dataset.class);

                    if (selectedClasses.length > 0) {
                        // 각 노드를 복제하여 필터링 적용
                        filteredNodes = filteredNodes.map(node => {
                            const clonedNode = node.cloneNode(true);

                            // 이미지 관련 테이블은 특별 처리
                            const assetTables = clonedNode.querySelectorAll('.x-risu-asset-table');
                            const savedAssetTables = Array.from(assetTables).map(table => ({
                                table: table.cloneNode(true),
                                parent: table.parentElement,
                                nextSibling: table.nextSibling
                            }));

                            // 필터 적용
                            const filtered = filterWithCustomClasses(clonedNode, selectedClasses);

                            // 이미지 테이블 복원 (필요한 경우)
                            if (selectedClasses.includes('x-risu-asset-table')) {
                                // 사용자가 asset-table을 제거하기로 선택한 경우는 복원하지 않음
                            } else {
                                // asset-table이 실수로 제거된 경우 복원
                                savedAssetTables.forEach(({ table, parent, nextSibling }) => {
                                    const targetParent = filtered.querySelector(`:scope > *:nth-child(${Array.from(parent.children).indexOf(table) + 1})`);
                                    if (targetParent && !filtered.querySelector('.x-risu-asset-table')) {
                                        if (nextSibling) {
                                            parent.insertBefore(table, nextSibling);
                                        } else {
                                            parent.appendChild(table);
                                        }
                                    }
                                });
                            }

                            return filtered;
                        });
                    }
                }

                const useFilter = filterToggleCheckbox.checked;
                const threshold = parseInt(filterSlider.value, 10);
                filterSliderContainer.style.display = useFilter ? 'flex' : 'none';

                if (selectedFormat === 'html') {
                    filterControls.style.display = 'none';
                    htmlStyleControls.style.display = 'inline-flex';
                    saveImageControls.style.display = 'flex';
                    saveFileBtn.style.display = 'inline-block';
                    const useStyled = styleToggleCheckbox.checked;
                    const content = await generateHtmlFromNodes(filteredNodes, useStyled);
                    previewEl.innerHTML = buildFullHtml(content);
                } else if (selectedFormat === 'basic') {
                    filterControls.style.display = 'flex';
                    htmlStyleControls.style.display = 'none';
                    saveImageControls.style.display = 'none';
                    saveFileBtn.style.display = 'none';
                    const content = await generateBasicFormatLog(filteredNodes, { useFilter, complexityThreshold: threshold });
                    previewEl.innerHTML = content;
                } else {
                    filterControls.style.display = 'flex';
                    htmlStyleControls.style.display = 'none';
                    saveImageControls.style.display = 'none';
                    saveFileBtn.style.display = 'none';
                    const content = await generateFormattedLog(filteredNodes, selectedFormat, { useFilter, complexityThreshold: threshold });
                    previewEl.innerHTML = `<pre>${content.replace(/</g, "&lt;")}</pre>`;
                }
                applyImageScaling();
            }

            // 이제 updatePreview를 사용하는 이벤트 리스너들 설정
            const customFilterToggle = modal.querySelector('#custom-filter-toggle');
            const customFilterSection = modal.querySelector('#custom-filter-section');

            if (customFilterToggle && customFilterSection) {
                customFilterToggle.addEventListener('click', () => {
                    const isVisible = customFilterSection.style.display !== 'none';
                    customFilterSection.style.display = isVisible ? 'none' : 'block';
                    customFilterToggle.textContent = isVisible ? '커스텀 필터 설정 ▼' : '커스텀 필터 설정 ▲';
                });

                modal.querySelector('#select-all-filters')?.addEventListener('click', () => {
                    modal.querySelectorAll('.custom-filter-class').forEach(cb => cb.checked = true);
                    updatePreview();
                });

                modal.querySelector('#clear-all-filters')?.addEventListener('click', () => {
                    modal.querySelectorAll('.custom-filter-class').forEach(cb => cb.checked = false);
                    updatePreview();
                });

                modal.querySelector('#reset-default-filters')?.addEventListener('click', () => {
                     const classInfoMap = new Map(uiClasses.map(info => [info.name, info]));
    modal.querySelectorAll('.custom-filter-class').forEach(cb => {
        const info = classInfoMap.get(cb.dataset.class);
        if (info) {
            cb.checked = !info.hasImage; // hasImage가 false이면 true (체크됨)
        }
    });
    updatePreview();
                });

                modal.querySelectorAll('.custom-filter-class').forEach(cb => {
                    cb.addEventListener('change', updatePreview);
                });
            }

            modal.querySelectorAll('input[name="log-format"], #style-toggle-checkbox, #filter-toggle-checkbox, .participant-filter-checkbox').forEach(el => {
                el.addEventListener('change', updatePreview);
            });
            filterSlider.addEventListener('input', () => {
                filterValueDisplay.textContent = filterSlider.value;
                updatePreview();
            });

            // 초기 프리뷰 생성
            updatePreview();

            // 나머지 이벤트 리스너들...
            const closeModal = () => modal.remove();
            modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
            modal.querySelector('#log-exporter-close').addEventListener('click', closeModal);

            saveFileBtn.addEventListener('click', async () => {
                try {
                    const filteredNodes = getFilteredNodes();
                    const useStyled = styleToggleCheckbox.checked;
                    const messagesHtml = await generateHtmlFromNodes(filteredNodes, useStyled);
                    await generateAndDownloadHtmlFile(charName, chatName, charAvatarUrl, messagesHtml, useStyled, extractedCss);
                    closeModal();
                } catch (e) { console.error('[Log Exporter] File save error from modal:', e); }
            });

            const footer = modal.querySelector('#log-exporter-footer');
            const progressFooter = modal.querySelector('#log-exporter-progress-footer');
            const progressBar = modal.querySelector('#export-progress-bar');
            const progressStatusText = modal.querySelector('#progress-status-text');
            const progressPercentageText = modal.querySelector('#progress-percentage-text');
            const cancelBtn = modal.querySelector('#log-exporter-cancel-image');
            const saveImageBtn = modal.querySelector('#log-exporter-save-image');

            const fontSizeInput = modal.querySelector('#image-font-size');
            const imageWidthInput = modal.querySelector('#image-width');

            let cancellationToken = { cancelled: false };

            const updateProgress = (status, value, max) => {
                if (cancellationToken.cancelled) return;
                progressStatusText.textContent = status;
                progressBar.value = value;
                progressBar.max = max;
                progressPercentageText.textContent = `${Math.round((value / max) * 100)}%`;
            };

            saveImageBtn.addEventListener('click', async () => {
                const useHighRes = modal.querySelector('#high-res-toggle').checked;
                const baseFontSize = parseInt(fontSizeInput.value, 10) || 16;
                const imageWidth = parseInt(imageWidthInput.value, 10) || 400;

                cancellationToken.cancelled = false;

                footer.style.display = 'none';
                progressFooter.style.display = 'flex';
                updateProgress('이미지 생성 준비 중...', 0, 100);

                const success = await savePreviewAsImage(previewEl, updateProgress, cancellationToken, charName, chatName, useHighRes, baseFontSize, imageWidth);

                footer.style.display = 'flex';
                progressFooter.style.display = 'none';

                if (success) {
                    closeModal();
                } else {
                    if (!cancellationToken.cancelled) {
                        alert("이미지 저장이 실패했거나 중단되었습니다.", "error");
                    }
                }
            });

            cancelBtn.addEventListener('click', () => {
                cancellationToken.cancelled = true;
                console.log('[Log Exporter] Image export cancelled by user.');
            });

            modal.querySelector('#log-exporter-copy').addEventListener('click', async () => {
                let filteredNodes = getFilteredNodes();
                const selectedFormat = modal.querySelector('input[name="log-format"]:checked').value;

                // 커스텀 필터 적용 (updatePreview와 동일하게)
                const customFilterSection = modal.querySelector('#custom-filter-section');
                if (filterToggleCheckbox.checked && customFilterSection) {
                    const selectedClasses = Array.from(modal.querySelectorAll('.custom-filter-class:checked'))
                        .map(cb => cb.dataset.class);

                    if (selectedClasses.length > 0) {
                        filteredNodes = filteredNodes.map(node => {
                            return filterWithCustomClasses(node, selectedClasses);
                        });
                    }
                }

                const useFilter = filterToggleCheckbox.checked;
                const threshold = parseInt(filterSlider.value, 10);

                let toCopy, copyFormat;

                if (selectedFormat === 'html') {
                    const useStyled = styleToggleCheckbox.checked;
                    const htmlContent = await generateHtmlFromNodes(filteredNodes, useStyled);
                    toCopy = buildFullHtml(htmlContent).replace('<div style="padding:15px;background-color:#1a1b26', '<div style="border:1px solid #414868;border-radius:8px;padding:15px;background-color:#1a1b26');
                    copyFormat = 'html';
                } else if (selectedFormat === 'basic') {
                    // 필터링 옵션을 전달
                    toCopy = await generateBasicFormatLog(filteredNodes, { useFilter, complexityThreshold: threshold });
                    copyFormat = 'html';
                } else {
                    // markdown/text 형식도 필터링 옵션 전달
                    toCopy = await generateFormattedLog(filteredNodes, selectedFormat, { useFilter, complexityThreshold: threshold });
                    copyFormat = 'text';
                }

                const success = await copyToClipboard(toCopy, copyFormat);
                if (success) {
                    closeModal();
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
 * RisuAI 인터페이스의 채팅 목록과 각 메시지 말풍선에 '로그 내보내기' 버튼을 동적으로 주입합니다.
 * 이미 버튼이 존재하는 경우 중복 생성을 방지합니다.
 */
    function injectButtons() {
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
     * DOM(문서 객체 모델)의 변경을 감시하는 `MutationObserver`를 시작합니다.
     * 채팅 목록이 변경되거나 새 메시지가 로드될 때마다 `injectButtons` 함수를 호출하여,
     * 새로 생긴 요소에도 내보내기 버튼이 추가되도록 합니다.
     */
    function startObserver() {
        if (observer) observer.disconnect();
        observer = new MutationObserver(() => setTimeout(injectButtons, 300));
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(injectButtons, 500);
    }

    /**
     * 플러그인이 언로드(비활성화)될 때 실행되는 정리 함수입니다.
     * 생성했던 모든 UI 요소(버튼, 모달, 스타일)를 제거하고, `MutationObserver`의 감시를 중지하여 리소스를 정리합니다.
     */
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

    // --- 플러그인 초기화 ---
    injectModalStyles();
    // [변경] ensureDomToImage -> ensureHtmlToImage 호출
    ensureHtmlToImage().catch(e => console.error(e));
    startObserver();
})();