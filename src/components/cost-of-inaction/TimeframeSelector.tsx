"use client";

const SANS = "'Plus Jakarta Sans','DM Sans',sans-serif";

const PRESETS = [
  { label: "3 mo", months: 3 },
  { label: "6 mo", months: 6 },
  { label: "1 yr", months: 12 },
  { label: "2 yr", months: 24 },
  { label: "5 yr", months: 60 },
];

interface TimeframeSelectorProps {
  months: number;
  onChange: (months: number) => void;
  accentColor: string;
}

export default function TimeframeSelector({ months, onChange, accentColor }: TimeframeSelectorProps) {
  const isPreset = PRESETS.some((p) => p.months === months);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{
        fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase",
        letterSpacing: "0.25em", fontFamily: SANS,
      }}>
        Projection Timeframe
      </label>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button
            key={p.months}
            onClick={() => onChange(p.months)}
            style={{
              background: months === p.months ? accentColor : "var(--bg3)",
              color: months === p.months ? "#fff" : "var(--text4)",
              border: `1px solid ${months === p.months ? accentColor : "var(--border)"}`,
              borderRadius: 24, padding: "8px 16px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: SANS, transition: "all 0.2s ease",
              touchAction: "manipulation",
              boxShadow: months === p.months ? `0 4px 12px -2px ${accentColor}44` : "none",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text5)", fontFamily: SANS, fontWeight: 600 }}>Custom:</span>
        <input
          type="number"
          min={1}
          max={120}
          value={isPreset ? "" : months}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > 0 && v <= 120) onChange(v);
          }}
          placeholder={String(months)}
          inputMode="numeric"
          style={{
            width: 60, padding: "6px 10px", background: "var(--iBg)", border: "1px solid var(--iBd)",
            borderRadius: 12, color: "var(--text)", fontSize: 12, fontFamily: SANS, outline: "none",
            textAlign: "center", fontWeight: 600,
          }}
        />
        <span style={{ fontSize: 11, color: "var(--text5)", fontFamily: SANS }}>months</span>
      </div>
    </div>
  );
}
