// src/components/FieldRenderer.tsx
import React from 'react';
import type { RuntimeField } from '../types';
import { Editable } from './Editable';
import { isTiptapJson, tiptapToMarkdown } from '../utils/tiptapToMarkdown';

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

// ====== Markdown → HTML (debug) ======
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
      if (!inOl) { html.push('</ol>'); inOl = true; }
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

// ====== Small helper for the hint image (top, smaller) ======
const HelpImage: React.FC<{ src?: string | null }> = ({ src }) => {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={{
        maxWidth: 220,
        height: 'auto',
        display: 'block',
        margin: '0 auto 8px',
        borderRadius: 6,
      }}
    />
  );
};

export const FieldRenderer: React.FC<{
  field: RuntimeField;
  value: unknown;
  onChange: (v: unknown) => void;
}> = ({ field, value, onChange }) => {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const savedSelRef = React.useRef<SavedSelection>(null);

  const rememberSelection = () => {
    savedSelRef.current = saveSelection();
  };

  const renderTextLike = () => (
    <div className="text-area-wrapper" ref={wrapRef}>
      <div className="text-tools" />
      {/* hint image ABOVE the input */}
      <HelpImage src={field.helpImage} />
      <Editable
        className="editable"
        value={(value as string) ?? ''}
        placeholder={field.placeholder}
        onChange={(v) => { onChange(v); rememberSelection(); }}
        onKeyUp={() => rememberSelection()}
        onMouseUp={() => rememberSelection()}
      />
    </div>
  );

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'url':
      return renderTextLike();

    case 'number':
      return (
        <div className="text-area-wrapper" ref={wrapRef}>
          <div className="text-tools" />
          {/* hint image ABOVE the input */}
          <HelpImage src={field.helpImage} />
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
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      );

    case 'select':
      return (
        <div className="text-area-wrapper" ref={wrapRef}>
          <div className="text-tools" />
          {/* hint image ABOVE the select */}
          <HelpImage src={field.helpImage} />
          <select
            className="editable"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" disabled>—</option>
            {(field.options || []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );

    case 'image':
      return (
        <div className="text-area-wrapper" ref={wrapRef}>
          <div className="text-tools" />
          {/* hint image ABOVE the input */}
          <HelpImage src={field.helpImage} />
          <Editable
            className="editable"
            value={(value as string) ?? ''}
            placeholder={field.placeholder || 'URL изображения или описание'}
            onChange={(v) => onChange(v)}
            onKeyUp={() => rememberSelection()}
            onMouseUp={() => rememberSelection()}
          />
        </div>
      );

    case 'markdown':
      return (
        <div className="text-area-wrapper" ref={wrapRef}>
          <div className="text-tools" />
          {/* hint image ABOVE the input */}
          <HelpImage src={field.helpImage} />
          <Editable
            className="editable"
            value={(value as string) ?? ''}
            placeholder={field.placeholder || 'Вставьте Markdown...'}
            onChange={(v) => {
              let out: unknown = v;
              try {
                if (isTiptapJson(v)) out = tiptapToMarkdown(v);
              } catch (e) { warn('tiptap→md failed:', e); }
              onChange(out);
              rememberSelection();
            }}
            onKeyUp={() => rememberSelection()}
            onMouseUp={() => rememberSelection()}
          />
        </div>
      );

    default:
      return <div style={{ color: 'red' }}>Unsupported: {field.type}</div>;
  }
};
