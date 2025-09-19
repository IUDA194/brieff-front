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

// валидация (берёт тип из URL, поддерживает алиасы)
import { validateBrief, type ValidationErrorMap } from './briefs/validate';

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
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  hr: '---',
});
td.addRule('preserveLineBreaks', { filter: ['br'], replacement: () => '  \n' });
td.addRule('stripEmptyParas', {
  filter: (node) => node.nodeName === 'P' && node.textContent?.trim() === '',
  replacement: () => '',
});
function looksLikeHtml(s: string): boolean {
  return /<\/?(p|h\d|ul|ol|li|strong|em|b|i|blockquote|code|pre|br)\b/i.test(s);
}
function normalizeValueForBackend(v: unknown): unknown {
  try {
    if (isTiptapJson(v)) return tiptapToMarkdown(v);
    if (typeof v === 'string' && looksLikeHtml(v)) return td.turndown(v);
  } catch {/* ignore */}
  return v;
}

/** ===================== URL <-> STATE ===================== */
function parsePath(pathname: string) {
  const parts = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const type = (parts[0] || "").toLowerCase();
  const lang = (parts[1] || "").toLowerCase();
  return { type, lang };
}
const ALLOWED_TYPES = ["static", "video", "print", "logo", "pack", "presentation", "prezent"] as const;
type AllowedType = typeof ALLOWED_TYPES[number];
const TYPE_ALIASES: Record<string, AllowedType> = {
  prezent: "presentation",
  pres: "presentation",
  deck: "presentation",
};
function normalizePathType(t: string | null | undefined): string | null {
  if (!t) return null;
  const s = String(t).toLowerCase();
  return TYPE_ALIASES[s] ?? s;
}
function buildUrl(type: string, lang: string, search = "", hash = "") {
  const normSearch = search || "";
  const normHash = hash || "";
  return `/${type}/${lang}/${normSearch}${normHash}`;
}
function resolveEffectiveType(urlTypeNorm: string | null, knownTypes: string[]): string | null {
  if (!urlTypeNorm) return null;
  if (knownTypes.includes(urlTypeNorm)) return urlTypeNorm;
  if (ALLOWED_TYPES.includes(urlTypeNorm as AllowedType)) return urlTypeNorm;
  return null;
}
function isKnownType(type: string | null | undefined, known: string[]): type is string {
  return !!type && known.includes(type);
}
function pickLangFromUrl(urlLang: string | null | undefined, fallback: string) {
  const s = String(urlLang || "").toLowerCase();
  return s || fallback;
}

/** -------- Алиасы id для поиска схемы -------- */
const BRIEF_ID_ALIASES: Record<string, string> = {
  prezent: "presentation",
  presentation: "prezent",
};
/** Возвращает id, который реально есть в loadBriefs(), с учётом алиасов */
function resolveBriefIdForSchema(currentId: string | null, knownIds: string[]): string | null {
  if (!currentId) return null;
  const id = currentId.toLowerCase();
  if (knownIds.includes(id)) return id;
  const alt = BRIEF_ID_ALIASES[id];
  if (alt && knownIds.includes(alt)) return alt;
  return null;
}

