/// <reference path="./vite-env.d.ts" />

import React from 'react';
import ReactDOM from 'react-dom/client';
import HelloPanel from './App';

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

  let reactRoot: ReactDOM.Root | null = null;
  let container: HTMLDivElement | null = null;
  let helloButton: HTMLButtonElement | null = null;

  // React 패널을 닫고 DOM에서 제거하는 함수
  function hidePanel() {
    if (reactRoot) {
      reactRoot.unmount(); // React 컴포넌트 정리
      reactRoot = null;
    }
    if (container) {
      container.remove(); // DOM 요소 제거
      container = null;
    }
  }

  // React 패널을 화면에 보여주는 함수
  function showPanel() {
    // 이미 패널이 있다면 아무것도 하지 않음
    if (container) return;

    // React 앱을 마운트할 div 요소를 생성
    container = document.createElement('div');
    container.id = 'risu-hello-react-container';
    document.body.appendChild(container);

    // React 렌더링 시작
    reactRoot = ReactDOM.createRoot(container);
    reactRoot.render(
      <React.StrictMode>
        <HelloPanel onClose={hidePanel} />
      </React.StrictMode>
    );
  }

  // 사이드바에 버튼을 추가하는 함수
  function injectButton() {
    if (document.getElementById('risu-hello-btn')) return;
    const targetArea = document.querySelector('.rs-sidebar .flex.flex-col.items-center.space-y-2.px-2');
    if (!targetArea) return;

    helloButton = document.createElement('button');
    helloButton.id = 'risu-hello-btn';
    helloButton.title = 'Show Hello Panel';
    helloButton.innerHTML = `👋`; // 간단한 아이콘
    
    // 버튼 스타일링
    Object.assign(helloButton.style, {
      height: '56px',
      width: '56px',
      cursor: 'pointer',
      border: '2px solid #4b5563',
      background: 'transparent',
      fontSize: '24px',
      marginTop: '8px',
    });

    helloButton.onclick = showPanel;
    targetArea.appendChild(helloButton);
  }

  // RisuAI UI가 로드된 후 버튼을 추가하기 위한 Observer 설정
  const observer = new MutationObserver(() => setTimeout(injectButton, 100));
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(injectButton, 1000); // 안전장치

  // 플러그인이 비활성화될 때 모든 것을 정리
  onUnload(() => {
    observer.disconnect();
    helloButton?.remove();
    hidePanel();
    console.log('Hello React Plugin unloaded.');
  });

})();