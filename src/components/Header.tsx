import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

type Lang = 'ru' | 'en' | 'ua';
type BriefKey = 'static' | 'prezent' | 'print' | 'video' | 'logo' | 'pack';

/** Нормализуем любые входы к нашим i18n-ключам */
function normalizeBriefKey(input?: string | null): BriefKey | undefined {
  if (!input) return undefined;
  const s = String(input).toLowerCase();
  if (s === 'upacovca') return 'pack';
  if (['pack','static','prezent','print','video','logo'].includes(s)) return s as BriefKey;
  return undefined;
}

/** Пытаемся вытащить слаг из location (pathname/hash/search) */
function briefKeyFromLocation(): BriefKey | undefined {
  if (typeof window === 'undefined') return undefined;
  const { pathname, hash, search } = window.location;
  const sources = [pathname, hash, search].filter(Boolean) as string[];

  console.log('[Header] location sources:', sources);
  for (const src of sources) {
    const m = src.match(/\/(static|prezent|print|video|logo|pack|upacovca)(?:\/|$)/i);
    if (m) {
      console.log('[Header] matched slug from location:', m[1]);
      return normalizeBriefKey(m[1]);
    }
  }
  return undefined;
}

/** Жёсткий запасной словарь (если i18n не вернул нормальную строку) */
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

/** Безопасный геттер перевода: проверяем тип, «сырой» возврат и совпадение с ключом */
function tSafe(
  t: (k: string, ...rest: any[]) => any,
  key: string,
  fallback?: string
): string | undefined {
  let raw: any;
  try {
    raw = t(key); // не полагаемся на 2-й аргумент — его может не быть в твоей реализации
  } catch (e) {
    console.warn('[Header] t threw:', e);
    return fallback;
  }
  console.log('[Header] i18n raw for', key, '=>', raw);

  if (typeof raw === 'string' && raw.trim().length > 0 && raw !== key) {
    return raw;
  }
  // если вернулся ключ, пустая строка, undefined или объект — используем наш fallback
  return fallback;
}

export const Header: React.FC<{
  /** если передан — имеет приоритет над URL */
  briefSlug?: string;
  /** если передан и непустой — перекрывает локализованный заголовок */
  displayTitle?: string;
}> = ({ briefSlug, displayTitle }) => {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const lastClickRef = React.useRef<number>(0);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;
    setOpen(v => !v);
  };

  const pick = (l: Lang) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); e.stopPropagation();
    setLang(l);
    setOpen(false);
  };

  const menuStyle: React.CSSProperties = open
    ? { display: 'block', opacity: 1, pointerEvents: 'auto', visibility: 'visible', position: 'absolute', zIndex: 9999 }
    : { display: 'none' };

  // 1) определяем ключ
  const key: BriefKey | undefined =
    normalizeBriefKey(briefSlug) ?? briefKeyFromLocation();

  // 2) пробуем i18n, 3) если нет — берём из встроенного словаря, 4) иначе — "Бриф"
  const fromBuiltin = key ? BUILTIN_TITLES[lang as Lang]?.[key] : undefined;
  const localized = key
    ? tSafe(t, `header.titles.${key}`, fromBuiltin) ?? fromBuiltin ?? 'Бриф'
    : tSafe(t, 'header.titleFallback', 'Бриф') ?? 'Бриф';

  // 5) displayTitle имеет высший приоритет
  const title = (displayTitle && displayTitle.trim()) || localized;

  return (
    <div className="top-banner">
      <h1>{title}</h1>
      <p className="credits">{tSafe(t, 'header.credits', '© Borysenko Design')}</p>

      <div className={`lang-dropdown${open ? ' open' : ''}`} ref={boxRef} onClick={(e) => e.stopPropagation()}>
        <button
          className="lang-btn"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          type="button"
          title={tSafe(t, 'header.changeLang', 'Сменить язык')}
        >
          🌍
        </button>
        <div className="lang-menu" role="menu" style={menuStyle}>
          <a href="#" role="menuitem" className={lang === 'ru' ? 'active' : ''} onClick={pick('ru')}>Ru</a>
          <a href="#" role="menuitem" className={lang === 'en' ? 'active' : ''} onClick={pick('en')}>En</a>
          <a href="#" role="menuitem" className={lang === 'ua' ? 'active' : ''} onClick={pick('ua')}>Ua</a>
        </div>
      </div>
    </div>
  );
};
