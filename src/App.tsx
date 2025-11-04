// src/App.tsx
import React, { useState } from 'react';
import './App.css'; // 위에서 작성한 CSS 파일을 import

// 컴포넌트가 받을 props의 타입을 정의합니다. (닫기 함수)
interface HelloPanelProps {
  onClose: () => void;
}

const HelloPanel: React.FC<HelloPanelProps> = ({ onClose }) => {
  const [count, setCount] = useState(0);

  return (
    <div className="hello-panel">
      <h1>Hello, RisuAI!</h1>
      <p>This panel is rendered by React.</p>
      <p>Button clicked: {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click Me!
      </button>
      <button onClick={onClose} style={{ marginLeft: '10px' }}>
        Close
      </button>
    </div>
  );
};

export default HelloPanel;