// src/components/FieldRenderer.tsx
import React from 'react';
import type { RuntimeField } from '../types';
import { Editable } from './Editable';

type SavedSelection = { range: Range } | null;

// ====== DEBUG ======
const DEBUG_FR = true; // ← выключай/включай логи тут
const log = (...a: any[]) => { if (DEBUG_FR) console.log('%c[FieldRenderer]', 'color:#ff6c00', ...a); };
const warn = (...a: any[]) => { if (DEBUG_FR) console.warn('%c[FieldRenderer]', 'color:#ff6c00', ...a); };
const group = (label: string) => DEBUG_FR ? console.group(label) : undefined;
const groupEnd = () => DEBUG_FR ? console.groupEnd() : undefined;

function nodePath(n: Node | null | undefined) {
  if (!n) return '∅';
  const parts: string[] = [];
  let cur: Node | null = n;
  // ограничим до 4 уровней вверх
  for (let i = 0; i < 4 && cur; i++) {
    if ((cur as HTMLElement).nodeType === 1) {
      const el = cur as HTMLElement;
      parts.unshift(`${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).replace(/\s+/g,'.') : ''}`);
      cur = el.parentElement;
    } else {
      parts.unshift(`#text(${(cur.textContent || '').slice(0, 12).replace(/\n/g,'\\n')}${(cur.textContent || '').length > 12 ? '…' : ''})`);
      cur = cur.parentElement as any;
    }
  }
  return parts.join(' > ');
}

// ====== Selection helpers ======
function saveSelection(): SavedSelection {
  try {
    const sel = window.getSelection?.();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      log('saveSelection()', { text: sel.toString(), range: { collapsed: r.collapsed, start: nodePath(r.startContainer), end: nodePath(r.endContainer) } });
      return { range: r.cloneRange() };
    }
  } catch (e) {
    warn('saveSelection() error:', e);
  }
  log('saveSelection(): no selection');
  return null;
}

function restoreSelection(saved: SavedSelection) {
  try {
    if (!saved) { warn('restoreSelection(): no saved range'); return; }
    const sel = window.getSelection?.();
    if (!sel) { warn('restoreSelection(): no window.getSelection'); return; }
    sel.removeAllRanges();
    sel.addRange(saved.range);
    log('restoreSelection(): done', {
      text: sel.toString(),
      start: nodePath(saved.range.startContainer),
      end: nodePath(saved.range.endContainer),
    });
  } catch (e) {
    warn('restoreSelection() error:', e);
  }
}

