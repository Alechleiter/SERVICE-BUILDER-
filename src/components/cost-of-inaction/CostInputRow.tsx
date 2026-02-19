"use client";
import { useState } from "react";
import type { CostEntry } from "@/lib/cost-of-inaction/types";

const SANS = "'Plus Jakarta Sans','DM Sans',sans-serif";

interface CostInputRowProps {
  entry: CostEntry;
  onAmountChange: (id: string, amount: number) => void;
  onToggle: (id: string) => void;
  onRemove?: (id: string) => void;
  accentColor: string;
  rationale?: string;
}

export default function CostInputRow({ entry, onAmountChange, onToggle, onRemove, accentColor, rationale }: CostInputRowProps) {
  const [showRationale, setShowRationale] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden", transition: "all 0.2s ease" }}>
      {/* Main row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
        background: entry.enabled ? "var(--bg2)" : "var(--bg)",
        border: `1px solid ${entry.enabled ? "var(--border)" : "var(--border)"}`,
        borderRadius: showRationale ? "16px 16px 0 0" : 16,
        transition: "all 0.2s ease",
        opacity: entry.enabled ? 1 : 0.45,
      }}>
        {/* Toggle checkbox */}
        <input
          type="checkbox"
          checked={entry.enabled}
          onChange={() => onToggle(entry.categoryId)}
          style={{ width: 18, height: 18, cursor: "pointer", accentColor, flexShrink: 0, borderRadius: 6 }}
        />

        {/* Label + info icon */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", fontFamily: SANS }}>
            {entry.label}
          </div>
          {rationale && (
            <button
              onClick={() => setShowRationale(!showRationale)}
              title="View research rationale"
              style={{
                background: showRationale ? accentColor : "var(--bg3)",
                color: showRationale ? "#fff" : "var(--text4)",
                border: "none",
                borderRadius: 10,
                width: 20, height: 20,
                fontSize: 11, fontWeight: 700,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s ease",
                fontFamily: SANS,
                lineHeight: 1,
              }}
            >
              i
            </button>
          )}
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

      {/* Rationale panel */}
      {rationale && showRationale && (
        <div style={{
          padding: "10px 16px 12px",
          background: "var(--bg3)",
          borderLeft: `1px solid var(--border)`,
          borderRight: `1px solid var(--border)`,
          borderBottom: `1px solid var(--border)`,
          borderRadius: "0 0 16px 16px",
          borderTop: `2px solid ${accentColor}22`,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const,
            letterSpacing: "0.15em", color: accentColor, marginBottom: 4,
            fontFamily: SANS,
          }}>
            Research Rationale
          </div>
          <div style={{
            fontSize: 12, lineHeight: 1.5, color: "var(--text3)",
            fontFamily: SANS, fontWeight: 400,
          }}>
            {rationale}
          </div>
        </div>
      )}
    </div>
  );
}
