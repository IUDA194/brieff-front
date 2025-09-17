import React from "react";
import type { BriefSchema } from "../types";
import { useI18n } from "../i18n/I18nProvider";

interface Props {
  schemas: BriefSchema[];
  currentId: string | null;
  onPick: (id: string) => void;
}

export const SchemaSwitcher: React.FC<Props> = ({
  schemas,
  currentId,
  onPick,
}) => {
  const { t } = useI18n();
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <span style={{ fontWeight: 600 }}>
        {t("app.selectSchema", "Select brief")}:
      </span>
      {schemas.map((s) => (
        <button
          key={s.id}
          onClick={() => onPick(s.id)}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: currentId === s.id ? "#ffe7c2" : "#fff",
          }}
        >
          {s.title || s.id}
        </button>
      ))}
    </div>
  );
};
