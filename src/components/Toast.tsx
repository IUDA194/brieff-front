import React from "react";

export const Toast: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: 12,
      }}
    >
      {message}
    </div>
  );
};
