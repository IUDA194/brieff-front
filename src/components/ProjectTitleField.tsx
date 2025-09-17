// src/components/ProjectTitleField.tsx
import React from "react";

export const ProjectTitleField: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const editorRef = React.useRef<HTMLDivElement | null>(null);

  const applyFormat = (cmd: "bold" | "italic" | "underline") => {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange((e.target as HTMLDivElement).innerHTML);
  };

  return (
    <div className="brief-section">
      <h2>Название проекта (для сохранения)</h2>
      <div className="text-area-wrapper">
        {/* тулбар */}
        <div className="text-tools">
          <button
            type="button"
            className="bold-btn"
            title="Bold (Ctrl/Cmd+B)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("bold")}
          >
            <b>B</b>
          </button>
          <button
            type="button"
            className="italic-btn"
            title="Italic (Ctrl/Cmd+I)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("italic")}
          >
            <i>i</i>
          </button>
          <button
            type="button"
            className="underline-btn"
            title="Underline (Ctrl/Cmd+U)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat("underline")}
          >
            <span>U</span>
          </button>
        </div>

        {/* поле редактирования */}
        <div
          ref={editorRef}
          className="editable"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Введите название проекта"
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: value }}
          style={{
            minHeight: 40,
            padding: 10,
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid #ccc",
            width: "100%",
          }}
        />
      </div>
    </div>
  );
};
