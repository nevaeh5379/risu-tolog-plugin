// src/vite-env.d.ts

/// <reference types="vite/client" />

// --------------------------------------------------------------------------
// Vite 주입 변수 선언 (플러그인 빌드 시 사용)
// 이 부분은 플러그인 프로젝트의 vite.config.ts에서 define 옵션으로 주입해주는 값들입니다.
// 사용하고 계신 것이 맞다면 그대로 두시면 됩니다.
// --------------------------------------------------------------------------
declare const __NAME__: string;
declare const __DISPLAY_NAME__: string;
declare const __VERSION__: string;
declare const __DESCRIPTION__: string;

// --------------------------------------------------------------------------
// RisuAI 플러그인 API 타입 정의
// plugin.ts 파일에 정의된 타입들을 기반으로 구체화했습니다.
// --------------------------------------------------------------------------

// `OpenAIChat` 타입 (plugin.ts에서 사용)
interface OpenAIChat {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// `addProvider` 함수의 `arg` 파라미터 타입
interface PluginV2ProviderArgument {
  prompt_chat: OpenAIChat[];
  frequency_penalty: number;
  min_p: number;
  presence_penalty: number;
  repetition_penalty: number;
  top_k: number;
  top_p: number;
  temperature: number;
  mode: string;
  max_tokens: number;
}

// `addProvider` 함수의 `options` 파라미터 타입
interface PluginV2ProviderOptions {
  tokenizer?: string;
  tokenizerFunc?: (content: string) => number[] | Promise<number[]>;
}

// `addRisuScriptHandler` 함수의 `name` 파라미터 타입
type ScriptMode = 'display' | 'output' | 'process' | 'input';

// `addRisuScriptHandler` 함수의 `func` 파라미터 타입
type EditFunction = (content: string) => string | null | undefined | Promise<string | null | undefined>;

// `addRisuReplacer` 함수의 `func` 파라미터 타입 (beforeRequest)
type BeforeRequestReplacerFunction = (content: OpenAIChat[], type: string) => OpenAIChat[] | Promise<OpenAIChat[]>;

// `addRisuReplacer` 함수의 `func` 파라미터 타입 (afterRequest)
type AfterRequestReplacerFunction = (content: string, type: string) => string | Promise<string>;

// RisuAI 플러그인 API 인터페이스 정의
interface RisuPluginApis {
  risuFetch: typeof fetch;
  nativeFetch: typeof fetch;
  getArg: (arg: string) => number | string | undefined;
  getChar: () => any; // 캐릭터 타입이 특정되지 않아 any로 유지
  setChar: (char: any) => void;

  addProvider: (
    name: string,
    func: (arg: PluginV2ProviderArgument, abortSignal?: AbortSignal) => Promise<{ success: boolean; content: string | ReadableStream<string>; }>,
    options?: PluginV2ProviderOptions
  ) => void;

  addRisuScriptHandler: (name: ScriptMode, func: EditFunction) => void;
  removeRisuScriptHandler: (name: ScriptMode, func: EditFunction) => void;

  // `addRisuReplacer`는 name에 따라 func의 타입이 달라지므로 오버로딩으로 정의
  addRisuReplacer(name: 'beforeRequest', func: BeforeRequestReplacerFunction): void;
  addRisuReplacer(name: 'afterRequest', func: AfterRequestReplacerFunction): void;
  
  // `removeRisuReplacer`도 동일하게 오버로딩
  removeRisuReplacer(name: 'beforeRequest', func: BeforeRequestReplacerFunction): void;
  removeRisuReplacer(name: 'afterRequest', func: AfterRequestReplacerFunction): void;

  onUnload: (func: () => void | Promise<void>) => void;
  setArg: (arg: string, value: string | number) => void;
}

// 전역 Window 인터페이스를 확장
declare global {
  interface Window {
    __pluginApis__: RisuPluginApis;
  }
}

// TypeScript 모듈 시스템을 위한 export {}
export {};