// ====== Markdown → HTML (тот же, но с логами входа/выхода) ======
function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function mdToHtml(mdRaw: string): string {
  group('mdToHtml()');
  log('input:', mdRaw);
  let md = mdRaw.replace(/\r\n?/g, '\n').trim();
  md = escapeHtml(md);

  md = md.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  md = md.replace(/(\*\*|__)(.+?)\1/g, (_m, _b, txt) => `<strong>${txt}</strong>`);
  md = md.replace(/(\*|_)([^*_]+)\1/g, (_m, _b, txt) => `<em>${txt}</em>`);
  md = md.replace(/~~(.+?)~~/g, (_m, txt) => `<del>${txt}</del>`);
  md = md.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  const lines = md.split('\n');
  const html: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;

  const closeLists = () => {
    if (inUl) { html.push('</ul>'); inUl = false; }
    if (inOl) { html.push('</ol>'); inOl = false; }
  };
  const closeQuote = () => {
    if (inBlockquote) { html.push('</blockquote>'); inBlockquote = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line)) { closeLists(); closeQuote(); html.push('<hr/>'); continue; }

    const hMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2];
      closeLists(); closeQuote();
      html.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    if (/^>/.test(line)) {
      closeLists();
      if (!inBlockquote) { html.push('<blockquote>'); inBlockquote = true; }
      html.push(line.replace(/^>\s?/, ''));
      continue;
    } else { closeQuote(); }

    if (/^[-*+]\s+/.test(line)) {
      if (inOl) { html.push('</ol>'); inOl = false; }
      if (!inUl) { html.push('<ul>'); inUl = true; }
      html.push(`<li>${line.replace(/^[-*+]\s+/, '')}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (!inOl) { html.push('<ol>'); inOl = true; }
      html.push(`<li>${line.replace(/^\d+\.\s+/, '')}</li>`);
      continue;
    }

    if (line === '') { closeLists(); closeQuote(); html.push(''); continue; }

    closeLists(); closeQuote();
    html.push(`<p>${line}</p>`);
  }

  if (inUl) html.push('</ul>');
  if (inOl) html.push('</ol>');
  if (inBlockquote) html.push('</blockquote>');

  const result = html.join('\n');
  log('output:', result);
  groupEnd();
  return result;
}

export const FieldRenderer: React.FC<{
  field: RuntimeField;
  value: unknown;
  onChange: (v: unknown) => void;
}> = ({ field, value, onChange }) => {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const savedSelRef = React.useRef<SavedSelection>(null);

  // Сервис: найти editable в текущем wrap
  const getEditable = (): HTMLElement | null => {
    const root = wrapRef.current;
    if (!root) return null;
    return (
      root.querySelector('[contenteditable="true"].editable') as HTMLElement ||
      root.querySelector('[contenteditable="true"]') as HTMLElement ||
      root.querySelector('.editable') as HTMLElement ||
      null
    );
  };

  // Логгер состояния selection и editable
  const logContext = (stage: string) => {
    if (!DEBUG_FR) return;
    const editable = getEditable();
    const sel = window.getSelection?.();
    const active = document.activeElement as HTMLElement | null;
    const ceAttr = editable?.getAttribute('contenteditable');
    const isCE = editable ? (editable as any).isContentEditable : false;
    log(`— ${stage} —`, {
      editable: editable ? {
        tag: editable.tagName,
        class: editable.className,
        id: editable.id,
        contenteditableAttr: ceAttr,
        isContentEditable: isCE,
        valueLike: (editable as HTMLInputElement).value,
        innerHTML_len: editable.innerHTML?.length,
        innerText_len: editable.innerText?.length
      } : '∅',
      activeEl: active ? { tag: active.tagName, class: active.className, id: active.id } : '∅',
      selection: sel ? {
        rangeCount: sel.rangeCount,
        text: sel.toString(),
        anchorPath: nodePath(sel.anchorNode || null),
        focusPath: nodePath(sel.focusNode || null)
      } : '∅'
    });
  };

  /** Помним выделение (для execCommand и серий кликов по кнопкам форматирования) */
  const rememberSelection = () => {
    savedSelRef.current = saveSelection();
  };

  React.useEffect(() => {
    if (!DEBUG_FR) return;
    const onSel = () => {
      const sel = window.getSelection?.();
      log('document.selectionchange', { text: sel?.toString(), rangeCount: sel?.rangeCount });
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  /** Универсальное применение форматирования к текущему выделению */
  const applyFormat = (cmd: 'bold' | 'italic' | 'underline') => {
    group(`applyFormat(${cmd})`);
    logContext('before');

    const editable = getEditable();
    if (!editable) {
      warn('Editable not found inside wrapper. Make sure <Editable> renders a contenteditable root with className="editable".');
      groupEnd();
      return;
    }

    // Проверим поддержку команд
    const supported = (document as any).queryCommandSupported?.(cmd);
    const enabled = (document as any).queryCommandEnabled?.(cmd);
    const stateBefore = (document as any).queryCommandState?.(cmd);
    log('command support:', { supported, enabled, stateBefore });

    // Если нет сохранённого ранжа — попробуем взять текущий
    if (!savedSelRef.current) {
      warn('No saved selection. Will try to use current window selection.');
    }

    // Восстанавливаем выделение и фокус в редактор
    restoreSelection(savedSelRef.current);
    if (document.activeElement !== editable) {
      editable.focus();
      log('focused editable');
    }

    // Повторно логнем контекст
    logContext('after focus/restore');

    // Выполняем команду
    let ok = false;
    try {
      // eslint-disable-next-line deprecation/deprecation
      ok = document.execCommand(cmd, false);
      log('execCommand result:', ok);
    } catch (e) {
      warn('execCommand threw:', e);
    }

    const stateAfter = (document as any).queryCommandState?.(cmd);
    const enabledAfter = (document as any).queryCommandEnabled?.(cmd);
    log('command state after:', { stateAfter, enabledAfter });

    // Синхронизируем значение наверх
    const ceAttr = editable.getAttribute('contenteditable');
    const prev =
      ceAttr === 'true'
        ? (editable as HTMLElement).innerHTML
        : (editable as HTMLInputElement).value ?? (editable as HTMLElement).innerText;

    // Форс-обновление: читаем снова после команды
    const next =
      ceAttr === 'true'
        ? (editable as HTMLElement).innerHTML
        : (editable as HTMLInputElement).value ?? (editable as HTMLElement).innerText;

    log('onChange payload:', {
      prevLen: prev?.length ?? 0,
      nextLen: next?.length ?? 0,
      changed: prev !== next
    });

    onChange(next);

    // Пересохраняем выделение
    rememberSelection();

    groupEnd();
  };

  /** Кнопки не должны красть фокус у редактора */
  const preventFocusSteal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Для надёжности — оставим курсор где был
    rememberSelection();
  };

  /** Тулбар + универсальный Editable (contenteditable) для текстоподобных полей */
  const renderTextLike = () => (
    <div className="text-area-wrapper" ref={wrapRef}>
      <style>{`
        .text-area-wrapper .text-tools {
          display: flex;
          gap: 6px;
          margin: 6px 0 6px;
        }
        .text-area-wrapper .text-tools button {
          all: unset;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;

          min-width: 24px;
          min-height: 24px;
          padding: 6px 12px;

          font: inherit;
          font-weight: 600;
          line-height: 1;
          color: #fff;

          background: linear-gradient(135deg, #ff8c00, #ff6c00);
          border: none;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);

          transition: background 0.25s ease, transform 0.15s ease, box-shadow 0.25s ease;
        }
        .text-area-wrapper .text-tools button:hover {
          background: linear-gradient(135deg, #ffa733, #ff7a1a);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          transform: translateY(-1px);
        }
        .text-area-wrapper .text-tools button:active {
          background: linear-gradient(135deg, #e56700, #cc5200);
          transform: translateY(1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.15) inset;
        }
        .text-area-wrapper .text-tools button:focus-visible {
          outline: 2px solid #ffb366;
          outline-offset: 2px;
        }
      `}</style>

      <div className="text-tools">
        <button
          type="button"
          className="bold-btn"
          onMouseDown={preventFocusSteal}
          onClick={() => applyFormat('bold')}
          title="Bold (Ctrl/Cmd+B)"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className="italic-btn"
          onMouseDown={preventFocusSteal}
          onClick={() => applyFormat('italic')}
          title="Italic (Ctrl/Cmd+I)"
        >
          <i>i</i>
        </button>
        <button
          type="button"
          className="underline-btn"
          onMouseDown={preventFocusSteal}
          onClick={() => applyFormat('underline')}
          title="Underline (Ctrl/Cmd+U)"
        >
          <span>U</span>
        </button>
      </div>

      <Editable
        // ВАЖНО: убедись, что Editable реально рендерит КОРНЕВОЙ элемент с contentEditable={true}
        // и применяет сюда className="editable". Иначе execCommand не сработает.
        className="editable"
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        onChange={(v) => {
          log('Editable.onChange len:', (v as string)?.length ?? 0);
          onChange(v);
          rememberSelection();
        }}
        onKeyUp={(e: any) => { log('Editable.onKeyUp key:', e?.key); rememberSelection(); }}
        onMouseUp={() => { log('Editable.onMouseUp'); rememberSelection(); }}
        onFocus={() => { log('Editable.onFocus'); }}
        onBlur={() => { log('Editable.onBlur'); }}
      />
    </div>
  );

  // ——— РЕНДЕР ПО ТИПАМ ———
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'url': {
      return renderTextLike();
    }
    case 'number': {
      return (
        <div className="text-area-wrapper" ref={wrapRef}>
          <div className="text-tools" />
          <input
            className="editable"
            type="number"
            value={
              typeof value === 'number'
                ? value
                : typeof value === 'string' && value !== ''
                  ? Number(value)
                  : ('' as any)
            }
            placeholder={typeof field.placeholder === 'string' ? field.placeholder : undefined}
            onChange={(e) => {
              const v = e.target.value;
              log('number.onChange raw:', v);
              onChange(v === '' ? '' : Number(v));
            }}
            onBlur={() => { log('number.onBlur'); rememberSelection(); }}
          />
        </div>
      );
    }
    case 'select': {
      return (
        <div className="text-area-wrapper" ref={wrapRef}>
          <div className="text-tools" />
          <select
            className="editable"
            value={(value as string) ?? ''}
            onChange={(e) => {
              log('select.onChange val:', e.target.value);
              onChange(e.target.value);
            }}
          >
            <option value="" disabled>—</option>
            {(field.options || []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    }
    case 'image': {
      return (
        <div className="text-area-wrapper" ref={wrapRef}>
          <div className="text-tools" />
          <Editable
            className="editable"
            value={(value as string) ?? ''}
            placeholder={field.placeholder || 'URL изображения или описание'}
            onChange={(v) => { log('image.Editable.onChange len:', (v as string)?.length ?? 0); onChange(v); }}
            onKeyUp={() => { log('image.Editable.onKeyUp'); rememberSelection(); }}
            onMouseUp={() => { log('image.Editable.onMouseUp'); rememberSelection(); }}
          />
        </div>
      );
    }
    case 'markdown': {
      return (
        <div className="text-area-wrapper" ref={wrapRef}>
          <div className="text-tools">
          </div>
          <Editable
            className="editable"
            value={(value as string) ?? ''}
            placeholder={field.placeholder || 'Вставьте Markdown...'}
            onChange={(v) => { log('markdown.Editable.onChange len:', (v as string)?.length ?? 0); onChange(v); rememberSelection(); }}
            onKeyUp={() => { log('markdown.Editable.onKeyUp'); rememberSelection(); }}
            onMouseUp={() => { log('markdown.Editable.onMouseUp'); rememberSelection(); }}
          />
        </div>
      );
    }
    default:
      return <div style={{ color: 'red' }}>Unsupported: {field.type}</div>;
  }
};
