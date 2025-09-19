// src/briefs/validate.ts
import type { AnyBrief } from "./schemas";

export type ValidationErrorMap = Record<string, string>;

type KnownType = "static" | "video" | "print" | "logo" | "presentation" | "prezent" | "pack";

function parsePath(pathname: string) {
  const parts = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const type = (parts[0] || "").toLowerCase();
  const lang = (parts[1] || "").toLowerCase();
  return { type, lang };
}
function mapPathTypeToBriefType(t: string | null | undefined): KnownType | null {
  if (!t) return null;
  const s = String(t).toLowerCase();
  if (s === "prezent") return "presentation";
  if (["static", "video", "print", "logo", "presentation", "pack"].includes(s)) return s as KnownType;
  return null;
}
function resolveTypeFromHref(href?: string | null): KnownType | null {
  try {
    if (!href && typeof window !== "undefined") href = window.location?.href;
    if (!href) return null;
    const u = new URL(href);
    const { type } = parsePath(u.pathname);
    return mapPathTypeToBriefType(type);
  } catch { return null; }
}

const DEBUG_VALIDATE: boolean =
  (typeof window !== "undefined" && Boolean((window as any).__DEBUG_VALIDATE__)) || false;
function dbg(...args: any[]) {
  if (!DEBUG_VALIDATE) return;
  // eslint-disable-next-line no-console
  console.log("%c[validateBrief]", "color:#ff6c00", ...args);
}

export function validateBrief(
  data: AnyBrief,
  opts?: { href?: string }
): ValidationErrorMap {
  const errors: ValidationErrorMap = {};

  const typeFromUrl = resolveTypeFromHref(opts?.href);
  const effectiveType = (typeFromUrl ?? (data as any).type) as KnownType | undefined;

  dbg("typeFromUrl =", typeFromUrl, "data.type =", (data as any).type, "→ effective =", effectiveType);

  if (!data.projectTitle?.trim()) {
    errors["projectTitle"] = "Укажите название проекта";
    dbg("❌ projectTitle");
  } else dbg("✅ projectTitle");

  if (effectiveType !== "presentation" && effectiveType !== "prezent") {
    if (!(data as any)?.contacts?.name?.trim()) {
      errors["contacts.name"] = "Контакт: имя обязательно";
      dbg("❌ contacts.name");
    } else dbg("✅ contacts.name");
    if (!(data as any)?.contacts?.email?.trim()) {
      errors["contacts.email"] = "Контакт: email обязателен";
      dbg("❌ contacts.email");
    } else dbg("✅ contacts.email");
  } else {
    dbg("ℹ️ presentation: contacts.* не требуются");
  }

  switch (effectiveType) {
    case "static":
      if (!((data as any).sizes?.length > 0)) {
        errors["sizes"] = "Добавьте хотя бы один формат"; dbg("❌ sizes");
      } else dbg("✅ sizes");
      break;

    case "video":
      if (!((data as any).durationSec > 0)) {
        errors["durationSec"] = "Длительность > 0"; dbg("❌ durationSec");
      } else dbg("✅ durationSec");
      break;

    case "print":
      if (!(((data as any).spec?.pages ?? 0) >= 1)) {
        errors["spec.pages"] = "Страниц >= 1"; dbg("❌ spec.pages");
      } else dbg("✅ spec.pages");
      break;

    case "logo":
      if (!((data as any).brandCore?.companyName?.trim())) {
        errors["brandCore.companyName"] = "Название компании обязательно"; dbg("❌ brandCore.companyName");
      } else dbg("✅ brandCore.companyName");
      break;

    case "presentation":
    case "prezent":
      if (!((data as any).slidesText?.trim())) {
        errors["slidesText"] = "Добавьте текст или ссылки для слайдов"; dbg("❌ slidesText");
      } else dbg("✅ slidesText");
      if (!((data as any).goal?.trim())) {
        errors["goal"] = "Опишите цель/задачу презентации"; dbg("❌ goal");
      } else dbg("✅ goal");
      if (!((data as any).size?.trim())) {
        errors["size"] = "Укажите размер/ориентацию презентации"; dbg("❌ size");
      } else dbg("✅ size");
      if (!((data as any).deadline?.trim())) {
        errors["deadline"] = "Укажите желаемый срок выполнения"; dbg("❌ deadline");
      } else dbg("✅ deadline");
      break;

    case "pack":
      dbg("ℹ️ type=pack: специальных правил нет");
      break;

    default:
      dbg("⚠️ Неизвестный тип брифа:", effectiveType);
      break;
  }

  dbg("errors =", errors);
  return errors;
}
