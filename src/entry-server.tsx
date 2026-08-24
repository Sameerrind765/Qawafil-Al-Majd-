import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import { AppContent } from './App';

export async function render(url: string) {
  let lang: 'en' | 'ar' = 'en';
  try {
    const parsedUrl = new URL(url, 'http://localhost');
    const queryLang = parsedUrl.searchParams.get('lang')?.toLowerCase();
    if (queryLang === 'ar' || queryLang === 'en') {
      lang = queryLang;
    }
  } catch (e) {
    // fallback to 'en'
  }

  const html = renderToString(
    <StrictMode>
      <LangProvider initialLang={lang}>
        <MemoryRouter initialEntries={[url]}>
          <AppContent />
        </MemoryRouter>
      </LangProvider>
    </StrictMode>
  );
  return html;
}

