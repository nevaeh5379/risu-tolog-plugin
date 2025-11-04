export function getAllMessageNodes(): HTMLElement[] {
    console.log('[Log Exporter] getAllMessageNodes: 모든 메시지 노드 수집 시작');

    // document.querySelectorAll의 반환 타입은 NodeListOf<Element>입니다.
    // 제네릭 <HTMLElement>를 사용하여 반환될 요소가 HTMLElement임을 명시적으로 지정합니다.
    const containers: HTMLElement[] = Array.from(
        document.querySelectorAll<HTMLElement>('.chat-message-container')
    );
    const allRisuChats: HTMLElement[] = Array.from(
        document.querySelectorAll<HTMLElement>('.risu-chat')
    );

    const standaloneMessageChats = allRisuChats.filter(chat =>
        // chat 변수는 HTMLElement 타입으로 자동 추론됩니다.
        (chat.querySelector('.prose') || chat.querySelector('.chattext')) &&
        !chat.closest('.log-exporter-modal') &&
        chat.closest('.risu-sidebar') === null &&
        chat.closest('.chat-message-container') === null
    );

    // containers와 standaloneMessageChats 모두 HTMLElement[] 타입이므로,
    // messageNodes는 타입스크립트에 의해 HTMLElement[]로 자동 추론됩니다.
    let messageNodes: HTMLElement[] = [...containers, ...standaloneMessageChats];

    // sort 콜백 함수의 매개변수 a와 b도 HTMLElement 타입으로 추론됩니다.
    // 명확성을 위해 타입을 직접 지정해 줄 수도 있습니다: .sort((a: HTMLElement, b: HTMLElement) => { ... })
    messageNodes.sort((a, b) => {
        const position = a.compareDocumentPosition(b);

        // Node 객체와 그 속성들은 TypeScript의 기본 DOM 타입 라이브러리에 포함되어 있어 바로 사용 가능합니다.
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1; // 원본 코드와 순서를 맞추기 위해 -1로 변경
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;  // 원본 코드와 순서를 맞추기 위해 1로 변경
        return 0;
    });

    console.log(`[Log Exporter] getAllMessageNodes: 총 ${messageNodes.length}개의 메시지 노드 발견 (정상 순서)`);
    return messageNodes;
}