import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../i18n/translations';

type Lang = 'en' | 'ar';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof translations.en;
  dir: 'ltr' | 'rtl';
}

const LangContext = createContext<LangContextType | undefined>(undefined);

function getInitialLanguage(): Lang {
  if (typeof window !== 'undefined') {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlLang = searchParams.get('lang')?.toLowerCase();
      if (urlLang === 'ar' || urlLang === 'en') {
        return urlLang as Lang;
      }
      const saved = localStorage.getItem('qawafil_lang');
      if (saved === 'en' || saved === 'ar') {
        return saved as Lang;
      }
    } catch (e) {
      // ignore in restricted environments
    }
  }
  return 'en';
}

export function LangProvider({ children, initialLang }: { children: React.ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initialLang || getInitialLanguage());

  // Synchronize with URL query parameter on mount and when popstate / history changes
  useEffect(() => {
    const syncFromUrl = () => {
      try {
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const urlLang = searchParams.get('lang')?.toLowerCase();
          if ((urlLang === 'ar' || urlLang === 'en') && urlLang !== lang) {
            setLangState(urlLang as Lang);
            localStorage.setItem('qawafil_lang', urlLang);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, [lang]);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('qawafil_lang', newLang);
        // Update the URL search parameter in browser bar smoothly
        const url = new URL(window.location.href);
        url.searchParams.set('lang', newLang);
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      } catch (e) {
        // ignore in restricted or SSR environments
      }
    }
  }, []);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
      if (dir === 'rtl') {
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
      } else {
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
      }
    }
  }, [lang, dir]);

  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
}

