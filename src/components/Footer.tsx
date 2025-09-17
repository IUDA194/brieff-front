import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

type Lang = 'ru' | 'en' | 'ua';
type SlugKey = 'static' | 'prezent' | 'print' | 'video' | 'logo' | 'pack';

/** Нормализуем слаг к ключу меню */
function normalizeSlug(s?: string | null): SlugKey | undefined {
  if (!s) return undefined;
  const x = s.toLowerCase();
  if (x === 'upacovca') return 'pack';
  if (['static', 'prezent', 'print', 'video', 'logo', 'pack'].includes(x)) {
    return x as SlugKey;
  }
  return undefined;
}

/** Достаём текущий слаг из URL (не зависит от языка) */
function slugFromLocation(loc?: Location): SlugKey | undefined {
  if (!loc) return undefined;
  const { pathname, hash, search } = loc;
  const sources = [pathname, hash, search].filter(Boolean) as string[];

  // примеры: /prezent/ru, /static/en, /#//print/ua, ?p=/logo/ru
  for (const src of sources) {
    const m = src.match(/\/(static|prezent|print|video|logo|pack|upacovca)(?:\/|$)/i);
    if (m) return normalizeSlug(m[1]);
  }
  return undefined;
}

/** Достаём слаг из пропса active (если передали строку пути или сам слаг) */
function slugFromActiveProp(active?: string): SlugKey | undefined {
  if (!active) return undefined;
  // если дали просто 'print'
  const norm = normalizeSlug(active);
  if (norm) return norm;

  // если дали путь вида '/print/ru'
  const m = active.match(/\/(static|prezent|print|video|logo|pack|upacovca)(?:\/|$)/i);
  return m ? normalizeSlug(m[1]) : undefined;
}

export const Footer: React.FC<{ active?: string }> = ({ active }) => {
  const { t, lang } = useI18n();
  const L = lang as Lang;

  // 1) определяем текущий слаг (приоритет: проп → URL)
  const currentSlug: SlugKey | undefined =
    slugFromActiveProp(active) ?? (typeof window !== 'undefined' ? slugFromLocation(window.location) : undefined);

  const links: { key: SlugKey; href: string; label: string }[] = [
    { key: 'static',  href: `/static/${L}`,   label: t('footer.links.static') },
    { key: 'prezent', href: `/prezent/${L}`,  label: t('footer.links.prezent') },
    { key: 'print',   href: `/print/${L}`,    label: t('footer.links.print') },
    { key: 'video',   href: `/video/${L}`,    label: t('footer.links.video') },
    { key: 'logo',    href: `/logo/${L}`,     label: t('footer.links.logo') },
    { key: 'pack',    href: `/upacovca/${L}`, label: t('footer.links.pack') },
  ];

  return (
    <>
      <hr className="footer-top-divider" />
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-column footer-links-column">
            <ul className="footer-links-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {links.map(link => {
                const isActive = currentSlug === link.key; // ← сравниваем по ключу, а НЕ по href
                return (
                  <li key={link.key} style={{ display: 'inline-block', marginRight: 12 }}>
                    <a
                      href={link.href}
                      aria-current={isActive ? 'page' : undefined}
                      style={{
                        color: isActive ? '#fff' : '#444',
                        background: isActive ? '#ff6c00' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        textDecoration: 'none',
                        padding: '4px 10px',
                        borderRadius: 6,
                        transition: 'background .15s ease, color .15s ease',
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
};
