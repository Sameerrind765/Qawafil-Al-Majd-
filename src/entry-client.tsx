import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root')!;

// Only hydrate if there is actual rendered DOM child elements from SSR and not just comments/whitespace
const hasSSRMarkup =
  rootElement &&
  rootElement.firstElementChild !== null &&
  !rootElement.innerHTML.includes('<!--ssr-outlet-->');

if (hasSSRMarkup) {
  hydrateRoot(
    rootElement,
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
