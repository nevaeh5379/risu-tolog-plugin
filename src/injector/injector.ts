import { getAllMessageNodes } from '../services/messageScanner';
import { showCopyPreviewModal } from '../LogExporter/showCopyPreviewModal';
import css from './injector.css?raw';

let rangeSelection: {
    active: boolean;
    startIndex: number;
} = { active: false, startIndex: -1 };

const injectCss = () => {
    const styleId = 'log-exporter-injector-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
};

const createExportButton = (chatIndex: number) => {
    const button = document.createElement('button');
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>`;
    button.title = '채팅 내보내기';
    button.className = 'log-exporter-inject-btn';
    button.id = `log-exporter-btn-${chatIndex}`;
    button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showCopyPreviewModal(chatIndex);
    };
    return button;
};

const injectButtons = () => {
    const chatItems = document.querySelectorAll('button[data-risu-chat-idx]');
    chatItems.forEach(item => {
        const chatIndex = item.getAttribute('data-risu-chat-idx');
        if (!chatIndex) return;

        const targetDiv = item.querySelector('div.flex-grow.flex.justify-end');
        if (targetDiv && !targetDiv.querySelector('.log-exporter-inject-btn')) {
            const button = createExportButton(parseInt(chatIndex, 10));
            targetDiv.prepend(button);
        }
    });
};

const injectMessageButtons = () => {
    const messageNodes = document.querySelectorAll('.risu-chat');
    const chatIndexStr = document.querySelector('button[data-risu-chat-idx].bg-selected')?.getAttribute('data-risu-chat-idx');
    if (!chatIndexStr) return;
    const chatIndex = parseInt(chatIndexStr, 10);

    const clearRange = () => {
        if (rangeSelection.startIndex !== -1) {
            const allNodes = document.querySelectorAll('.risu-chat');
            const node = allNodes[rangeSelection.startIndex] as HTMLElement | undefined;
            node?.classList.remove('log-exporter-range-start');
        }
        rangeSelection.active = false;
        rangeSelection.startIndex = -1;
    };

    messageNodes.forEach((node, index) => {
        const targetDiv = node.querySelector('.flex-grow.flex.items-center.justify-end.text-textcolor2');
        if (targetDiv && !targetDiv.querySelector('.log-exporter-msg-btn-group')) {
            const btnGroup = document.createElement('div');
            btnGroup.className = 'log-exporter-msg-btn-group';

            const fromHereBtn = document.createElement('button');
            fromHereBtn.title = '이 메시지부터 끝까지 내보내기';
            fromHereBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/><path d="m16 12 4 4 4-4"/></svg>`;
            fromHereBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                clearRange();
                showCopyPreviewModal(chatIndex, { startIndex: index });
            };

            const onlyThisBtn = document.createElement('button');
            onlyThisBtn.title = '이 메시지만 내보내기';
            onlyThisBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
            onlyThisBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                clearRange();
                showCopyPreviewModal(chatIndex, { startIndex: index, singleMessage: true });
            };

            const rangeBtn = document.createElement('button');
            rangeBtn.title = '범위 선택';
            rangeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8H3"/><path d="M21 16H3"/><path d="M7 12v8"/><path d="M7 4v4"/><path d="M17 12v8"/><path d="M17 4v4"/></svg>`;
            rangeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!rangeSelection.active) {
                    clearRange(); // Clear any previous dangling state
                    rangeSelection.active = true;
                    rangeSelection.startIndex = index;
                    node.classList.add('log-exporter-range-start');
                } else {
                    const endIndex = index;
                    // Ensure start comes before end
                    const start = Math.min(rangeSelection.startIndex, endIndex);
                    const end = Math.max(rangeSelection.startIndex, endIndex);
                    showCopyPreviewModal(chatIndex, { startIndex: start, endIndex: end });
                    clearRange();
                }
            };

            btnGroup.appendChild(fromHereBtn);
            btnGroup.appendChild(onlyThisBtn);
            btnGroup.appendChild(rangeBtn);
            targetDiv.prepend(btnGroup);
        }
    });
};

let observer: MutationObserver | null = null;

export const initializeInjector = () => {
    injectCss();
    injectButtons(); // Initial injection for chat list
    injectMessageButtons(); // Initial injection for messages

    observer = new MutationObserver((mutations) => {
        let needsChatInject = false;
        let needsMessageInject = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as Element;
                        if (el.matches('button[data-risu-chat-idx]') || el.querySelector('button[data-risu-chat-idx]')) {
                            needsChatInject = true;
                        }
                        if (el.matches('.risu-chat') || el.querySelector('.risu-chat')) {
                            needsMessageInject = true;
                        }
                    }
                });
            }
        }
        if (needsChatInject) {
            injectButtons();
        }
        if (needsMessageInject) {
            injectMessageButtons();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
};

export const disconnectInjector = () => {
    if (observer) {
        observer.disconnect();
    }
};
