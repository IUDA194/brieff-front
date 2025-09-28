// src/components/Header.tsx
import React from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { LangSwitcher, type LangCode } from './LangSwitcher';

type Lang = 'ru' | 'en' | 'ua';
type BriefKey = 'static' | 'prezent' | 'print' | 'video' | 'logo' | 'pack';

function normalizeBriefKey(input?: string | null): BriefKey | undefined {
  if (!input) return undefined;
  const s = String(input).toLowerCase();
  if (s === 'upacovca') return 'pack';
  if (['pack', 'static', 'prezent', 'print', 'video', 'logo'].includes(s)) {
    return s as BriefKey;
  }
  return undefined;
}

function briefKeyFromLocation(): BriefKey | undefined {
  if (typeof window === 'undefined') return undefined;
  const { pathname, hash, search } = window.location;
  const sources = [pathname, hash, search].filter(Boolean) as string[];
  for (const src of sources) {
    const m = src.match(/\/(static|prezent|print|video|logo|pack|upacovca)(?:\/|$)/i);
    if (m) return normalizeBriefKey(m[1]);
  }
  return undefined;
}

const BUILTIN_TITLES: Record<Lang, Record<BriefKey, string>> = {
  ru: {
    static: 'Бриф: Статика',
    prezent: 'Бриф: Презентация',
    print: 'Бриф: Печать',
    video: 'Бриф: Видео',
    logo: 'Бриф: Логотип',
    pack: 'Бриф: Упаковка',
  },
  en: {
    static: 'Static Brief',
    prezent: 'Presentation Brief',
    print: 'Print Brief',
    video: 'Video Brief',
    logo: 'Logo Brief',
    pack: 'Packaging Brief',
  },
  ua: {
    static: 'Бриф: Статика',
    prezent: 'Бриф: Презентація',
    print: 'Бриф: Друк',
    video: 'Бриф: Відео',
    logo: 'Бриф: Логотип',
    pack: 'Бриф: Пакування',
  },
};

function tSafe(
  t: (k: string, ...rest: any[]) => any,
  key: string,
  fallback?: string
): string | undefined {
  let raw: any;
  try {
    raw = t(key);
  } catch {
    return fallback;
  }
  if (typeof raw === 'string' && raw.trim().length > 0 && raw !== key) return raw;
  return fallback;
}

export const Header: React.FC<{
  briefSlug?: string;
  displayTitle?: string;
}> = ({ briefSlug, displayTitle }) => {
  const { lang, setLang, t } = useI18n();

  const key: BriefKey | undefined =
    normalizeBriefKey(briefSlug) ?? briefKeyFromLocation();

  const fromBuiltin = key ? BUILTIN_TITLES[(lang as Lang) ?? 'ru']?.[key] : undefined;
  const localized = key
    ? tSafe(t, `header.titles.${key}`, fromBuiltin) ?? fromBuiltin ?? 'Бриф'
    : tSafe(t, 'header.titleFallback', 'Бриф') ?? 'Бриф';

  const title = (displayTitle && displayTitle.trim()) || localized;

  return (
    <div className="top-banner" style={{ position: 'relative' }}>
      {/* Язык в правом верхнем углу */}
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <LangSwitcher
          current={(lang as LangCode) || 'ru'}
          onChange={(code) => setLang(code)}
          title={tSafe(t, 'header.changeLang', 'Сменить язык') || 'Сменить язык'}
        />
      </div>

      <h1>{title}</h1>
      <p className="credits">
        {tSafe(t, 'header.credits', '© Borysenko Design')}
      </p>
    </div>
  );
};

export default Header;
