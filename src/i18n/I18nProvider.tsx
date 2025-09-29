// src/i18n/I18nProvider.tsx
import React, { createContext, useContext } from "react";
import type { Lang } from "./index";
import { dict } from "./index";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string, f?: string) => string;
};

const C = createContext<Ctx | null>(null);
const LS_LANG_KEY = "brief-lang";

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = React.useState<Lang>(() => {
    try {
      return (localStorage.getItem(LS_LANG_KEY) as Lang) || "ru";
    } catch {
      return "ru";
    }
  });

  // при смене языка — пишем в localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(LS_LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  // слушаем изменения localStorage (другие вкладки)
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_LANG_KEY && e.newValue) {
        setLangState(e.newValue as Lang);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LS_LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const t = (key: string, fallback?: string) =>
    dict[lang]?.[key] ?? fallback ?? key;

  return (
    <C.Provider value={{ lang, setLang, t }}>
      {children}
    </C.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
