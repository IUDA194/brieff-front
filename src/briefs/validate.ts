// src/briefs/validate.ts
import type { AnyBrief } from "./schemas";

export type ValidationErrorMap = Record<string, string>;

export function validateBrief(data: AnyBrief): ValidationErrorMap {
  const errors: ValidationErrorMap = {};

  // Общие
  if (!data.projectTitle?.trim()) errors["projectTitle"] = "Укажите название проекта";
  if (!data.contacts?.name?.trim()) errors["contacts.name"] = "Контакт: имя обязательно";
  if (!data.contacts?.email?.trim()) errors["contacts.email"] = "Контакт: email обязателен";

  switch (data.type) {
    case "static":
      if (!data.sizes?.length) errors["sizes"] = "Добавьте хотя бы один формат";
      break;
    case "video":
      if (!(data.durationSec > 0)) errors["durationSec"] = "Длительность > 0";
      break;
    case "print":
      if (!(data.spec?.pages >= 1)) errors["spec.pages"] = "Страниц >= 1";
      break;
    case "logo":
      if (!data.brandCore?.companyName?.trim()) errors["brandCore.companyName"] = "Название компании обязательно";
      break;
  }

  return errors;
}
