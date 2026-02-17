"use client";

interface WizardNavigationProps {
  current: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  accent: string;
  nextLabel?: string;
}

export default function WizardNavigation({ current, total, onBack, onNext, accent, nextLabel }: WizardNavigationProps) {
  const isFirst = current === 0;
  const isLast = current === total - 1;
  const label = nextLabel || (isLast ? "Preview \u2192" : "Next \u2192");

  return (
    <div style={{
      position: "sticky",
      bottom: 0,
      zIndex: 90,
      background: "var(--bg)",
      borderTop: "1px solid var(--border)",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isFirst}
        style={{
          height: 48,
          padding: "0 24px",
          borderRadius: 12,
          border: `1px solid ${isFirst ? "var(--border2)" : "var(--border3)"}`,
          background: "transparent",
          color: isFirst ? "var(--text5)" : "var(--text3)",
          fontSize: 15,
          fontWeight: 600,
          cursor: isFirst ? "not-allowed" : "pointer",
          opacity: isFirst ? 0.4 : 1,
          transition: "all 0.15s",
          fontFamily: "'DM Sans',sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {"\u2190"} Back
      </button>

      {/* Mini dot indicators */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            width: i === current ? 8 : 5,
            height: i === current ? 8 : 5,
            borderRadius: "50%",
            background: i <= current ? accent : "var(--border3)",
            transition: "all 0.2s",
          }} />
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        style={{
          height: 48,
          padding: "0 28px",
          borderRadius: 12,
          border: "none",
          background: accent,
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.15s",
          fontFamily: "'DM Sans',sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: `0 2px 12px ${accent}40`,
        }}
      >
        {label}
      </button>
    </div>
  );
}
