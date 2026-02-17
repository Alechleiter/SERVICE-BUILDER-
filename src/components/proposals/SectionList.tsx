"use client";
import type { SectionItem } from "@/lib/proposals/section-utils";

const SANS = "'DM Sans',sans-serif";
const MONO = "'DM Mono',monospace";

interface SectionListProps {
  sections: SectionItem[];
  activeIndex: number | null;
  onSectionClick: (index: number) => void;
  accentColor: string;
  /** Show Back/Next sequential navigation buttons at the bottom */
  showNav?: boolean;
}

export default function SectionList({
  sections,
  activeIndex,
  onSectionClick,
  accentColor,
  showNav = true,
}: SectionListProps) {
  const canGoBack = activeIndex !== null && activeIndex > 0;
  const canGoNext = activeIndex !== null && activeIndex < sections.length - 1;
  const nothingOpen = activeIndex === null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 0",
      }}
    >
      {sections.map((s, i) => {
        const isActive = activeIndex === i;
        const hasFill = s.isSpecial ? s.filled > 0 : s.filled > 0;
        const isComplete = !s.isSpecial && s.total > 0 && s.filled >= s.total;

        // Badge text
        let badge: string;
        if (s.isSpecial === "photos") {
          badge = s.filled > 0 ? `${s.filled} photo${s.filled !== 1 ? "s" : ""}` : "No photos";
        } else if (s.isSpecial === "map") {
          badge = s.filled > 0 ? `${s.filled} marker${s.filled !== 1 ? "s" : ""}` : "No markers";
        } else if (isComplete) {
          badge = "\u2713";
        } else {
          badge = `${s.filled}/${s.total}`;
        }

        return (
          <button
            key={s.id}
            onClick={() => onSectionClick(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              minHeight: 52,
              padding: "10px 14px",
              background: isActive
                ? "var(--bg3)"
                : "transparent",
              border: "none",
              borderLeft: hasFill
                ? `3px solid ${accentColor}`
                : "3px solid transparent",
              borderRadius: 0,
              cursor: "pointer",
              color: "var(--text)",
              fontFamily: SANS,
              textAlign: "left",
              transition: "all 0.15s",
              touchAction: "manipulation",
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: 18, flexShrink: 0, width: 26, textAlign: "center" }}>
              {s.icon}
            </span>

            {/* Title */}
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: isActive ? "var(--text)" : "var(--text3)",
              }}
            >
              {s.title}
            </span>

            {/* Completion badge */}
            <span
              style={{
                fontSize: 10,
                fontFamily: MONO,
                fontWeight: 700,
                flexShrink: 0,
                padding: "2px 6px",
                borderRadius: 6,
                background: isComplete
                  ? "rgba(16,185,129,0.12)"
                  : hasFill
                    ? `${accentColor}15`
                    : "var(--bg3)",
                color: isComplete
                  ? "#10b981"
                  : hasFill
                    ? accentColor
                    : "var(--text5)",
              }}
            >
              {badge}
            </span>
          </button>
        );
      })}

      {/* Back / Next sequential navigation */}
      {showNav && (
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "10px 14px 6px",
            borderTop: "1px solid var(--border)",
            marginTop: 4,
          }}
        >
          <button
            onClick={() => {
              if (canGoBack) onSectionClick(activeIndex! - 1);
            }}
            disabled={!canGoBack}
            style={{
              flex: 1,
              padding: "8px 0",
              background: canGoBack ? "var(--bg2)" : "var(--bg3)",
              border: "1px solid var(--border3)",
              borderRadius: 8,
              color: canGoBack ? "var(--text3)" : "var(--text5)",
              cursor: canGoBack ? "pointer" : "not-allowed",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: SANS,
              opacity: canGoBack ? 1 : 0.45,
              touchAction: "manipulation",
            }}
          >
            {"\u2190"} Back
          </button>
          <button
            onClick={() => {
              if (nothingOpen) {
                onSectionClick(0);
              } else if (canGoNext) {
                onSectionClick(activeIndex! + 1);
              }
            }}
            disabled={!nothingOpen && !canGoNext}
            style={{
              flex: 1,
              padding: "8px 0",
              background:
                nothingOpen || canGoNext
                  ? `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`
                  : "var(--bg3)",
              border: nothingOpen || canGoNext ? "none" : "1px solid var(--border3)",
              borderRadius: 8,
              color: nothingOpen || canGoNext ? "#fff" : "var(--text5)",
              cursor: nothingOpen || canGoNext ? "pointer" : "not-allowed",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: SANS,
              opacity: !nothingOpen && !canGoNext ? 0.45 : 1,
              touchAction: "manipulation",
            }}
          >
            {nothingOpen ? "Start \u2192" : "Next \u2192"}
          </button>
        </div>
      )}
    </div>
  );
}
