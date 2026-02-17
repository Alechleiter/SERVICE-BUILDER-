"use client";
import { useEffect, useRef } from "react";

const SANS = "'DM Sans',sans-serif";

interface SectionPanelProps {
  isOpen: boolean;
  title: string;
  icon: string;
  sectionIndex: number;
  totalSections: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  accentColor: string;
  isMobile: boolean;
  children: React.ReactNode;
}

export default function SectionPanel({
  isOpen,
  title,
  icon,
  sectionIndex,
  totalSections,
  onClose,
  onPrev,
  onNext,
  accentColor,
  isMobile,
  children,
}: SectionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top when section changes
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen, sectionIndex]);

  // Escape key to close on desktop
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isMobile, onClose]);

  const isFirst = sectionIndex <= 0;
  const isLast = sectionIndex >= totalSections - 1;

  // Mobile: full-screen fixed overlay
  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "var(--bg)",
          display: isOpen ? "flex" : "none",
          flexDirection: "column",
          fontFamily: SANS,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border3)",
              borderRadius: 8,
              color: "var(--text3)",
              cursor: "pointer",
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              touchAction: "manipulation",
            }}
          >
            {"\u2190"} Back
          </button>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span
            style={{
              flex: 1,
              fontWeight: 700,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--text)",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text5)",
              fontFamily: "'DM Mono',monospace",
              flexShrink: 0,
            }}
          >
            {sectionIndex + 1} of {totalSections}
          </span>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflow: "auto",
            padding: 16,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>

        {/* Footer — Prev/Next */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onPrev}
            disabled={isFirst}
            style={{
              flex: 1,
              padding: "12px 0",
              background: isFirst ? "var(--bg3)" : "var(--bg2)",
              border: "1px solid var(--border3)",
              borderRadius: 10,
              color: isFirst ? "var(--text5)" : "var(--text3)",
              cursor: isFirst ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: isFirst ? 0.5 : 1,
              touchAction: "manipulation",
            }}
          >
            {"\u2190"} Prev
          </button>
          <button
            onClick={isLast ? onClose : onNext}
            style={{
              flex: 1,
              padding: "12px 0",
              background: isLast
                ? `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`
                : "var(--bg2)",
              border: isLast ? "none" : "1px solid var(--border3)",
              borderRadius: 10,
              color: isLast ? "#fff" : "var(--text3)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              touchAction: "manipulation",
            }}
          >
            {isLast ? "\u2713 Done" : "Next \u2192"}
          </button>
        </div>
      </div>
    );
  }

  // Desktop: slide-over panel (420px, overlays the section list)
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: 420,
        zIndex: 10,
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
        boxShadow: isOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
        display: "flex",
        flexDirection: "column",
        fontFamily: SANS,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "var(--bg3)",
            border: "1px solid var(--border3)",
            borderRadius: 8,
            color: "var(--text3)",
            cursor: "pointer",
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {"\u2190"} Back
        </button>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span
          style={{
            flex: 1,
            fontWeight: 700,
            fontSize: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--text)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--text5)",
            fontFamily: "'DM Mono',monospace",
            flexShrink: 0,
          }}
        >
          {sectionIndex + 1} of {totalSections}
        </span>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
        }}
      >
        {children}
      </div>

      {/* Footer — Prev/Next */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onPrev}
          disabled={isFirst}
          style={{
            flex: 1,
            padding: "8px 0",
            background: isFirst ? "var(--bg3)" : "var(--bg2)",
            border: "1px solid var(--border3)",
            borderRadius: 8,
            color: isFirst ? "var(--text5)" : "var(--text3)",
            cursor: isFirst ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 600,
            opacity: isFirst ? 0.5 : 1,
          }}
        >
          {"\u2190"} Prev
        </button>
        <button
          onClick={isLast ? onClose : onNext}
          style={{
            flex: 1,
            padding: "8px 0",
            background: isLast
              ? `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`
              : "var(--bg2)",
            border: isLast ? "none" : "1px solid var(--border3)",
            borderRadius: 8,
            color: isLast ? "#fff" : "var(--text3)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {isLast ? "\u2713 Done" : "Next \u2192"}
        </button>
      </div>
    </div>
  );
}
