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
import { isTiptapJson, tiptapToMarkdown } from './utils/tiptapToMarkdown';
import TurndownService from 'turndown';
import { validateBrief, type ValidationErrorMap } from './briefs/validate';
import { ServicePicker, type LangCode } from './components/ServicePicker';

type BriefType = 'static' | 'prezent' | 'print' | 'video' | 'logo' | 'pack';
const skey = (briefId: string) => `${STORAGE_PREFIX}:brief:${briefId}`;
const HISTORY_KEY = `${STORAGE_PREFIX}:brief:history`;

type PdfHistoryItem = {
  id: string;
  briefId: string;
  lang: string;
  requestedAt: string;
  payload: SubmissionPayload;
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
    if (mS3?.groups?.id) return mS3?.groups?.id ?? null;
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
const ALLOWED_TYPES = ["static", "video", "print", "logo", "pack", "presentation", "prezent", "upacovca"] as const;
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
  const lcLang = String(lang || 'ru').toLowerCase();
  const isRu = lcLang.startsWith('ru');

  const briefs = React.useRef(loadBriefs());
  const [briefIds, setBriefIds] = React.useState<string[]>([]);
  const [current, setCurrent] = React.useState<string | null>(null);

  const [schema, setSchema] = React.useState<RuntimeSchema | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [link, setLink] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState<PdfHistoryItem[]>([]);

  // --- ServicePicker visibility: show if URL has no type ---
  const shouldShowPickerInitial = (() => {
    if (typeof window === "undefined") return false;
    const { type } = parsePath(window.location.pathname);
    return !type;
  })();
  const [showServicePicker, setShowServicePicker] = React.useState<boolean>(shouldShowPickerInitial);

  // --- Scroll hint button state/logic ---
  const [scrollHint, setScrollHint] = React.useState<"down" | "up" | null>(null);
  React.useEffect(() => {
    let frame = 0;
    const THRESH = 200;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollY = window.scrollY || doc.scrollTop || 0;
        const innerH = window.innerHeight || 0;
        const docH = Math.max(doc.scrollHeight, doc.offsetHeight, doc.clientHeight);
        const atTop = scrollY <= THRESH;
        const atBottom = scrollY + innerH >= docH - THRESH;
        if (atTop) setScrollHint("down");
        else if (atBottom) setScrollHint("up");
        else setScrollHint(null);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function handleScrollHintClick() {
    const doc = document.documentElement;
    const docH = Math.max(doc.scrollHeight, doc.offsetHeight, doc.clientHeight);
    const innerH = window.innerHeight || 0;
    if (scrollHint === "down") window.scrollTo({ top: docH - innerH, behavior: "smooth" });
    else if (scrollHint === "up") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  // init
  React.useEffect(() => {
    const ids = briefs.current.map(b => b.id);
    setBriefIds(ids);
    if (!current && ids.length) setCurrent(ids[0]);
    setHistory(loadHistory());
  }, []);

  // 1) URL → current
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname, search, hash } = window.location;
    const knownTypes = briefs.current.map(b => b.id);
    const lc = String(lang || "ru").toLowerCase();
    const { type: pathTypeRaw, lang: pathLang } = parsePath(pathname);
    const pathTypeNorm = normalizePathType(pathTypeRaw);
    const effectiveType = resolveEffectiveType(pathTypeNorm, knownTypes);
    if (effectiveType) {
      const urlLang = (pathLang || lc).toLowerCase();
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
    // если тип не определён — показываем онбординг
    if (!pathTypeRaw) {
      setShowServicePicker(true);
      return;
    }
    const defaultType = knownTypes[0] || "static";
    const to = buildUrl(defaultType, lc, search, hash);
    window.history.replaceState({}, "", to);
    setCurrent(defaultType);
  }, [lang]);

  // 2) current → URL
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!current) return;
    const knownTypes = briefs.current.map(b => b.id);
    const { pathname, search, hash } = window.location;
    const { type: pathTypeRaw, lang: pathLang } = parsePath(pathname);
    const urlLang = (pathLang || String(lang || "ru")).toLowerCase();
    const typeToWrite = knownTypes.includes(current) ? current : (pathTypeRaw || current);
    const desired = buildUrl(typeToWrite, urlLang, search, hash);
    const now = `${pathname}${search}${hash}`;
    if (now !== desired) window.history.replaceState({}, "", desired);
  }, [current, lang]);

  // 3) Back/Forward → current (и показать ServicePicker, если типа нет)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const knownTypes = briefs.current.map(b => b.id);
    const onPop = () => {
      const { pathname } = window.location;
      const { type: pathTypeRaw } = parsePath(pathname);
      if (!pathTypeRaw) {
        setShowServicePicker(true);
        return;
      }
      const pathTypeNorm = normalizePathType(pathTypeRaw);
      const effectiveType = resolveEffectiveType(pathTypeNorm, knownTypes);
      if (effectiveType) setCurrent(prev => (prev === effectiveType ? prev : effectiveType));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // rebuild schema on language / brief change
  React.useEffect(() => {
    if (!current) return;
    const knownIds = briefs.current.map(b => b.id);
    const resolvedId = resolveBriefIdForSchema(current, knownIds);
    if (!resolvedId) return;
    const def = briefs.current.find(b => b.id === resolvedId);
    if (!def) return;
    if (current !== resolvedId) setCurrent(resolvedId);
    setSchema(realizeSchema(def, lang));
  }, [current, lang]);

  // load saved values
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
      (toast as HTMLDivElement).textContent = text;
      (toast as HTMLDivElement).style.display = 'block';
      setTimeout(() => ((toast as HTMLDivElement).style.display = 'none'), 1800);
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
      (el as HTMLElement).animate?.([{ outline: '2px solid #ff6c00' }, { outline: 'none' }], { duration: 1600 });
    }
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

  // вложенные локализации для ServicePicker
  const briefTitles: Record<string, string | Partial<Record<LangCode, string>>> = {
    static: {
      en: "Ad Creatives",
      ru: "Статика",
      ua: "Статика",
    },
    prezent: {
      en: "Presentation Design",
      ru: "Презентации",
      ua: "Презентації",
    },
    print: {
      en: "Design for Print",
      ru: "Полиграфия",
      ua: "Поліграфія",
    },
    video: {
      en: "Motion&Video Design",
      ru: "Видео",
      ua: "Відео",
    },
    logo: {
      en: "Logo Design",
      ru: "Логотип",
      ua: "Логотип",
    },
    pack: {
      en: "Inst Visual",
      ru: "Упаковка аккаунта",
      ua: "Упаковка акаунта",
    },
    // алиас для upacovca
    upacovca: {
      en: "Inst Visual",
      ru: "Упаковка аккаунта",
      ua: "Упаковка акаунта",
    },
  };



  const visibleBriefIds = briefIds.length ? briefIds : ['static','presentation','print','video','logo','pack'];

  // безопасное переключение языка: меняем второй сегмент URL и пушим событие
  const changeLang = (code: LangCode) => {
    if (typeof window === 'undefined') return;
    const { pathname, search, hash } = window.location;
    const { type: curType } = parsePath(pathname);
    const type = curType || (current || 'static');
    const to = buildUrl(type, code, search, hash);
    window.history.replaceState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
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
/* ====== Layout ====== */
.brief-wrapper{padding:24px}
.brief-content{max-width:980px;margin:0 auto}

/* ====== Scroll-hint floating button ====== */
.scroll-hint {
  position: fixed;
  right: 22px;
  bottom: 22px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: linear-gradient(135deg,#ff8c00,#ff6c00);
  background: #fff;
  color:rgba(151, 151, 151, 1);
  border: 1px solid transparent;
  transition: transform .18s ease, box-shadow .22s ease, opacity .2s ease;
  z-index: 1001;
}
.scroll-hint:hover { transform: translateY(-1px);}
.scroll-hint:active { transform: translateY(0); }
.scroll-hint.down svg { transform: rotate(0deg); }
.scroll-hint.up svg { transform: rotate(180deg); }
          `}</style>

          {/* History блоки опущены для краткости — оставь свои, если нужны */}
        </div>
      </div>

      {/* Floating scroll-hint button */}
      {scrollHint && (
        <button
          className={`scroll-hint ${scrollHint}`}
          onClick={handleScrollHintClick}
          aria-label={
            scrollHint === "down"
              ? (isRu ? "Прокрутить вниз" : "Scroll down")
              : (isRu ? "Прокрутить вверх" : "Scroll up")
          }
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              {/* 135deg ~ из левого-верхнего в правый-нижний угол */}
              <linearGradient id="scrollGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff8c00" />
                <stop offset="100%" stopColor="#ff6c00" />
              </linearGradient>
            </defs>
            {/* штрих теперь градиентный */}
            <path
              d="M12 5v14M5 12l7 7 7-7"
              stroke="url(#scrollGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Service Picker (модалка) — показываем, если в URL нет типа */}
      <ServicePicker
        open={showServicePicker}
        briefIds={visibleBriefIds}
        titles={briefTitles}
        currentLang={(lcLang as LangCode) || 'ru'}
        onChangeLang={changeLang}
        onSelect={(id) => {
          setCurrent(id);
          setShowServicePicker(false);
          if (typeof window !== 'undefined') {
            const { search, hash } = window.location;
            const urlLang = String(lcLang || 'ru').toLowerCase();
            window.history.replaceState({}, "", buildUrl(id, urlLang, search, hash));
          }
        }}
        onClose={() => setShowServicePicker(false)}
      />

      <Footer />
    </>
  );
};

export default App;
