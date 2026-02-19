"use client";
import type { IndustryPreset } from "@/lib/cost-of-inaction/types";

const SANS = "'DM Sans',sans-serif";

interface IndustryCardProps {
  preset: IndustryPreset;
  onClick: () => void;
  index: number;
}

export default function IndustryCard({ preset, onClick, index }: IndustryCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 14,
        padding: "28px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
        animation: "slideIn 0.3s ease forwards", animationDelay: `${index * 0.04}s`, opacity: 0,
        position: "relative", overflow: "hidden", touchAction: "manipulation",
        fontFamily: SANS, color: "var(--text)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: preset.color, opacity: 0.7 }} />
      <div style={{ fontSize: 32, marginBottom: 10 }}>{preset.icon}</div>
      <h3 style={{ margin: "0 0 6px", color: "var(--text)", fontSize: 16, fontWeight: 700 }}>{preset.name}</h3>
      <p style={{ margin: 0, color: "var(--text4)", fontSize: 12, lineHeight: 1.5 }}>{preset.description}</p>
    </button>
  );
}
