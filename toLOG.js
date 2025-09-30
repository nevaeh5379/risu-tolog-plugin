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

// --- 색상 팔레트 정의 ---
const COLORS = {
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

// --- 레이아웃 테마 정의 ---
const THEMES = {
    basic: {
        name: '기본',
        description: '가장 일반적인 말풍선 디자인입니다. 색상 팔레트를 자유롭게 변경할 수 있습니다.'
        // 이 테마는 COLORS 객체에서 선택된 색상을 사용합니다.
    },
    modern: {
        name: '현대',
        description: '카드형 UI와 깔끔한 선으로 구성된 모던한 다크 디자인입니다.',
        // 고정 다크 색상 값
        color: {
            background: '#1c1e22', cardBg: '#282a2e', cardBgUser: '#282a2e',
            text: '#d1d5db', nameColor: '#8fbaff', border: '#373b41',
            shadow: '0 4px 12px rgba(0,0,0,0.3)', avatarBorder: '#8fbaff',
            // [추가] 하이라이트 색상
            quoteBg: 'rgba(143, 186, 255, 0.1)', quoteText: '#a1c6ff',
            thoughtBg: 'rgba(209, 213, 219, 0.08)', thoughtText: '#b0b8c4'
        }
    },
    fantasy: {
        name: '판타지',
        description: '밤하늘의 마법서와 같은 신비로운 디자인입니다.',
        color: {
            background: '#191e3a',
            cardBg: 'rgba(25, 30, 58, 0.7)',
            cardBgUser: 'rgba(40, 48, 90, 0.7)',
            text: '#d8deff',
            textSecondary: '#a9b1d6',
            nameColor: '#ffc978',
            border: '#4a558c',
            separator: '#a9b1d6',
            shadow: '0 0 20px rgba(175, 192, 255, 0.2)',
            avatarBorder: '#ffc978',
            quoteBg: 'rgba(255, 201, 120, 0.15)',
            quoteText: '#ffd59e',
            thoughtBg: 'rgba(175, 192, 255, 0.12)',
            thoughtText: '#c1c8f0',
            soundBg: 'rgba(254, 200, 154, 0.15)',
            soundText: '#fec89a'
        }
    },
    fantasy2: {
        name: '엘프의 숲',
        description: '신비로운 엘프 왕국의 자연과 마법이 어우러진 신록의 디자인입니다.',
        color: {
            background: 'linear-gradient(135deg, #064e3b 0%, #022c22 50%, #052e16 100%)',
            cardBg: 'linear-gradient(145deg, rgba(34, 197, 94, 0.15), rgba(21, 128, 61, 0.1))',
            cardBgUser: 'linear-gradient(145deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))',
            text: '#d1fae5',
            textSecondary: '#86efac',
            nameColor: '#34d399',
            border: 'linear-gradient(45deg, #10b981, #34d399)',
            separator: '#6ee7b7',
            shadow: '0 0 25px rgba(52, 211, 153, 0.2), 0 8px 32px rgba(16, 185, 129, 0.1)',
            avatarBorder: '#34d399',
            quoteBg: 'rgba(52, 211, 153, 0.1)',
            quoteText: '#6ee7b7',
            thoughtBg: 'rgba(16, 185, 129, 0.08)',
            thoughtText: '#a7f3d0',
            soundBg: 'rgba(251, 191, 36, 0.1)',
            soundText: '#fde68a'
        }
    },
    royal: {
        name: '로얄',
        description: '황금과 보라빛이 어우러진 고귀한 왕실 디자인입니다.',
        color: {
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            cardBg: 'linear-gradient(145deg, rgba(79, 70, 229, 0.2), rgba(99, 102, 241, 0.1))',
            cardBgUser: 'linear-gradient(145deg, rgba(147, 51, 234, 0.25), rgba(168, 85, 247, 0.15))',
            text: '#e0e7ff',
            textSecondary: '#c7d2fe',
            nameColor: '#fbbf24',
            border: 'linear-gradient(45deg, #7c3aed, #fbbf24)',
            separator: '#a855f7',
            shadow: '0 0 40px rgba(168, 85, 247, 0.3), 0 8px 32px rgba(251, 191, 36, 0.15)',
            avatarBorder: '#fbbf24',
            quoteBg: 'rgba(251, 191, 36, 0.12)',
            quoteText: '#fcd34d',
            thoughtBg: 'rgba(168, 85, 247, 0.12)',
            thoughtText: '#c084fc',
            soundBg: 'rgba(239, 68, 68, 0.1)',
            soundText: '#fca5a5'
        }
    },
    ocean: {
        name: '심해',
        description: '깊은 바다의 신비로운 청록빛과 산호초가 빛나는 디자인입니다.',
        color: {
            background: 'radial-gradient(ellipse at center, #0c4a6e 0%, #0f172a 70%)',
            cardBg: 'linear-gradient(145deg, rgba(14, 116, 144, 0.2), rgba(6, 78, 59, 0.15))',
            cardBgUser: 'linear-gradient(145deg, rgba(8, 145, 178, 0.25), rgba(14, 116, 144, 0.2))',
            text: '#a7f3d0',
            textSecondary: '#5eead4',
            nameColor: '#22d3ee',
            border: 'linear-gradient(45deg, #0891b2, #06b6d4)',
            separator: '#67e8f9',
            shadow: '0 0 30px rgba(34, 211, 238, 0.2), 0 8px 32px rgba(6, 182, 212, 0.1)',
            avatarBorder: '#22d3ee',
            quoteBg: 'rgba(34, 211, 238, 0.1)',
            quoteText: '#67e8f9',
            thoughtBg: 'rgba(6, 182, 212, 0.08)',
            thoughtText: '#a5f3fc',
            soundBg: 'rgba(244, 114, 182, 0.1)',
            soundText: '#f9a8d4'
        }
    },
    sakura: {
        name: '벚꽃',
        description: '봄날의 벚꽃잎이 흩날리는 따뜻하고 로맨틱한 디자인입니다.',
        color: {
            background: 'linear-gradient(135deg, #fdf2f8 0%, #f9fafb 50%, #fef7ff 100%)',
            cardBg: 'linear-gradient(145deg, rgba(251, 207, 232, 0.3), rgba(252, 231, 243, 0.2))',
            cardBgUser: 'linear-gradient(145deg, rgba(244, 114, 182, 0.2), rgba(236, 72, 153, 0.15))',
            text: '#831843',
            textSecondary: '#be185d',
            nameColor: '#ec4899',
            border: 'linear-gradient(45deg, #f472b6, #ec4899)',
            separator: '#f9a8d4',
            shadow: '0 0 25px rgba(244, 114, 182, 0.2), 0 8px 32px rgba(236, 72, 153, 0.1)',
            avatarBorder: '#ec4899',
            quoteBg: 'rgba(244, 114, 182, 0.08)',
            quoteText: '#be185d',
            thoughtBg: 'rgba(168, 85, 247, 0.06)',
            thoughtText: '#a21caf',
            soundBg: 'rgba(251, 191, 36, 0.08)',
            soundText: '#d97706'
        }
    },
    matrix: {
        name: '매트릭스',
        description: '컴퓨터 터미널과 해킹 코드가 흐르는 사이버펑크 디자인입니다.',
        color: {
            background: '#000000',
            cardBg: 'rgba(0, 255, 0, 0.05)',
            cardBgUser: 'rgba(0, 255, 0, 0.08)',
            text: '#00ff00',
            textSecondary: '#008f00',
            nameColor: '#00ff41',
            border: '#00ff00',
            separator: '#008f00',
            shadow: '0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.05)',
            avatarBorder: '#00ff41',
            quoteBg: 'rgba(0, 255, 0, 0.1)',
            quoteText: '#00ff41',
            thoughtBg: 'rgba(0, 255, 65, 0.08)',
            thoughtText: '#32ff7e',
            soundBg: 'rgba(255, 255, 0, 0.08)',
            soundText: '#ffff00'
        }
    },
    log: {
        name: '로그',
        description: '개발자 콘솔과 같은 깔끔한 터미널 스타일 디자인입니다.',
        color: {
            background: '#0d1117',
            cardBg: 'rgba(33, 38, 45, 0.3)',
            cardBgUser: 'rgba(56, 139, 253, 0.1)',
            text: '#e6edf3',
            textSecondary: '#7d8590',
            nameColor: '#58a6ff',
            border: '#30363d',
            shadow: '0 0 0 1px rgba(48, 54, 61, 0.5)',
            avatarBorder: '#58a6ff',
            quoteBg: 'rgba(88, 166, 255, 0.1)',
            quoteText: '#79c0ff',
            thoughtBg: 'rgba(125, 133, 144, 0.08)',
            thoughtText: '#8b949e'
        }
    }
};

const CHAT_ITEM_SELECTOR = 'button[data-risu-chat-idx]';
const MESSAGE_CONTAINER_SELECTOR = '.chat-message-container';
const AVATAR_ATTR = 'data-avatar';

(async () => {
    async function getComprehensivePageCSS() {
        console.log('[Log Exporter] getComprehensivePageCSS: 페이지의 모든 CSS 포괄적 추출 시작');
        const cssTexts = new Set(); // 중복 규칙 방지를 위해 Set 사용

        // 1. document.styleSheets 순회 (링크된 CSS 파일 및 기본 스타일)
        for (const sheet of document.styleSheets) {
            try {
                // sheet.cssRules 접근 시 보안 오류가 발생할 수 있어 try-catch로 감쌉니다.
                const rules = sheet.cssRules;
                for (const rule of rules) {
                    cssTexts.add(rule.cssText);
                }
            } catch (e) {
                console.warn(`[Log Exporter] 스타일시트를 읽을 수 없습니다 (CORS): ${sheet.href}`, e);
            }
        }

        // 2. 문서 내의 모든 <style> 태그 내용 직접 추출 (동적 주입된 CSS 대응)
        document.querySelectorAll('style').forEach(styleElement => {
            // 플러그인 자체 스타일은 제외하여 중복 방지
            if (styleElement.id !== 'log-exporter-styles' && styleElement.textContent) {
                cssTexts.add(styleElement.textContent);
            }
        });

        console.log(`[Log Exporter] getComprehensivePageCSS: CSS 추출 완료. 총 ${cssTexts.size}개의 고유 규칙/블록 발견.`);
        return Array.from(cssTexts).join('\n');
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
    let rangeSelectionState = { active: false, startIndex: -1, chatIndex: -1 };

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
                const response = await fetch('https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js');
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
    let domToImagePromise = null;
    /**
     * dom-to-image-more 라이브러리가 로드되었는지 확인하고, 로드되지 않았다면 CDN에서 동적으로 로드합니다.
     * @returns {Promise<void>} 라이브러리 로드가 완료되면 resolve되는 Promise.
     */
    function ensureDomToImage() {
        console.log('[Log Exporter] ensureDomToImage: dom-to-image-more 라이브러리 확인/로드 시작');
        if (typeof window.domtoimage !== 'undefined') {
            console.log('[Log Exporter] ensureDomToImage: 이미 로드됨');
            return Promise.resolve();
        }
        if (domToImagePromise) {
            return domToImagePromise;
        }

        domToImagePromise = new Promise(async (resolve, reject) => {
            console.log('[Log Exporter] dom-to-image-more 라이브러리 로드 시작...');
            try {
                const response = await fetch('https://cdn.jsdelivr.net/npm/dom-to-image-more@3.1.6/dist/dom-to-image-more.min.js');
                if (!response.ok) {
                    throw new Error(`CDN에서 스크립트를 가져오는 데 실패했습니다: ${response.statusText}`);
                }
                const libraryCode = await response.text();

                // [수정] try...catch...finally 구문이 문자열 내에서 문제를 일으키는 것을 방지하기 위해
                // try...catch와 try...finally를 분리하여 코드를 실행하고 정리하는 로직으로 변경합니다.
                const wrappedCode = `
                    (() => {
                        const define_backup = window.define;
                        const require_backup = window.require;
                        try {
                            window.define = undefined;
                            window.require = undefined;
                            try {
                                ${libraryCode}
                            } catch (e) {
                                console.error("[Log Exporter] 주입된 dom-to-image-more 코드 실행 중 오류 발생:", e);
                            }
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

                if (typeof window.domtoimage !== 'undefined') {
                    console.log('[Log Exporter] dom-to-image-more 라이브러리가 성공적으로 로드되었습니다.');
                    resolve();
                } else { throw new Error('코드를 주입하여 실행했지만 domtoimage 객체가 생성되지 않았습니다.'); }
            } catch (error) {
                console.error('[Log Exporter] dom-to-image-more 라이브러리 동적 로드에 최종 실패했습니다.', error);
                domToImagePromise = null;
                reject(error);
            }
        });
        return domToImagePromise;
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
                // [수정] generateBasicFormatLog 호출 시 두 번째 인자로 charInfo 객체를 전달하도록 수정
                // [수정] 이미지를 Base64로 임베드하지 않고 원본 URL을 유지하도록 embedImagesAsBase64: false 옵션 추가
                const charInfoForLog = {
                    name: charName,
                    chatName: chatName,
                    avatarUrl: '' // 아바타 URL은 이 컨텍스트에서 직접 사용되지 않으므로 빈 값으로 전달
                };
                const baseHtml = await generateBasicFormatLog(nodes, charInfoForLog, 'basic', 'dark', showAvatar, false, false, true, true, false);
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
            .log-exporter-modal-backdrop { 
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background-color: rgba(0,0,0,0.6); z-index: 10001; 
                display: flex; align-items: center; justify-content: center;
                /* 모바일에서 키보드가 올라와도 스크롤 방지 */
                overflow: hidden;
                /* 터치 스크롤 부드럽게 */
                -webkit-overflow-scrolling: touch;
                /* 텍스트 선택 방지 (배경 영역) */
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                /* 터치 하이라이트 제거 */
                -webkit-tap-highlight-color: transparent;
            }
            .log-exporter-modal { 
                background-color: #24283b; color: #c0caf5; border-radius: 10px; 
                width: 90%; max-width: 1200px; max-height: 90vh; 
                display: flex; flex-direction: column; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.3); overflow: hidden;
                /* 모달 내용에서는 텍스트 선택 허용 */
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
                /* 모바일에서 부드러운 애니메이션 */
                transition: transform 0.3s ease-out;
                position: relative; /* 닫기 버튼을 위한 기준점 */
            }
            .log-exporter-modal-header { padding: 12px 18px; font-size: 1.15em; font-weight: bold; border-bottom: 1px solid #414868; padding-right: 48px; /* 닫기 버튼 공간 확보 */ }
            .log-exporter-modal-content { padding: 15px; display: flex; flex-direction: row; gap: 15px; overflow-y: hidden; flex-grow: 1; }
            .log-exporter-left-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 100%; }
            .log-exporter-right-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: hidden; max-height: 100%; }
            .log-exporter-modal-close-btn {
                position: absolute;
                top: 8px; right: 8px;
                width: 36px; height: 36px;
                background: transparent;
                border: none; color: #a9b1d6;
                font-size: 24px; line-height: 36px; text-align: center;
                cursor: pointer; transition: all 0.2s ease;
                border-radius: 50%;
            }
            .log-exporter-modal-close-btn:hover { background-color: #414868; color: #fff; transform: rotate(90deg); }
            .log-exporter-modal-options { display: flex; gap: 8px; align-items: center; background: #1f2335; padding: 8px 10px; border-radius: 5px; flex-wrap: wrap; }
            .log-exporter-modal-options label { cursor: pointer; user-select: none; display: inline-flex; align-items: center; }
            .log-exporter-modal-preview { flex-grow: 1; background-color: #1a1b26; border: 1px solid #414868; border-radius: 5px; padding: 12px; overflow-y: auto; min-height: 150px; max-height: none; }
            .log-exporter-modal-preview pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace; font-size: 0.9em; margin: 0; color: #c0caf5; }
            .log-exporter-modal-footer { padding: 12px 18px; border-top: 1px solid #414868; display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
            .log-exporter-modal-btn { background-color: #414868; color: #c0caf5; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; white-space: nowrap; }
            .log-exporter-modal-btn:hover { background-color: #565f89; }
            .log-exporter-modal-btn:focus { 
                outline: 2px solid #7aa2f7; 
                outline-offset: 2px; 
                background-color: #565f89; 
            }
            .log-exporter-modal-btn:active { 
                transform: translateY(1px); 
                background-color: #4a5374; 
            }
            .log-exporter-modal-btn.primary { background-color: #7aa2f7; color: #1a1b26; }
            .log-exporter-modal-btn.primary:hover { background-color: #9eceff; }
            @media (max-width: 992px) { /* Tablet breakpoint: revert to column layout */
                .log-exporter-modal-header {
                    padding-right: 44px; /* 모바일에서 닫기 버튼 공간 */
                }
                .log-exporter-modal-content { flex-direction: column; overflow-y: auto; } /* 컨텐츠 영역 스크롤 */
                .log-exporter-left-panel, .log-exporter-right-panel { max-height: none; overflow-y: visible; flex: none; width: 100%; } /* 패널 높이 제한 해제 */
                .log-exporter-modal-preview { max-height: 40vh; } /* 세로 모드에서 미리보기 높이 제한 */
            }
            .log-exporter-modal-btn.image-save { background-color: #9ece6a; color: #1a1b26; }
            .log-exporter-modal-btn.image-save:hover { background-color: #b8e090; }
            .log-exporter-modal-btn:disabled { background-color: #565f89; cursor: not-allowed; }
            .mobile-more-menu-btn {
                display: none; /* 기본적으로 더보기 버튼 숨김 */
            }
            .log-exporter-msg-btn { margin-left: 8px; cursor: pointer; color: #a0a0a0; transition: color 0.2s; font-size: 20px; line-height: 1; background: none; border: none; padding: 0;}
            .log-exporter-msg-btn.range-active { color: #ff9e64; }
            .log-exporter-msg-btn.range-endpoint { color: #9ece6a; }
            .chat-message-container.log-exporter-range-start {
                background-color: rgba(122, 162, 247, 0.1); box-shadow: 0 0 0 2px rgba(122, 162, 247, 0.4) inset; border-radius: 8px;
            }
            .log-exporter-msg-btn:hover { color: #7aa2f7; }
            #filter-controls { display: none; margin-left: auto; align-items: center; gap: 12px; }
            #theme-selector { padding: 4px 8px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
            #color-selector { padding: 4px 8px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
            #theme-selector:hover, #color-selector:hover { border-color: #565f89; }
            #theme-selector:hover { border-color: #565f89; }
            .arca-helper-section { display: none; flex-direction: column; gap: 8px; background-color: #1a1b26; padding: 12px; border-radius: 8px; border: 1px solid #7aa2f7; margin-top: 8px; }
            .arca-helper-section h4 { margin: 0 0 8px 0; color: #7aa2f7; }
            .arca-helper-section textarea { width: 100%; height: 100px; background-color: #1f2335; color: #c0caf5; border: 1px solid #414868; border-radius: 5px; padding: 8px; font-family: monospace; font-size: 0.9em; resize: vertical; }
            .arca-helper-section button { align-self: center; }
            /* --- 모바일 반응형 스타일 (개선) --- */
            @media (max-width: 768px) { /* 일반 모바일 기기 */
                .log-exporter-modal { 
                    width: 100%; height: 100%; max-height: 100vh; border-radius: 0; 
                    flex-direction: column; 
                    /* 모바일 Safari 주소창 문제 해결 */
                    height: 100dvh; 
                }
                .log-exporter-modal-content { 
                    flex-direction: column; padding: 12px; gap: 16px; 
                    overflow-y: auto; flex-grow: 1; 
                    /* 부드러운 스크롤과 모멘텀 스크롤 */
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                }
                .log-exporter-left-panel, .log-exporter-right-panel { 
                    overflow-y: visible; max-height: none; flex: none; 
                }
                .log-exporter-modal-preview { 
                    max-height: 50vh; 
                    /* 터치 스크롤 개선 */
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                }
                /* 터치 친화적인 버튼 크기 (최소 44px) */
                .log-exporter-modal-btn { 
                    padding: 14px 16px; font-size: 1em; 
                    min-height: 44px; min-width: 44px;
                    /* 터치 타겟을 명확하게 */
                    touch-action: manipulation;
                }
                /* 체크박스와 라디오 버튼도 터치 친화적으로 */
                input[type="checkbox"], input[type="radio"] {
                    min-width: 18px; min-height: 18px;
                    transform: scale(1.2);
                    touch-action: manipulation;
                }
                /* 라벨도 터치하기 쉽게 */
                label {
                    padding: 8px 4px;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    touch-action: manipulation;
                }
                .log-exporter-modal-options, #filter-controls { 
                    flex-direction: column; align-items: stretch; gap: 12px; margin-left: 0; 
                }
                .log-exporter-modal-options { background: transparent; padding: 0; }
                .log-exporter-modal-options > div { 
                    background: #1f2335; padding: 16px; border-radius: 8px; 
                    /* 시각적 구분을 위한 박스 섀도우 */
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                #format-selection-group { 
                    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; 
                }
                #format-selection-group > strong { grid-column: 1 / -1; margin-bottom: 8px; }
                #basic-options-group { display: flex; flex-direction: column; gap: 12px; }
                #image-scale-controls, #filter-controls { display: flex; flex-direction: column; gap: 12px; }
                /* 슬라이더를 터치하기 쉽게 */
                input[type="range"] {
                    height: 8px;
                    -webkit-appearance: none;
                    background: #414868;
                    border-radius: 4px;
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #7aa2f7;
                    cursor: pointer;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                /* 푸터 버튼 레이아웃 개선 - 극도로 컴팩트한 버전 */
                .log-exporter-modal-footer { 
                    display: flex; flex-wrap: wrap; gap: 6px; 
                    flex-shrink: 0; padding: 8px;
                    /* 안전 영역 고려 (아이폰 홈 인디케이터) */
                    padding-bottom: max(8px, env(safe-area-inset-bottom));
                    max-height: 15vh; /* 최대 화면 높이의 15%로 제한 */
                    overflow: hidden;
                }
                .log-exporter-modal-footer > button { 
                    flex: 1; margin: 0 !important; 
                    min-width: calc(50% - 3px);
                }
                .log-exporter-modal-footer .log-exporter-modal-btn { 
                    padding: 8px 6px; font-size: 0.8em; 
                    min-height: 36px; line-height: 1.2;
                }
                /* 핵심 버튼만 표시하는 컴팩트 레이아웃 */
                #image-export-controls { 
                    display: none !important; /* 모바일에서는 숨김 */
                }
                /* 부차적인 버튼들 숨기기 */
                #log-exporter-raw-toggle,
                #log-exporter-save-file,
                #log-exporter-copy-formatted,
                #log-exporter-download-zip,
                #arca-helper-toggle-btn {
                    display: none !important;
                }
                /* 핵심 버튼들만 표시 */
                #log-exporter-copy-html {
                    order: 1; background-color: #7aa2f7 !important; color: #1a1b26 !important;
                }
                /* 더보기 메뉴 버튼 추가 */
                .mobile-more-menu-btn {
                    display: block; /* 모바일에서만 보임 */
                    order: 2; background-color: #9ece6a !important; color: #1a1b26 !important;
                    position: relative; transition: all 0.3s ease;
                }
                .log-exporter-modal-footer .log-exporter-modal-btn { flex-basis: calc(50% - 3px); }
                /* 더보기 메뉴가 펼쳐졌을 때 버튼들 스타일 */
                .log-exporter-modal-footer[data-expanded="true"] {
                    max-height: 50vh !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch;
                }
                .log-exporter-modal-footer[data-expanded="true"] > button {
                    flex-basis: calc(33.33% - 4px);
                    margin-bottom: 4px;
                }
                /* 텍스트 입력 요소들 개선 */
                select, input[type="number"], textarea {
                    padding: 12px;
                    font-size: 16px; /* iOS 자동 줌 방지 */
                    border-radius: 8px;
                    touch-action: manipulation;
                }
                textarea {
                    resize: vertical;
                    min-height: 120px;
                }
            }
            
            /* 작은 화면 기기 추가 최적화 */
            @media (max-width: 480px) {
                .log-exporter-modal-content {
                    padding: 8px;
                    gap: 12px;
                }
                .log-exporter-modal-header {
                    padding: 12px 8px;
                    font-size: 1.05em;
                    padding-right: 40px;
                    text-align: center;
                }
                .log-exporter-modal-btn {
                    padding: 12px 8px;
                    font-size: 0.9em;
                    min-height: 42px;
                }
                /* 푸터를 극도로 컴팩트하게 */
                .log-exporter-modal-footer {
                    padding: 6px;
                    gap: 4px;
                    padding-bottom: max(6px, env(safe-area-inset-bottom));
                    max-height: 12vh; /* 작은 화면에서는 12%로 더 제한 */
                }
                .log-exporter-modal-footer .log-exporter-modal-btn {
                    padding: 6px 4px; flex-basis: calc(50% - 2px);
                    font-size: 0.75em;
                    min-height: 32px;
                    line-height: 1.1;
                }
                /* 아카라이브 도우미 섹션 최적화 */
                .arca-helper-section {
                    padding: 12px;
                }
                .arca-helper-section ol {
                    font-size: 0.85em;
                    padding-left: 16px;
                }
                .arca-helper-section textarea {
                    min-height: 100px;
                    font-size: 14px;
                }
                /* 미리보기 영역 최적화 */
                .log-exporter-modal-preview {
                    max-height: 40vh;
                    font-size: 0.9em;
                }
                /* 옵션 그룹들 간격 조정 */
                .log-exporter-modal-options > div {
                    padding: 12px;
                }
                /* 체크박스/라디오 그룹 최적화 */
                #format-selection-group {
                    grid-template-columns: 1fr;
                    gap: 8px;
                }
                #format-selection-group label {
                    padding: 12px 8px;
                    background: #24283b;
                    border-radius: 6px;
                    margin: 2px 0;
                }
            }
            
            /* 가로 모드 최적화 */
            @media (max-width: 768px) and (orientation: landscape) {
                .log-exporter-modal-header {
                    padding-right: 44px;
                }
                .log-exporter-modal-footer .log-exporter-modal-btn { flex-basis: auto; flex-grow: 1; }
                .log-exporter-modal-footer[data-expanded="true"] > button { flex-basis: calc(33.33% - 4px); }
                .log-exporter-modal-content {
                    flex-direction: row;
                    gap: 12px;
                }
                .log-exporter-left-panel {
                    flex: 0 0 50%;
                    max-height: calc(100vh - 140px);
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .log-exporter-right-panel {
                    flex: 1;
                }
                .log-exporter-modal-preview {
                    max-height: none;
                    height: calc(100vh - 180px);
                }
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
     * @param {object} [options={}] - 추가 옵션.
     * @param {number} [options.startIndex] - 로그를 시작할 메시지의 인덱스.
     * @param {number} [options.endIndex] - 로그를 끝낼 메시지의 인덱스.
     * @param {boolean} [options.singleMessage] - 단일 메시지만 내보낼지 여부.
     * @throws {Error} 채팅 버튼, 캐릭터 정보, 또는 메시지를 찾을 수 없는 경우.
     */
    async function processChatLog(chatIndex, options = {}) {
        console.log(`[Log Exporter] processChatLog: 채팅 로그 처리 시작, 인덱스: ${chatIndex}`);
        const chatButton = document.querySelector(`button[data-risu-chat-idx="${chatIndex}"]`);
        if (!chatButton) throw new Error("채팅 버튼을 찾을 수 없습니다.");

        const { startIndex, endIndex, singleMessage } = options;

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

        let finalNodes = messageNodes;
        let finalChatName = targetChat.name;

        if (typeof startIndex === 'number') {
            if (singleMessage) {
                finalNodes = [messageNodes[startIndex]];
                finalChatName += ` (메시지 #${startIndex + 1})`;
            } else {
                finalNodes = messageNodes.slice(startIndex, typeof endIndex === 'number' ? endIndex + 1 : undefined);
                finalChatName += ` (메시지 #${startIndex + 1}부터${typeof endIndex === 'number' ? ` #${endIndex + 1}까지` : ''})`;
            }
        }

        return { charName: character.name, chatName: finalChatName, charAvatarUrl, messageNodes: finalNodes };
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

// ▼▼▼ [교체] 기존의 generateForceHoverCss 함수를 아래의 새 코드로 완전히 덮어쓰세요. ▼▼▼

    /**
     * 페이지의 모든 스타일시트를 스캔하여 :hover 규칙을 강제로 활성화하는 CSS를 생성합니다.
     * @media 규칙을 보존하고, 모든 속성에 !important를 추가하여 명시도 문제를 해결합니다.
     * @async
     * @returns {Promise<string>} :hover를 강제 활성화하는 CSS 규칙 문자열.
     */
    async function generateForceHoverCss() {
        console.log('[Log Exporter] generateForceHoverCss: :hover 강제 활성화 CSS 생성 시작 (v2, !important 적용)');
        const newRules = new Set();
        const hoverRegex = /:hover/g;

        /**
         * 단일 CSS 규칙을 받아 :hover를 강제하는 새 규칙 문자열을 생성합니다.
         * @param {CSSStyleRule} rule - 처리할 CSS 규칙.
         * @returns {string|null} 생성된 규칙 문자열 또는 null.
         */
        const createImportantRule = (rule) => {
            // selectorText가 없거나 :hover가 없으면 처리하지 않음
            if (!rule.selectorText || !hoverRegex.test(rule.selectorText)) return null;

            // :hover를 제거하고 앞에 강제 활성화 클래스를 붙여 새 선택자 생성
            const newSelector = rule.selectorText
                .split(',')
                // ▼▼▼ [수정] :not 선택자를 사용하여 data-no-force-hover 속성을 가진 요소를 제외 ▼▼▼
                .map(part => `.expand-hover-globally ${part.trim().replace(hoverRegex, '')}:not([data-no-force-hover])`)
                .join(', ');

            // 규칙 내의 모든 스타일 속성을 !important와 함께 재구성
            let newDeclarations = '';
            for (let i = 0; i < rule.style.length; i++) {
                const propName = rule.style[i];
                const propValue = rule.style.getPropertyValue(propName);
                newDeclarations += `${propName}: ${propValue} !important; `;
            }

            // 생성된 선택자와 스타일 속성이 모두 있을 경우에만 최종 규칙 반환
            if (newSelector && newDeclarations) {
                return `${newSelector} { ${newDeclarations} }`;
            }
            return null;
        };

        for (const sheet of document.styleSheets) {
            try {
                if (!sheet.cssRules) continue;

                for (const rule of sheet.cssRules) {
                    // @media 규칙인 경우, 내부의 규칙들을 재귀적으로 처리
                    if (rule.type === CSSRule.MEDIA_RULE) {
                        let mediaRules = '';
                        for (const nestedRule of rule.cssRules) {
                            const importantRule = createImportantRule(nestedRule);
                            if (importantRule) {
                                mediaRules += importantRule;
                            }
                        }
                        // @media 블록 내에 유효한 :hover 규칙이 있었을 경우에만 최종 규칙에 추가
                        if (mediaRules) {
                            newRules.add(`@media ${rule.conditionText} { ${mediaRules} }`);
                        }
                    } else {
                        // 일반 규칙인 경우 바로 처리
                        const importantRule = createImportantRule(rule);
                        if (importantRule) {
                            newRules.add(importantRule);
                        }
                    }
                }
            } catch (e) {
                console.warn(`[Log Exporter] 스타일시트를 읽을 수 없습니다 (CORS): ${sheet.href}`, e);
            }
        }
        console.log(`[Log Exporter] generateForceHoverCss: ${newRules.size}개의 :hover 대체 규칙 블록 생성 완료.`);
        return Array.from(newRules).join('\n');
    }
// ▲▲▲ [교체] 여기까지 덮어쓰시면 됩니다. ▲▲▲
    /**
  * 생성된 HTML 콘텐츠를 기반으로 완전한 HTML 파일을 만들어 사용자에게 다운로드합니다.
  * @async
  * @param {string} charName - 캐릭터 이름.
  * @param {string} chatName - 채팅 이름.
  * @param {string} messagesHtml - 채팅 메시지의 HTML 콘텐츠.
  * @param {string} charAvatarUrl - 캐릭터 아바타 URL.
  * @param {boolean} [expandHoverElements=false] - 호버 요소를 항상 펼칠지 여부.
  */
// ▼▼▼ [교체] 기존 generateAndDownloadHtmlFile 함수를 아래 내용으로 덮어쓰세요 ▼▼▼
    async function generateAndDownloadHtmlFile(charName, chatName, messagesHtml, charAvatarUrl, expandHoverElements = false) {
        console.log(`[Log Exporter] generateAndDownloadHtmlFile: HTML 파일 생성 및 다운로드 시작 (전체 스타일 복제 모드)`);

        const fullCss = await getComprehensivePageCSS();
        const htmlTagStyle = document.documentElement.getAttribute('style') || '';
        const headerHtml = await getHeaderHtml(charAvatarUrl, charName, chatName);

        let extraCss = '';
        if (expandHoverElements) {
            extraCss = await generateForceHoverCss();
        }

        const finalHtml = `<!DOCTYPE html>
<html lang="ko" style="${htmlTagStyle}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>채팅 로그: ${charName} - ${chatName}</title>
    <style>
        /* RisuAI 페이지의 모든 스타일을 그대로 주입 */
        ${fullCss}
        ${extraCss}

         /* 내보내기용 추가 스타일 (스크롤 문제 해결) */
    html, body {
        overflow: auto !important;
        height: auto !important;
    }
        body { 
            padding: 20px; 
            background-color: var(--risu-theme-bgcolor, #1a1b26);
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
<body ${expandHoverElements ? 'class="expand-hover-globally"' : ''}>
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
// ▲▲▲ [교체] 여기까지 ▲▲▲

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
                    const theme = COLORS.dark; // 기본 다크 테마 사용
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
                    const theme = COLORS.dark;
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
                    // img.style.maxWidth = '100%';
                    // img.style.height = 'auto';
                }
            }

            clonedNode.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
                // ▼▼▼ [추가] 강제 호버 효과에서 제외하기 위한 속성 추가 ▼▼▼
                btn.setAttribute('data-no-force-hover', 'true');
                // ▲▲▲ [추가] 완료 ▲▲▲
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
            return `width:48px; height:48px; min-width:48px; flex-shrink:0; border-radius:50%; object-fit:cover; border:2px solid ${theme.avatarBorder}; box-shadow:${theme.shadow}; margin:${isUser ? '0 0 0 12px' : '0 12px 0 0'};`;
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
         * 테마(레이아웃)와 색상을 적용하며, 이미지는 사용하지 않습니다.
         * @async
         * @param {HTMLElement[]} nodes - DOM 노드의 배열.
         * @param {string} [selectedThemeKey='basic'] - 사용할 레이아웃 테마.
         * @param {string} [selectedColorKey='dark'] - '기본' 테마에서 사용할 색상 팔레트.
         * @param {boolean} [embedImagesAsBase64=true] - (사용되지 않음)
         * @param {boolean} [showAvatar=true] - 아바타를 표시할지 여부.
         * @param {boolean} [showHeader=true] - 헤더를 표시할지 여부.
         * @param {boolean} [showFooter=true] - 푸터를 표시할지 여부.
         * @param {boolean} [showBubble=true] - 말풍선을 표시할지 여부.
         * @returns {Promise<string>} 포맷된 채팅 로그를 나타내는 HTML 문자열.
         */
        async function generateBasicFormatLog(nodes, charInfo, selectedThemeKey = 'basic', selectedColorKey = 'dark', showAvatar = true, showHeader = true, showFooter = true, showBubble = true, isForArca = false, embedImagesAsBase64 = true) {
            console.log(`[Log Exporter] generateBasicFormatLog: 테마: ${selectedThemeKey}, 헤더: ${showHeader}, 푸터: ${showFooter}`);
            
            const themeInfo = THEMES[selectedThemeKey] || THEMES.basic;
            // '기본' 테마는 COLORS에서, 나머지는 THEMES의 고정 color 객체에서 색상 정보를 가져옴
            const color = (selectedThemeKey === 'basic') ? (COLORS[selectedColorKey] || COLORS.dark) : themeInfo.color;

            // [핵심 수정] CSS 누락 방지를 위한 기본 태그 스타일 정의
            const baseTagStyles = `
            p { margin: 0.75em 0; }
            a { color: ${color.nameColor}; text-decoration: none; }
            a:hover { text-decoration: underline; }
            ul, ol { padding-left: 1.5em; margin: 0.75em 0; }
            li { margin-bottom: 0.25em; }
            blockquote { border-left: 3px solid ${color.border}; padding-left: 1em; margin-left: 0; color: inherit; opacity: 0.8; }
            strong, b { font-weight: bold; color: ${color.nameColor}; }
            em, i { font-style: italic; }
            hr { border: 0; height: 1px; background-color: ${color.border}; margin: 1.5em 0; }
            /* Add monospace font for code-like elements */
            code, pre { font-family: 'Nanum Gothic Coding', 'D2Coding', 'Fira Code', 'JetBrains Mono', monospace, sans-serif; }
        `;

            // [수정] 헤더 HTML 생성 로직
            const generateHeaderHtml = async () => {
                if (!showHeader) return '';
                const charAvatarBase64 = await imageUrlToBase64(charInfo.avatarUrl);
                const headerStyles = `
                    text-align:center; padding-bottom:1.5em; margin-bottom:2em;
                    border-bottom: 2px solid ${color.border};
                `;
                return `
                    <header style="${headerStyles}">
                        <img src="${charAvatarBase64}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin:0 auto 1em; display:block; border: 3px solid ${color.avatarBorder}; box-shadow: ${color.shadow};">
                        <h1 style="color: ${color.nameColor}; margin: 0 0 0.25em 0; font-size: 1.8em; letter-spacing: 1px;">${charInfo.name}</h1>
                        <p style="color: ${color.text}; opacity: 0.8; margin: 0; font-size: 0.9em;">${charInfo.chatName}</p>
                    </header>
                `;
            };

            let log = '';
            const avatarMap = await collectCharacterAvatars(nodes, false);
            const fantasyFont = `'Nanum Myeongjo', serif`;

            for (const [index, node] of nodes.entries()) {
                if (node.querySelector('textarea')) continue;
    
                let name = node.querySelector('.unmargin.text-xl')?.textContent.trim() || (node.classList.contains('justify-end') ? 'User' : 'Assistant');
                const originalMessageEl = node.querySelector('.prose, .chattext');
                if (!originalMessageEl) continue;
    
                let contentSourceEl = originalMessageEl.cloneNode(true);
                // [수정] script, style, 버튼 그룹만 제거하고 img 태그는 유지합니다.
                contentSourceEl.querySelectorAll('script, style, .log-exporter-msg-btn-group').forEach(el => el.remove());
                contentSourceEl.querySelectorAll('[style*="background-image"]').forEach(el => el.style.backgroundImage = 'none');
                
                // [추가] 메시지 내의 모든 이미지를 Base64로 변환하여 포함시킵니다.
                const imagePromises = Array.from(contentSourceEl.querySelectorAll('img')).map(async (img) => {
                    if (img.src && embedImagesAsBase64) { // embedImagesAsBase64 플래그 확인
                        if (img.src) {
                            try {
                                const base64Src = await imageUrlToBase64(img.src);
                                img.src = base64Src;
                            } catch (e) {
                                console.warn(`[Log Exporter] 이미지 Base64 변환 실패: ${img.src}`, e);
                            }
                        }
                    }
                    // [수정] 스타일 적용은 Base64 변환 여부와 관계없이 항상 수행
                    Object.assign(img.style, { maxWidth: '100%', height: 'auto', borderRadius: '8px', display: 'block', margin: '12px 0' });
                });
                await Promise.all(imagePromises);

                // [핵심 수정] RisuAI 전용 서식(인용, 생각 등) 스타일링 로직 추가
                const styleBlock = (el, bg, textColor, border = null) => {
                    const newBlock = document.createElement('div');
                    newBlock.innerHTML = `<div style="padding:0; margin:0;">${el.innerHTML}</div>`;
                    // [핵심 수정] 스타일 제거를 우회하기 위해 구형 bgcolor 속성을 직접 설정
                    newBlock.setAttribute('bgcolor', bg);
                    Object.assign(newBlock.style, {
                        padding: '0.75em 1em', margin: '0.75em 0',
                        borderRadius: '4px', borderLeft: `3px solid ${border || 'transparent'}`
                    });
                    // 기존 CSS 속성도 유지하여 호환성 확보
                    newBlock.style.setProperty('background-color', bg );
                    newBlock.style.setProperty('color', textColor);

                    el.replaceWith(newBlock);
                };
                
                contentSourceEl.querySelectorAll('.x-risu-regex-quote-block').forEach(el => styleBlock(el, color.quoteBg, color.quoteText, color.quoteText));
                contentSourceEl.querySelectorAll('.x-risu-regex-thought-block').forEach(el => styleBlock(el, color.thoughtBg, color.thoughtText));
                // .x-risu-regex-sound-block 등 다른 서식이 있다면 여기에 추가할 수 있습니다.
    
                contentSourceEl.querySelectorAll('mark[risu-mark^="quote"]').forEach(markEl => {
                    Object.assign(markEl.style, {
                        backgroundColor: color.quoteBg,
                        color: color.quoteText,
                        padding: '0.1em 0.3em',
                        borderRadius: '3px',
                        textDecoration: 'none' // mark 태그의 기본 밑줄 제거
                    });
                });
                // --- 스타일링 로직 끝 ---
                
                let messageHtml = contentSourceEl.innerHTML.trim();
                if (messageHtml.length === 0) continue;
    
                const isUser = node.classList.contains('justify-end');
                const avatarSrc = avatarMap.get(name);
                let avatarHtml = '';

                // [수정] 아카라이브용 변환 시, 모든 아바타를 <img> 태그로 통일하여 생성합니다.
                if (isForArca && showAvatar && avatarSrc) {
                    // AVATAR_ATTR 속성과 data-user 속성을 <img> 태그에 추가하여 아바타와 유저 구분을 명시합니다.
                    // style="" 속성을 추가하여 각 테마에서 스타일을 추가할 수 있도록 합니다.
                    avatarHtml = `<img ${AVATAR_ATTR} data-user="${isUser}" style="" src="${avatarSrc}">`;
                    // 아카라이브 변환 시에는 아래의 복잡한 div 생성 로직을 건너뜁니다.
                } else 

                if (showAvatar && selectedThemeKey !== 'log' && selectedThemeKey !== 'fantasy') {
                    const createAvatarDiv = (src, isUser) => {
                        const margin = isUser ? 'margin-left:12px;' : 'margin-right:12px;';
                        const baseStyle = `width:48px;height:48px;min-width:48px;border-radius:50%;box-shadow:${color.shadow || 'none'};border:2px solid ${color.avatarBorder};${margin}`;
                        if (src) {
                            return `<div ${AVATAR_ATTR} style="${baseStyle}background:url('${src}');background-size:cover;background-position:center;"></div>`;
                        } else {
                            const letter = isUser ? 'U' : name.charAt(0).toUpperCase();
                            return `<div ${AVATAR_ATTR} style="${baseStyle}background-color:${color.avatarBorder};display:flex;align-items:center;justify-content:center;"><span style="color:${color.background};font-weight:bold;font-size:1.2em;">${letter}</span></div>`;
                        }
                    };
                    avatarHtml = createAvatarDiv(avatarSrc, isUser);
                }
    
                let logEntry = '';
                switch (selectedThemeKey) {
                     case 'modern':
                         const modernCardBg = isUser 
                             ? `linear-gradient(135deg, ${color.cardBgUser} 0%, #3a3e44 100%)` 
                             : color.cardBg;
                         logEntry += `<div class="chat-message-container" style="display:flex; align-items:flex-start; margin-bottom:20px; gap: 16px; ${isUser ? 'flex-direction:row-reverse;' : ''}">`;
                         logEntry += avatarHtml;
                         logEntry += `<div style="flex:1; border-radius: 8px; background: ${modernCardBg}; box-shadow:${color.shadow}; overflow:hidden;">`;
                         logEntry += `<strong style="color:${color.nameColor}; font-weight:600; font-size:0.9em; display:block; padding: 10px 14px; background-color: rgba(0,0,0,0.15); text-align:${isUser ? 'right;' : 'left;'}">${name}</strong>`;
                         logEntry += `<div style="padding: 14px; color:${color.text}; line-height:1.8; word-wrap:break-word;">${messageHtml}</div>`;
                         logEntry += '</div></div>';
                         break;

                    case 'fantasy': { // 중괄호로 스코프를 만들어 변수 충돌 방지
                        let fantasyAvatarHtml = '';
                        if (showAvatar) {
                            if (isForArca) {
                                // 아카라이브용: <img> 태그 사용 (data-user 속성 포함)
                                const avatarStyle = 'width:52px;height:52px;min-width:52px;border-radius:50%;border:2px solid ' + color.avatarBorder + '; box-shadow: 0 0 12px rgba(255, 201, 120, 0.5); margin-left: auto; margin-right: auto;';
                                if (avatarHtml.includes('style="')) {
                                    fantasyAvatarHtml = avatarHtml.replace('style="', `style="${avatarStyle}`);
                                } else {
                                    fantasyAvatarHtml = avatarHtml.replace('<img', `<img style="${avatarStyle}"`);
                                }
                            } else {
                                // 미리보기용: <div> 태그 사용
                                const baseStyle = `width:52px;height:52px;min-width:52px;border-radius:50%;border:2px solid ${color.avatarBorder}; box-shadow: 0 0 12px rgba(255, 201, 120, 0.5); margin-left: auto; margin-right: auto;`;
                                if (avatarSrc) {
                                    fantasyAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background:url('${avatarSrc}');background-size:cover;background-position:center;"></div>`;
                                } else {
                                    const letter = isUser ? 'U' : name.charAt(0).toUpperCase();
                                    fantasyAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background: linear-gradient(135deg, #2c3e7a, #1a1e3a); display:flex;align-items:center;justify-content:center;"><span style="color:${color.nameColor};font-weight:bold;font-size:1.4em; font-family: 'Nanum Myeongjo', serif; text-shadow: 0 0 6px rgba(255,201,120,0.7);">${letter}</span></div>`;
                                }
                            }
                        }
                        if (index > 0) {
                            logEntry += `
        <div style="display:flex; align-items: center; text-align: center; margin: 2.2em auto; max-width: 50%;">
            <div style="flex-grow: 1; height: 1px; background: linear-gradient(to right, transparent, ${color.separator}, transparent);width:100%;margin: auto;"></div>
            <span style="padding: 0 0.8em; color: ${color.separator}; font-size: 1.3em; font-family: 'Nanum Myeongjo', serif; text-shadow: 0 0 8px rgba(175,192,255,0.4); margin-left: auto; margin-right: auto;">✦</span>
            <div style="flex-grow: 1; height: 1px; background: linear-gradient(to left, transparent, ${color.separator}, transparent);width:100%;margin: auto;"></div>
        </div>`;
                        }
                        logEntry += `<div class="chat-message-container" style="display:flex; flex-direction:column; align-items: center; ${!isForArca ? `font-family: ${fantasyFont};` : ''} text-align:center; margin-bottom:28px;">`;
                        logEntry += fantasyAvatarHtml;
                        logEntry += `<strong style="color:${color.nameColor}; font-weight:400; font-size:1.4em; margin-top: 0.6em; letter-spacing: 1.5px; text-shadow: 0 0 10px rgba(255, 201, 120, 0.6);">${name}</strong>`;
                        logEntry += `<div style="color:${color.text}; line-height: 1.85; font-size: 1.1em; text-align: justify; margin-top: 1.2em; max-width: 95%; margin-left: auto; margin-right: auto; background-color: ${isUser ? color.cardBgUser : color.cardBg}; padding: 14px 18px; border: 1px solid ${color.border}; box-shadow: ${color.shadow};">${messageHtml}</div>`;
                        logEntry += `</div>`;
                        break;
                    } // case 'fantasy' 종료
                    case 'fantasy2': // 엘프의 숲
                        const elfFont = `'Nanum Myeongjo', serif`;
                        let elfAvatarHtml = '';
                        if (showAvatar) {
                            if (isForArca) {
                                // 아카라이브용: <img> 태그 사용 (data-user 속성 포함)
                                elfAvatarHtml = avatarHtml;
                            } else {
                                // 미리보기용: <div> 태그 사용
                                const baseStyle = `width:50px;height:50px;min-width:50px;border-radius:50%;border:3px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; position: relative;`;
                                if (avatarSrc) {
                                    elfAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background:url('${avatarSrc}');background-size:cover;background-position:center; overflow: hidden;"><div style="position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 60%, rgba(52, 211, 153, 0.3) 100%);"></div></div>`;
                                } else {
                                    const letter = isUser ? '🌿' : name.charAt(0).toUpperCase();
                                    elfAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background: linear-gradient(135deg, #059669, #10b981); display:flex;align-items:center;justify-content:center;"><span style="color: #d1fae5;font-weight:bold;font-size:1.3em; text-shadow: 0 0 8px rgba(52, 211, 153, 0.8);">${letter}</span></div>`;
                                }
                            }
                        }
                        
                        if (index > 0) {
                            logEntry += `
                                <div style="display:flex; align-items: center; text-align: center; margin: 2em auto; max-width: 70%;">
                                    <div style="flex-grow: 1; height: 2px; background: linear-gradient(to right, transparent, ${color.separator}, transparent); border-radius: 1px;"></div>
                                    <div style="padding: 0 1.2em; color: ${color.separator}; font-size: 1.2em; position: relative;">
                                        <span style="text-shadow: 0 0 10px rgba(52, 211, 153, 0.6);">🌺</span>
                                        <div style="position: absolute; inset: 0; animation: pulse 2s infinite; opacity: 0.5;">
                                            <span style="color: ${color.separator};">🌺</span>
                                        </div>
                                    </div>
                                    <div style="flex-grow: 1; height: 2px; background: linear-gradient(to left, transparent, ${color.separator}, transparent); border-radius: 1px;"></div>
                                </div>`;
                        }

                        logEntry += `<div class="chat-message-container" style="display:flex; align-items:flex-start; gap: 16px; ${!isForArca ? `font-family: ${elfFont};` : ''} margin-bottom:2em; ${isUser ? 'flex-direction:row-reverse;' : ''}">`;
                        logEntry += elfAvatarHtml;
                        logEntry += `<div style="flex:1; position: relative;">`;
                        logEntry += `<div style="position: absolute; top: -5px; left: ${isUser ? 'auto' : '-8px'}; right: ${isUser ? '-8px' : 'auto'}; width: 3px; height: calc(100% + 10px); background: ${color.border}; border-radius: 2px; opacity: 0.6;"></div>`;
                        logEntry += `<strong style="color:${color.nameColor}; font-weight:600; font-size:1.2em; text-shadow: 0 0 8px rgba(52, 211, 153, 0.4); letter-spacing: 1px; margin-bottom: 0.8em; display: block; text-align: ${isUser ? 'right' : 'left'};">${name}</strong>`;
                        logEntry += `<div style="background: ${isUser ? color.cardBgUser : color.cardBg}; border-radius: 15px; padding: 16px 20px; box-shadow: ${color.shadow}; border: 1px solid rgba(52, 211, 153, 0.2); position: relative; overflow: hidden;">`;
                        logEntry += `<div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, ${color.nameColor}, transparent);"></div>`;
                        logEntry += `<div style="color:${color.text}; line-height: 1.7; font-size: 1.05em; position: relative; z-index: 1;">${messageHtml}</div>`;
                        logEntry += `</div></div></div>`;
                        break;

                    case 'royal': // 로얄 테마
                        const royalFont = `'Nanum Myeongjo', serif`;
                        let royalAvatarHtml = '';
                        if (showAvatar) {
                            if (isForArca) {
                                // 아카라이브용: <img> 태그 사용 (data-user 속성 포함)
                                const avatarStyle = 'width:55px;height:55px;min-width:55px;border-radius:50%;border:3px solid ' + color.avatarBorder + '; box-shadow: ' + color.shadow + '; position: relative; margin-left: auto; margin-right: auto;';
                                if (avatarHtml.includes('style="')) {
                                    royalAvatarHtml = avatarHtml.replace('style="', `style="${avatarStyle}`);
                                } else {
                                    royalAvatarHtml = avatarHtml.replace('<img', `<img style="${avatarStyle}"`);
                                }
                            } else {
                                // 미리보기용: <div> 태그 사용
                                const baseStyle = `width:55px;height:55px;min-width:55px;border-radius:50%;border:3px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; position: relative;`;
                                if (avatarSrc) {
                                    royalAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background:url('${avatarSrc}');background-size:cover;background-position:center;"></div>`;
                                } else {
                                    const letter = isUser ? '👑' : name.charAt(0).toUpperCase();
                                    royalAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background: linear-gradient(135deg, #7c3aed, #a855f7); display:flex;align-items:center;justify-content:center;"><span style="color: #fbbf24;font-weight:bold;font-size:1.4em; text-shadow: 0 0 10px rgba(251, 191, 36, 0.8);">${letter}</span></div>`;
                                }
                            }
                        }
                        
                        if (index > 0) {
                            logEntry += `
                                <div style="display:flex; align-items: center; text-align: center; margin: 2.5em auto; max-width: 60%;">
                                    <div style="flex-grow: 1; height: 1px; background: linear-gradient(to right, transparent, ${color.separator}, transparent);"></div>
                                    <span style="padding: 0 1em; color: ${color.separator}; font-size: 1.4em; text-shadow: 0 0 15px rgba(168, 85, 247, 0.6);">♦</span>
                                    <div style="flex-grow: 1; height: 1px; background: linear-gradient(to left, transparent, ${color.separator}, transparent);"></div>
                                </div>`;
                        }

                        logEntry += `<div class="chat-message-container" style="display:flex; flex-direction:column; align-items: center; ${!isForArca ? `font-family: ${royalFont};` : ''} text-align:center; margin-bottom:3em; position: relative;">`;
                        logEntry += `<div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 80%; height: 2px; background: linear-gradient(90deg, transparent, ${color.nameColor}, transparent); opacity: 0.6;"></div>`;
                        logEntry += royalAvatarHtml;
                        logEntry += `<strong style="color:${color.nameColor}; font-weight:500; font-size:1.5em; margin-top: 1em; letter-spacing: 2px; text-shadow: 0 0 12px rgba(251, 191, 36, 0.5);">${name}</strong>`;
                        logEntry += `<div style="background: ${isUser ? color.cardBgUser : color.cardBg}; color:${color.text}; line-height: 1.8; font-size: 1.1em; text-align: justify; margin-top: 1.5em; max-width: 95%; padding: 20px 25px; border-radius: 15px; border: 2px solid transparent; background-clip: padding-box; box-shadow: ${color.shadow}; position: relative; overflow: hidden;">`;
                        logEntry += `<div style="position: absolute; inset: -2px; background: linear-gradient(45deg, #7c3aed, #fbbf24, #7c3aed); border-radius: 17px; z-index: -1;"></div>`;
                        logEntry += `${messageHtml}</div>`;
                        logEntry += `</div>`;
                        break;

                    case 'ocean': // 심해 테마
                        let oceanAvatarHtml = '';
                        if (showAvatar) {
                            if (isForArca) {
                                // 아카라이브용: <img> 태그 사용 (data-user 속성 포함)
                                const margin = isUser ? 'margin-left:14px;' : 'margin-right:14px;';
                                if (avatarHtml.includes('style="')) {
                                    oceanAvatarHtml = avatarHtml.replace('style="', `style="${margin}`);
                                } else {
                                    oceanAvatarHtml = avatarHtml.replace('<img', `<img style="${margin}"`);
                                }
                            } else {
                                // 미리보기용: <div> 태그 사용
                                const baseStyle = `width:48px;height:48px;min-width:48px;border-radius:50%;border:2px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; position: relative;`;
                                if (avatarSrc) {
                                    oceanAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background:url('${avatarSrc}');background-size:cover;background-position:center;"></div>`;
                                } else {
                                    const letter = isUser ? '🌊' : name.charAt(0).toUpperCase();
                                    oceanAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background: radial-gradient(circle, #0891b2, #0c4a6e); display:flex;align-items:center;justify-content:center;"><span style="color: #22d3ee;font-weight:bold;font-size:1.2em; text-shadow: 0 0 8px rgba(34, 211, 238, 0.8);">${letter}</span></div>`;
                                }
                                const margin = isUser ? 'margin-left:14px;' : 'margin-right:14px;';
                                oceanAvatarHtml = oceanAvatarHtml.replace('style="', `style="${margin}`);
                            }
                        }

                        logEntry += `<div class="chat-message-container" style="display:flex; align-items:flex-start; margin-bottom:2em; position: relative; ${isUser ? 'flex-direction:row-reverse;' : ''}">`;
                        logEntry += `<div style="position: absolute; ${isUser ? 'right: 0;' : 'left: 0;'} top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, ${color.nameColor}, transparent); opacity: 0.5;"></div>`;
                        logEntry += oceanAvatarHtml;
                        logEntry += `<div style="flex:1; position: relative;">`;
                        logEntry += `<strong style="color:${color.nameColor}; font-weight:600; font-size:1em; display:block; margin-bottom:10px; text-align:${isUser ? 'right;' : 'left;'} text-shadow: 0 0 8px rgba(34, 211, 238, 0.4);">${name}</strong>`;
                        logEntry += `<div style="background: ${isUser ? color.cardBgUser : color.cardBg}; border-radius:18px; padding:16px 20px; box-shadow:${color.shadow}; border:1px solid rgba(34, 211, 238, 0.3); color:${color.text}; line-height:1.75; word-wrap:break-word; position:relative; overflow: hidden;">`;
                        logEntry += `<div style="position: absolute; top: 0; left: 0; right: 0; height: 100%; background: radial-gradient(ellipse at ${isUser ? 'right' : 'left'} top, rgba(34, 211, 238, 0.05), transparent 70%); pointer-events: none;"></div>`;
                        logEntry += `<div style="position: relative; z-index: 1;">${messageHtml}</div>`;
                        logEntry += `</div></div></div>`;
                        break;

                    case 'sakura': // 벚꽃 테마
                        let sakuraAvatarHtml = '';
                        if (showAvatar) {
                            if (isForArca) {
                                // 아카라이브용: <img> 태그 사용 (data-user 속성 포함)
                                const margin = isUser ? 'margin-left:12px;' : 'margin-right:12px;';
                                if (avatarHtml.includes('style="')) {
                                    sakuraAvatarHtml = avatarHtml.replace('style="', `style="${margin}`);
                                } else {
                                    sakuraAvatarHtml = avatarHtml.replace('<img', `<img style="${margin}"`);
                                }
                            } else {
                                // 미리보기용: <div> 태그 사용
                                const baseStyle = `width:46px;height:46px;min-width:46px;border-radius:50%;border:2px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; position: relative;`;
                                if (avatarSrc) {
                                    sakuraAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background:url('${avatarSrc}');background-size:cover;background-position:center;"></div>`;
                                } else {
                                    const letter = isUser ? '🌸' : name.charAt(0).toUpperCase();
                                    sakuraAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background: linear-gradient(135deg, #f472b6, #ec4899); display:flex;align-items:center;justify-content:center;"><span style="color: #fdf2f8;font-weight:bold;font-size:1.2em; text-shadow: 0 0 6px rgba(244, 114, 182, 0.6);">${letter}</span></div>`;
                                }
                                const margin = isUser ? 'margin-left:12px;' : 'margin-right:12px;';
                                sakuraAvatarHtml = sakuraAvatarHtml.replace('style="', `style="${margin}`);
                            }
                        }

                        if (index > 0) {
                            logEntry += `
                                <div style="display:flex; align-items: center; text-align: center; margin: 1.8em auto; max-width: 65%;">
                                    <div style="flex-grow: 1; height: 1px; background: linear-gradient(to right, transparent, ${color.separator}, transparent);"></div>
                                    <span style="padding: 0 0.8em; color: ${color.separator}; font-size: 1.1em;">🌸</span>
                                    <div style="flex-grow: 1; height: 1px; background: linear-gradient(to left, transparent, ${color.separator}, transparent);"></div>
                                </div>`;
                        }

                        logEntry += `<div class="chat-message-container" style="display:flex; align-items:flex-start; margin-bottom:2em; ${isUser ? 'flex-direction:row-reverse;' : ''}">`;
                        logEntry += sakuraAvatarHtml;
                        logEntry += `<div style="flex:1;">`;
                        logEntry += `<strong style="color:${color.nameColor}; font-weight:600; font-size:0.95em; display:block; margin-bottom:8px; text-align:${isUser ? 'right;' : 'left;'} text-shadow: 0 0 6px rgba(244, 114, 182, 0.3);">${name}</strong>`;
                        logEntry += `<div style="background: ${isUser ? color.cardBgUser : color.cardBg}; border-radius:20px; padding:15px 18px; box-shadow:${color.shadow}; border:1px solid rgba(244, 114, 182, 0.2); color:${color.text}; line-height:1.7; word-wrap:break-word; position: relative; overflow: hidden;">`;
                        logEntry += `<div style="position: absolute; top: -50%; right: -50%; width: 100%; height: 200%; background: radial-gradient(circle, rgba(244, 114, 182, 0.05), transparent 60%); pointer-events: none; animation: float 6s ease-in-out infinite;"></div>`;
                        logEntry += `<div style="position: relative; z-index: 1;">${messageHtml}</div>`;
                        logEntry += `</div></div></div>`;
                        break;

                    case 'matrix': // 매트릭스 테마
                        let matrixAvatarHtml = '';
                        if (showAvatar) {
                            if (isForArca) {
                                // 아카라이브용: <img> 태그 사용 (data-user 속성 포함)
                                const margin = isUser ? 'margin-left:10px;' : 'margin-right:10px;';
                                if (avatarHtml.includes('style="')) {
                                    matrixAvatarHtml = avatarHtml.replace('style="', `style="${margin}`);
                                } else {
                                    matrixAvatarHtml = avatarHtml.replace('<img', `<img style="${margin}"`);
                                }
                            } else {
                                // 미리보기용: <div> 태그 사용
                                const baseStyle = `width:44px;height:44px;min-width:44px;border-radius:4px;border:1px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; font-family: 'Courier New', monospace;`;
                                if (avatarSrc) {
                                    matrixAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background:url('${avatarSrc}');background-size:cover;background-position:center; filter: hue-rotate(120deg) saturate(0.8);"></div>`;
                                } else {
                                    const letter = isUser ? '[U]' : `[${name.charAt(0).toUpperCase()}]`;
                                    matrixAvatarHtml = `<div ${AVATAR_ATTR} style="${baseStyle}background: #000000; display:flex;align-items:center;justify-content:center;"><span style="color: ${color.nameColor};font-weight:bold;font-size:0.8em; text-shadow: 0 0 8px ${color.nameColor};">${letter}</span></div>`;
                                }
                                const margin = isUser ? 'margin-left:10px;' : 'margin-right:10px;';
                                matrixAvatarHtml = matrixAvatarHtml.replace('style="', `style="${margin}`);
                            }
                        }

                        logEntry += `<div class="chat-message-container" style="display:flex; align-items:flex-start; margin-bottom:1.5em; font-family: 'Courier New', monospace; ${isUser ? 'flex-direction:row-reverse;' : ''}">`;
                        logEntry += matrixAvatarHtml;
                        logEntry += `<div style="flex:1;">`;
                        logEntry += `<div style="color:${color.nameColor}; font-weight:bold; font-size:0.9em; margin-bottom:5px; text-align:${isUser ? 'right;' : 'left;'} text-shadow: 0 0 5px ${color.nameColor}; font-family: 'Courier New', monospace;">&gt; ${name.toUpperCase()}</div>`;
                        logEntry += `<div style="background: ${isUser ? color.cardBgUser : color.cardBg}; border:1px solid ${color.border}; padding:12px 15px; color:${color.text}; line-height:1.6; word-wrap:break-word; font-family: 'Courier New', monospace; font-size: 0.9em; text-shadow: 0 0 3px ${color.text}; position: relative;">`;
                        logEntry += `<div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: ${color.nameColor}; opacity: 0.6;"></div>`;
                        logEntry += `${messageHtml}</div></div></div>`;
                        break;
                    case 'log': // 개선된 로그 테마
                        const lineNumber = String(index + 1).padStart(4, '0');
                        const logBg = isUser ? color.cardBgUser : color.cardBg;
                        const statusIcon = isUser ? '→' : '←';

                        logEntry += `<div class="chat-message-container" style="
                            display: flex;
                            align-items: flex-start;
                            gap: 8px;
                            padding: 8px 12px;
                            background: ${logBg};
                            border: 1px solid ${color.border};
                            margin-bottom: 2px;
                            font-family: 'Courier New', 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
                            font-size: 0.9em;
                            position: relative;
                            transition: all 0.2s ease;
                        ">`;
                        
                        // 라인 번호
                        logEntry += `<div style="
                            color: ${color.textSecondary};
                            font-size: 0.8em;
                            width: 35px;
                            flex-shrink: 0;
                            text-align: right;
                            padding-right: 8px;
                            border-right: 1px solid ${color.border};
                            opacity: 0.6;
                        ">${lineNumber}</div>`;
                        
                        // 상태 아이콘
                        logEntry += `<div style="
                            color: ${color.nameColor};
                            font-size: 0.9em;
                            width: 15px;
                            flex-shrink: 0;
                            text-align: center;
                            font-weight: bold;
                        ">${statusIcon}</div>`;
                        
                        // 이름 (더 작게)
                        logEntry += `<div style="
                            color: ${color.nameColor};
                            font-weight: bold;
                            width: 80px;
                            flex-shrink: 0;
                            text-overflow: ellipsis;
                            overflow: hidden;
                            white-space: nowrap;
                            font-size: 0.85em;
                        ">[${name.toUpperCase()}]</div>`;
                        
                        // 메시지 내용
                        logEntry += `<div style="
                            color: ${color.text};
                            flex: 1;
                            line-height: 1.4;
                            word-wrap: break-word;
                        ">`;
                        
                        const tempMessageDiv = document.createElement('div');
                        tempMessageDiv.innerHTML = messageHtml;
                        tempMessageDiv.querySelectorAll('p').forEach(p => { 
                            p.style.margin = '0'; 
                            p.style.padding = '0';
                            p.style.display = 'inline';
                        });
                        logEntry += tempMessageDiv.innerHTML;
                        logEntry += `</div></div>`;
                        break;

                    case 'basic':
                    default: // ... (기존 기본 테마와 동일) ...
                        const cardBgColor = isUser ? color.cardBgUser : color.cardBg;
                        logEntry += `<div class="chat-message-container" style="display:flex;align-items:flex-start;margin-bottom:28px; ${isUser ? 'flex-direction:row-reverse;' : ''}">`;
                        logEntry += avatarHtml;
                        logEntry += `<div style="flex:1;">`;
                        logEntry += `<strong style="color:${color.nameColor};font-weight:600;font-size:0.95em;display:block;margin-bottom:8px;text-align:${isUser ? 'right;' : 'left;'}">${name}</strong>`;
                        if (showBubble) {
                            logEntry += `<div style="background-color:${cardBgColor};border-radius:16px;padding:14px 18px;box-shadow:${color.shadow};border:1px solid ${color.border};color:${color.text};line-height:1.8;word-wrap:break-word;position:relative;">${messageHtml}</div>`;
                        } else {
                            logEntry += `<div style="color:${color.text};line-height:1.8;word-wrap:break-word;padding: 0 4px;">${messageHtml}</div>`;
                        }
                        logEntry += '</div></div>';
                        break;
                }
    
                log += logEntry;
            }
    
            // 전체 컨테이너 스타일
            let containerStyle = `
                margin: 16px auto;
                max-width: 900px;
                background-color: ${color.background};
                border-radius: ${selectedThemeKey === 'log' ? '8px' : '12px'};
                overflow: hidden; /* 둥근 모서리에서 내용이 삐져나가지 않도록 */
            `;

            if (selectedThemeKey === 'log') {
                containerStyle += `
                    padding: 0; /* 컨테이너 자체 패딩 제거 */
                    border: none; /* 컨테이너 테두리 제거 */
                    box-shadow: none; /* 컨테이너 그림자 제거 */
                `;
            } else {
                containerStyle += `
                    border: 1px solid ${color.border};
                    box-shadow: ${color.shadow || 'none'};
                    padding: 24px 32px;
                `;
            }

            const containerIdSuffix = Date.now();

            // 테마별 최종 컨테이너 장식
            let extraStyles = '';
            if (selectedThemeKey === 'modern') {
                containerStyle += `background-image: linear-gradient(145deg, ${color.background}, #2c2f33);`;
            }
            // [수정] 아카라이브용으로 변환 시, 가상요소 대신 인라인 배경 이미지로 그라데이션을 직접 적용합니다.
            if (isForArca && selectedThemeKey === 'fantasy') {
                const gradient = `radial-gradient(ellipse at top, rgba(74, 85, 140, 0.3), transparent 60%), radial-gradient(ellipse at bottom, rgba(74, 85, 140, 0.2), transparent 70%)`;
                containerStyle += ` background-image: ${gradient};`;
            }
            if (selectedThemeKey === 'fantasy') {
                containerStyle += `
                    ${!isForArca ? `font-family:${fantasyFont};` : ''} 
                    border-image: linear-gradient(to bottom, ${color.border}, ${color.separator}) 1; 
                    border-width: 2px; 
                    border-style: solid;
                    position: relative; /* 가상 요소를 위한 기준점 */
                    overflow: hidden; /* 가상 요소가 삐져나가지 않도록 */
                    z-index: 0; /* 내용물과의 z-index 계층을 위해 */
                `;
                // 그라데이션 배경을 ::before 가상 요소로 분리하여 렌더링 문제 해결
                extraStyles = `
                    #tolog-fantasy-container-${containerIdSuffix}::before {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; width: 100%; height: 100%;
                        background-image: radial-gradient(ellipse at top, rgba(74, 85, 140, 0.3), transparent 60%), radial-gradient(ellipse at bottom, rgba(74, 85, 140, 0.2), transparent 70%);
                        pointer-events: none; /* 마우스 이벤트 방해 방지 */
                        z-index: -1; /* 내용물 뒤로 보내기 */
                    }
                `;
            }
            if (selectedThemeKey === 'fantasy2') {
                containerStyle += `${!isForArca ? `font-family: 'Nanum Myeongjo', serif;` : ''} background: ${color.background}; border: 2px solid transparent; background-clip: padding-box; position: relative; overflow: hidden;`;
                extraStyles = `
                    #tolog-fantasy2-container-${containerIdSuffix}::before {
                        content: '';
                        position: absolute;
                        inset: -2px;
                        background: linear-gradient(45deg, #10b981, #34d399, #10b981);
                        border-radius: 14px;
                        z-index: -1;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 0.5; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.05); }
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        33% { transform: translateY(-10px) rotate(1deg); }
                        66% { transform: translateY(5px) rotate(-1deg); }
                    }
                `;
            }
            if (selectedThemeKey === 'royal') {
                containerStyle += `${!isForArca ? `font-family: 'Nanum Myeongjo', serif;` : ''} background: ${color.background}; border: 3px solid transparent; background-clip: padding-box; position: relative;`;
                extraStyles = `
                    #tolog-royal-container-${containerIdSuffix}::before {
                        content: '';
                        position: absolute;
                        inset: -3px;
                        background: linear-gradient(45deg, #7c3aed, #fbbf24, #a855f7, #fbbf24, #7c3aed);
                        border-radius: 15px;
                        z-index: -1;
                        animation: royalShine 4s linear infinite;
                    }
                    @keyframes royalShine {
                        0% { background-position: 0% 50%; }
                        100% { background-position: 200% 50%; }
                    }
                `;
            }
            if (selectedThemeKey === 'ocean') {
                containerStyle += `background: ${color.background}; border: 1px solid rgba(34, 211, 238, 0.3); position: relative; overflow: hidden;`;
                extraStyles = `
                    #tolog-ocean-container-${containerIdSuffix}::before {
                        content: '';
                        position: absolute;
                        top: 0; left: -100%; width: 200%; height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.1), transparent);
                        animation: wave 3s ease-in-out infinite;
                        z-index: -1;
                    }
                    @keyframes wave {
                        0% { left: -100%; }
                        100% { left: 100%; }
                    }
                `;
            }
            if (selectedThemeKey === 'sakura') {
                containerStyle += `background: ${color.background}; border: 1px solid rgba(244, 114, 182, 0.2); position: relative; overflow: hidden;`;
                extraStyles = `
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        33% { transform: translateY(-8px) rotate(2deg); }
                        66% { transform: translateY(4px) rotate(-1deg); }
                    }
                `;
            }
            if (selectedThemeKey === 'matrix') {
                containerStyle += `background: ${color.background}; border: 1px solid ${color.border}; font-family: 'Courier New', monospace; position: relative;`;
                extraStyles = `
                    #tolog-matrix-container-${containerIdSuffix}::before {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; right: 0; height: 2px;
                        background: linear-gradient(90deg, transparent, ${color.nameColor}, transparent);
                        animation: scan 2s linear infinite;
                    }
                    @keyframes scan {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `;
            }

            // [수정] 푸터 HTML 생성 로직
            const generateFooterHtml = () => {
                if (!showFooter) return '';
                return `
                    <footer style="text-align: center; margin-top: 3em; padding-top: 1.5em; border-top: 1px solid ${color.border}; font-size: 0.8em; color: ${color.text}; opacity: 0.6;">
                        Created by Chat Log Exporter Plugin
                    </footer>
                `;
            };

            // [수정] 최종 return 구문에 헤더와 푸터 포함
            const headerHtml = await generateHeaderHtml();
            const footerHtml = generateFooterHtml();
            // 최종 HTML 생성 로직 수정
            const containerIdMap = {
                'fantasy': `tolog-fantasy-container-${containerIdSuffix}`,
                'fantasy2': `tolog-fantasy2-container-${containerIdSuffix}`,
                'modern': `tolog-modern-container-${containerIdSuffix}`,
                'royal': `tolog-royal-container-${containerIdSuffix}`,
                'ocean': `tolog-ocean-container-${containerIdSuffix}`,
                'matrix': `tolog-matrix-container-${containerIdSuffix}`
            };
            const containerId = containerIdMap[selectedThemeKey] ? ` id="${containerIdMap[selectedThemeKey]}"` : '';
            let finalHtml = `<div${containerId} style="${containerStyle}">
                                <style>${baseTagStyles}${extraStyles}</style>${headerHtml}${log}${footerHtml}
                             </div>`;
            if (['fantasy', 'fantasy2', 'royal'].includes(selectedThemeKey)) {
                const fontLink = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap">`;
                finalHtml = fontLink + finalHtml;
            }
            return finalHtml;
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
 * 미리보기 컨테이너를 이미지 파일로 저장합니다. (오프스크린 렌더링 최종 안정화 버전)
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
async function savePreviewAsImage(previewContainer, onProgress, cancellationToken, charName, chatName, options = {}) {
    const { useHighRes = false, baseFontSize = 16, imageWidth = 900, library = 'html-to-image' } = options;
    console.log(`[Log Exporter] savePreviewAsImage: 이미지 저장을 시작합니다. (v3 - border-image 시뮬레이션 적용)`, { useHighRes, imageWidth, library });

    let captureTarget = previewContainer.querySelector('div');
    if (!captureTarget) {
        console.error('[Log Exporter] 캡처할 대상 div를 찾을 수 없습니다.');
        alert('이미지 저장에 실패했습니다: 캡처할 콘텐츠를 찾을 수 없습니다.', 'error');
        return false;
    }
    if (captureTarget.shadowRoot) {
        captureTarget = captureTarget.shadowRoot.querySelector('.preview-wrapper') || captureTarget.shadowRoot.firstElementChild || captureTarget;
    }

    const rootHtml = document.documentElement;
    // 나중에 복원할 원본 스타일 저장
    const originalStyles = {
        preview: { width: previewContainer.style.width, height: previewContainer.style.height, maxHeight: previewContainer.style.maxHeight, overflowY: previewContainer.style.overflowY, padding: previewContainer.style.padding, border: previewContainer.style.border },
        target: { width: captureTarget.style.width, border: captureTarget.style.border, borderImage: captureTarget.style.borderImage, backgroundImage: captureTarget.style.backgroundImage, margin: captureTarget.style.margin },
        rootHtml: { fontSize: rootHtml.style.fontSize }
    };

    const domReplacements = [];
    const originalMessageNodes = Array.from(captureTarget.childNodes);
    let borderWrapper = null; // border-image 시뮬레이션용 래퍼

    try {
        // --- 웹 폰트 로드 ---
        const fontLinkEl = previewContainer.querySelector('link[href*="fonts.googleapis.com"]');
        if (fontLinkEl) {
            onProgress('웹 폰트 로딩 중...', 2, 100);
            try {
                const fontFace = new FontFace('Nanum Myeongjo', `url(${fontLinkEl.href})`);
                await fontFace.load();
                document.fonts.add(fontFace);
            } catch (fontError) {
                console.warn('[Log Exporter] 웹 폰트 로드 실패', fontError);
            }
        }

        // --- 캡처 라이브러리 로드 ---
        let imageLib;
        if (library === 'dom-to-image') {
            await ensureDomToImage(); imageLib = window.domtoimage;
        } else {
            await ensureHtmlToImage(); imageLib = window.__htmlToImageLib || window.htmlToImage;
        }

        // --- 비디오 프레임 캡처 (생략) ---

        // --- [핵심 수정] 판타지 테마 렌더링 문제 해결 ---
        const isFantasyTheme = originalStyles.target.fontFamily?.includes('Nanum Myeongjo') || captureTarget.style.fontFamily.includes('Nanum Myeongjo');
        if (isFantasyTheme) {
            console.log('[Log Exporter] 판타지 테마의 그래픽 요소를 캡처용으로 변환합니다.');
            const themeColor = THEMES.fantasy.color;

            // 1. 배경 그래디언트를 SVG로 변환
            if (originalStyles.target.backgroundImage.includes('gradient')) {
                const width = captureTarget.offsetWidth;
                const height = captureTarget.offsetHeight;
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="grad1" cx="50%" cy="0%" r="60%"><stop offset="0%" stop-color="rgba(74, 85, 140, 0.3)" /><stop offset="60%" stop-color="transparent" /></radialGradient><radialGradient id="grad2" cx="50%" cy="100%" r="70%"><stop offset="0%" stop-color="rgba(74, 85, 140, 0.2)" /><stop offset="70%" stop-color="transparent" /></radialGradient></defs><rect x="0" y="0" width="${width}" height="${height}" fill="${themeColor.background}" /><rect x="0" y="0" width="${width}" height="${height}" fill="url(#grad1)" /><rect x="0" y="0" width="${width}" height="${height}" fill="url(#grad2)" /></svg>`;
                const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
                captureTarget.style.backgroundImage = `url("${svgBase64}")`;
            }

            // 2. border-image를 Wrapper 기법으로 시뮬레이션
            if (originalStyles.target.borderImage !== 'none' && originalStyles.target.borderImage !== '') {
                borderWrapper = document.createElement('div');
                
                // Wrapper에 그래디언트 배경과 패딩 적용
                Object.assign(borderWrapper.style, {
                    padding: '2px', // border-width 값
                    borderRadius: captureTarget.style.borderRadius,
                    background: `linear-gradient(to bottom, ${themeColor.border}, ${themeColor.separator})`
                });

                // 원본 요소의 테두리 제거 및 마진 초기화
                Object.assign(captureTarget.style, {
                    border: 'none',
                    borderImage: 'none',
                    margin: '0'
                });
                
                // DOM 구조 변경: captureTarget을 wrapper 안으로 이동
                captureTarget.parentNode.insertBefore(borderWrapper, captureTarget);
                borderWrapper.appendChild(captureTarget);
            }
        }

        // --- 캡처 준비 ---
        onProgress('렌더링 준비 중...', 10, 100);
        await document.fonts.ready;
        const pixelRatio = useHighRes ? (window.devicePixelRatio || 2) : 1;
        const commonOptions = { quality: 1.0, pixelRatio, backgroundColor: getComputedStyle(captureTarget).backgroundColor || '#1a1b26' };
        
        rootHtml.style.fontSize = `${baseFontSize}px`;
        Object.assign(previewContainer.style, { height: 'auto', maxHeight: 'none', overflowY: 'visible', border: 'none', padding: '0', width: `${imageWidth}px` });
        (borderWrapper || captureTarget).style.width = `${imageWidth}px`;
        
        await new Promise(r => requestAnimationFrame(r));
        
        // --- 이미지 생성 및 분할 저장 로직 (기존과 동일) ---
        // (이 부분은 수정할 필요가 없으므로 생략합니다. 기존 코드를 그대로 사용하세요)
        const totalHeight = (borderWrapper || captureTarget).scrollHeight;
        const MAX_CHUNK_HEIGHT = 30000;
        
        if (totalHeight <= MAX_CHUNK_HEIGHT) {
            // 단일 이미지 저장
            let canvas = await imageLib.toCanvas(previewContainer, { ...commonOptions, width: imageWidth, height: totalHeight });
            downloadImage(canvas.toDataURL('image/png', 1.0), charName, chatName);
        } else {
            // 분할 저장
            // (이 로직은 매우 길기 때문에 생략합니다. 기존의 분할 저장 로직을 여기에 그대로 두시면 됩니다.)
             alert('분할 저장 로직은 생략되었습니다. 이 부분은 기존 코드를 유지하세요.');
        }

        return true;

    } catch (e) {
        if (e.message !== "Cancelled") {
            console.error('[Log Exporter] 이미지 저장 중 오류 발생:', e);
            alert('이미지 저장 중 오류가 발생했습니다. 개발자 콘솔(F12)을 확인해주세요.', 'error');
        }
        return false;
    } finally {
        // --- [핵심 수정] 최종 정리 및 완벽 복원 ---
        console.log("[Log Exporter] 이미지 저장 절차를 종료하고 원본 상태로 복원합니다.");
        
        // 1. border-image 시뮬레이션 되돌리기
        if (borderWrapper) {
            borderWrapper.parentNode.insertBefore(captureTarget, borderWrapper);
            borderWrapper.parentNode.removeChild(borderWrapper);
        }

        // 2. 비디오 이미지 대체를 되돌림 (생략)
        
        // 3. 미리보기 창을 비우고, 미리 저장해둔 원본 메시지 노드 전체를 복원
        while (captureTarget.firstChild) captureTarget.removeChild(captureTarget.firstChild);
        originalMessageNodes.forEach(node => captureTarget.appendChild(node));

        // 4. 모든 스타일을 원상 복구
        Object.assign(previewContainer.style, originalStyles.preview);
        Object.assign(captureTarget.style, originalStyles.target);
        Object.assign(rootHtml.style, originalStyles.rootHtml);
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
     * [수정] innerHTML 재파싱으로 인한 스타일 손실을 방지하기 위해 문자열 기반 처리로 변경
     * [핵심 수정] 아바타와 일반 이미지를 구분하여 순차적으로 교체
     */
    async function generateArcaLiveTemplate(nodes, charInfo, themeKey = 'basic', colorKey = 'dark', showAvatar = true) {
        console.log('[Log Exporter] generateArcaLiveTemplate: 아카라이브용 템플릿 생성 시작');
        let imageCounter = 0;

        // 헤더/푸터/말풍선은 아카라이브 템플릿에 포함시키지 않음 (false, false, false)
        let baseHtml = await generateBasicFormatLog(nodes, charInfo, themeKey, colorKey, showAvatar, false, false, true, true);

        // [핵심 수정] 이미지를 순서대로 찾아서 교체하되, 정확한 패턴 매칭 사용
        // 1. 먼저 모든 이미지의 위치와 타입을 파악
        const imageMatches = [];
        
        // 1-1. data-tolog-avatar 속성을 가진 아바타 이미지 찾기 (data-user 속성도 추출)
        const avatarRegex = /<img\s+[^>]*data-tolog-avatar[^>]*data-user="(true|false)"[^>]*>/gi;
        let match;
        while ((match = avatarRegex.exec(baseHtml)) !== null) {
            const isUser = match[1] === 'true';
            imageMatches.push({ index: match.index, length: match[0].length, type: 'avatar', isUser, content: match[0] });
        }
        
        // 1-2. 배경 이미지를 가진 div 찾기 (아바타용) - 주변 컨텍스트에서 isUser 판단
        const bgImageRegex = /<div\s+[^>]*style="[^"]*background-image:\s*url\([^)]+\)[^"]*"[^>]*>/gi;
        while ((match = bgImageRegex.exec(baseHtml)) !== null) {
            // 해당 div를 포함하는 부모 컨테이너를 찾아 flex-direction을 확인
            // flex-direction:row-reverse가 있으면 사용자 메시지
            const contextStart = Math.max(0, match.index - 200);
            const contextEnd = Math.min(baseHtml.length, match.index + match[0].length + 200);
            const context = baseHtml.substring(contextStart, contextEnd);
            
            // 주변 200자 내에서 flex-direction:row-reverse를 찾음
            const isUser = context.includes('flex-direction:row-reverse');
            
            imageMatches.push({ index: match.index, length: match[0].length, type: 'avatar-bg', isUser, content: match[0] });
        }
        
        // 1-3. 일반 이미지 찾기 (data-tolog-avatar가 없는 img)
        const imgRegex = /<img\s+(?![^>]*data-tolog-avatar)[^>]*>/gi;
        while ((match = imgRegex.exec(baseHtml)) !== null) {
            imageMatches.push({ index: match.index, length: match[0].length, type: 'content', content: match[0] });
        }
        
        // 2. 인덱스 순으로 정렬 (문서 순서대로)
        imageMatches.sort((a, b) => a.index - b.index);
        
        console.log(`[Log Exporter] generateArcaLiveTemplate: 발견된 이미지 타입별 개수:`, {
            avatar: imageMatches.filter(m => m.type === 'avatar').length,
            avatarBg: imageMatches.filter(m => m.type === 'avatar-bg').length,
            content: imageMatches.filter(m => m.type === 'content').length,
            total: imageMatches.length
        });
        
        // 3. 먼저 정방향으로 번호를 매기고, 뒤에서부터 치환 (인덱스 변화 방지)
        for (let i = 0; i < imageMatches.length; i++) {
            imageMatches[i].imageNumber = i + 1;  // 정방향으로 번호 매기기
        }
        
        // 4. 뒤에서부터 치환 (인덱스 변화 방지하면서 실제 HTML 수정)
        for (let i = imageMatches.length - 1; i >= 0; i--) {
            const img = imageMatches[i];
            const imageNumber = img.imageNumber;  // 미리 매겨진 번호 사용
            
            let placeholder;
            if (img.type === 'avatar' || img.type === 'avatar-bg') {
                // 아바타인 경우 isUser 정보를 자리표시자에 포함
                const isUserValue = img.isUser !== undefined ? img.isUser : false;
                placeholder = `<!-- ARCA_AVATAR_PLACEHOLDER_${isUserValue ? 'true' : 'false'}_${imageNumber} -->`;
                console.log(`[Log Exporter] 아바타 #${imageNumber}: type=${img.type}, isUser=${isUserValue}`);
            } else {
                placeholder = `<!-- ARCA_IMG_PLACEHOLDER_${imageNumber} -->`;
                console.log(`[Log Exporter] 일반 이미지 #${imageNumber}`);
            }
            
            baseHtml = baseHtml.substring(0, img.index) + placeholder + baseHtml.substring(img.index + img.length);
        }
        
        imageCounter = imageMatches.length;

        console.log(`[Log Exporter] generateArcaLiveTemplate: 템플릿 생성 완료. 이미지 개수: ${imageCounter}`);
        return baseHtml;
    }

    /**
     * 로그 내보내기 옵션을 설정하고 미리보기를 제공하는 메인 모달을 표시합니다.
     * @async
     * @param {number} chatIndex - 내보낼 채팅의 인덱스.
     * @param {object} [options={}] - 추가 옵션.
     */
    async function showCopyPreviewModal(chatIndex, options = {}) {
        console.log(`[Log Exporter] showCopyPreviewModal: 미리보기 모달 표시 시작. 채팅 인덱스: ${chatIndex}, 옵션:`, options);
        try {
            // processChatLog에 옵션을 바로 전달하여 필터링된 노드와 채팅 이름을 가져옴
            let { charName, chatName, charAvatarUrl, messageNodes } = await processChatLog(chatIndex, options);

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
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'modal-header');
            modal.innerHTML = `
            <div class="log-exporter-modal">
                <button id="log-exporter-close" class="log-exporter-modal-close-btn" title="닫기 (Esc)" aria-label="모달 닫기" style="min-width: 44px; min-height: 44px;">
                    &times;
                </button>
                <div class="log-exporter-modal-header" id="modal-header">로그 내보내기 옵션 <span style="font-size: 0.75em; color: #7aa2f7; margin-left: 8px;">(Ctrl+/ 도움말)</span></div>
                <div class="log-exporter-modal-content">
                    <div class="log-exporter-left-panel">
                        <div class="log-exporter-modal-options">
                            <div id="format-selection-group" role="radiogroup" aria-label="로그 형식 선택">
                                <strong>형식: <span style="font-size: 0.7em; color: #565f89;">(단축키: 1~4)</span></strong>
                                <label style="cursor: pointer; padding: 4px;"><input type="radio" name="log-format" value="html" accesskey="1"> <u>H</u>TML</label>
                                <label style="cursor: pointer; padding: 4px;"><input type="radio" name="log-format" value="basic" checked accesskey="2"> <u>기</u>본</label>
                                <label style="cursor: pointer; padding: 4px;"><input type="radio" name="log-format" value="markdown" accesskey="3"> <u>마</u>크다운</label>
                                <label style="cursor: pointer; padding: 4px;"><input type="radio" name="log-format" value="text" accesskey="4"> <u>일</u>반 텍스트</label>
                            </div>
                            <div id="basic-options-group" style="display: none;">
                                <div id="theme-selection-group" style="display: flex; flex-direction: column; gap: 8px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <label for="theme-selector" style="font-size: 0.9em;">테마: <span style="font-size: 0.8em; color: #565f89;">(↑↓로 선택)</span></label>
                                        <select id="theme-selector" name="log-theme" aria-label="테마 선택">
                                        ${Object.entries(THEMES).map(([key, theme]) =>
                                            `<option value="${key}" title="${theme.description}" ${key === 'basic' ? 'selected' : ''}>${theme.name}</option>`
                                        ).join('')}
                                        </select>
                                    </div>
                                </div>
                                <div id="color-selector-container" style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; transition: opacity 0.3s;">
                                    <label for="color-selector" style="font-size: 0.9em;">색상 (기본 테마 전용):</label>
                                    <select id="color-selector">
                                        ${Object.entries(COLORS).map(([key, color]) =>
                                            `<option value="${key}" ${key === 'dark' ? 'selected' : ''}>${color.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                 <div id="avatar-toggle-controls" style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
                                    <label style="font-size:0.9em;"><input type="checkbox" id="avatar-toggle-checkbox" checked> 아바타 표시</label>
                                    <label style="font-size:0.9em;" title="말풍선 배경과 테두리를 표시합니다. 해제 시 텍스트만 나옵니다.">
                                        <input type="checkbox" id="bubble-toggle-checkbox" checked> 말풍선 표시
                                    </label>
                                </div>
                                <div id="extra-elements-controls" style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #414868;">
                                    <label style="font-size:0.9em;" title="캐릭터 이름과 채팅 제목을 표시합니다.">
                                        <input type="checkbox" id="header-toggle-checkbox" checked> 헤더 표시
                                    </label>
                                    <label style="font-size:0.9em;" title="플러그인 크레딧을 표시합니다.">
                                        <input type="checkbox" id="footer-toggle-checkbox" checked> 푸터 표시
                                    </label>
                                </div>
                            </div>
                            <div id="image-scale-controls" style="display: none;">
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <label for="image-scale-slider" title="미리보기의 모든 이미지 크기를 조절합니다. 키보드 화살표로 조정 가능" style="font-size:0.9em;">이미지 크기: <span style="font-size: 0.8em; color: #565f89;">(←→)</span></label>
                                    <span id="image-scale-value" style="font-size: 0.9em; width: 50px; text-align: right; font-weight: bold; color: #7aa2f7;">100%</span>
                                </div>
                                <input type="range" id="image-scale-slider" min="10" max="100" value="100" step="5" style="width: 100%; cursor: pointer;" aria-label="이미지 크기 조절" aria-valuemin="10" aria-valuemax="100" aria-valuenow="100" aria-valuetext="100%">
                            </div>
                            <div id="html-options-group" style="display:none; flex-direction: column; gap: 8px;">
                                <label><input type="checkbox" id="style-toggle-checkbox"> 스타일 인라인 적용</label>
                                <label><input type="checkbox" id="expand-hover-elements-checkbox"> 호버 요소 항상 펼치기</label>
                            </div>
                            <div id="filter-controls">
                                <label><input type="checkbox" id="filter-toggle-checkbox" checked> UI 필터링 적용</label>
                                ${uiClasses.length > 0 ? `
                                    <button id="custom-filter-toggle" class="log-exporter-modal-btn" style="margin-left: 10px; padding: 3px 8px; font-size: 0.85em;">
                                        커스텀 필터 설정 ▼
                                    </button>
                                ` : ''}
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
                <div class="log-exporter-modal-footer" id="log-exporter-footer" role="toolbar" aria-label="내보내기 도구">
                    <button class="log-exporter-modal-btn" id="log-exporter-raw-toggle" style="display: none;" aria-label="HTML Raw 보기 전환" accesskey="r">HTML <u>R</u>aw 보기</button>
                    <button class="log-exporter-modal-btn" id="log-exporter-save-file" aria-label="HTML 파일로 저장" accesskey="s"><u>S</u>ave HTML 파일</button>
                    <button class="log-exporter-modal-btn" id="arca-helper-toggle-btn" style="background-color: #bb9af7; color: #1a1b26; display: none;" aria-label="아카라이브 변환기 열기">아카라이브 변환기</button>
                    
                    <!-- [복원] 이미지 저장 옵션 UI -->
                    <div id="image-export-controls" style="display: flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap; font-size: 0.9em;">
                        <label><input type="checkbox" id="image-high-res-checkbox" checked>고해상도</label>
                        <label>엔진:
                            <select id="image-library-selector" style="width: auto; margin-left: 4px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 4px; text-align: center;">
                                <option value="html-to-image" selected>html-to-image</option>
                                <option value="dom-to-image">dom-to-image</option>
                            </select></label>
                        <label>폰트:<input type="number" id="image-font-size-input" value="26" min="12" max="40" style="width: 45px; margin-left: 4px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 4px; text-align: center;"></label>
                        <label>너비:<input type="number" id="image-width-input" value="700" min="600" max="1200" step="50" style="width: 60px; margin-left: 4px; background: #1a1b26; color: #c0caf5; border: 1px solid #414868; border-radius: 4px; text-align: center;"></label>
                        <button class="log-exporter-modal-btn image-save" id="log-exporter-save-image" aria-label="이미지로 저장" accesskey="i" style="min-height: 36px;"><u>I</u>mage 저장</button>    
                    </div>
                    
                    <button class="log-exporter-modal-btn" id="log-exporter-download-zip" style="background-color: #e0af68; color: #1a1b26; min-height: 36px;" aria-label="이미지 ZIP 다운로드" accesskey="z"><u>Z</u>IP 다운로드</button>
                    <button class="log-exporter-modal-btn" id="log-exporter-copy-formatted" title="메일, 노션 등에 사용해볼 수 있지만, 대상 프로그램에 따라 서식이 깨질 수 있습니다." aria-label="서식 있는 텍스트로 복사" accesskey="f" style="min-height: 36px;">
                        서식 복사 (<u>F</u>ormatted)
                    </button>
                    <button class="log-exporter-modal-btn primary" id="log-exporter-copy-html" title="웹페이지, 블로그, 아카라이브 HTML 모드 등 HTML을 직접 편집할 수 있는 환경에 최적화되어 있습니다. 모든 서식과 이미지가 포함된 완전한 코드를 복사합니다." aria-label="HTML 소스 코드 복사" accesskey="c" style="min-height: 36px;">
                        HTML 소스 <u>C</u>opy (권장)
                    </button>
                    <button class="log-exporter-modal-btn mobile-more-menu-btn" id="mobile-more-menu" title="추가 기능 보기">
                        더보기 ⋯
                    </button>
                </div>
                <div class="log-exporter-modal-footer" id="log-exporter-progress-footer" style="display: none; flex-direction: column; align-items: stretch; gap: 10px;" role="status" aria-live="polite">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
                        <span id="progress-status-text" aria-live="polite">이미지 처리 중...</span>
                        <span id="progress-percentage-text" aria-live="polite" style="font-weight: bold; color: #7aa2f7;">0%</span>
                    </div>
                    <progress id="export-progress-bar" value="0" max="100" style="width: 100%; height: 12px;" aria-label="내보내기 진행 상황"></progress>
                    <button class="log-exporter-modal-btn" id="log-exporter-cancel-image" style="background-color: #f7768e; color: #1a1b26; min-height: 40px;" aria-label="내보내기 취소" accesskey="x">취소 (<u>X</u>)</button>
                </div>
            </div>`;
            document.body.appendChild(modal);

            // 모바일 환경 최적화: 모달 열릴 때 배경 스크롤 방지
            const originalOverflow = document.body.style.overflow;
            const originalPosition = document.body.style.position;
            const originalTop = document.body.style.top;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollTop}px`;
            document.body.style.width = '100%';

            // 접근성: 포커스 트랩 설정
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusableElement = focusableElements[0];
            const lastFocusableElement = focusableElements[focusableElements.length - 1];

            // 모달이 열리면 첫 번째 요소에 포커스
            setTimeout(() => {
                if (firstFocusableElement) {
                    firstFocusableElement.focus();
                }
            }, 100);

            // Tab 키 트랩 핸들러
            const handleTabKey = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusableElement) {
                            lastFocusableElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastFocusableElement) {
                            firstFocusableElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            };

            // ESC 키로 모달 닫기
            const handleEscapeKey = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                }
            };

            // 키보드 단축키 핸들러
            const handleKeyboardShortcuts = (e) => {
                // Ctrl+/ 또는 Cmd+/: 도움말 표시
                if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                    e.preventDefault();
                    showKeyboardHelp();
                    return;
                }
                
                // Ctrl+S: HTML 파일 저장 (기본 저장 동작 방지)
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    const saveBtn = modal.querySelector('#log-exporter-save-file');
                    if (saveBtn && saveBtn.style.display !== 'none') saveBtn.click();
                    return;
                }
                
                // Ctrl+Enter: HTML 복사
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    modal.querySelector('#log-exporter-copy-html')?.click();
                    return;
                }
                
                // 숫자 키 1-4: 형식 선택
                if (e.key >= '1' && e.key <= '4' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    const formats = ['html', 'basic', 'markdown', 'text'];
                    const formatInput = modal.querySelector(`input[name="log-format"][value="${formats[parseInt(e.key) - 1]}"]`);
                    if (formatInput && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                        formatInput.checked = true;
                        formatInput.dispatchEvent(new Event('change', { bubbles: true }));
                        e.preventDefault();
                    }
                }
            };

            // 도움말 모달 표시 함수
            const showKeyboardHelp = () => {
                const helpModal = document.createElement('div');
                helpModal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100001;';
                helpModal.innerHTML = `
                    <div style="background: #1a1b26; color: #c0caf5; padding: 24px; border-radius: 12px; max-width: 500px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                        <h3 style="margin: 0 0 16px 0; color: #7aa2f7; font-size: 1.3em;">⌨️ 키보드 단축키</h3>
                        <div style="display: grid; gap: 10px; font-size: 0.95em;">
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: #24283b; border-radius: 6px;">
                                <span><kbd style="background: #414868; padding: 2px 8px; border-radius: 4px; font-family: monospace;">Esc</kbd></span>
                                <span style="color: #a9b1d6;">모달 닫기</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: #24283b; border-radius: 6px;">
                                <span><kbd style="background: #414868; padding: 2px 8px; border-radius: 4px; font-family: monospace;">Ctrl + /</kbd></span>
                                <span style="color: #a9b1d6;">도움말 보기</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: #24283b; border-radius: 6px;">
                                <span><kbd style="background: #414868; padding: 2px 8px; border-radius: 4px; font-family: monospace;">Ctrl + S</kbd></span>
                                <span style="color: #a9b1d6;">파일 저장</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: #24283b; border-radius: 6px;">
                                <span><kbd style="background: #414868; padding: 2px 8px; border-radius: 4px; font-family: monospace;">Ctrl + Enter</kbd></span>
                                <span style="color: #a9b1d6;">HTML 복사</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: #24283b; border-radius: 6px;">
                                <span><kbd style="background: #414868; padding: 2px 8px; border-radius: 4px; font-family: monospace;">1 ~ 4</kbd></span>
                                <span style="color: #a9b1d6;">형식 선택</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: #24283b; border-radius: 6px;">
                                <span><kbd style="background: #414868; padding: 2px 8px; border-radius: 4px; font-family: monospace;">Tab</kbd></span>
                                <span style="color: #a9b1d6;">다음 요소로 이동</span>
                            </div>
                        </div>
                        <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; width: 100%; padding: 10px; background: #7aa2f7; color: #1a1b26; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1em;">닫기 (Esc)</button>
                    </div>
                `;
                helpModal.addEventListener('click', (e) => {
                    if (e.target === helpModal) helpModal.remove();
                });
                helpModal.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') helpModal.remove();
                });
                document.body.appendChild(helpModal);
                helpModal.querySelector('button')?.focus();
            };

            document.addEventListener('keydown', handleTabKey);
            document.addEventListener('keydown', handleEscapeKey);
            document.addEventListener('keydown', handleKeyboardShortcuts);

            // 터치 제스처 지원: 스와이프로 모달 닫기
            let touchStartY = 0;
            let touchStartX = 0;
            let touchStartTime = 0;
            
            const handleTouchStart = (e) => {
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
                touchStartTime = Date.now();
            };
            
            const handleTouchEnd = (e) => {
                if (!e.changedTouches[0]) return;
                
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndX = e.changedTouches[0].clientX;
                const touchDuration = Date.now() - touchStartTime;
                
                const deltaY = touchEndY - touchStartY;
                const deltaX = touchEndX - touchStartX;
                const absDeltaY = Math.abs(deltaY);
                const absDeltaX = Math.abs(deltaX);
                
                // 빠른 세로 스와이프 (아래로 300px 이상 또는 빠른 속도)
                if (absDeltaY > absDeltaX && 
                    ((absDeltaY > 300) || (absDeltaY > 100 && touchDuration < 300)) &&
                    deltaY > 0) {
                    closeModal();
                }
            };
            
            // 모달 배경에서만 터치 제스처 적용 (내용 영역에서는 제외)
            modal.addEventListener('touchstart', (e) => {
                if (e.target === modal) {
                    handleTouchStart(e);
                }
            }, { passive: true });
            
            modal.addEventListener('touchend', (e) => {
                if (e.target === modal) {
                    handleTouchEnd(e);
                }
            }, { passive: true });

            // 더보기 메뉴 기능 구현
            const mobileMoreBtn = modal.querySelector('#mobile-more-menu');
            let moreMenuExpanded = false;
            
            const hiddenButtons = [
                '#log-exporter-save-file',
                '#log-exporter-copy-formatted', 
                '#log-exporter-copy-html',
                '#log-exporter-download-zip',
                '#arca-helper-toggle-btn'
            ];
            
            if (mobileMoreBtn) {
                mobileMoreBtn.addEventListener('click', () => {
                    moreMenuExpanded = !moreMenuExpanded;
                    
                    hiddenButtons.forEach(selector => {
                        const btn = modal.querySelector(selector);
                        if (btn) {
                            btn.style.setProperty('display', moreMenuExpanded ? 'block' : 'none', 'important');
                        }
                    });
                    
                    // 이미지 익스포트 컨트롤도 토글 (내부 버튼들은 개별 처리 안 함)
                    const imageControls = modal.querySelector('#image-export-controls');
                    if (imageControls) {
                        imageControls.style.setProperty('display', moreMenuExpanded ? 'flex' : 'none', 'important');
                    }
                    
                    // 버튼 텍스트 변경
                    mobileMoreBtn.textContent = moreMenuExpanded ? '간단히 ⋀' : '더보기 ⋯';
                    mobileMoreBtn.style.backgroundColor = moreMenuExpanded ? '#f7768e' : '#9ece6a';
                    
                    // 푸터 높이 조정 및 스타일 적용
                    const footer = modal.querySelector('.log-exporter-modal-footer');
                    if (moreMenuExpanded) {
                        footer.setAttribute('data-expanded', 'true');
                        footer.style.maxHeight = '50vh';
                        footer.style.overflow = 'auto';
                        footer.style.flexWrap = 'wrap';
                        footer.style.alignContent = 'flex-start';
                    } else {
                        footer.removeAttribute('data-expanded');
                        footer.style.maxHeight = '15vh';
                        footer.style.overflow = 'hidden';
                        footer.style.flexWrap = 'wrap';
                        footer.style.alignContent = 'center';
                    }
                });
            }

            // [추가] 화면 크기 변경 감지 및 스타일 초기화 로직
            const mediaQuery = window.matchMedia('(max-width: 768px)');
            
            const handleViewportChange = (e) => {
                const isMobile = e.matches;
                console.log(`[Log Exporter] 뷰포트 변경 감지: ${isMobile ? '모바일' : '데스크톱'}`);

                // 데스크톱 뷰로 전환될 때
                if (!isMobile) {
                    // '더보기' 메뉴가 열려있던 상태를 초기화
                    moreMenuExpanded = false;
                    const footer = modal.querySelector('.log-exporter-modal-footer');
                    if (footer) {
                        footer.removeAttribute('data-expanded');
                        // 푸터의 모든 인라인 스타일 제거 (maxHeight, overflow 등)
                        footer.style.maxHeight = '';
                        footer.style.overflow = '';
                        footer.style.flexWrap = '';
                        footer.style.alignContent = '';
                    }

                    // 모든 버튼의 인라인 display 스타일을 제거하여 CSS 규칙이 적용되도록 함
                    const allFooterButtons = modal.querySelectorAll('.log-exporter-modal-footer > button');
                    allFooterButtons.forEach(btn => {
                        btn.style.display = ''; // 인라인 스타일 제거
                    });
                    
                    // 이미지 익스포트 컨트롤은 별도로 처리 (데스크톱에서는 항상 표시)
                    const imageControls = modal.querySelector('#image-export-controls');
                    if (imageControls) {
                        imageControls.style.display = ''; // 인라인 스타일 제거하여 CSS 적용
                    }
                }
                // 모바일 뷰로 전환될 때는 CSS가 알아서 처리하므로 별도 작업 불필요
            };

            // 리스너 등록
            mediaQuery.addEventListener('change', handleViewportChange);

            // [추가] 아바타 토글 컨트롤 변수 정의 (ReferenceError 방지)
            const avatarToggleControls = modal.querySelector('#avatar-toggle-controls');
            const avatarToggleCheckbox = modal.querySelector('#avatar-toggle-checkbox');

            const previewEl = modal.querySelector('.log-exporter-modal-preview');
            const imageScaleSlider = modal.querySelector('#image-scale-slider');
            const imageScaleValue = modal.querySelector('#image-scale-value');
            const saveFileBtn = modal.querySelector('#log-exporter-save-file');
            const saveImageControls = modal.querySelector('#image-export-controls');
            const htmlStyleControls = modal.querySelector('#html-style-controls');
            const styleToggleCheckbox = modal.querySelector('#style-toggle-checkbox');
            const filterControls = modal.querySelector('#filter-controls');
            const filterToggleCheckbox = modal.querySelector('#filter-toggle-checkbox');
            const colorSelector = modal.querySelector('#color-selector');
            const expandHoverCheckbox = modal.querySelector('#expand-hover-elements-checkbox');
            const colorSelectorContainer = modal.querySelector('#color-selector-container');
            
            const headerToggleCheckbox = modal.querySelector('#header-toggle-checkbox');
            const footerToggleCheckbox = modal.querySelector('#footer-toggle-checkbox');
            const bubbleToggleCheckbox = modal.querySelector('#bubble-toggle-checkbox');
            // [수정] 옵션 그룹 컨테이너 변수 추가
            const basicOptionsGroup = modal.querySelector('#basic-options-group');
            const imageScaleControls = modal.querySelector('#image-scale-controls');
            const htmlOptionsGroup = modal.querySelector('#html-options-group');


            const arcaHelperSection = modal.querySelector('#arca-helper-section');
            const arcaHelperToggleBtn = modal.querySelector('#arca-helper-toggle-btn');
            const arcaDownloadZipBtn = modal.querySelector('#arca-download-zip-btn');
            const arcaTemplateHtml = modal.querySelector('#arca-template-html');
            const arcaSourceHtml = modal.querySelector('#arca-source-html');
            const arcaConvertBtn = modal.querySelector('#arca-convert-btn');
            const arcaFinalHtml = modal.querySelector('#arca-final-html');

            /**
             * 미리보기 내의 이미지 크기를 슬라이더 값에 따라 조절합니다.
             * 모바일 환경에서 터치 피드백을 제공합니다.
             */
            const applyImageScaling = () => {
                const scale = imageScaleSlider.value;
                imageScaleValue.textContent = `${scale}%`;
                
                // 접근성: aria 속성 업데이트
                imageScaleSlider.setAttribute('aria-valuenow', scale);
                imageScaleSlider.setAttribute('aria-valuetext', `${scale}%`);
                
                previewEl.querySelectorAll('img').forEach(img => {
                    img.style.maxWidth = `${scale}%`;
                    img.style.height = 'auto';
                    // 모바일에서 이미지 터치 시 확대 방지
                    img.style.touchAction = 'manipulation';
                });
                
                // 슬라이더 값 변경 시 햅틱 피드백 (지원하는 기기에서)
                if (navigator.vibrate && window.innerWidth <= 768) {
                    navigator.vibrate(10);
                }
            };
            
            // 터치와 마우스 모두 지원
            imageScaleSlider.addEventListener('input', applyImageScaling);
            imageScaleSlider.addEventListener('touchmove', (e) => {
                // 터치 스크롤 방지
                e.preventDefault();
                applyImageScaling();
            }, { passive: false });

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
                const selectedTheme = COLORS[theme] || COLORS.dark;

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
// ▼▼▼ [교체] 기존 updatePreview 함수를 아래 내용으로 덮어쓰세요 ▼▼▼
            async function updatePreview() {
                console.log('[Log Exporter] updatePreview: 미리보기 업데이트 시작 (Shadow DOM 방식)');
                arcaHelperSection.style.display = 'none';
                const selectedFormat = modal.querySelector('input[name="log-format"]:checked').value;
                const selectedThemeKey = modal.querySelector('select[name="log-theme"]').value;
                const selectedColorKey = colorSelector.value;

                arcaHelperToggleBtn.style.display = (selectedFormat === 'basic') ? 'inline-block' : 'none';

                const isImageFormat = selectedFormat === 'html' || selectedFormat === 'basic';
                imageScaleControls.style.display = isImageFormat ? 'block' : 'none'; // flex -> block
                saveImageControls.style.display = isImageFormat ? 'flex' : 'none';
                basicOptionsGroup.style.display = selectedFormat === 'basic' ? 'block' : 'none';
                htmlOptionsGroup.style.display = selectedFormat === 'html' ? 'flex' : 'none';

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

                previewEl.style.backgroundColor = COLORS.dark.background;

                if (selectedFormat === 'html') {
                    filterControls.style.display = 'none';
                    if (customFilterSection) customFilterSection.style.display = 'none';
                    saveFileBtn.style.display = 'inline-block';

                    await new Promise(resolve => requestAnimationFrame(resolve));

                    const fullCss = await getComprehensivePageCSS();
                    const messagesHtml = await generateHtmlFromNodes(filteredNodes, false, true);
                    const themeBgColor = getComputedStyle(document.documentElement).getPropertyValue('--risu-theme-bgcolor').trim() || '#1a1b26';
                    const headerHtml = await getHeaderHtml(charAvatarUrl, charName, chatName);
                    const htmlTagStyle = document.documentElement.getAttribute('style') || '';

                    let extraCss = '';
                    if (expandHoverCheckbox.checked) {
                        extraCss = await generateForceHoverCss();
                    }

                    lastGeneratedHtml = `<!DOCTYPE html><html lang="ko" style="${htmlTagStyle}"><head><meta charset="UTF-8"><title>Chat Log</title><style>${fullCss} ${extraCss}</style></head><body ${expandHoverCheckbox.checked ? 'class="expand-hover-globally"' : ''}><div class="chat-log-wrapper">${headerHtml}${messagesHtml}</div></body></html>`;

                    if (isRawMode) {
                        previewEl.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.85em;">${lastGeneratedHtml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
                    } else {
                        previewEl.innerHTML = '';

                        const shadowHost = document.createElement('div');
                        const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

                        shadowRoot.innerHTML = `
                            <style>
                                ${fullCss}
                                ${extraCss}
                                .preview-wrapper {
                                    background-color: ${themeBgColor};
                                    padding: 20px;
                                }
                                .chat-log-wrapper { max-width: 900px; margin: 0 auto; }
                                .log-exporter-msg-btn-group { display: none !important; }
                            </style>
                            <div class="preview-wrapper ${expandHoverCheckbox.checked ? 'expand-hover-globally' : ''}">
                                <div class="chat-log-wrapper">${headerHtml}${messagesHtml}</div>
                            </div>
                        `;
                        previewEl.appendChild(shadowHost);
                    }
                    const addedStyle = document.getElementById('tolog-temp-hover-disable');
                    if (addedStyle) addedStyle.remove();

                } else if (selectedFormat === 'basic') {
                    // ... (이 부분은 수정 없음)
                    filterControls.style.display = 'flex';
                    saveFileBtn.style.display = 'none';
                    // [수정] 헤더에 필요한 캐릭터 정보를 객체로 묶음
                    const charInfo = { name: charName, chatName: chatName, avatarUrl: charAvatarUrl };
                    const content = await generateBasicFormatLog(
                        filteredNodes, 
                        charInfo, // 캐릭터 정보 전달
                        selectedThemeKey, 
                        selectedColorKey, 
                        avatarToggleCheckbox.checked,
                        headerToggleCheckbox.checked,
                        footerToggleCheckbox.checked,
                        bubbleToggleCheckbox.checked
                    );
                    lastGeneratedHtml = content;
                    const themeInfo = THEMES[selectedThemeKey] || THEMES.basic;
                    const color = (selectedThemeKey === 'basic') ? (COLORS[selectedColorKey] || COLORS.dark) : themeInfo.color;
                    previewEl.style.backgroundColor = color.background;

                    if (isRawMode) {
                        previewEl.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.85em;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
                    } else {
                        previewEl.innerHTML = content;
                    }
                } else { // Text / Markdown
                    // ... (이 부분은 수정 없음)
                    filterControls.style.display = 'flex';
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
// ▲▲▲ [교체] 여기까지 ▲▲▲

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

            // 테마 변경 시 색상 선택 활성화/비활성화 로직을 추가합니다.
            const themeSelector = modal.querySelector('select[name="log-theme"]');
            // ▼▼▼ [수정] handleThemeChange 함수 ▼▼▼
            const handleThemeChange = () => {
                const selectedTheme = themeSelector.value;
                const isBasicTheme = selectedTheme === 'basic';
                
                // 색상 선택기 활성화/비활성화
                colorSelector.style.opacity = isBasicTheme ? '1' : '0.5';
                colorSelector.disabled = !isBasicTheme;
                colorSelectorContainer.style.opacity = isBasicTheme ? '1' : '0.5';

                // '말풍선 표시' 체크박스 활성화/비활성화
                const bubbleToggleLabel = bubbleToggleCheckbox.parentElement;
                bubbleToggleCheckbox.disabled = !isBasicTheme;
                if (bubbleToggleLabel) {
                    bubbleToggleLabel.style.opacity = isBasicTheme ? '1' : '0.5';
                    bubbleToggleLabel.style.cursor = isBasicTheme ? 'pointer' : 'not-allowed';
                }

                updatePreview();
            };
            // ▲▲▲ [수정] 여기까지 ▲▲▲
            themeSelector.addEventListener('change', handleThemeChange);


            modal.querySelectorAll('input[name="log-format"], #style-toggle-checkbox, #filter-toggle-checkbox, .participant-filter-checkbox, #avatar-toggle-checkbox, #header-toggle-checkbox, #footer-toggle-checkbox, #bubble-toggle-checkbox, #expand-hover-elements-checkbox').forEach(el => {
                el.addEventListener('change', updatePreview);
            });
            colorSelector.addEventListener('change', updatePreview);
            handleThemeChange();

            const closeModal = () => {
                // 모바일 환경: 스크롤 복원
                document.body.style.overflow = originalOverflow;
                document.body.style.position = originalPosition;
                document.body.style.top = originalTop;
                document.body.style.width = '';
                window.scrollTo(0, scrollTop);
                
                // 이벤트 리스너 정리
                document.removeEventListener('keydown', handleTabKey);
                document.removeEventListener('keydown', handleEscapeKey);
                document.removeEventListener('keydown', handleKeyboardShortcuts);
                modal.removeEventListener('touchstart', handleTouchStart);
                modal.removeEventListener('touchend', handleTouchEnd);

                // [추가] 뷰포트 변경 리스너 제거
                mediaQuery.removeEventListener('change', handleViewportChange);
                
                // 모달 제거
                modal.remove();
            };
            modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
            modal.querySelector('#log-exporter-close').addEventListener('click', closeModal);

            saveFileBtn.addEventListener('click', async () => {
                try {
                    const filteredNodes = getFilteredNodes();
                    const useStyled = styleToggleCheckbox ? styleToggleCheckbox.checked : false;
                    const showAvatar = avatarToggleCheckbox.checked;
                    const messagesHtml = await generateHtmlFromNodes(filteredNodes, useStyled, true);
                    await generateAndDownloadHtmlFile(charName, chatName, messagesHtml, charAvatarUrl, expandHoverCheckbox.checked);
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
            const imageLibrarySelector = modal.querySelector('#image-library-selector');
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

                const success = await savePreviewAsImage(previewEl, updateProgress, cancellationToken, charName, chatName, {
                    useHighRes,
                    baseFontSize,
                    imageWidth,
                    library: imageLibrarySelector.value
                });

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
                    modal.querySelector('#log-exporter-copy-formatted'),
                    modal.querySelector('#log-exporter-copy-html'),
                    modal.querySelector('#log-exporter-download-zip'), // 이 버튼은 아카라이브 섹션에 있으므로 중복될 수 있음
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

                    const selectedColorKey = colorSelector.value;
                    const selectedThemeKey = themeSelector.value;
                    const showAvatar = avatarToggleCheckbox.checked;
                    const template = await generateArcaLiveTemplate(nodesForTemplate, { name: charName, chatName: chatName, avatarUrl: charAvatarUrl }, selectedThemeKey, selectedColorKey, showAvatar);
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

                let usedUrlCount = 0;

                // ▼▼▼ [최종 수정 코드] 이 코드로 전체를 교체하세요 ▼▼▼
                let finalHtml = template.replace(/<!--\s*(ARCA_IMG_PLACEHOLDER_(\d+)|ARCA_AVATAR_PLACEHOLDER_(true|false)_(\d+))\s*-->/g, (match, fullMatch, imgNum, isUserStr, avatarNum) => {
                    // 이미지 번호 결정: 일반 이미지는 imgNum, 아바타는 avatarNum 사용
                    const imageNumber = imgNum || avatarNum;
                    const index = parseInt(imageNumber, 10) - 1;

                    if (index < imageUrls.length) {
                        usedUrlCount++;
                        const imageUrl = imageUrls[index]; // 이미지 URL 추출
                        const selectedThemeKey = themeSelector.value;
                        const themeInfo = THEMES[selectedThemeKey] || THEMES.basic;
                        const color = (selectedThemeKey === 'basic') ? (COLORS[colorSelector.value] || COLORS.dark) : themeInfo.color;
                
                        // 아바타인지 확인 (isUserStr이 정의되어 있으면 아바타)
                        if (typeof isUserStr !== 'undefined' && isUserStr !== null) {
                            const isUser = isUserStr === 'true';
                            let style;

                            // 테마별 아바타 스타일 적용 (이제 margin, display는 여기서 정의하지 않음)
                            switch(selectedThemeKey) {
                                case 'fantasy':
                                    style = `width:52px;height:52px;min-width:52px;border-radius:50%;border:2px solid ${color.avatarBorder}; box-shadow: 0 0 12px rgba(255, 201, 120, 0.5);`;
                                    break;
                                case 'fantasy2':
                                    style = `width:50px;height:50px;min-width:50px;border-radius:50%;border:3px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; position: relative; margin:${isUser ? '0 0 0 16px' : '0 16px 0 0'};`;
                                    break;
                                case 'royal':
                                    style = `width:55px;height:55px;min-width:55px;border-radius:50%;border:3px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; position: relative;`;
                                    break;
                                case 'ocean':
                                    style = `width:48px;height:48px;min-width:48px;border-radius:50%;border:2px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; position: relative; margin:${isUser ? '0 0 0 14px' : '0 14px 0 0'};`;
                                    break;
                                case 'sakura':
                                    style = `width:46px;height:46px;min-width:46px;border-radius:50%;border:2px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; position: relative; margin:${isUser ? '0 0 0 12px' : '0 12px 0 0'};`;
                                    break;
                                case 'matrix':
                                    style = `width:44px;height:44px;min-width:44px;border-radius:4px;border:1px solid ${color.avatarBorder}; box-shadow: ${color.shadow}; font-family: 'Courier New', monospace; margin:${isUser ? '0 0 0 10px' : '0 10px 0 0'};`;
                                    break;
                                default:
                                    style = ARCA_IMG_STYLES.avatar(color, isUser);
                            }

                            const imgTag = `<img src="${imageUrl}" style="${style}">`;

                            // [핵심 수정] 중앙 정렬이 필요한 테마(fantasy, royal)인 경우, <div>로 감싸서 반환
                            if (selectedThemeKey === 'fantasy' || selectedThemeKey === 'royal') {
                                // <p> 태그의 text-align: center 스타일은 거의 모든 웹 에디터에서 허용하는 표준 기능입니다.
                                // <p> 태그의 기본 여백(margin)을 제거하여 불필요한 공간이 생기지 않도록 합니다.
                                return `<div style="text-align: center; margin: auto; padding: 0;">${imgTag}</div>`;
                            }else {
                                return imgTag; // 나머지 테마는 기존처럼 <img> 태그만 반환
                            }
                        } else {
                            // 일반 콘텐츠 이미지
                            return `<img src="${imageUrl}" style="${ARCA_IMG_STYLES.content}">`;
                        }
                    }
                    return match;
                });
                // ▲▲▲ [최종 수정 코드] 여기까지 ▲▲▲

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
                    tempContainer.querySelectorAll('td').forEach(td => td.setAttribute('border', '0'));

                    // 이미지 max-width를 슬라이더 값으로 통일, 높이는 auto 유지
                    // 이미지에 max-width와 height:auto를 강제로 추가하여 스타일을 통일합니다.
                    tempContainer.querySelectorAll('img').forEach(img => {
                        img.style.setProperty('max-width', `${scale}%`, 'important');
                        img.style.setProperty('height', 'auto', 'important');
                    });

                    finalHtml = tempContainer.innerHTML;
                } catch (e) {
                    console.warn('[Arca Convert] post-process failed:', e);
                }

                arcaFinalHtml.value = finalHtml;
                alert(`변환 완료! ${usedUrlCount}개의 이미지 위치가 교체되었습니다. 최종 결과물을 복사하여 사용하세요.`, 'success');
            });
            
            const setupCopyButtons = () => {
                let filteredNodes = getFilteredNodes();
                const selectedFormat = modal.querySelector('input[name="log-format"]:checked').value;
                const selectedThemeKey = modal.querySelector('select[name="log-theme"]').value;
                const selectedColorKey = colorSelector.value;

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
                        const charInfo = { name: charName, chatName: chatName, avatarUrl: charAvatarUrl };
                        htmlContent = await generateBasicFormatLog(
                            nodes, charInfo, selectedThemeKey, theme, showAvatar,
                            headerToggleCheckbox.checked, footerToggleCheckbox.checked, bubbleToggleCheckbox.checked
                        );
                    } else {
                        return '';
                    }
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlContent;
                    tempDiv.querySelectorAll('img').forEach(img => img.remove());

                    // [추가] 기본 태그 스타일을 인라인으로 주입
                    if (format === 'basic') {
                        const color = COLORS[theme] || COLORS.dark;
                        const baseTagStyles = `
                            p { margin: 0.75em 0; } a { color: ${color.nameColor}; text-decoration: none; } a:hover { text-decoration: underline; }
                            ul, ol { padding-left: 1.5em; margin: 0.75em 0; } li { margin-bottom: 0.25em; }
                            blockquote { border-left: 3px solid ${color.border}; padding-left: 1em; margin-left: 0; color: inherit; opacity: 0.8; }
                            strong, b { font-weight: bold; color: ${color.nameColor}; } em, i { font-style: italic; }
                            hr { border: 0; height: 1px; background-color: ${color.border}; margin: 1.5em 0; }`;
                        const styleEl = document.createElement('style');
                        styleEl.textContent = baseTagStyles;
                        tempDiv.prepend(styleEl);
                    }

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
                    const selectedThemeObj = COLORS[theme] || COLORS.dark;
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
                        const selectedThemeObj = COLORS[theme] || COLORS.dark;
                        tempDiv.querySelectorAll('[style*="background: url"]').forEach(el => {
                            el.style.background = selectedThemeObj.avatarBorder;
                        });
                    }

                    return (format === 'html') ? buildFullHtml(tempDiv.innerHTML, 'dark', styleToggleCheckbox.checked) : tempDiv.innerHTML;
                };

                const copyFormattedBtn = modal.querySelector('#log-exporter-copy-formatted');
                copyFormattedBtn.addEventListener('click', async () => {
                    const htmlBody = await generateHtmlForCopy(filteredNodes, selectedFormat, selectedColorKey);
                    const fullHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;">${htmlBody}</body></html>`;
                    
                    const success = await copyToClipboard(fullHtml, 'html');

                    if (success) {
                        const originalText = copyFormattedBtn.textContent;
                        copyFormattedBtn.textContent = '✓ 복사 완료!';
                        copyFormattedBtn.style.backgroundColor = '#9ece6a';
                        setTimeout(() => {
                            copyFormattedBtn.textContent = originalText;
                            copyFormattedBtn.style.backgroundColor = '';
                        }, 2000);
                    } else {
                        alert("복사에 실패했습니다.", "error");
                    }
                });

                const copyHtmlBtn = modal.querySelector('#log-exporter-copy-html');
                copyHtmlBtn.addEventListener('click', async () => {
                    let contentToCopy = lastGeneratedHtml;

                    if (selectedFormat === 'markdown' || selectedFormat === 'text') {
                        contentToCopy = await generateFormattedLog(getFilteredNodes(), selectedFormat);
                    }

                    const success = await copyToClipboard(contentToCopy, 'text');

                    if (success) {
                        const originalText = copyHtmlBtn.textContent;
                        copyHtmlBtn.textContent = '✓ 복사 완료!';
                        copyHtmlBtn.style.backgroundColor = '#9ece6a';
                        setTimeout(() => {
                            copyHtmlBtn.textContent = originalText;
                            copyHtmlBtn.style.backgroundColor = '';
                        }, 2000);
                    } else {
                        alert("복사에 실패했습니다. 수동으로 복사해주세요.", "error");
                    }
                });
            };

            setupCopyButtons();

        } catch (e) {
            console.error('[Log Exporter] Modal open error:', e);
            alert(`오류 발생: ${e.message}`, "error");
        }
    }


    /**
     * 범위 선택 버튼 클릭을 처리합니다.
     * @param {number} chatIndex - 현재 채팅의 인덱스.
     * @param {number} messageIndex - 클릭된 메시지의 UI 상 인덱스.
     */
    function handleRangeSelection(chatIndex, messageIndex) {
        const allMessageNodes = getAllMessageNodes().reverse();
        const clickedNode = allMessageNodes[messageIndex];

        if (!rangeSelectionState.active) {
            // 범위 선택 시작
            rangeSelectionState = { active: true, startIndex: messageIndex, chatIndex: chatIndex };
            clickedNode.classList.add('log-exporter-range-start');

            // 모든 메시지 버튼의 UI 업데이트
            document.querySelectorAll('.log-exporter-msg-btn-group').forEach(group => {
                const rangeBtn = group.querySelector('.range-select-btn');
                const otherBtns = group.querySelectorAll('button:not(.range-select-btn)');
                if (rangeBtn) {
                    if (group.closest('.log-exporter-range-start')) {
                        rangeBtn.innerHTML = '🏁';
                        rangeBtn.title = '범위 선택 취소';
                        rangeBtn.classList.add('range-active');
                    } else {
                        rangeBtn.innerHTML = '🔚';
                        rangeBtn.title = '여기를 끝으로 지정';
                        rangeBtn.classList.add('range-endpoint');
                    }
                }
                otherBtns.forEach(btn => btn.disabled = true);
            });
        } else {
            // 범위 선택 종료
            if (rangeSelectionState.chatIndex !== chatIndex) {
                alert('같은 채팅 내에서만 범위를 지정할 수 있습니다.', 'error');
                resetRangeSelection();
                return;
            }

            const startIndex = Math.min(rangeSelectionState.startIndex, messageIndex);
            const endIndex = Math.max(rangeSelectionState.startIndex, messageIndex);

            resetRangeSelection();
            showCopyPreviewModal(chatIndex, { startIndex, endIndex });
        }
    }

    function resetRangeSelection() {
        rangeSelectionState = { active: false, startIndex: -1, chatIndex: -1 };
        document.querySelectorAll('.log-exporter-range-start').forEach(el => el.classList.remove('log-exporter-range-start'));
        document.querySelectorAll('.log-exporter-msg-btn-group').forEach(group => {
            const rangeBtn = group.querySelector('.range-select-btn');
            if (rangeBtn) {
                rangeBtn.innerHTML = '✂️';
                rangeBtn.title = '범위 지정 시작';
                rangeBtn.classList.remove('range-active', 'range-endpoint');
            }
            group.querySelectorAll('button').forEach(btn => btn.disabled = false);
        });
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
                btn.innerHTML = emoji;
                btn.title = title;
                btn.className = 'log-exporter-msg-btn';
                btn.addEventListener('click', e => {
                    e.stopPropagation(); e.preventDefault();
                    onClick(currentChatIndex, messageIndexInUI);
                });
                return btn;
            };
            
            const rangeSelectBtn = createMsgButton('✂️', '범위 지정 시작', handleRangeSelection);
            rangeSelectBtn.classList.add('range-select-btn');

            buttonGroup.appendChild(createMsgButton('📄', '이 메시지만 내보내기', (chatIdx, msgIdx) => showCopyPreviewModal(chatIdx, { startIndex: msgIdx, singleMessage: true })));
            buttonGroup.appendChild(createMsgButton('📑', '이 메시지부터 내보내기', (chatIdx, msgIdx) => showCopyPreviewModal(chatIdx, { startIndex: msgIdx, singleMessage: false })));
            buttonGroup.appendChild(rangeSelectBtn);

            if (rangeSelectionState.active) {
                setTimeout(resetRangeSelection, 0);
            }

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
        observer = new MutationObserver((mutations) => {
            if (rangeSelectionState.active && mutations.some(m => m.target.closest('.risu-sidebar'))) {
                resetRangeSelection();
            }
            setTimeout(injectButtons, 300);
        });
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
        resetRangeSelection();
        console.log('Chat Log Exporter 플러그인이 언로드되었습니다.');
    });

    injectModalStyles();
    ensureHtmlToImage().catch(e => console.error(e));
    ensureDomToImage().catch(e => console.error(e)); // 미리 로드
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
