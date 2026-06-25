/// <reference types="vite/client" />
/// <reference path="./types/risuai-api.d.ts" />

// --------------------------------------------------------------------------
// Vite 주입 변수 선언 (플러그인 빌드 시 사용)
// vite.config.ts의 define 옵션으로 주입되는 값들입니다.
// --------------------------------------------------------------------------
declare const __NAME__: string;
declare const __DISPLAY_NAME__: string;
declare const __VERSION__: string;
declare const __DESCRIPTION__: string;

export {};