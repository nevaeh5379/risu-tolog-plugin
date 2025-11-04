// src/utils/domParser.ts

import { getAllMessageNodes } from '../serivces/messageScanner';
import type { RisuCharacter } from '../types/risuai';

// 이 함수들이 같은 파일이나 다른 util 파일에 정의되어 있다고 가정합니다.

// 함수의 옵션 객체에 대한 타입을 정의합니다.
interface ProcessChatLogOptions {
  startIndex?: number;
  endIndex?: number;
  singleMessage?: boolean;
}

// 반환 값에 대한 타입을 정의합니다.
interface ProcessedChatLog {
  charName: string;
  chatName: string;
  charAvatarUrl: string;
  messageNodes: HTMLElement[];
  character: RisuCharacter;
}

/**
 * 지정된 채팅 인덱스에 대한 채팅 로그를 처리합니다.
 * 채팅을 활성화하고, 캐릭터 정보와 모든 메시지 노드를 수집하여 반환합니다.
 * @async
 * @param chatIndex - 처리할 채팅의 인덱스.
 * @param options - 추가 옵션 (범위 지정 등).
 * @throws {Error} 채팅 버튼, 캐릭터 정보, 또는 메시지를 찾을 수 없는 경우.
 */
export async function processChatLog(
  chatIndex: number,
  options: ProcessChatLogOptions = {}
): Promise<ProcessedChatLog> {
  console.log(`[Log Exporter] processChatLog: 채팅 로그 처리 시작, 인덱스: ${chatIndex}, 옵션:`, options);

  const chatButton = document.querySelector<HTMLButtonElement>(`button[data-risu-chat-idx="${chatIndex}"]`);
  if (!chatButton) {
    throw new Error("채팅 버튼을 찾을 수 없습니다.");
  }

  const { startIndex, endIndex, singleMessage } = options;

  if (!chatButton.classList.contains('bg-selected')) {
    chatButton.click();
    // DOM 업데이트를 기다립니다.
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const character = window.__pluginApis__.getChar();
  if (!character) {
    throw new Error("캐릭터 정보를 불러올 수 없습니다.");
  }

  const targetChat = character.chats[chatIndex];
  if (!targetChat) {
      throw new Error(`채팅 인덱스 ${chatIndex}에 해당하는 채팅을 찾을 수 없습니다.`);
  }

  let charAvatarUrl = character.avatar;

  const activeIndicator = document.querySelector<HTMLElement>('.rs-sidebar div[class*="bg-white"][class*="!h-"]');
  if (activeIndicator) {
    const characterContainer = activeIndicator.closest<HTMLElement>('div[role="listitem"]');
    if (characterContainer) {
      const sidebarAvatarImg = characterContainer.querySelector<HTMLImageElement>('img.sidebar-avatar');
      if (sidebarAvatarImg?.src && !sidebarAvatarImg.src.endsWith('none.webp')) {
        charAvatarUrl = sidebarAvatarImg.src;
      }
    }
  }

  const messageNodes = getAllMessageNodes();
  console.log(`[Log Exporter] Found ${messageNodes.length} messages`);

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
      const sliceEnd = typeof endIndex === 'number' ? endIndex + 1 : undefined;
      finalNodes = messageNodes.slice(startIndex, sliceEnd);
      finalChatName += ` (메시지 #${startIndex + 1}부터${typeof endIndex === 'number' ? ` #${endIndex + 1}까지` : ''})`;
    }
    console.log(`[Log Exporter] 메시지 슬라이싱 적용: ${finalNodes.length}개 선택됨`);
  }

  return { 
    charName: character.name, 
    chatName: finalChatName, 
    charAvatarUrl, 
    messageNodes: finalNodes,
    character 
  };
}