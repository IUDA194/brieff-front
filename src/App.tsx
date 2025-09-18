// src/App.tsx
import React from 'react';
import { Header } from './components/Header';
import { Rules } from './components/Rules';
import { FieldRenderer } from './components/FieldRenderer';
import { Toolbar } from './components/Toolbar';
import { Footer } from './components/Footer';
import { useI18n } from './i18n/I18nProvider';
import type { RuntimeSchema, SubmissionPayload } from './types';
import { loadBriefs, realizeSchema } from './briefs';
import { API_URL, STORAGE_PREFIX } from './config';

// tiptap → Markdown утилиты
import { isTiptapJson, tiptapToMarkdown } from './utils/tiptapToMarkdown';

// HTML → Markdown
import TurndownService from 'turndown';

type BriefType = 'static' | 'prezent' | 'print' | 'video' | 'logo' | 'pack';
const skey = (briefId: string) => `${STORAGE_PREFIX}:brief:${briefId}`;
const HISTORY_KEY = `${STORAGE_PREFIX}:brief:history`;

type PdfHistoryItem = {
  id: string;
  briefId: string;
  lang: string;
  requestedAt: string;
  payload: SubmissionPayload; // data уже локализована (ключи = H2)
  response: any;
  link?: string | null;
};

// ---------- utils ----------
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
function loadHistory(): PdfHistoryItem[] {
  return safeParse<PdfHistoryItem[]>(localStorage.getItem(HISTORY_KEY), []);
}
function saveHistory(items: PdfHistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}
function addToHistory(item: PdfHistoryItem) {
  const cur = loadHistory();
  const next = [item, ...cur].slice(0, 30);
  saveHistory(next);
}
function uuid(): string {
  // @ts-ignore
  return (globalThis.crypto?.randomUUID?.() ?? `h_${Date.now()}_${Math.random().toString(36).slice(2)}`);
}

/** Пытаемся вытащить briefId из URL по нескольким шаблонам */
function deriveBriefIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    for (const key of ['briefId', 'brief', 'id']) {
      const v = u.searchParams.get(key);
      if (v) return v;
    }
    const last = (u.pathname.split('/').pop() || '').toLowerCase();
    const mFile = last.match(/brief[-_](?<id>[a-z0-9._-]+?)(?:[-_.]\w+)*\.pdf$/i);
    if (mFile?.groups?.id) return mFile.groups.id;
    const mS3 = u.pathname.match(/\/briefs?\/(?<id>[a-z0-9._-]+)/i);
    if (mS3?.groups?.id) return mS3.groups.id;
    const mPath = u.pathname.match(/\/(?:b|template|templates)\/(?<id>[a-z0-9._-]+)/i);
    if (mPath?.groups?.id) return mPath.groups.id;
    const hostParts = u.hostname.split('.');
    if (hostParts.length > 2) {
      const cand = hostParts[0];
      if (/^[a-z0-9._-]{2,}$/.test(cand)) return cand;
    }
  } catch { /* ignore */ }
  return null;
}

/** Выбираем briefId: сперва из ссылок, потом из current/schema */
function pickBriefId(opts: {
  pageUrl?: string | null;
  fileUrl?: string | null;
  current?: string | null;
  schemaId?: string | null;
}): string | null {
  return (
    deriveBriefIdFromUrl(opts.fileUrl) ??
    deriveBriefIdFromUrl(opts.pageUrl) ??
    opts.current ??
    opts.schemaId ??
    null
  );
}

/** Нормализация подписи (как в buildLocalizedDataMap) */
function normalizeLabel(s: string | undefined | null) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

