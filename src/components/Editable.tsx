// src/components/Editable.tsx
import React from "react";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

type Props = {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  height?: number;
  mobileBreakpointPx?: number; // кастомный брейкпоинт (по умолчанию 920)
};

function normalizeForMarkdown(src: string): string {
  let s = src ?? "";
  s = s.replace(/\r\n?/g, "\n");
  s = s.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, "").replace(/\u00A0/g, " ");
  s = s.replace(/^[ \t]*[•\u2022](?=[ \t]+)/gm, (m) => m.replace(/[•\u2022]/, "-"));
  s = s.replace(/^([ \t]*)\*(?=[ \t]+)/gm, (_m, ws) => `${ws}-`);
  s = s.replace(/^\s*(\d+)[\.)](?=[ \t]+)/gm, (_m, n) => `${n}.`);
  s = s.replace(/([^\n])\n([ \t]*([-+*]|\d+\.)[ \t]+)/g, (_m, a, b) => `${a}\n\n${b}`);
  return s;
}

export const Editable: React.FC<Props> = ({
  value,
  placeholder,
  onChange,
  height = 380,
  mobileBreakpointPx = 920,
}) => {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= mobileBreakpointPx : false
  );
  const [mobileView, setMobileView] = React.useState<"edit" | "preview">("edit");
  const [toolbarOpen, setToolbarOpen] = React.useState<boolean>(true);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= mobileBreakpointPx);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileBreakpointPx]);

  const handleChange = (v?: string) => onChange(normalizeForMarkdown(v ?? ""));

  const handlePaste: React.ClipboardEventHandler<HTMLTextAreaElement> = (e) => {
    const ta = e.currentTarget;
    const clip = e.clipboardData?.getData("text/plain") ?? "";
    if (!clip) return;
    e.preventDefault();

    const ins = normalizeForMarkdown(clip);
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? start;
    const next = (value ?? "").slice(0, start) + ins + (value ?? "").slice(end);
    onChange(next);

    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLTextAreaElement>("textarea.w-md-editor-text-input");
      (el ?? ta).selectionStart = (el ?? ta).selectionEnd = start + ins.length;
      (el ?? ta).focus();
    });
  };

  const currentPreview = isMobile ? (mobileView === "edit" ? "edit" : "preview") : "live";

  return (
    <div className={`editable-md ${isMobile ? "is-mobile" : "is-desktop"} ${toolbarOpen ? "" : "toolbar-collapsed"}`} data-color-mode="light">
      <style>{`
        .editable-md { --btn-size: 34px; --btn-radius: 10px; --orange:#ff6c00; --orange2:#ff8c00; }
        @media (max-width: 1024px) { .editable-md { --btn-size: 32px; } }
        @media (max-width: 768px)  { .editable-md { --btn-size: 28px; --btn-radius: 9px; } }
        @media (max-width: 520px)  { .editable-md { --btn-size: 26px; --btn-radius: 8px; } }

        /* ---------- MOBILE HEADER ---------- */
        .editable-md .mobile-head {
          display: none;
          margin-bottom: 8px;
        }
        .editable-md.is-mobile .mobile-head {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .editable-md .segmented {
          display: inline-flex;
          background: #fff;
          border: 1px solid #ffd5b3;
          border-radius: 10px;
          overflow: hidden;
        }
        .editable-md .segmented button {
          all: unset;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 600;
          color: #ff6c00;
        }
        .editable-md .segmented button.active {
          background: linear-gradient(135deg, var(--orange2), var(--orange));
          color: #fff;
        }
        .editable-md .toolbar-toggle {
          all: unset;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, var(--orange2), var(--orange));
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,.15);
        }

        /* ---------- ORANGE TOOLBAR PILLS ---------- */
        .w-md-editor { border-radius: 12px !important; }
        .w-md-editor .w-md-editor-toolbar {
          background: transparent !important;
          border-bottom: 1px solid #ffd5b3 !important;
          padding: 6px 6px 8px !important;
        }
        .editable-md.toolbar-collapsed .w-md-editor-toolbar {
          display: none !important;
        }
        .w-md-editor .w-md-editor-toolbar > ul {
          display: flex !important;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 100%;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
        }
        .w-md-editor .w-md-editor-toolbar > ul::-webkit-scrollbar { height: 8px; }
        .w-md-editor .w-md-editor-toolbar > ul::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,.15); border-radius: 6px;
        }

        .w-md-editor .w-md-editor-toolbar li { margin: 0 !important; }
        .w-md-editor .w-md-editor-toolbar li > button {
          all: unset;
          display: inline-flex; align-items: center; justify-content: center;
          width: var(--btn-size); height: var(--btn-size);
          padding: 0 0px; margin: 0;
          color: #fff !important; font-weight: 700;
          background: linear-gradient(135deg, var(--orange2), var(--orange));
          border-radius: var(--btn-radius);
          box-shadow: 0 2px 4px rgba(0,0,0,.15);
          cursor: pointer;
          transition: background .2s ease, transform .15s ease, box-shadow .2s ease;
        }
        .w-md-editor .w-md-editor-toolbar li > button:hover {
          background: linear-gradient(135deg, #ffa733, var(--orange2));
          box-shadow: 0 4px 10px rgba(0,0,0,.18);
          transform: translateY(-1px);
        }
        .w-md-editor .w-md-editor-toolbar li > button:active {
          background: linear-gradient(135deg, #e56700, #cc5200);
          transform: translateY(1px);
          box-shadow: inset 0 2px 4px rgba(0,0,0,.2);
        }
        .w-md-editor .w-md-editor-toolbar-divider {
          width: 1px; height: var(--btn-size);
          background: #ffd5b3; margin: 0 4px !important;
        }

        /* ---------- PREVIEW BULLETS (orange dots) ---------- */
        .wmde-markdown ul { padding-left: 1.5em; list-style: none; }
        .wmde-markdown ul li { position: relative; }
        .wmde-markdown ul li::before {
          content: "•"; position: absolute; left: -1.2em;
          color: var(--orange); font-weight: 900;
        }
        .wmde-markdown ol { padding-left: 1.5em; list-style: decimal; }

        /* ---------- RESPONSIVE PANES ---------- */
        @media (max-width: ${mobileBreakpointPx}px) {
          .w-md-editor .w-md-editor-content { flex-direction: column !important; }
          .w-md-editor .w-md-editor-text,
          .w-md-editor .w-md-editor-preview { width: 100% !important; }
          .w-md-editor .w-md-editor-text { min-height: 220px; }
          .w-md-editor .w-md-editor-preview { min-height: 220px; }
        }

        /* косметика контента */
        .wmde-markdown h1, .wmde-markdown h2 { padding-bottom: .25rem; border-bottom: 1px solid #eee; }
        .wmde-markdown hr { border: 0; border-top: 1px solid #eee; margin: 12px 0; }
        .wmde-markdown a { color: #2563eb; text-decoration: underline; }
      `}</style>

      {/* mobile header */}
      {isMobile && (
        <div className="mobile-head">
          <div className="segmented">
            <button
              className={mobileView === "edit" ? "active" : ""}
              onClick={() => setMobileView("edit")}
              aria-pressed={mobileView === "edit"}
            >
              Edit
            </button>
            <button
              className={mobileView === "preview" ? "active" : ""}
              onClick={() => setMobileView("preview")}
              aria-pressed={mobileView === "preview"}
            >
              Preview
            </button>
          </div>
          <button
            className="toolbar-toggle"
            onClick={() => setToolbarOpen(v => !v)}
            aria-pressed={toolbarOpen}
            title={toolbarOpen ? "Скрыть панель" : "Показать панель"}
          >
            {toolbarOpen ? "Скрыть панель" : "Показать панель"}
          </button>
        </div>
      )}

      <MDEditor
        value={value}
        onChange={handleChange}
        height={height}
        preview={currentPreview}          // live (десктоп), edit/preview (мобилка)
        textareaProps={{
          placeholder: placeholder || "Введите текст…",
          onPaste: handlePaste,
        }}
      />
    </div>
  );
};
