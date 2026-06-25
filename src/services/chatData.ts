// chatData.ts — API v3.0 기반 채팅 데이터 수집
// 기존 utils/domParser.ts의 processChatLog를 대체합니다.
// Risuai.getCharacter / getChatFromIndex / getRootDocument를 사용하여
// 캐릭터 정보, 채팅 메시지 데이터, 메시지 DOM 노드를 수집합니다.

import type { RisuCharacter, RisuChat } from '../types/risuai'
import { getAllMessageNodes } from './messageScanner'

export interface ChatLogData {
  charName: string
  chatName: string
  charAvatarUrl: string
  messageNodes: SafeElement[] // SafeElement[] (메인 DOM, 외부에서 outerHTML로 변환)
  character: RisuCharacter | null
  chat: RisuChat | null
}

export interface ProcessOptions {
  startIndex?: number
  endIndex?: number
  singleMessage?: boolean
}

/**
 * mainDom 권한을 보장하여 rootDoc을 반환합니다.
 * getRootDocument()는 권한 거부 시 null을 반환하므로,
 * 먼저 requestPluginPermission('mainDom')으로 권한을 요청합니다.
 */
export async function ensureRootDoc(): Promise<SafeDocument | null> {
  try {
    const granted = await Risuai.requestPluginPermission('mainDom')
    if (!granted) {
      console.warn('[log plugin] mainDom permission denied')
      return null
    }
    const doc = await Risuai.getRootDocument()
    return doc
  } catch (e) {
    console.error('[log plugin] ensureRootDoc error:', e)
    return null
  }
}

/**
 * 사이드바에서 현재 캐릭터의 아바타 URL을 추출합니다.
 * RisuAI SidebarAvatar 컴포넌트는 data-char-id 속성과 background-image 스타일을 사용합니다.
 * character.chaId로 사이드바에서 정확히 해당 캐릭터의 아바타를 찾습니다.
 */
async function extractAvatarFromSidebar(rootDoc: SafeDocument, chaId: string): Promise<string> {
  try {
    // 1순위: data-char-id 속성으로 정확히 해당 캐릭터의 아바타 요소 찾기
    // SidebarAvatar.svelte가 data-char-id={chaId} 속성을 가지고 있음
    const charEl = await rootDoc.querySelector(`[data-char-id="${chaId}"]`)
    if (charEl) {
      // 해당 요소 내부에서 background-image를 가진 .sidebar-avatar 찾기
      const avatarEl = await charEl.querySelector('.sidebar-avatar')
      if (avatarEl) {
        const style = await avatarEl.getStyleAttribute()
        const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/)
        if (urlMatch && urlMatch[1] && !urlMatch[1].includes('none.webp')) {
          return urlMatch[1]
        }
      }
    }

    // 2순위: 사이드바의 모든 .sidebar-avatar 중 background-image를 가진 첫 번째
    const allAvatars = await rootDoc.querySelectorAll('.sidebar-avatar')
    const avatarArr = await Risuai.unwarpSafeArray(allAvatars)
    for (const el of avatarArr) {
      const style = await el.getStyleAttribute()
      const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/)
      if (urlMatch && urlMatch[1] && !urlMatch[1].includes('none.webp')) {
        return urlMatch[1]
      }
    }
  } catch (e) {
    console.error('[log plugin] Avatar extract error:', e)
  }
  return ''
}

/**
 * 현재 채팅의 로그 데이터를 수집합니다.
 *
 * @param chatIndex 내보낼 채팅 인덱스 (character.chatPage 기준). undefined 시 현재 채팅.
 * @param options startIndex/endIndex/singleMessage로 메시지 범위 제한
 */
export async function processChatLog(
  chatIndex?: number,
  options: ProcessOptions = {}
): Promise<ChatLogData> {
  const rootDoc = await ensureRootDoc()
  const charIdx = await Risuai.getCurrentCharacterIndex()
  const character: RisuCharacter | null = (await Risuai.getCharacter()) as RisuCharacter | null

  const targetChatIndex = chatIndex ?? (await Risuai.getCurrentChatIndex())

  let chat: RisuChat | null = null
  if (character && targetChatIndex >= 0) {
    chat = (await Risuai.getChatFromIndex(charIdx, targetChatIndex)) as RisuChat | null
  }

  const charName = character?.name || 'Unknown'
  const chatName = chat?.name || `Chat ${targetChatIndex}`

  // 아바타 URL은 DOM에서 추출 (asset id → URL 변환을 플러그인에서 직접 할 수 없으므로)
  // character.chaId로 사이드바에서 정확히 해당 캐릭터의 아바타를 찾습니다.
  let charAvatarUrl = ''
  if (character?.chaId && rootDoc) {
    charAvatarUrl = await extractAvatarFromSidebar(rootDoc, String(character.chaId))
  }

  // 메시지 DOM 노드 수집 (문서 순서)
  let allNodes: SafeElement[] = []
  if (rootDoc) {
    allNodes = await getAllMessageNodes(rootDoc)
  } else {
    console.warn('[log plugin] rootDoc is null — no message nodes collected')
  }

  // 범위 슬라이싱
  let messageNodes = allNodes
  const { startIndex, endIndex, singleMessage } = options
  if (singleMessage && typeof startIndex === 'number') {
    messageNodes = allNodes.slice(startIndex, startIndex + 1)
  } else if (typeof startIndex === 'number' && typeof endIndex === 'number') {
    messageNodes = allNodes.slice(startIndex, endIndex + 1)
  } else if (typeof startIndex === 'number') {
    messageNodes = allNodes.slice(startIndex)
  }

  return {
    charName,
    chatName,
    charAvatarUrl,
    messageNodes,
    character,
    chat
  }
}

/**
 * SafeElement[]의 outerHTML을 수집하여 문자열 배열로 반환합니다.
 * iframe 내부에서 HTMLElement로 재구성할 때 사용합니다.
 */
export async function serializeNodes(nodes: SafeElement[]): Promise<string[]> {
  const out: string[] = []
  for (const node of nodes) {
    try {
      out.push(await node.getOuterHTML())
    } catch {
      out.push('')
    }
  }
  return out
}