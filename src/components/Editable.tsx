// src/components/Editable.tsx
import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, Eraser, Pilcrow,
  Heading1, Heading2, Heading3, List as ListBulleted,
  ListOrdered, Undo as UndoIcon, Redo as RedoIcon,
} from "lucide-react";
import { TextSelection } from "@tiptap/pm/state";

type Props = {
  value: string;
  placeholder?: string;
  onChange: (html: string) => void;
  height?: number;
};

const IconBtn: React.FC<
  React.PropsWithChildren<{
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
  }>
> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    className={`he-btn ${active ? "active" : ""} ${disabled ? "disabled" : ""}`}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

const Sep: React.FC = () => <span className="he-sep" aria-hidden="true" />;

export const Editable: React.FC<Props> = ({
  value,
  placeholder = "Введите текст…",
  onChange,
  height = 420,
}) => {
  const editor = useEditor({
    extensions: [StarterKit,     Placeholder.configure({
      placeholder,                 // берём из пропса
      showOnlyWhenEditable: true,  // не показывать в readonly
      showOnlyCurrent: true,       // показывать только для текущего пустого блока
      emptyEditorClass: 'is-editor-empty',
    }),],
    content: value || "",
    editorProps: {
      attributes: {
        spellCheck: "false",
        "data-gramm": "false",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Клик по «пустой» области → курсор в конец (Notion-like)
  const handleMouseDownOnContainer = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor) return;
    const pmEl = (e.currentTarget.querySelector(".ProseMirror") as HTMLElement) || null;
    if (!pmEl) return;

    const target = e.target as Node;

    // Если клик пришёл НЕ внутрь реального текста (например, по паддингу/фону),
    // принудительно ставим курсор в конец документа.
    const clickedInsidePM = pmEl.contains(target);
    if (!clickedInsidePM || target === pmEl) {
      const { state, view } = editor;
      const end = state.doc.content.size;
      view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, end)).scrollIntoView());
      view.focus();
    }
    // иначе — ProseMirror сам рассчитает позицию caret по клику
  };

  return (
    <div className="headless-editor">
      <style>{`
        .headless-editor {
          --orange: #ff6c00;
          --orange2: #ff8c00;
          --orange-light: #ffa733;
          --orange-dark: #cc5200;
          --pill-disabled: #ffd5b3;
          --border: #ffd5b3;
          --he-min-h: ${height}px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,.08);
          transition: box-shadow .2s ease, border-color .2s ease;
        }
        /* Мягкий Notion-like focus */
        .headless-editor:focus-within {
          border-color: #ffc58f;
          box-shadow: 0 0 0 3px rgba(255, 162, 89, 0.25);
        }

        .he-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          padding: 8px;
          border-bottom: 1px solid var(--border);
          background: #fffaf5;
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .he-btn {
          all: unset;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--orange2), var(--orange));
          color: #fff;
          cursor: pointer;
          user-select: none;
          transition: background .2s ease, transform .1s ease, box-shadow .2s ease, opacity .2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,.15);
        }
        .he-btn svg { width: 18px; height: 18px; pointer-events: none; }
        .he-btn:hover {
          background: linear-gradient(135deg, var(--orange-light), var(--orange2));
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,.18);
        }
        .he-btn:active {
          background: linear-gradient(135deg, var(--orange-dark), var(--orange));
          transform: translateY(1px);
          box-shadow: inset 0 2px 4px rgba(0,0,0,.2);
        }
        .he-btn.active { outline: 2px solid #fff; outline-offset: -3px; }
        .he-btn.disabled, .he-btn:disabled {
          background: var(--pill-disabled);
          color: #fff3e0;
          cursor: not-allowed;
          opacity: .7;
          box-shadow: none;
        }
        .he-sep { width: 1px; height: 22px; background: var(--border); margin: 0 2px; }

        /* Контейнер контента: на нём ловим клики по пустоте */
        .he-content {
          padding: 16px 18px;
          cursor: text;
        }

        /* Внутренний корень ProseMirror — делаем высоким и кликабельным */
        .he-content .ProseMirror {
          min-height: var(--he-min-h);
          outline: none;
          cursor: text;
        }

        .he-content p { margin: 0.6em 0; }
        .he-content h1, .he-content h2, .he-content h3 {
          margin: 0.8em 0 0.4em;
          line-height: 1.2;
        }
        .he-content h1 { font-size: 1.6rem; }
        .he-content h2 { font-size: 1.4rem; }
        .he-content h3 { font-size: 1.2rem; }

        /* Оранжевые точки */
        .he-content ul { padding-left: 1.5em; list-style: none; }
        .he-content ul li { position: relative; }
        .he-content ul li::before {
          content: "•";
          position: absolute;
          left: -1.2em;
          color: var(--orange);
          font-weight: 900;
        }
        .he-content ol { padding-left: 1.5em; list-style: decimal; }

        .he-content blockquote {
          border-left: 3px solid var(--orange-light);
          padding-left: 10px;
          color: #4b5563;
        }
        blockquote,
        .editor-preview-active,
        .editor-preview {
          border: 2px solid #e88440ff !important;
          border-radius: 12px;
          padding: 8px 12px;
        }
        hr {
          border: none;
          border-top: 2px solid #9f9d9cff;
          margin: 24px 0;
        }

        /* Убираем агрессивные outline по умолчанию */
        .he-content :focus {
          outline: none !important;
        }

        /* Мобилки — горизонтальный скролл панели */
        @media (max-width: 640px) {
          .he-toolbar {
            overflow-x: auto;
            white-space: nowrap;
            scrollbar-width: thin;
          }
          .he-toolbar::-webkit-scrollbar { height: 6px; }
          .he-toolbar::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 999px;
          }
        }
      .he-content p {
        margin: 0.6em 0;
        font-size: 15px;
        font-weight: 400;
      }

      .he-content h1,
      .he-content h2,
      .he-content h3,
      .he-content h4 {
        margin: 0.8em 0 0.4em;
        line-height: 1.3;
        font-weight: 400; /* убираем жирность по умолчанию */
      }

      /* размеры по Google Docs scale */
      .he-content h1 { font-size: 26.7px; }  /* Heading 1 */
      .he-content h2 { font-size: 21.3px; }  /* Heading 2 */
      .he-content h3 { font-size: 18.7px; }  /* Heading 3 */
      .he-content h4 { font-size: 16px;   }  /* Heading 4 (необяз.) */
      /* Базовый плейсхолдер для первого пустого абзаца */
      /* делаем контейнеры позиционируемыми */
      .he-content .ProseMirror p.is-editor-empty,
      .he-content .ProseMirror h1.is-editor-empty,
      .he-content .ProseMirror h2.is-editor-empty,
      .he-content .ProseMirror h3.is-editor-empty {
        position: relative;
      }

      /* Плейсхолдер — абсолютный, с обрезкой и троеточием */
      .he-content .ProseMirror p.is-editor-empty:first-child::before,
      .he-content .ProseMirror h1.is-editor-empty::before,
      .he-content .ProseMirror h2.is-editor-empty::before,
      .he-content .ProseMirror h3.is-editor-empty::before {
        content: attr(data-placeholder);
        position: absolute;
        inset-inline-start: 0;   /* left в LTR */
        inset-inline-end: 0;     /* right */
        top: 0.1em;
        color: #9ca3af;
        pointer-events: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        box-sizing: border-box;
      }

      .he-content .ProseMirror p.is-editor-empty,
      .he-content .ProseMirror h1.is-editor-empty,
      .he-content .ProseMirror h2.is-editor-empty,
      .he-content .ProseMirror h3.is-editor-empty {
        position: relative;
      }

      .he-content .ProseMirror p.is-editor-empty:first-child::before,
      .he-content .ProseMirror h1.is-editor-empty::before,
      .he-content .ProseMirror h2.is-editor-empty::before,
      .he-content .ProseMirror h3.is-editor-empty::before {
        content: attr(data-placeholder);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        color: #9ca3af;
        pointer-events: none;
        white-space: normal;       /* разрешаем перенос */
        word-break: break-word;    /* ломаем длинные слова */
      }



      
      `}
      </style>

      {/* Панель */}
      <div className="he-toolbar" role="toolbar" aria-label="Text formatting">
        <IconBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Жирный">
          <Bold />
        </IconBtn>
        <IconBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Курсив">
          <Italic />
        </IconBtn>
        <IconBtn onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")} title="Зачёркнутый">
          <Strikethrough />
        </IconBtn>

        <Sep />

        <IconBtn onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} title="Очистить форматирование">
          <Eraser />
        </IconBtn>

        <Sep />
        <IconBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive("heading", { level: 1 })} title="H1">
          <Heading1 />
        </IconBtn>
        <IconBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="H2">
          <Heading2 />
        </IconBtn>
        <IconBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="H3">
          <Heading3 />
        </IconBtn>

        <Sep />

        <IconBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Маркированный список">
          <ListBulleted />
        </IconBtn>
        <IconBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Нумерованный список">
          <ListOrdered />
        </IconBtn>

        <Sep />

        <IconBtn onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Отменить">
          <UndoIcon />
        </IconBtn>
        <IconBtn onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Повторить">
          <RedoIcon />
        </IconBtn>
      </div>

      {/* Контент — ловим клики по пустому месту */}
      <div className="he-content" onMouseDown={handleMouseDownOnContainer}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Editable;