// ---------- component ----------
const App: React.FC = () => {
  const { lang } = useI18n();
  const isRu = String(lang).toLowerCase().startsWith('ru');

  const briefs = React.useRef(loadBriefs());
  // сразу после const briefs = React.useRef(loadBriefs());
  console.log('[briefs ids]', briefs.current.map(b => b.id));

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

  // 1) URL → current (бережно)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname, search, hash } = window.location;

    const knownTypes = briefs.current.map(b => b.id);
    const lcLang = String(lang || "en").toLowerCase();

    const { type: pathTypeRaw, lang: pathLang } = parsePath(pathname);
    const pathTypeNorm = normalizePathType(pathTypeRaw);
    const effectiveType = resolveEffectiveType(pathTypeNorm, knownTypes);

    if (effectiveType) {
      const urlLang = (pathLang || lcLang).toLowerCase();
      const shouldFixLang = !pathLang || pathLang.toLowerCase() !== urlLang;
      const shouldFixType = knownTypes.includes(effectiveType) && pathTypeRaw?.toLowerCase() !== effectiveType;

      if (shouldFixLang || shouldFixType) {
        const to = buildUrl(
          shouldFixType ? effectiveType : (pathTypeRaw || effectiveType),
          urlLang,
          search,
          hash
        );
        window.history.replaceState({}, "", to);
      }
      setCurrent(prev => (prev === effectiveType ? prev : effectiveType));
      return;
    }

    const defaultType = knownTypes[0] || "static";
    const to = buildUrl(defaultType, lcLang, search, hash);
    window.history.replaceState({}, "", to);
    setCurrent(defaultType);
  }, [lang]);

  // 2) current → URL (аккуратно)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!current) return;

    const knownTypes = briefs.current.map(b => b.id);
    const { pathname, search, hash } = window.location;
    const { type: pathTypeRaw, lang: pathLang } = parsePath(pathname);
    const urlLang = (pathLang || String(lang || "en")).toLowerCase();

    const typeToWrite = knownTypes.includes(current) ? current : (pathTypeRaw || current);

    const desired = buildUrl(typeToWrite, urlLang, search, hash);
    const now = `${pathname}${search}${hash}`;

    if (now !== desired) {
      window.history.replaceState({}, "", desired);
    }
  }, [current, lang]);

  // 3) Back/Forward → current
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const knownTypes = briefs.current.map(b => b.id);

    const onPop = () => {
      const { pathname } = window.location;
      const { type: pathTypeRaw } = parsePath(pathname);
      const pathTypeNorm = normalizePathType(pathTypeRaw);
      const effectiveType = resolveEffectiveType(pathTypeNorm, knownTypes);
      if (effectiveType) setCurrent(prev => (prev === effectiveType ? prev : effectiveType));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // rebuild schema on language / brief change (с алиасами id)
  React.useEffect(() => {
    if (!current) return;
    const knownIds = briefs.current.map(b => b.id);
    const resolvedId = resolveBriefIdForSchema(current, knownIds);
    if (!resolvedId) return;

    const def = briefs.current.find(b => b.id === resolvedId);
    if (!def) return;

    if (current !== resolvedId) setCurrent(resolvedId); // выравниваем состояние
    setSchema(realizeSchema(def, lang));
  }, [current, lang]);

  // load saved values for selected brief (по реальному id)
  React.useEffect(() => {
    if (!current) return;
    const knownIds = briefs.current.map(b => b.id);
    const resolvedId = resolveBriefIdForSchema(current, knownIds);
    if (!resolvedId) return;
    setValues(loadValuesForBriefId(resolvedId));
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
      setTimeout(() => (toast.style.display = 'none'), 1800);
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
    showToast(isRu ? 'Запись удалена.' : 'Entry deleted.');
  }

  /** Загрузить values из истории в форму */
  function loadHistoryIntoForm(item: PdfHistoryItem) {
    const def = briefs.current.find(b => b.id === item.briefId);
    if (!def) {
      showToast(isRu ? 'Шаблон брифа не найден.' : 'Brief template not found.');
      return;
    }
    const sc = realizeSchema(def, item.lang as any);
    const labelToId = new Map<string, string>();
    for (const f of sc.fields) labelToId.set(normalizeLabel(f.label) || f.id, f.id);

    const incoming = (item.payload?.data ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    const unmapped: string[] = [];
    for (const [label, val] of Object.entries(incoming)) {
      const id = labelToId.get(normalizeLabel(label));
      if (id) next[id] = val; else unmapped.push(label);
    }
    if (unmapped.length) console.warn('[history->form] Unmapped labels:', unmapped);
    try { localStorage.setItem(skey(item.briefId), JSON.stringify(next)); } catch {}
    setCurrent(item.briefId);
    if (current === item.briefId) setValues(next);
    showToast(isRu ? 'Поля загружены из истории.' : 'Fields loaded from history.');
  }

  function buildValidationData(): Record<string, unknown> {
    const v = { ...(values || {}) } as Record<string, unknown>;
    if (current) v.type = current;
    if (!('projectTitle' in v) && typeof (values as any)?.projectTitle === 'string') {
      v.projectTitle = (values as any).projectTitle;
    }
    return v;
  }
  function stringifyErrors(errs: ValidationErrorMap): string {
    const entries = Object.entries(errs);
    if (!entries.length) return '';
    const max = 6;
    const lines = entries.slice(0, max).map(([k, msg]) => `• ${k}: ${msg}`);
    if (entries.length > max) lines.push(`… +${entries.length - max}`);
    return lines.join('\n');
  }
  function scrollToErrorField(errKey: string) {
    const idCandidate = errKey.includes('.') ? errKey.split('.')[0] : errKey;
    const el = document.getElementById(`field-${idCandidate}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.animate?.([{ outline: '2px solid #ff6c00' }, { outline: 'none' }], { duration: 1600 });
    }
  }

  async function onDownload() {
    if (!schema) return;
    if (loading) return;

    // клиентская валидация
    const vErrors = validateBrief(buildValidationData() as any, { href: pageUrl });
    if (Object.keys(vErrors).length > 0) {
      const firstKey = Object.keys(vErrors)[0];
      scrollToErrorField(firstKey);
      showToast(isRu ? 'Исправьте ошибки в форме:\n' + stringifyErrors(vErrors)
                     : 'Please fix form errors:\n' + stringifyErrors(vErrors));
      return;
    }

    const briefIdPre = pickBriefId({ pageUrl, current, schemaId: schema?.id ?? null });
    if (!briefIdPre) {
      showToast(isRu ? 'Не удалось определить briefId.' : 'Failed to resolve briefId.');
      return;
    }

    const lsValues = loadValuesForBriefId(briefIdPre);
    const rawValues = (lsValues && Object.keys(lsValues).length > 0) ? lsValues : values;

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

    console.log('=== BRIEF (локализованные ключи по H2) [SENT TO BACKEND] ===');
    console.log(JSON.stringify(dataLocalized, null, 2));

    setLoading(true);
    setLink(null);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${API_URL}/brief/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(t);

      if (res.status === 422) {
        const err = await res.json().catch(() => ({}));
        showToast(isRu ? 'Ошибка валидации данных брифа (422). Проверьте обязательные поля.'
                       : 'Validation error (422). Check required fields.');
        addToHistory({ id: uuid(), briefId: briefIdPre, lang, requestedAt: new Date().toISOString(), payload, response: err, link: null });
        setHistory(loadHistory());
        return;
      }

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        showToast((isRu ? 'Ошибка генерации PDF' : 'PDF generation error') + ` (${res.status}).`);
        addToHistory({ id: uuid(), briefId: briefIdPre, lang, requestedAt: new Date().toISOString(), payload, response: { status: res.status, body: msg }, link: null });
        setHistory(loadHistory());
        return;
      }

      const data = await res.json().catch(() => ({} as any));
      const fileUrl: string | undefined = data?.file_url || data?.url || data?.link;

      const briefIdFinal =
        pickBriefId({ pageUrl, fileUrl: fileUrl ?? null, current, schemaId: schema?.id ?? null }) || briefIdPre;

      addToHistory({ id: uuid(), briefId: briefIdFinal, lang, requestedAt: new Date().toISOString(), payload, response: data, link: fileUrl ?? null });
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
    new Date(iso).toLocaleString(isRu ? 'ru-RU' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const renderValue = (val: unknown) => {
    if (val == null) return <em className="history-empty">{isRu ? '— пусто —' : '— empty —'}</em>;
    if (typeof val === 'string') {
      if (/^https?:\/\//i.test(val)) {
        return <a className="history-link" href={val} target="_blank" rel="noreferrer">{val}</a>;
      }
      return <span>{val}</span>;
    }
    if (Array.isArray(val)) return <ul className="history-list">{val.map((v, i) => <li key={i}>{renderValue(v)}</li>)}</ul>;
    if (typeof val === 'object') return <code className="history-code">{JSON.stringify(val)}</code>;
    return <span>{String(val)}</span>;
  };

  return (
    <>
      <Header />
      <Rules />

      <div className="brief-wrapper">
        <div className="brief-content">
          {schema?.fields.map(f => (
            <div className="brief-section" key={f.id} id={`field-${f.id}`}>
              <h2>{f.label}</h2>
              <FieldRenderer field={f} value={values[f.id]} onChange={(v) => updateField(f.id, v)} />
            </div>
          ))}

          <Toolbar onDownload={onDownload} onCopyLink={onCopyLink} link={link} loading={loading} />

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
            .history-summary { list-style: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
            .history-summary::-webkit-details-marker { display: none; }
            .history-summary .meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
            .badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 8px; border-radius: 999px; background: #fff3e8; color: #c24a00; border: 1px solid #ffd7b3; }
            .history-actions { display: inline-flex; gap: 8px; align-items: center; }
            .btn { all: unset; cursor: pointer; padding: 6px 10px; border-radius: 10px; font-weight: 600; font-size: 13px; line-height: 1; transition: transform .15s ease, box-shadow .2s ease, background .2s ease; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 2px rgba(0,0,0,0.06); background: #ffffff; }
            .btn:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.08); }
            .btn:active { transform: translateY(0); }
            .btn-accent { background: linear-gradient(135deg, #ffd29e, #ff9b4a); color: #4a2700; border: none; box-shadow: 0 3px 10px rgba(255,155,74,0.25); }
            .btn-accent:hover { box-shadow: 0 6px 16px rgba(255,155,74,0.35); }
            .btn-danger { background: linear-gradient(135deg, #ff7a7a, #ff4d4d); color: #fff; border: none; box-shadow: 0 3px 10px rgba(255,77,77,0.25); }
            .btn-danger:hover { box-shadow: 0 6px 16px rgba(255,77,77,0.35); }
            .history-body { margin-top: 10px; }
            .history-table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .history-table td { vertical-align: top; padding: 8px 10px; border-top: 1px dashed #eee; }
            .history-table td.key { width: 35%; font-weight: 700; color: #3a2a18; }
            .history-link { color: #cc5400; text-decoration: underline; }
            .history-code { background: #f6f6f6; padding: 2px 6px; border-radius: 6px; }
            .history-list { margin: 0; padding-left: 18px; }
            .history-empty { opacity: .7; }
          `}</style>

          <div className="history">
            <h3>{isRu ? 'История генераций' : 'Generation history'}</h3>
            <div className="history-sub">
              {isRu ? 'Хранится только в этом браузере · максимум 30 записей'
                   : 'Stored only in this browser · up to 30 entries'}
            </div>

            {history.length === 0 ? (
              <div>{isRu ? 'Пока пусто.' : 'Nothing here yet.'}</div>
            ) : (
              <div className="history-grid">
                {history.map(item => {
                  const fmt = (iso: string) => new Date(iso).toLocaleString(isRu ? 'ru-RU' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
                  const left = `${fmt(item.requestedAt)} — ${item.briefId} (${item.lang})`;
                  return (
                    <details key={item.id} className="history-card">
                      <summary className="history-summary">
                        <div className="meta">
                          <span>{left}</span>
                          {item.link ? <span className="badge">PDF</span> : null}
                        </div>
                        <div className="history-actions">
                          <button className="btn btn-accent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadHistoryIntoForm(item); }}>
                            {isRu ? 'Загрузить в форму' : 'Load into form'}
                          </button>
                          {item.link ? (
                            <a className="btn" href={item.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              {isRu ? 'Открыть' : 'Open'}
                            </a>
                          ) : null}
                          <button
                            className="btn btn-danger"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm(isRu ? 'Удалить эту запись из истории?' : 'Delete this history entry?')) {
                                deleteHistoryItem(item.id);
                              }
                            }}
                            title={isRu ? 'Удалить' : 'Delete'}
                          >
                            {isRu ? 'Удалить' : 'Delete'}
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

          <div
            id="toast"
            style={{
              display: 'none',
              position: 'fixed',
              right: 16,
              bottom: 16,
              background: 'rgba(0,0,0,0.92)',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 10,
              zIndex: 1000,
              maxWidth: 420,
              whiteSpace: 'pre-line'
            }}
          />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default App;
