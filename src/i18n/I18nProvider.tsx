import React, { createContext, useContext } from 'react';
import type { Lang } from './index';
import { dict } from './index';

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string, f?: string) => string };
const C = createContext<Ctx | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = React.useState<Lang>(
    (localStorage.getItem('brief-lang') as Lang) || 'ru'
  );
  React.useEffect(() => { localStorage.setItem('brief-lang', lang); }, [lang]);

  const t = (key: string, fallback?: string) => dict[lang]?.[key] ?? fallback ?? key;

  return <C.Provider value={{ lang, setLang, t }}>{children}</C.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(C);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
