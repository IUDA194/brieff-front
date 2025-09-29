// src/components/LangSwitcher.tsx
import React from "react";

export type LangCode = "ru" | "en" | "ua";

type Props = {
  current: LangCode;
  onChange: (code: LangCode) => void;
  title?: string;
  className?: string;
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

  const menuStyle: React.CSSProperties = open
    ? { display: "block", position: "absolute", zIndex: 100050 }
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

      <style>{`
        .lang-dropdown{
          position: relative;
          display: inline-block;
        }

        .lang-btn{
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1px solid #e5e5e5;
          background: #f5f5f5;
          cursor: pointer;
          font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          transition: box-shadow .2s ease, transform .12s ease;
        }
        .lang-btn:hover{
          box-shadow: 0 4px 10px rgba(0,0,0,0.12);
          transform: translateY(-1px);
        }

        .lang-menu{
          top: calc(100% + 10px);
          transform: translateX(-50%);
          background: #fff;
          border-radius: 14px;
          padding: 6px 0;
          box-shadow: 0 14px 28px rgba(0,0,0,0.18);
          border: 1px solid rgba(0,0,0,0.06);
          min-width: 120px;
        }

        .lang-item{
          display: block;
          padding: 10px 14px;
          text-decoration: none;
          text-align: center;
          font-size: 16px;
          color: #333;
          border-radius: 8px;
          margin: 2px 6px;
          font-weight: 600;
          transition: background .18s ease, color .18s ease;
        }

        /* Hover = серый */
        .lang-item:hover{
          background: #f0f0f0;
          color: #111;
        }

        /* Активный язык тоже серый */
        .lang-item.active{
          background: #e5e5e5;
          color: #111;
        }
      `}</style>
    </div>
  );
};
