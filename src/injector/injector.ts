// injector.ts — API v3.0 기반
// 1. 채팅 단위 내보내기 버튼: main.tsx에서 registerButton으로 등록 (공식 API)
// 2. 메시지별 버튼(이 메시지만/이 메시지부터/범위): getRootDocument + SafeMutationObserver로 주입
// 3. openExportModalForCurrentChat: showCopyPreviewModal을 iframe에서 오픈

import { getAllMessageNodes } from '../services/messageScanner'
import { ensureRootDoc } from '../services/chatData'

// 메시지별 버튼 주입에 사용할 스타일 (메인 DOM에 주입)
const INJECTOR_CSS = `
.log-exporter-msg-btn-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-right: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.log-exporter-msg-btn-group:hover,
.risu-chat:hover .log-exporter-msg-btn-group {
  opacity: 1;
}
.log-exporter-msg-btn-group button {
  background: transparent;
  border: none;
  color: var(--textcolor2, #888);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.log-exporter-msg-btn-group button:hover {
  background: rgba(128,128,128,0.15);
  color: var(--textcolor, #fff);
}
.log-exporter-range-start {
  background: rgba(80, 160, 255, 0.15) !important;
  box-shadow: inset 3px 0 0 rgba(80,160,255,0.7);
}
`

// 모듈 상태
let rangeSelection = {
  active: false,
  startIndex: -1
}
let styleEl: SafeElement | null = null
let observer: SafeMutationObserver | null = null

async function clearRange(rootDoc: SafeDocument): Promise<void> {
  try {
    const startNodes = await rootDoc.querySelectorAll('.log-exporter-range-start')
    const arr = await Risuai.unwarpSafeArray(startNodes)
    for (const n of arr) {
      await n.removeClass('log-exporter-range-start')
    }
  } catch {
    /* ignore */
  }
  rangeSelection.active = false
  rangeSelection.startIndex = -1
}

async function injectCss(rootDoc: SafeDocument): Promise<void> {
  if (styleEl) return
  try {
    styleEl = await rootDoc.createElement('style')
    await styleEl.setAttribute('x-log-exporter-style', 'injector')
    await styleEl.setInnerHTML(INJECTOR_CSS)
    const body = await rootDoc.querySelector('body')
    if (body) {
      await body.appendChild(styleEl)
    }
  } catch (e) {
    console.error('[log plugin] CSS inject error:', e)
  }
}

// 메시지 노드에 버튼 그룹이 이미 있는지 확인
async function hasBtnGroup(target: SafeElement): Promise<boolean> {
  try {
    const existing = await target.querySelector('.log-exporter-msg-btn-group')
    return !!existing
  } catch {
    return false
  }
}

// 메시지별 버튼 그룹을 하나의 SafeElement로 생성
async function createMsgBtnGroup(
  rootDoc: SafeDocument,
  node: SafeElement,
  index: number
): Promise<SafeElement> {
  const btnGroup = await rootDoc.createElement('div')
  await btnGroup.addClass('log-exporter-msg-btn-group')

  // 이 메시지부터 끝까지
  const fromHereBtn = await rootDoc.createElement('button')
  await fromHereBtn.setAttribute('x-title', '이 메시지부터 끝까지 내보내기')
  await fromHereBtn.setInnerHTML(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/><path d="m16 12 4 4 4-4"/></svg>'
  )
  await fromHereBtn.addEventListener('click', async (e: any) => {
    e.preventDefault?.()
    e.stopPropagation?.()
    await clearRange(rootDoc)
    await openExportModal({ startIndex: index })
  })

  // 이 메시지만
  const onlyThisBtn = await rootDoc.createElement('button')
  await onlyThisBtn.setAttribute('x-title', '이 메시지만 내보내기')
  await onlyThisBtn.setInnerHTML(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  )
  await onlyThisBtn.addEventListener('click', async (e: any) => {
    e.preventDefault?.()
    e.stopPropagation?.()
    await clearRange(rootDoc)
    await openExportModal({ startIndex: index, singleMessage: true })
  })

  // 범위 선택
  const rangeBtn = await rootDoc.createElement('button')
  await rangeBtn.setAttribute('x-title', '범위 선택')
  await rangeBtn.setInnerHTML(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8H3"/><path d="M21 16H3"/><path d="M7 12v8"/><path d="M7 4v4"/><path d="M17 12v8"/><path d="M17 4v4"/></svg>'
  )
  await rangeBtn.addEventListener('click', async (e: any) => {
    e.preventDefault?.()
    e.stopPropagation?.()
    if (!rangeSelection.active) {
      await clearRange(rootDoc)
      rangeSelection.active = true
      rangeSelection.startIndex = index
      await node.addClass('log-exporter-range-start')
    } else {
      const endIndex = index
      const start = Math.min(rangeSelection.startIndex, endIndex)
      const end = Math.max(rangeSelection.startIndex, endIndex)
      await openExportModal({ startIndex: start, endIndex: end })
      await clearRange(rootDoc)
    }
  })

  await btnGroup.appendChild(fromHereBtn)
  await btnGroup.appendChild(onlyThisBtn)
  await btnGroup.appendChild(rangeBtn)
  return btnGroup
}

