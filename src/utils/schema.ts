import type { BriefSchema } from '../types';

// Подхватываем все схемы из src/schemas/*.json
export async function loadSchemas(): Promise<BriefSchema[]> {
  const modules = import.meta.glob('../schemas/*.json', { eager: true });
  const out: BriefSchema[] = [];
  for (const k in modules) {
    const mod = modules[k] as any;
    const val = mod.default ?? mod;
    if (val?.id && Array.isArray(val.fields)) out.push(val);
  }
  return out.sort((a, b) => (a.title ?? a.id).localeCompare(b.title ?? b.id));
}
