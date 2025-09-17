import React from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { Lang } from "../i18n";

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useI18n();
  const change = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setLang(e.target.value as Lang);
  return (
    <select
      value={lang}
      onChange={change}
      style={{ padding: 6, borderRadius: 8 }}
    >
      <option value="ru">Ru</option>
      <option value="en">En</option>
      <option value="ua">Ua</option>
    </select>
  );
};
