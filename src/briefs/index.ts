import type { BriefDefinition, Lang, RuntimeSchema, RuntimeField } from '../types';

// Загружаем все файлы из src/briefs/*.ts (кроме index.ts)
const mods = import.meta.glob('./*.ts', { eager: true });

export function loadBriefs(): BriefDefinition[] {
  const out: BriefDefinition[] = [];
  for (const p in mods) {
    if (p.endsWith('/index.ts')) continue;
    const m = mods[p] as any;
    const def = m.default ?? m;
    if (def?.id && Array.isArray(def.fields) && def.i18n) out.push(def);
  }
  // стабильный порядок
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export function realizeSchema(brief: BriefDefinition, lang: Lang): RuntimeSchema {
  const L = brief.i18n.labels[lang] || {};
  const P = brief.i18n.placeholders?.[lang] || {};
  const title = brief.i18n.title[lang] || brief.id;

  const fields: RuntimeField[] = brief.fields.map(f => ({
    id: f.id,
    type: f.type,
    required: f.required,
    label: L[f.labelKey] ?? f.labelKey,
    placeholder: f.placeholderKey ? (P[f.placeholderKey] ?? f.placeholderKey) : undefined,
    options: f.options?.map(o => ({ value: o.value, label: L[o.labelKey] ?? o.labelKey })),
    // ⬇️ ПРОКИДЫВАЕМ URL КАРТИНКИ
    helpImage: f.helpImageKey ? (P[f.helpImageKey] ?? f.helpImageKey) : undefined,
  }));

  return { id: brief.id, title, fields };
}