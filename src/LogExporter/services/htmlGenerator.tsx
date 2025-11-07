
import { createRoot } from 'react-dom/client';
import LogContainer from '../components/LogContainer';
import type { LogContainerProps } from '../../types';

/**
 * Renders the LogContainer component in a hidden div, waits for it to be ready,
 * and returns the resulting inner HTML.
 * @param props - The props for the LogContainer component.
 * @returns A promise that resolves with the HTML string.
 */
export const getLogHtml = (props: Omit<LogContainerProps, 'onReady'>): Promise<string> => {
  return new Promise((resolve) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    const root = createRoot(tempDiv);

    const onReady = () => {
      const html = tempDiv.innerHTML;
      root.unmount();
      document.body.removeChild(tempDiv);
      resolve(html);
    };

    root.render(
      <LogContainer {...props} onReady={onReady} />
    );
       });
};


