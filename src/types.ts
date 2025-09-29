// src/types.ts

export type Lang = 'ru' | 'en' | 'ua';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'url'
  | 'image';

export interface FieldOption {
  value: string;
  /** Ключ подписи опции в i18n брифа (labels[lang][labelKey]) */
  labelKey: string;
}

export interface FieldShape {
  id: string;
  type: FieldType;
  /** Ключ заголовка поля в i18n брифа (labels[lang][labelKey]) */
  labelKey: string;
  /** Ключ плейсхолдера/подсказки в i18n брифа (placeholders[lang][placeholderKey]) */
  placeholderKey?: string;
  required?: boolean;
  options?: FieldOption[];

  /**
   * (необязательно) Ключ строки в placeholders, где лежит URL картинки-подсказки
   * Пример: helpImageKey: "sizes_help_img" -> placeholders[lang]["sizes_help_img"] = "/assets/logo-format.png"
   */
  helpImageKey?: string;
}

export interface BriefI18n {
  /** Заголовок брифа по языкам */
  title: Record<Lang, string>;
  /** Подписи к полям по языкам: labels[lang][labelKey] -> string */
  labels: Record<Lang, Record<string, string>>;
  /**
   * Плейсхолдеры и прочие строковые подсказки по языкам:
   * placeholders[lang][placeholderKey] -> string
   * Сюда же можно класть URL для helpImageKey.
   */
  placeholders?: Record<Lang, Record<string, string>>;
}

export interface BriefDefinition {
  /** Идентификатор брифа, например "static" */
  id: string;
  /** Переводы и строки для брифа */
  i18n: BriefI18n;
  /** Структура полей брифа */
  fields: FieldShape[];
}

/** Рантайм-представление опции (уже с локализованной подписью) */
export interface RuntimeFieldOption {
  value: string;
  label: string;
}

/** Рантайм-представление поля (локализованные подписи и плейсхолдеры) */
export interface RuntimeField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: RuntimeFieldOption[];
  /** Готовый URL (или data:) картинки-подсказки, если задан helpImageKey */
  helpImage?: string;
}

/** Рантайм-схема брифа */
export interface RuntimeSchema {
  id: string;
  title: string;
  fields: RuntimeField[];
}

/** Пэйлоад, отправляемый на бэкенд для генерации PDF */
export interface SubmissionPayload {
  briefId: string;
  lang: Lang;
  timestamp: string;
  data: Record<string, unknown>;
}
