// src/components/ServicePicker.tsx
import React from "react";
import { createPortal } from "react-dom";
import { LangSwitcher, type LangCode } from "./LangSwitcher";

/** Языки интерфейса */
export type ServicePickerProps = {
  open: boolean;
  briefIds: string[];
  /**
   * Вложенная локализация названий кнопок-сервисов.
   * Пример:
   * {
   *   logo: { en: "Logo", ru: "Логотип", ua: "Логотип" },
   *   site: { en: "Website", ru: "Сайт" },
   *   pack: "Package" // допустимо — будет считаться дефолтом (en)
   * }
   */
  titles: Record<
    string,
    | string
    | Partial<Record<LangCode, string>>
  >;
  currentLang: LangCode;
  onSelect: (id: string) => void;
  onChangeLang: (lang: LangCode) => void;
  onClose: () => void;
};

/** UI-строки тоже во вложенном формате */
const UI_TEXT: Record<
  "question" | "changeLanguage",
  Partial<Record<LangCode, string>> & { en: string }
> = {
  question: {
    en: "Which service would you like to select a brief for?",
    ru: "Какой сервис вы хотите выбрать для брифа?",
    ua: "Який сервіс ви хочете обрати для брифу?",
  },
  changeLanguage: {
    en: "Change language",
    ru: "Сменить язык",
    ua: "Змінити мову",
  },
};

/** Достаём строку из UI_TEXT с фоллбэком на en */
function t<K extends keyof typeof UI_TEXT>(key: K, lang: LangCode) {
  const dict = UI_TEXT[key];
  return (dict[lang] ?? dict.en)!;
}

/** Универсальный геттер локализованного названия сервиса для вложенного titles */
function getLocalizedTitle(
  id: string,
  titles: ServicePickerProps["titles"],
  lang: LangCode
): string {
  const node = titles[id];

  // Если это просто строка — принимаем как дефолт (en)
  if (typeof node === "string") {
    return node || id;
  }

  // Если объект — пробуем exact lang → en → любую непустую строку → id
  if (node && typeof node === "object") {
    const exact = node[lang];
    if (typeof exact === "string" && exact.trim()) return exact;

    const en = node.en ?? node["EN"] ?? node["En"];
    if (typeof en === "string" && en.trim()) return en;

    // Возьмём первый непустой перевод, если есть
    const first = Object.values(node).find(
      (v) => typeof v === "string" && !!v.trim()
    ) as string | undefined;
    if (first) return first;
  }

  return id;
}

const LS_LANG_KEY = "brief-lang";

export const ServicePicker: React.FC<ServicePickerProps> = ({
  open,
  briefIds,
  titles,
  currentLang,
  onSelect,
  onChangeLang,
  onClose,
}) => {
  if (!open) return null;

  // Локальный язык для мгновенного перевода всего компонента
  const [lang, setLang] = React.useState<LangCode>(() => {
    try {
      const saved = window.localStorage.getItem(LS_LANG_KEY) as LangCode | null;
      return (saved || currentLang) as LangCode;
    } catch {
      return currentLang;
    }
  });

  // Синхронизация при внешней смене currentLang
  React.useEffect(() => {
    setLang((prev) => (prev !== currentLang ? currentLang : prev));
  }, [currentLang]);

  const titleText = t("question", lang);
  const langBtnTitle = t("changeLanguage", lang);

  // Меняем язык: локально → localStorage → наверх
  const handleLangChange = (next: LangCode) => {
    setLang(next);
    try {
      window.localStorage.setItem(LS_LANG_KEY, next);
    } catch {
      /* ignore */
    }
    onChangeLang(next);
  };

  return createPortal(
    <div
      className="picker-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="picker-card" onClick={(e) => e.stopPropagation()}>
        {/* LangSwitcher — всегда над заголовком */}
        <div className="picker-lang-wrap">
          <LangSwitcher
            current={lang}
            onChange={handleLangChange}
            title={langBtnTitle}
            className="picker-lang"
          />
        </div>

        {/* Заголовок */}
        <div className="picker-header">
          <div className="picker-title">{titleText}</div>
        </div>

        {/* Кнопки сервисов (pill'ы) — берём подписи из вложенного titles */}
        <div className="picker-grid">
          {briefIds.map((id) => {
            const label = getLocalizedTitle(id, titles, lang);
            return (
              <button
                key={id}
                className="pill"
                onClick={() => onSelect(id)}
                aria-label={label}
                title={label}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* СТИЛИ НЕ ТРОГАЛ */}
      <style>{`
/* ===== Overlay & Card ===== */
.picker-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(8px);
  display: grid; place-items: center;
  z-index: 1002;
  padding: 16px;
}
.picker-card {
  width: min(720px, 100%);
  border-radius: 22px;
  padding: 28px 30px;
  background:
    linear-gradient(#fff,#fff) padding-box,
    linear-gradient(135deg,#ffb156,#ff7a1a) border-box;
  border: 2px solid transparent;
  box-shadow: 0 40px 110px rgba(0,0,0,0.22);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== LangSwitcher ===== */
.picker-lang-wrap {
  display: flex;
  justify-content: center;
  margin: 12px;
}
.lang-dropdown {
  position: relative;
  display: flex;
  justify-content: center;
  top: 0;
  text-align: center;
  right: 0;
}
.lang-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
}

/* ===== Header ===== */
.picker-header {
  display:flex;
  flex-direction:column;
  align-items:center;
}
.picker-title {
  text-align:center;
  font-weight:800;
  font-size: clamp(26px,3.6vw,56px);
  line-height:1.2;
  margin: 0;
  color: #111;
}

/* ===== Grid ===== */
.picker-grid {
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 22px 8px 6px;
  margin: 16px;
  margin-top: 8px;
}
@media (max-width: 920px) {
  .picker-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .picker-grid { grid-template-columns: 1fr; }
}

/* ===== Pills ===== */
.pill {
  --pill-h: 44px;
  --pill-pad-x: 18px;
  --pill-radius: 999px;

  display:inline-flex;
  align-items:center;
  justify-content:center;

  min-height: var(--pill-h);
  padding: 10px var(--pill-pad-x);

  border-radius: var(--pill-radius);
  border: 1px solid transparent;
  background: #F2F2F2;
  color: #2B2B2B;
  font-weight: 500;
  font-size: 16px;
  line-height: 1;
  white-space: nowrap;
  text-align:center;
  cursor: pointer;

  transition:
    transform .12s ease,
    background .18s ease,
    color .18s ease,
    box-shadow .18s ease;
}

/* Hover = оранжевый */
.pill:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg,#ffd29e,#ff9b4a);
  color: #4a2700;
}

/* Active (нажатая) */
.pill:active {
  transform: translateY(0);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.85) inset,
    0 4px 10px rgba(0,0,0,0.12);
}

/* Focus */
.pill:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255,155,74,0.28),
    0 6px 16px rgba(0,0,0,0.1);
}

/* Selected (оставить оранжевой) */
.pill.is-active,
.pill[aria-pressed="true"] {
  background: linear-gradient(135deg,#ffd29e,#ff9b4a);
  color: #4a2700;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.35),
    0 10px 22px rgba(255,155,74,0.25);
}
      `}</style>
    </div>,
    document.body
  );
};
