export interface RisuChat {
  name: string;
  // ... targetChat에서 사용되는 다른 속성들
}

// RisuAI 캐릭터 객체
export interface RisuCharacter {
  name: string;
  avatar: string;
  chaId: string | number; // 캐릭터 ID
  chats: RisuChat[];
  // ... character 객체의 다른 속성들
}