"use client";
import type { CostEntry } from "@/lib/cost-of-inaction/types";

const SANS = "'Plus Jakarta Sans','DM Sans',sans-serif";

interface CostInputRowProps {
  entry: CostEntry;
  onAmountChange: (id: string, amount: number) => void;
  onToggle: (id: string) => void;
  onRemove?: (id: string) => void;
  accentColor: string;
}

export default function CostInputRow({ entry, onAmountChange, onToggle, onRemove, accentColor }: CostInputRowProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
      background: entry.enabled ? "var(--bg2)" : "var(--bg)",
      border: `1px solid ${entry.enabled ? "var(--border)" : "var(--border)"}`,
      borderRadius: 16, transition: "all 0.2s ease",
      opacity: entry.enabled ? 1 : 0.45,
    }}>
      {/* Toggle checkbox */}
      <input
        type="checkbox"
        checked={entry.enabled}
        onChange={() => onToggle(entry.categoryId)}
        style={{ width: 18, height: 18, cursor: "pointer", accentColor, flexShrink: 0, borderRadius: 6 }}
      />

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", fontFamily: SANS }}>
          {entry.label}
        </div>
      </div>

      {/* Dollar input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: "var(--iBg)", border: "1px solid var(--iBd)", borderRadius: 12,
        overflow: "hidden", flexShrink: 0,
      }}>
        <span style={{
          padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "var(--text4)",
          background: "var(--bg3)", borderRight: "1px solid var(--iBd)",
          fontFamily: SANS,
        }}>$</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={entry.amount || ""}
          onChange={(e) => onAmountChange(entry.categoryId, Number(e.target.value) || 0)}
          style={{
            width: 90, padding: "8px 10px", border: "none", background: "transparent",
            color: "var(--text)", fontSize: 13, fontWeight: 700, fontFamily: SANS,
            outline: "none", textAlign: "right",
          }}
          placeholder="0"
        />
      </div>

      {/* Delete button (custom entries only) */}
      {onRemove && (
        <button
          onClick={() => onRemove(entry.categoryId)}
          style={{
            background: "transparent", border: "none", color: "#ef4444",
            cursor: "pointer", padding: "4px 6px", fontSize: 14, flexShrink: 0,
            borderRadius: 8, lineHeight: 1,
          }}
          title="Remove"
        >✕</button>
      )}
    </div>
  );
}
