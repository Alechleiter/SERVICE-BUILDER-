"use client";
import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  accentColor?: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultExpanded = true,
  accentColor,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Header bar — clickable */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--bg2)",
          border: "1px solid var(--border2, var(--border))",
          borderRadius: expanded ? "10px 10px 0 0" : 10,
          cursor: "pointer",
          color: "var(--text)",
          fontFamily: "'DM Sans', sans-serif",
          transition: "border-radius 0.2s",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: accentColor || "var(--text3)",
          }}
        >
          {title}
        </span>
        {/* Chevron */}
        <span
          style={{
            fontSize: 12,
            transition: "transform 0.2s",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--text4)",
            lineHeight: 1,
          }}
        >
          {"\u25BC"}
        </span>
      </button>

      {/* Content area */}
      {expanded && (
        <div
          style={{
            padding: "14px 14px 4px",
            border: "1px solid var(--border2, var(--border))",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            background: "var(--bg)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
