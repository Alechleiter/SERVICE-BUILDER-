"use client";
import { useRef, useEffect } from "react";

interface Step {
  id: string;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number;
  onStepClick: (index: number) => void;
  accent: string;
}

export default function StepIndicator({ steps, current, onStepClick, accent }: StepIndicatorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-scroll to keep current step visible
  useEffect(() => {
    const dot = dotRefs.current[current];
    if (dot && scrollRef.current) {
      const container = scrollRef.current;
      const dotLeft = dot.offsetLeft;
      const dotWidth = dot.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;

      // Center the current dot
      const targetScroll = dotLeft - containerWidth / 2 + dotWidth / 2;
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
  }, [current]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: "14px 20px 10px",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Hide scrollbar via inline style trick */}
      <style>{`
        .step-indicator-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="step-indicator-scroll" style={{
        display: "flex", alignItems: "flex-start", gap: 0, minWidth: "max-content",
        margin: "0 auto",
      }}>
        {steps.map((step, i) => {
          const isCompleted = i < current;
          const isCurrent = i === current;
          const isFuture = i > current;
          const isClickable = i <= current;

          return (
            <div key={step.id} style={{ display: "flex", alignItems: "flex-start" }}>
              {/* Step dot + label */}
              <button
                ref={(el) => { dotRefs.current[i] = el; }}
                onClick={() => isClickable && onStepClick(i)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: isClickable ? "pointer" : "default",
                  padding: "0 4px",
                  opacity: isFuture ? 0.4 : 1,
                  transition: "opacity 0.2s",
                  minWidth: 0,
                }}
              >
                {/* Dot */}
                <div style={{
                  width: isCurrent ? 14 : 10,
                  height: isCurrent ? 14 : 10,
                  borderRadius: "50%",
                  background: isCompleted || isCurrent ? accent : "transparent",
                  border: `2px solid ${isCompleted || isCurrent ? accent : "var(--border3)"}`,
                  boxShadow: isCurrent ? `0 0 0 3px ${accent}30` : "none",
                  transition: "all 0.25s",
                  flexShrink: 0,
                }} />
                {/* Label */}
                <span style={{
                  fontSize: 9,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? accent : isCompleted ? "var(--text3)" : "var(--text5)",
                  whiteSpace: "nowrap",
                  maxWidth: 72,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: "'DM Sans',sans-serif",
                  letterSpacing: "0.3px",
                  transition: "color 0.2s",
                }}>
                  {step.title}
                </span>
              </button>

              {/* Connector line (not after last step) */}
              {i < steps.length - 1 && (
                <div style={{
                  width: 24,
                  height: 2,
                  background: isCompleted ? accent : "var(--border3)",
                  marginTop: isCurrent ? 6 : 4, // align with dot center
                  flexShrink: 0,
                  transition: "background 0.25s",
                  borderRadius: 1,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
