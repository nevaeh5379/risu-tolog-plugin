
import React from 'react';
import { createRoot } from 'react-dom/client';
import LogContainer from './components/LogContainer';
import type { LogContainerProps } from '../types';

// This function provides an interface similar to the original one,
// but it renders a React component instead of returning an HTML string.
export const renderLog = (container: Element, props: LogContainerProps) => {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <LogContainer {...props} />
    </React.StrictMode>
  );
};

// You can also export the component directly if you want to use it in your React application
// export { LogContainer };
