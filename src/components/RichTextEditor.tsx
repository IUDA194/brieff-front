import React from 'react';

export const RichTextEditor: React.FC<{
  value: string;
  onChange: (html: string) => void;
}> = ({ value, onChange }) => {
  const editorRef = React.useRef<HTMLDivElement | null>(null);

  const apply = (cmd: 'bold'|'italic'|'underline') => {
    // сохраняем фокус и применяем форматирование к выделению
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    // синхронизируем состояние
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const onInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div>
      <div className="text-tools" style={{ display:'flex', gap:8, marginBottom:8 }}>
        <button type="button" className="bold-btn" onClick={() => apply('bold')}><b>B</b></button>
        <button type="button" className="italic-btn" onClick={() => apply('italic')}><i>i</i></button>
        <button type="button" className="underline-btn" onClick={() => apply('underline')}><span style={{ textDecoration:'underline' }}>T</span></button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={onInput}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        style={{
          minHeight: 120,
          padding: 10,
          border: '1px solid #ccc',
          borderRadius: 6,
          background: '#fff'
        }}
      />
    </div>
  );
};
