import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App, { AppContent } from './App';

export async function render(url: string, userState?: any, initialData?: any) {
  const html = renderToString(
    <StrictMode>
      <App>
        <MemoryRouter initialEntries={[url]}>
          <AppContent />
        </MemoryRouter>
      </App>
    </StrictMode>
  );
  return html;
}
