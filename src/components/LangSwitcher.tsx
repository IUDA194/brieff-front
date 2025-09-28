// src/components/LangSwitcher.tsx
import React from "react";

export type LangCode = "ru" | "en" | "ua";

type Props = {
  current: LangCode;                 // текущий язык
  onChange: (code: LangCode) => void;// коллбэк смены языка
  title?: string;                    // title у кнопки (опц.)
  className?: string;                // для внешнего контейнера (опц.)
};

const LANGS: LangCode[] = ["ru", "en", "ua"];

export const LangSwitcher: React.FC<Props> = ({
  current,
  onChange,
  title = "Сменить язык",
  className = "",
}) => {
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const lastClickRef = React.useRef<number>(0);

  // закрытие по клику вне
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    // лёгкий дебаунс как в Header
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;
    setOpen((v) => !v);
  };

  const pick =
    (l: LangCode) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(l);
      setOpen(false);
    };

  // Видимость/поведение меню — как в Header: absolute + высокий z-index
  const menuStyle: React.CSSProperties = open
    ? {
        display: "block",
        opacity: 1,
        pointerEvents: "auto",
        visibility: "visible",
        position: "absolute",
        zIndex: 100050,
      }
    : { display: "none" };

  return (
    <div className={`lang-dropdown${open ? " open" : ""} ${className}`} ref={boxRef}>
      <button
        className="lang-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        type="button"
        title={title}
      >
        🌍
      </button>

      <div className="lang-menu" role="menu" style={menuStyle}>
        {LANGS.map((code) => (
          <a
            key={code}
            href="#"
            role="menuitem"
            className={`lang-item ${current === code ? "active" : ""}`}
            onClick={pick(code)}
          >
            {code.toUpperCase()}
          </a>
        ))}
      </div>

      {/* Стили 1-в-1 по духу: белая карточка с мягкой тенью, активный — оранжевый градиент,
          наведение — ЯРКО-СЕРЫЙ (не оранжевый). */}
      <style>{`
        .lang-dropdown{
          position: relative;
          display: inline-block;
        }

        .lang-btn{
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.08);
          background: #fff;
          cursor: pointer;
          font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 18px rgba(0,0,0,0.08);
          transition: box-shadow .2s ease, transform .12s ease, background .2s ease, border-color .2s ease;
        }
        .lang-dropdown.open .lang-btn,
        .lang-btn:hover{
          background: linear-gradient(135deg,#ffd29e,#ff9b4a);
          color:#4a2700;
          border-color: transparent;
          box-shadow: 0 10px 26px rgba(175, 175, 175, 0.35);
        }

        .lang-menu{
          top: calc(100% + 10px);
          transform: translateX(-50%);
          background: #ffffff;
          border-radius: 18px;
          padding: 8px 0;
          box-shadow: 0 14px 28px rgba(0,0,0,0.18);
          border: 1px solid rgba(0,0,0,0.06);
          min-width: 140px;
        }

        .lang-item{
          display: block;
          padding: 12px 18px;
          text-decoration: none;
          text-align: center;
          font-size: 20px;
          line-height: 1.2;
          color: #333;
          transition: background .18s ease, color .18s ease, box-shadow .18s ease;
          border-radius: 10px; /* небольшой скруг для серого hover внутри карточки */
          margin: 2px 8px;    /* чтобы серый hover не прилипал к краям */
          font-weight: 600;
        }

        /* Hover — ярко-серый */
        .lang-item:hover{
          background: #f0f0f0;
          color: #111;
        }

        /* Активный язык — фирменный градиент */
        .lang-item.active{
          background: linear-gradient(135deg,#ffd29e,#ff9b4a);
          color: #4a2700;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.02), 0 6px 16px rgba(255,155,74,0.28);
        }
      `}</style>
    </div>
  );
};
