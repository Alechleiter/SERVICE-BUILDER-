"use client";
import type { IndustryPreset } from "@/lib/cost-of-inaction/types";

const SERIF = "'Playfair Display','Georgia',serif";
const SANS = "'Plus Jakarta Sans','DM Sans',sans-serif";

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
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: 32, padding: "32px 24px", cursor: "pointer", textAlign: "left",
        transition: "all 0.25s ease",
        animation: "slideIn 0.3s ease forwards", animationDelay: `${index * 0.04}s`, opacity: 0,
        position: "relative", overflow: "hidden", touchAction: "manipulation",
        fontFamily: SANS, color: "var(--text)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top icon block */}
      <div style={{
        width: 48, height: 48, borderRadius: 16,
        background: preset.color, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, marginBottom: 16,
        boxShadow: `0 8px 16px -4px ${preset.color}33`,
      }}>
        {preset.icon}
      </div>

      <h3 style={{
        margin: "0 0 8px", fontFamily: SERIF, fontSize: 18, fontWeight: 700,
        lineHeight: 1.2, color: "var(--text)",
      }}>
        {preset.name}
        <span style={{ color: "var(--text5)" }}>.</span>
      </h3>

      <p style={{
        margin: "0 0 16px", color: "var(--text4)", fontSize: 11,
        lineHeight: 1.6, fontWeight: 300, letterSpacing: "0.01em",
      }}>
        {preset.description}
      </p>

      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        color: "var(--text)", fontWeight: 700, fontSize: 9,
        textTransform: "uppercase", letterSpacing: "0.3em",
      }}>
        Analyze →
      </div>
    </button>
  );
}
