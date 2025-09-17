export type Lang = 'ru' | 'en' | 'ua';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'url' | 'image';

export interface FieldOption {
  value: string;
  labelKey: string;      // ключ в i18n брифа
}

export interface FieldShape {
  id: string;
  type: FieldType;
  labelKey: string;      // ключ в i18n брифа
  placeholderKey?: string;
  required?: boolean;
  options?: FieldOption[];
}

export interface BriefI18n {
  title: Record<Lang, string>;
  labels: Record<Lang, Record<string, string>>;       // labels[labelKey]
  placeholders?: Record<Lang, Record<string, string>>;// placeholders[placeholderKey]
}

export interface BriefDefinition {
  id: string;                  // например "static"
  i18n: BriefI18n;             // переводы по языкам
  fields: FieldShape[];        // структура
}

export interface RuntimeField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface RuntimeSchema {
  id: string;
  title: string;
  fields: RuntimeField[];
}

export interface SubmissionPayload {
  briefId: string;
  lang: Lang;
  timestamp: string;
  data: Record<string, unknown>;
}
