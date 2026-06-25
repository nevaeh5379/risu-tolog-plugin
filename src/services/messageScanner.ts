// messageScanner.ts — API v3.0 기반
// SafeDocument/SafeElement를 통해 메인 DOM에서 메시지 노드를 수집합니다.
// 모든 메서드는 async이며, 반환된 SafeElement는 이후 outerHTML 문자열로 변환하여
// iframe 내부에서 표준 HTMLElement로 재구성합니다.

// 메시지 노드가 채팅 메시지 본문을 포함하는지 판별
async function hasMessageContent(node: SafeElement): Promise<boolean> {
  try {
    const prose = await node.querySelector('.prose, .chattext')
    return !!prose
  } catch {
    return false
  }
}

// 노드가 사이드바/모달 내부에 있는지(=메시지 영역 밖) 판별
async function isOutsideChatArea(node: SafeElement): Promise<boolean> {
  try {
    // .log-exporter-modal (플러그인 자체 모달) 내부는 제외
    if (await node.matches('.log-exporter-modal, .log-exporter-modal *')) return true
    // .risu-sidebar 내부는 사이드바이므로 제외
    if (await node.matches('.risu-sidebar, .risu-sidebar *')) return true
    return false
  } catch {
    return false
  }
}

/**
 * 메인 DOM에서 모든 채팅 메시지 노드를 수집하여 문서 순서대로 정렬합니다.
 * - `.chat-message-container` (Chats.svelte가 메시지별로 추가하는 래퍼)를 우선 수집
 * - `.chat-message-container`에 속하지 않은 standalone `.risu-chat` (메시지 본문 포함)도 수집
 * - 사이드바/모달 내부의 `.risu-chat`은 제외
 * - 정렬은 getBoundingClientRect().top 기준 (DOM 순서 보장)
 *
 * @returns SafeElement[] (문서 순서대로 정렬된 메시지 노드들)
 */
export async function getAllMessageNodes(rootDoc: SafeDocument): Promise<SafeElement[]> {
  const containersRaw = await rootDoc.querySelectorAll('.chat-message-container')
  const containers = await Risuai.unwarpSafeArray(containersRaw)

  // standalone .risu-chat (사이드바/모달이 아닌, .chat-message-container 밖의 메시지)
  // .default-chat-screen 스코프로 사이드바의 .risu-chat과 구분
  const allRisuChatsRaw = await rootDoc.querySelectorAll('.default-chat-screen .risu-chat')
  const allRisuChats = await Risuai.unwarpSafeArray(allRisuChatsRaw)

  const standalone: SafeElement[] = []
  for (const chat of allRisuChats) {
    const hasContent = await hasMessageContent(chat)
    if (!hasContent) continue
    const outside = await isOutsideChatArea(chat)
    if (outside) continue
    // .chat-message-container 내부에 있는지 검사 — container와 중복 방지
    const parent = await chat.getParent()
    if (parent) {
      const parentClass = await parent.getClassName()
      if (parentClass.includes('chat-message-container')) continue
      // 더 상위에서 .chat-message-container 찾기
      let p: SafeElement | null = parent
      let wrapped = false
      for (let i = 0; i < 5 && p; i++) {
        const cls = await p.getClassName()
        if (cls.includes('chat-message-container')) {
          wrapped = true
          break
        }
        p = await p.getParent()
      }
      if (wrapped) continue
    }
    standalone.push(chat)
  }

  const all = [...containers, ...standalone]

  // getBoundingClientRect().top 기준 정렬 (문서 순서)
  const withRect = await Promise.all(
    all.map(async (el) => {
      const rect = await el.getBoundingClientRect()
      return { el, top: rect.top }
    })
  )
  withRect.sort((a, b) => a.top - b.top)

  return withRect.map((x) => x.el)
}

/**
 * SafeElement에서 data-chat-index 속성값을 읽습니다.
 * v3.0 SafeElement는 x- 접두사 속성만 직접 접근 가능하므로,
 * data-chat-index는 getAttribute로 읽을 수 없습니다.
 * 대안: 노드의 getInnerHTML 또는 outerHTML에서 파싱하거나,
 * DOM 순서(index)를 메시지 인덱스로 사용합니다.
 * 여기서는 outerHTML에서 정규식으로 추출합니다 (필요한 경우만 사용).
 */
export async function getChatIndexFromNode(node: SafeElement): Promise<number | null> {
  try {
    const html = await node.getOuterHTML()
    const match = html.match(/data-chat-index\s*=\s*["']?(\d+)/)
    return match ? parseInt(match[1], 10) : null
  } catch {
    return null
  }
}