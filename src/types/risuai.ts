// RisuAI 데이터 모델 타입 정의 (API v3.0 기반, RisuAI src/ts/storage/database.svelte.ts 참고)

export interface RisuMessage {
  role: 'user' | 'char';
  data: string;
  saying?: string;
  chatId?: string;
  time?: number;
  name?: string;
  otherUser?: boolean;
  disabled?: false | true | 'allBefore';
  isComment?: boolean;
}

export interface RisuChat {
  message: RisuMessage[];
  note: string;
  name: string;
  localLore?: any[];
  sdData?: string;
  supaMemoryData?: string;
  hypaV2Data?: any;
  hypaV3Data?: any;
  lastMemory?: string;
  suggestMessages?: string[];
  isStreaming?: boolean;
  scriptstate?: any;
  modules?: string[];
  id?: string;
  bindedPersona?: string;
  fmIndex?: number;
  folderId?: string;
  lastDate?: number;
  bookmarks?: string[];
  bookmarkNames?: { [chatId: string]: string };
}

export interface RisuChatFolder {
  id: string;
  name?: string;
  color?: string;
  folded: boolean;
}

// RisuAI 캐릭터 객체 (database.svelte.ts의 character 인터페이스 기반)
export interface RisuCharacter {
  name: string;
  image?: string; // asset id (avatar). 주의: 예전 avatar 필드는 image로 변경됨
  chaId: string; // 캐릭터 고유 ID
  chats: RisuChat[];
  chatPage: number; // 현재 선택된 채팅 인덱스
  chatFolders?: RisuChatFolder[];
  type?: 'character' | 'group';
  firstMessage?: string;
  alternateGreetings?: string[];
  firstMsgIndex?: number;
  additionalAssets?: [string, string, string][];
  emotionImages?: [string, string][];
  largePortrait?: boolean;
  nickname?: string;
  hideChatIcon?: boolean;
  [key: string]: any; // 기타 필드 허용
}

// 그룹 채팅 객체
export interface RisuGroupChat extends RisuCharacter {
  type: 'group';
  characters: string[]; // 멤버 character chaId 목록
  characterTalks: number[];
  characterActive: boolean[];
}