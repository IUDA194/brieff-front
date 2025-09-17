import React, { useCallback, useMemo, useRef } from 'react';
import TurndownService from 'turndown';

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

// markdown для "подчёркнутого" нет — используем HTML-тэг <u>…</u>
function wrap(md: string, prefix: string, suffix = prefix) {
  const start = md.indexOf('\n') === -1 ? '' : ''; // на будущее
  return `${start}${prefix}${md}${suffix}`;
}

export const MarkdownInput: React.FC<Props> = ({
  label = 'Желаемый срок выполнения, и почему:',
  value,
  onChange,
  placeholder = 'Введите текст в Markdown…',
  rows = 10,
  className,
}) => {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const turndown = useMemo(
    () =>
      new TurndownService({
        headingStyle: 'atx',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
      }),
    []
  );

  const applyWrapToSelection = useCallback((prefix: string, suffix = prefix) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd);
    const after = value.slice(selectionEnd);

    const next = before + wrap(selected || '', prefix, suffix) + after;

    // вычислим новые позиции курсора
    const newStart = selectionStart + prefix.length;
    const newEnd = newStart + (selected || '').length;

    onChange(next);
    // отложим восстановление курсора после обновления value
    requestAnimationFrame(() => {
      ta.setSelectionRange(newStart, newEnd);
      ta.focus();
    });
  }, [value, onChange]);

  const insertAtCursor = useCallback((text: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const next = before + text + after;
    const caret = selectionStart + text.length;
    onChange(next);
    requestAnimationFrame(() => {
      ta.setSelectionRange(caret, caret);
      ta.focus();
    });
  }, [value, onChange]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const accel = isMac ? e.metaKey : e.ctrlKey;

    if (!accel) return;

    // Ctrl/Cmd + B/I/U
    if (e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyWrapToSelection('**');
    } else if (e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyWrapToSelection('*');
    } else if (e.key.toLowerCase() === 'u') {
      e.preventDefault();
      applyWrapToSelection('<u>', '</u>');
    }
  }, [applyWrapToSelection]);

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    if (!html) return; // обычная вставка текста
    e.preventDefault();

    const md = turndown.turndown(html).trim();
    if (!md) return;

    insertAtCursor(md);
  }, [turndown, insertAtCursor]);

  return (
    <div className="brief-section">
      <h2>{label}</h2>
      <div className="text-area-wrapper">
        <div className="text-tools">
          <button type="button" className="bold-btn" title="Bold (Ctrl/Cmd+B)" onClick={() => applyWrapToSelection('**')}>
            <b>B</b>
          </button>
          <button type="button" className="italic-btn" title="Italic (Ctrl/Cmd+I)" onClick={() => applyWrapToSelection('*')}>
            <i>i</i>
          </button>
          <button type="button" className="underline-btn" title="Underline (Ctrl/Cmd+U)" onClick={() => applyWrapToSelection('<u>', '</u>')}>
            <span>U</span>
          </button>
          <button type="button" title="Заголовок H2" onClick={() => insertAtCursor('\n\n## Заголовок\n\n')}>
            H2
          </button>
          <button type="button" title="Список" onClick={() => insertAtCursor('\n- пункт 1\n- пункт 2\n- пункт 3\n')}>
            ••
          </button>
          <button type="button" title="Ссылка" onClick={() => insertAtCursor('[текст ссылки](https://example.com)')}>
            🔗
          </button>
          <button type="button" title="Код" onClick={() => applyWrapToSelection('`')}>
            {`</>`}
          </button>
        </div>

        <textarea
          ref={taRef}
          className={`md-textarea ${className ?? ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          rows={rows}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
