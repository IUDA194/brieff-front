// src/components/ServicePicker.tsx
import React from "react";
import { createPortal, flushSync } from "react-dom";
import { LangSwitcher, type LangCode } from "./LangSwitcher";
import { useI18n } from "../i18n/I18nProvider";

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
  titles: Record<string, string | Partial<Record<LangCode, string>>>;
  onSelect: (id: string) => void;
  onClose: () => void;
};

/** Универсальный геттер локализованного названия сервиса */
function getLocalizedTitle(
  id: string,
  titles: ServicePickerProps["titles"],
  lang: LangCode
): string {
  const node = titles[id];
  if (typeof node === "string") return node || id;

  if (node && typeof node === "object") {
    const exact = node[lang];
    if (typeof exact === "string" && exact.trim()) return exact;

    const en = node.en ?? (node as any)["EN"] ?? (node as any)["En"];
    if (typeof en === "string" && en.trim()) return en;

    const first = Object.values(node).find(
      (v) => typeof v === "string" && !!v.trim()
    ) as string | undefined;
    if (first) return first;
  }
  return id;
}

export const ServicePicker: React.FC<ServicePickerProps> = ({
  open,
  briefIds,
  titles,
  onSelect,
  onClose,
}) => {
  if (!open) return null;

  const { lang, setLang, t } = useI18n();

  // обработчик выбора сервиса
  const handleSelect = (id: string) => {
    // гарантируем, что язык синхронно сохранится в контекст
    flushSync(() => {
      setLang(lang);
    });
    onSelect(id);
    // можно закрывать попап
    onClose();
  };

  return createPortal(
    <div className="picker-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="picker-card" onClick={(e) => e.stopPropagation()}>
        {/* LangSwitcher — всегда над заголовком */}
        <div className="picker-lang-wrap">
          <LangSwitcher
            current={lang}
            onChange={setLang}
            title={t("changeLanguage")}
            className="picker-lang"
          />
        </div>

        {/* Заголовок */}
        <div className="picker-header">
          <div className="picker-title">{t("question")}</div>
        </div>

        {/* Кнопки сервисов */}
        <div className="picker-grid">
          {briefIds.map((id) => {
            const label = getLocalizedTitle(id, titles, lang);
            return (
              <button
                key={id}
                className="pill"
                onClick={() => handleSelect(id)}
                aria-label={label}
                title={label}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

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
  padding: 12px var(--pill-pad-x);

  border-radius: var(--pill-radius);
  border: 0px solid #e5e5e5;
  background: #f5f5f5;
  color: #2b2b2b;

  font-weight: 600;
  font-size: 15px;
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

/* Hover = оранжевый градиент (как btn-primary) */
.pill:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg,#ff8c00,#ff6c00);
  color: #fff;
  box-shadow: 0 6px 16px rgba(255,108,0,0.25);
}

/* Active (нажатая) */
.pill:active {
  transform: translateY(0);
  box-shadow: 0 6px 16px rgba(255,108,0,0.25);
}

/* Focus */
.pill:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255,155,74,0.28),
    0 6px 16px rgba(0,0,0,0.1);
}

/* Disabled */
.pill[disabled],
.pill[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: .65;
  filter: grayscale(.15);
  box-shadow: none;
}

/* Selected (оставляем оранжевой после клика) */
.pill.is-active,
.pill[aria-pressed="true"] {
  background: linear-gradient(135deg,#ff8c00,#ff6c00);
  color: #fff;
}
      `}</style>
    </div>,
    document.body
  );
};