// 모든 메시지 노드에 버튼 주입
async function injectMessageButtons(rootDoc: SafeDocument): Promise<void> {
  await clearRange(rootDoc)
  const messageNodes = await getAllMessageNodes(rootDoc)

  for (let i = 0; i < messageNodes.length; i++) {
    const node = messageNodes[i]
    // Tailwind `grow` (예전 flex-grow는 더 이상 사용 안 함)
    const target = await node.querySelector('.grow.flex.items-center.justify-end')
    if (!target) continue
    if (await hasBtnGroup(target)) continue

    const btnGroup = await createMsgBtnGroup(rootDoc, node, i)
    await target.prepend(btnGroup)
  }
}

// showCopyPreviewModal 지연 로드 (순환 의존 회피)
let _showCopyPreviewModal: ((options: {
  startIndex?: number
  endIndex?: number
  singleMessage?: boolean
}) => Promise<void>) | null = null

async function getShowCopyPreviewModal() {
  if (_showCopyPreviewModal) return _showCopyPreviewModal
  const mod = await import('../LogExporter/showCopyPreviewModal')
  _showCopyPreviewModal = mod.showCopyPreviewModal
  return _showCopyPreviewModal
}

// 메시지 범위 옵션으로 모달 오픈
async function openExportModal(options: {
  startIndex?: number
  endIndex?: number
  singleMessage?: boolean
}): Promise<void> {
  try {
    const fn = await getShowCopyPreviewModal()
    await fn(options)
  } catch (e) {
    console.error('[log plugin] openExportModal error:', e)
  }
}

// main.tsx에서 호출 — 현재 채팅 전체 내보내기
export async function openExportModalForCurrentChat(): Promise<void> {
  await openExportModal({})
}

// MutationObserver 콜백
// 참고: RisuAI v3.0의 SafeMutationObserver는 콜백 인자(SafeClassArray)를
// postMessage 직렬화 과정에서 메서드가 손실된 일반 객체로 전달하는 버그가 있어
// mutations 내용 검사 대신 단순 재주입 트리거(디바운스)로 회피합니다.
let reinjectTimer: ReturnType<typeof setTimeout> | null = null

async function onMutation(_mutations: any): Promise<void> {
  try {
    // 디바운스: 연속 DOM 변경 시 한 번만 재주입
    if (reinjectTimer) clearTimeout(reinjectTimer)
    reinjectTimer = setTimeout(async () => {
      reinjectTimer = null
      try {
        const rootDoc = await Risuai.getRootDocument()
        if (!rootDoc) return
        await injectMessageButtons(rootDoc)
      } catch (e) {
        console.error('[log plugin] reinject error:', e)
      }
    }, 300)
  } catch (e) {
    console.error('[log plugin] mutation observer error:', e)
  }
}

// 메인 DOM에 메시지별 버튼 주입 셋업
export async function setupMessageButtons(): Promise<void> {
  try {
    const rootDoc = await ensureRootDoc()
    if (!rootDoc) {
      console.warn('[log plugin] mainDom permission denied — message buttons skipped')
      return
    }
    await injectCss(rootDoc)
    await injectMessageButtons(rootDoc)

    // SafeMutationObserver로 메시지 영역 변경 감지
    observer = await Risuai.createMutationObserver(onMutation)
    const body = await rootDoc.querySelector('body')
    if (body && observer) {
      await observer.observe(body, { childList: true, subtree: true })
    }
    console.log('[log plugin] Message buttons set up.')
  } catch (e) {
    console.error('[log plugin] setupMessageButtons error:', e)
  }
}

// 정리
export async function teardownMessageButtons(): Promise<void> {
  try {
    // observer는 Risuai.onUnload 시 자동 해제되지만, 명시적으로도 처리
    observer = null

    const rootDoc = await Risuai.getRootDocument()
    if (!rootDoc) return
    // 주입된 버튼 그룹 제거
    const groups = await rootDoc.querySelectorAll('.log-exporter-msg-btn-group')
    const arr = await Risuai.unwarpSafeArray(groups)
    for (const g of arr) {
      await g.remove()
    }
    // 스타일 제거
    if (styleEl) {
      await styleEl.remove()
      styleEl = null
    }
    // range 표시 제거
    await clearRange(rootDoc)
  } catch {
    /* ignore */
  }
}