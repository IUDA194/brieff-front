// src/components/Editable.tsx
import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

type Props = {
  value: string;
  placeholder?: string;
  onChange: (html: string) => void;
  height?: number;
};

const Btn: React.FC<
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
  >
    {children}
  </button>
);

export const Editable: React.FC<Props> = ({
  value,
  placeholder = "Введите текст…",
  onChange,
  height = 420,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="headless-editor">
      <style>{`
        .headless-editor {
          --orange: #ff6c00;
          --orange2: #ff8c00;
          --orange-light: #ffa733;
          --orange-dark: #cc5200;
          --pill-disabled: #ffd5b3;
          background: #fff;
          border: 1px solid #ffd5b3;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,.08);
        }
        .he-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
          border-bottom: 1px solid #ffd5b3;
        }
        .he-btn {
          all: unset;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--orange2), var(--orange));
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
          transition: background .2s ease, transform .1s ease, box-shadow .2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,.15);
        }
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
        .he-btn.active {
          background: linear-gradient(135deg, var(--orange2), var(--orange));
          color: #fff;
        }
        .he-btn.disabled,
        .he-btn:disabled {
          background: var(--pill-disabled);
          color: #fff3e0;
          cursor: not-allowed;
          opacity: .7;
          box-shadow: none;
        }
        .he-content {
          min-height: ${height}px;
          padding: 16px 18px;
          outline: none;
        }
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
          border: 2px solid #e88440ff !important; /* твой брендовый оранжевый */
          border-radius: 12px; /* можно сгладить углы */
          padding: 8px 12px;
        }
        hr {
          border: none;
          border-top: 2px solid #9f9d9cff; /* можно и цвет фирменный */
          margin: 24px 0;  /* отступы сверху/снизу — увеличь по вкусу */
        }

        /* Если это обводка именно при фокусе */
        :focus {
          outline: 2px solid #ffa733 !important;
          border-radius: 12px;
          outline-offset: 2px;
        }
      `}</style>

      {/* Панель */}
      <div className="he-toolbar">
        <Btn onClick={() => editor?.chain().focus().toggleBold().run()}
             active={editor?.isActive("bold")}>Bold</Btn>
        <Btn onClick={() => editor?.chain().focus().toggleItalic().run()}
             active={editor?.isActive("italic")}>Italic</Btn>
        <Btn onClick={() => editor?.chain().focus().toggleStrike().run()}
             active={editor?.isActive("strike")}>Strike</Btn>
        <Btn onClick={() => editor?.chain().focus().unsetAllMarks().run()}>Clear</Btn>
        <Btn onClick={() => editor?.chain().focus().setParagraph().run()}
             active={editor?.isActive("paragraph")}>P</Btn>
        <Btn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
             active={editor?.isActive("heading", { level: 1 })}>H1</Btn>
        <Btn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
             active={editor?.isActive("heading", { level: 2 })}>H2</Btn>
        <Btn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
             active={editor?.isActive("heading", { level: 3 })}>H3</Btn>
        <Btn onClick={() => editor?.chain().focus().toggleBulletList().run()}
             active={editor?.isActive("bulletList")}>•</Btn>
        <Btn onClick={() => editor?.chain().focus().toggleOrderedList().run()}
             active={editor?.isActive("orderedList")}>1.</Btn>
        <Btn onClick={() => editor?.chain().focus().undo().run()}
             disabled={!editor?.can().undo()}>Undo</Btn>
        <Btn onClick={() => editor?.chain().focus().redo().run()}
             disabled={!editor?.can().redo()}>Redo</Btn>
      </div>

      {/* Контент */}
      <EditorContent editor={editor} className="he-content" />
    </div>
  );
};

export default Editable;