/** Построить объект "локализованный заголовок секции (H2) → значение" */
function buildLocalizedDataMap(schema: RuntimeSchema | null, values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (!schema?.fields) return out;
  for (const f of schema.fields) {
    const key = normalizeLabel(f.label) || f.id;
    const val = values[f.id];
    if (Object.prototype.hasOwnProperty.call(out, key)) {
      const prev = out[key];
      out[key] = Array.isArray(prev) ? [...prev, val] : [prev, val];
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Грузим значения полей для конкретного briefId из localStorage */
function loadValuesForBriefId(briefId: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(skey(briefId));
    return raw ? safeParse<Record<string, unknown>>(raw, {}) : {};
  } catch {
    return {};
  }
}

/** -------- HTML → Markdown (Turndown) ---------- */
const td = new TurndownService({
  headingStyle: 'atx',          // # H1
  bulletListMarker: '-',        // - item
  codeBlockStyle: 'fenced',     // ``` code ```
  emDelimiter: '*',
  strongDelimiter: '**',
  hr: '---',
});
// <br> → мягкий перенос
td.addRule('preserveLineBreaks', {
  filter: ['br'],
  replacement: () => '  \n',
});
// удалить пустые абзацы <p></p>
td.addRule('stripEmptyParas', {
  filter: (node) => node.nodeName === 'P' && node.textContent?.trim() === '',
  replacement: () => '',
});
function looksLikeHtml(s: string): boolean {
  return /<\/?(p|h\d|ul|ol|li|strong|em|b|i|blockquote|code|pre|br)\b/i.test(s);
}

/** Универсальная нормализация значений перед отправкой на бэк:
 * 1) tiptap JSON → Markdown
 * 2) строковый HTML → Markdown
 * 3) иначе — как есть
 */
function normalizeValueForBackend(v: unknown): unknown {
  try {
    if (isTiptapJson(v)) return tiptapToMarkdown(v);
    if (typeof v === 'string' && looksLikeHtml(v)) {
      return td.turndown(v);
    }
  } catch {/* ignore */}
  return v;
}

// ---------- component ----------
const App: React.FC = () => {
  const { lang } = useI18n();
  const isRu = String(lang).toLowerCase().startsWith('ru');

  // 🔁 Редирект с "/" (и "/index.html", "/static" без языка) на /static/<lang>/
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const { pathname, search, hash } = window.location;
    const lcLang = String(lang || 'en').toLowerCase();
    const target = `/static/${lcLang}/`;
    const norm = pathname.replace(/\/+$/, '/') || '/';
    const needRedirect =
      norm === '/' ||
      norm === '/index.html' ||
      norm === '/static' ||
      norm === '/static/';
    if (needRedirect) {
      const to = `${target}${search}${hash}`;
      if (norm + search + hash !== to) {
        window.location.replace(to);
      }
    }
  }, [lang]);

  // мини-словарь
  const TXT = {
    historyTitle: isRu ? 'История генераций' : 'Generation history',
    historySubtitle: isRu
      ? 'Хранится только в этом браузере · максимум 30 записей'
      : 'Stored only in this browser · up to 30 entries',
    empty: isRu ? 'Пока пусто.' : 'Nothing here yet.',
    pdfLink: isRu ? 'Открыть PDF' : 'Open PDF',
    loadInto: isRu ? 'Загрузить в форму' : 'Load into form',
    remove: isRu ? 'Удалить' : 'Delete',
    confirmRemove: isRu ? 'Удалить эту запись из истории?' : 'Delete this history entry?',
    removedToast: isRu ? 'Запись удалена.' : 'Entry deleted.',
    loadedToast: isRu ? 'Поля загружены из истории.' : 'Fields loaded from history.',
    notFoundToast: isRu ? 'Шаблон брифа не найден.' : 'Brief template not found.',
  };

  const briefs = React.useRef(loadBriefs());
  const [briefIds, setBriefIds] = React.useState<string[]>([]);
  const [current, setCurrent] = React.useState<string | null>(null);

  const [schema, setSchema] = React.useState<RuntimeSchema | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [link, setLink] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState<PdfHistoryItem[]>([]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  // init
  React.useEffect(() => {
    const ids = briefs.current.map(b => b.id);
    setBriefIds(ids);
    if (!current && ids.length) setCurrent(ids[0]);
    setHistory(loadHistory());
  }, []);

  // rebuild schema on language / brief change
  React.useEffect(() => {
    if (!current) return;
    const def = briefs.current.find(b => b.id === current);
    if (!def) return;
    setSchema(realizeSchema(def, lang)); // локализация label тут
  }, [current, lang]);

  // load saved values for selected brief into state (для live-редактора)
  React.useEffect(() => {
    if (!current) return;
    setValues(loadValuesForBriefId(current));
  }, [current]);

  function updateField(id: string, v: unknown) {
    if (!current) return;
    setValues(prev => {
      const next = { ...prev, [id]: v };
      localStorage.setItem(skey(current), JSON.stringify(next));
      return next;
    });
  }

  function showToast(text: string) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = text;
      toast.style.display = 'block';
      setTimeout(() => (toast.style.display = 'none'), 1600);
    } else {
      alert(text);
    }
  }

  function clearSavedValuesForBrief(briefId: string) {
    try { localStorage.removeItem(skey(briefId)); } catch {}
    if (current === briefId) setValues({});
  }

  function deleteHistoryItem(id: string) {
    const next = history.filter(h => h.id !== id);
    saveHistory(next);
    setHistory(next);
    showToast(TXT.removedToast);
  }

  /** Загрузить values из записи истории в localStorage брифа и открыть его */
  function loadHistoryIntoForm(item: PdfHistoryItem) {
    // 1) найти определение брифа
    const def = briefs.current.find(b => b.id === item.briefId);
    if (!def) {
      showToast(TXT.notFoundToast);
      return;
    }
    // 2) реализовать схему в языке записи (чтобы лейблы совпали)
    const sc = realizeSchema(def, item.lang as any);
    // 3) карта "нормализованный label → id"
    const labelToId = new Map<string, string>();
    for (const f of sc.fields) {
      labelToId.set(normalizeLabel(f.label) || f.id, f.id);
    }
    // 4) пробежаться по локализованным ключам из истории и собрать объект по id
    const incoming = (item.payload?.data ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    const unmapped: string[] = [];
    for (const [label, val] of Object.entries(incoming)) {
      const id = labelToId.get(normalizeLabel(label));
      if (id) next[id] = val;
      else unmapped.push(label);
    }
    if (unmapped.length) {
      console.warn('[history->form] Unmapped labels:', unmapped);
    }
    // 5) сохранить в localStorage этого брифа
    try {
      localStorage.setItem(skey(item.briefId), JSON.stringify(next));
    } catch {}
    // 6) переключиться на этот бриф и/или обновить значения
    setCurrent(item.briefId);
    if (current === item.briefId) setValues(next);
    showToast(TXT.loadedToast);
  }

  async function onDownload() {
    if (!schema) return;
    if (loading) return;

    const briefIdPre = pickBriefId({ pageUrl, current, schemaId: schema?.id ?? null });
    if (!briefIdPre) {
      showToast(isRu ? 'Не удалось определить briefId.' : 'Failed to resolve briefId.');
      return;
    }

    const lsValues = loadValuesForBriefId(briefIdPre);
    const rawValues = (lsValues && Object.keys(lsValues).length > 0) ? lsValues : values;

    // 🔸 КЛЮЧЕВОЕ: нормализация перед отправкой (TipTap JSON → MD, иначе HTML → MD)
    const normalizedValues = Object.fromEntries(
      Object.entries(rawValues).map(([k, v]) => [k, normalizeValueForBackend(v)])
    );

    const dataLocalized = buildLocalizedDataMap(schema, normalizedValues);

    const payload: SubmissionPayload = {
      briefId: briefIdPre,
      lang,
      timestamp: new Date().toISOString(),
      data: dataLocalized,
    };

    // DEBUG
    console.log('=== BRIEF (локализованные ключи по H2) [SENT TO BACKEND] ===');
    console.log(JSON.stringify(dataLocalized, null, 2));

    setLoading(true);
    setLink(null);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${API_URL}/brief/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(t);

      if (res.status === 422) {
        const err = await res.json().catch(() => ({}));
        showToast(isRu ? 'Ошибка валидации данных брифа (422). Проверьте обязательные поля.' : 'Validation error (422). Check required fields.');
        addToHistory({
          id: uuid(),
          briefId: briefIdPre,
          lang,
          requestedAt: new Date().toISOString(),
          payload,
          response: err,
          link: null,
        });
        setHistory(loadHistory());
        return;
      }

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        showToast((isRu ? 'Ошибка генерации PDF' : 'PDF generation error') + ` (${res.status}).`);
        addToHistory({
          id: uuid(),
          briefId: briefIdPre,
          lang,
          requestedAt: new Date().toISOString(),
          payload,
          response: { status: res.status, body: msg },
          link: null,
        });
        setHistory(loadHistory());
        return;
      }

      const data = await res.json().catch(() => ({} as any));
      const fileUrl: string | undefined = data?.file_url || data?.url || data?.link;

      const briefIdFinal =
        pickBriefId({ pageUrl, fileUrl: fileUrl ?? null, current, schemaId: schema?.id ?? null }) ||
        briefIdPre;

      addToHistory({
        id: uuid(),
        briefId: briefIdFinal,
        lang,
        requestedAt: new Date().toISOString(),
        payload,
        response: data,
        link: fileUrl ?? null,
      });
      setHistory(loadHistory());

      if (fileUrl) {
        setLink(fileUrl);
        showToast(isRu ? 'Ссылка на PDF готова.' : 'PDF link is ready.');
        clearSavedValuesForBrief(briefIdFinal);
      } else {
        showToast(isRu ? 'PDF сгенерирован, но ссылка не получена.' : 'PDF generated, but no link returned.');
      }
    } catch (e: any) {
      showToast(e?.name === 'AbortError'
        ? (isRu ? 'Таймаут генерации PDF.' : 'PDF generation timed out.')
        : (isRu ? 'Сеть/сервер недоступны.' : 'Network/server unavailable.'));
      addToHistory({
        id: uuid(),
        briefId: (pickBriefId({ pageUrl, current, schemaId: schema?.id ?? null }) || 'unknown'),
        lang,
        requestedAt: new Date().toISOString(),
        payload,
        response: { error: String(e?.message || e) },
        link: null,
      });
      setHistory(loadHistory());
    } finally {
      setLoading(false);
    }
  }

  function onCopyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      showToast(isRu ? 'Ссылка скопирована в буфер обмена!' : 'Link copied to clipboard!');
    });
  }

  const briefType: BriefType | undefined =
    current && (['static','prezent','print','video','logo','pack'] as const)
      .includes(current as BriefType)
      ? (current as BriefType)
      : undefined;

  const displayTitle = (values['projectTitle'] as string) || undefined;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(isRu ? 'ru-RU' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const renderValue = (val: unknown) => {
    if (val == null) return <em className="history-empty">{isRu ? '— пусто —' : '— empty —'}</em>;
    if (typeof val === 'string') {
      if (/^https?:\/\//i.test(val)) {
        return (
          <a className="history-link" href={val} target="_blank" rel="noreferrer">
            {val}
          </a>
        );
      }
      return <span>{val}</span>;
    }
    if (Array.isArray(val)) {
      return (
        <ul className="history-list">
          {val.map((v, i) => <li key={i}>{renderValue(v)}</li>)}
        </ul>
      );
    }
    if (typeof val === 'object') {
      return <code className="history-code">{JSON.stringify(val)}</code>;
    }
    return <span>{String(val)}</span>;
  };

  return (
    <>
      <Header />
      <Rules />

      <div className="brief-wrapper">
        <div className="brief-content">
          {schema?.fields.map(f => (
            <div className="brief-section" key={f.id}>
              <h2>{f.label}</h2>
              <FieldRenderer field={f} value={values[f.id]} onChange={(v) => updateField(f.id, v)} />
            </div>
          ))}

          <Toolbar
            onDownload={onDownload}
            onCopyLink={onCopyLink}
            link={link}
            loading={loading}
          />

          {/* Стили истории */}
          <style>{`
            .history { margin-top: 24px; }
            .history h3 { margin: 0 0 6px 0; }
            .history-sub { font-size: 12px; opacity: 0.75; margin-bottom: 12px; }

            .history-grid { display: grid; gap: 12px; }
            details.history-card {
              border-radius: 14px;
              padding: 10px 12px;
              background: linear-gradient(180deg, #fff, #fff) padding-box,
                          linear-gradient(135deg, #ffb156, #ff7a1a) border-box;
              border: 1px solid transparent;
              box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            }
            .history-summary {
              list-style: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
            }
            .history-summary::-webkit-details-marker { display: none; }
            .history-summary .meta {
              display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px;
            }
            .badge {
              display: inline-flex; align-items: center; gap: 6px;
              font-size: 12px; padding: 4px 8px; border-radius: 999px;
              background: #fff3e8; color: #c24a00; border: 1px solid #ffd7b3;
            }
            .history-actions { display: inline-flex; gap: 8px; align-items: center; }
            .btn {
              all: unset; cursor: pointer; padding: 6px 10px; border-radius: 10px;
              font-weight: 600; font-size: 13px; line-height: 1;
              transition: transform .15s ease, box-shadow .2s ease, background .2s ease;
              border: 1px solid rgba(0,0,0,0.08);
              box-shadow: 0 1px 2px rgba(0,0,0,0.06);
              background: #ffffff;
            }
            .btn:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.08); }
            .btn:active { transform: translateY(0); }
            .btn-accent {
              background: linear-gradient(135deg, #ffd29e, #ff9b4a);
              color: #4a2700; border: none;
              box-shadow: 0 3px 10px rgba(255,155,74,0.25);
            }
            .btn-accent:hover { box-shadow: 0 6px 16px rgba(255,155,74,0.35); }
            .btn-danger {
              background: linear-gradient(135deg, #ff7a7a, #ff4d4d);
              color: #fff; border: none;
              box-shadow: 0 3px 10px rgba(255,77,77,0.25);
            }
            .btn-danger:hover { box-shadow: 0 6px 16px rgba(255,77,77,0.35); }
            .history-body { margin-top: 10px; }
            .history-table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .history-table td {
              vertical-align: top; padding: 8px 10px; border-top: 1px dashed #eee;
            }
            .history-table td.key { width: 35%; font-weight: 700; color: #3a2a18; }
            .history-link { color: #cc5400; text-decoration: underline; }
            .history-code { background: #f6f6f6; padding: 2px 6px; border-radius: 6px; }
            .history-list { margin: 0; padding-left: 18px; }
            .history-empty { opacity: .7; }
          `}</style>

          {/* Локализованный блок истории */}
          <div className="history">
            <h3>{TXT.historyTitle}</h3>
            <div className="history-sub">{TXT.historySubtitle}</div>

            {history.length === 0 ? (
              <div>{TXT.empty}</div>
            ) : (
              <div className="history-grid">
                {history.map(item => {
                  const left = `${fmtDate(item.requestedAt)} — ${item.briefId} (${item.lang})`;
                  return (
                    <details key={item.id} className="history-card">
                      <summary className="history-summary">
                        <div className="meta">
                          <span>{left}</span>
                          {item.link ? <span className="badge">PDF</span> : null}
                        </div>
                        <div className="history-actions">
                          <button
                            className="btn btn-accent"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              loadHistoryIntoForm(item);
                            }}
                          >
                            {TXT.loadInto}
                          </button>
                          {item.link ? (
                            <a
                              className="btn"
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isRu ? 'Открыть' : 'Open'}
                            </a>
                          ) : null}
                          <button
                            className="btn btn-danger"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm(TXT.confirmRemove)) deleteHistoryItem(item.id);
                            }}
                            title={TXT.remove}
                          >
                            {TXT.remove}
                          </button>
                        </div>
                      </summary>

                      <div className="history-body">
                        <table className="history-table">
                          <tbody>
                            {Object.entries(item.payload?.data ?? {}).map(([k, v]) => (
                              <tr key={k}>
                                <td className="key">{k}</td>
                                <td>{renderValue(v)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toast */}
          <div
            id="toast"
            style={{
              display: 'none',
              position: 'fixed',
              right: 16,
              bottom: 16,
              background: 'rgba(0,0,0,0.9)',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 10,
              zIndex: 1000,
            }}
          />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default App;
