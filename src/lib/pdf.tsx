// src/lib/pdf.tsx
import React, { useRef } from "react";
import { usePDF } from "react-to-pdf";

export function PdfButton({ target }: { target: React.RefObject<HTMLElement> }) {
  const { toPDF } = usePDF({ filename: "brief.pdf" });
  return (
    <button onClick={() => toPDF({ target: () => target.current! })}>
      Скачать PDF
    </button>
  );
}

export function PdfContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <PdfButton target={ref} />
      <div ref={ref} style={{ background: "#fff", color: "#000", padding: 24, width: 794 }}>
        {children}
      </div>
    </div>
  );
}
