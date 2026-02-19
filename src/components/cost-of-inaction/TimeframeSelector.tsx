"use client";

const SANS = "'DM Sans',sans-serif";

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
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: SANS }}>
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
              border: `1px solid ${months === p.months ? accentColor : "var(--border3)"}`,
              borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: SANS, transition: "all 0.15s",
              touchAction: "manipulation",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text4)", fontFamily: SANS }}>Custom:</span>
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
            width: 60, padding: "5px 8px", background: "var(--iBg)", border: "1px solid var(--iBd)",
            borderRadius: 8, color: "var(--text)", fontSize: 12, fontFamily: SANS, outline: "none",
            textAlign: "center",
          }}
        />
        <span style={{ fontSize: 12, color: "var(--text5)", fontFamily: SANS }}>months</span>
      </div>
    </div>
  );
}
