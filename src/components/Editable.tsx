// src/components/Editable.tsx
import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, Eraser,
  Heading1, Heading2, Heading3, List as ListBulleted,
  ListOrdered, Undo as UndoIcon, Redo as RedoIcon,
} from "lucide-react";
import { TextSelection } from "@tiptap/pm/state";

type Props = {
  value: string;
  placeholder?: string;
  onChange: (html: string) => void;
  height?: number; // стартовая высота области редактирования
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
  height = 200,
}) => {
  // управляемая высота редактора
  const [editorHeight, setEditorHeight] = React.useState<number>(height);
  const isResizingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const startHRef = React.useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        spellCheck: "false",
        "data-gramm": "false",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Клик по «пустой» области → курсор в конец (Notion-like),
  // но игнорируем клики, начинающиеся на ручке ресайза.
  const handleMouseDownOnContainer = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor) return;
    // если кликнули по ручке ресайза — выходим
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest(".he-resizer")) return;

    const pmEl = (e.currentTarget.querySelector(".ProseMirror") as HTMLElement) || null;
    if (!pmEl) return;

    const target = e.target as Node;
    const clickedInsidePM = pmEl.contains(target);

    // только если реально попали в «пустоту» (корень) — ставим курсор в конец
    if (!clickedInsidePM || target === pmEl) {
      const { state, view } = editor;
      const end = state.doc.content.size;
      view.dispatch(
        state.tr.setSelection(TextSelection.create(state.doc, end)).scrollIntoView()
      );
      view.focus();
    }
  };

  // --- Ресайз через ручку ---
  const onResizerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHRef.current = editorHeight;
    // Во время ресайза отключаем выделение текста
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ns-resize";
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dy = e.clientY - startYRef.current;
      const next = Math.max(180, startHRef.current + dy); // минимальная высота
      setEditorHeight(next);
    };
    const onUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [editorHeight]);

  return (
    <div
      className="headless-editor"
      style={{ ["--he-min-h" as any]: `${editorHeight}px` }}
    >
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
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
          transition: box-shadow .2s ease, border-color .2s ease;
        }
        .headless-editor:focus-within {
          border-color: var(--orange-light);
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
          background: #f3f4f6; /* серый фон по умолчанию */
          color: #6b7280;       /* серые иконки */
          cursor: pointer;
          user-select: none;
          transition: background .2s ease, transform .1s ease, box-shadow .2s ease, color .2s ease;
        }
        .he-btn svg { width: 18px; height: 18px; pointer-events: none; }
        .he-btn:hover {
          background: linear-gradient(135deg, var(--orange-light), var(--orange));
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(0,0,0,.18);
        }
        .he-btn:active {
          background: linear-gradient(135deg, var(--orange-dark), var(--orange2));
          color: #fff;
          transform: translateY(1px);
          box-shadow: inset 0 2px 4px rgba(0,0,0,.2);
        }
        .he-btn.active {
          background: linear-gradient(135deg, var(--orange2), var(--orange));
          color: #fff;
          box-shadow: 0 0 0 2px #ffe5cc inset;
        }
        .he-btn.disabled, .he-btn:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
          opacity: .6;
          box-shadow: none;
        }

        .he-sep { width: 1px; height: 22px; background: var(--border); margin: 0 2px; }

        .he-content {
          padding: 16px 18px;
          cursor: text;
        }
        .he-content .ProseMirror {
          min-height: var(--he-min-h);
          outline: none;
          cursor: text;
        }

        .he-content p { margin: 0.6em 0; font-size: 15px; font-weight: 400; }
        .he-content h1, .he-content h2, .he-content h3, .he-content h4 {
          margin: 0.8em 0 0.4em;
          line-height: 1.3;
          font-weight: 400;
        }
        .he-content h1 { font-size: 26.7px; }
        .he-content h2 { font-size: 21.3px; }
        .he-content h3 { font-size: 18.7px; }
        .he-content h4 { font-size: 16px; }

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
          border-top: 2px solid #d1d5db;
          margin: 24px 0;
        }

        .he-content :focus { outline: none !important; }

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

        .he-resizer {
          position: relative;
          height: 14px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: ns-resize;
          user-select: none;
        }
        .he-resizer::before {
          content: "";
          position: absolute;
          left: 8px;
          right: 8px;
          top: 0;
          height: 1px;
          background: var(--border);
          pointer-events: none;
        }
        .he-resizer-grip {
          width: 36px;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--orange2), var(--orange));
          opacity: .9;
        }
      `}</style>





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

      {/* Контент — ловим клики по пустому месту (исключаем ручку ресайза) */}
      <div className="he-content" onMouseDown={handleMouseDownOnContainer}>
        <EditorContent editor={editor} />
      </div>

      {/* Ручка ресайза (не мешает выделению в тексте) */}
      <div className="he-resizer" onMouseDown={onResizerMouseDown} role="separator" aria-orientation="vertical" aria-label="Resize editor">
        <div className="he-resizer-grip" />
      </div>
    </div>
  );
};

export default Editable;
