import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { App } from './app/App';

const domNode = document.getElementById('root');
if (
  domNode === null ||
  domNode === undefined ||
  !(domNode instanceof HTMLElement)
) {
  throw new Error('Could not find root DOM node');
}

const root = createRoot(domNode);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
