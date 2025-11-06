/// <reference path="./vite-env.d.ts" />

import { initializeInjector, disconnectInjector } from './injector/injector';

// RisuAI 플러그인 헤더 (빌드 시 Vite가 자동으로 채워줍니다)
console.log(`
//@name risu-tolog-plugin
//@display-name Risu toLOG Plugin
//@version 0.0.1
//@description A plugin for RisuAI.
`);

// 플러그인 코드를 즉시 실행 함수(IIFE)로 감싸기
(async () => {
  const { onUnload } = (window as any).__pluginApis__;

  // Start the injector to add buttons to the UI
  initializeInjector();

  // 플러그인이 비활성화될 때 모든 것을 정리
  onUnload(() => {
    disconnectInjector();
    console.log('Log Exporter Plugin unloaded.');
  });

})();