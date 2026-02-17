"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { exportPDF, exportWord, copyToClipboard, printContent } from "@/lib/export";

interface ExportMenuProps {
  /** Generates HTML. Pass `forWord: true` for Word-compatible output. */
  getHtml: (opts?: { forWord?: boolean }) => string;
  /** Generates internal HTML. Pass `forWord: true` for Word-compatible output. */
  getInternalHtml?: (opts?: { forWord?: boolean }) => string;
  getPlainText?: () => string;
  filename?: string;
  title?: string;
  buttonLabel?: string;
  accentColor?: string;
  isMobile?: boolean;
}

export default function ExportMenu({
  getHtml,
  getInternalHtml,
  getPlainText,
  filename = "proposal",
  title = "Proposal",
  buttonLabel = "Export",
  accentColor,
  isMobile = false,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  }, []);

  // Customer exports
  const handleCopy = useCallback(async () => {
    const html = getHtml();
    const plain = getPlainText?.();
    const ok = await copyToClipboard(html, plain);
    showFeedback(ok ? "\u2713 Copied!" : "Copy failed");
    if (ok) setOpen(false);
  }, [getHtml, getPlainText, showFeedback]);

  const handleWord = useCallback(() => {
    const html = getHtml({ forWord: true });
    exportWord(html, filename);
    showFeedback("\u2713 Word saved");
    setOpen(false);
  }, [getHtml, filename, showFeedback]);

  const handlePDF = useCallback(async () => {
    setExporting(true);
    showFeedback("Generating PDF\u2026");
    try {
      const html = getHtml();
      await exportPDF(html, title);
      showFeedback("\u2713 PDF saved");
    } catch {
      showFeedback("PDF failed");
    } finally {
      setExporting(false);
    }
    setOpen(false);
  }, [getHtml, title, showFeedback]);

  const handlePrint = useCallback(() => {
    printContent(getHtml(), title);
    setOpen(false);
  }, [getHtml, title]);

  // Internal exports
  const handleInternalPDF = useCallback(async () => {
    if (!getInternalHtml) return;
    setExporting(true);
    showFeedback("Generating PDF\u2026");
    try {
      await exportPDF(getInternalHtml(), `${title} (Internal)`);
      showFeedback("\u2713 PDF saved");
    } catch {
      showFeedback("PDF failed");
    } finally {
      setExporting(false);
    }
    setOpen(false);
  }, [getInternalHtml, title, showFeedback]);

  const handleInternalWord = useCallback(() => {
    if (!getInternalHtml) return;
    exportWord(getInternalHtml({ forWord: true }), `${filename}_Internal`);
    showFeedback("\u2713 Internal saved");
    setOpen(false);
  }, [getInternalHtml, filename, showFeedback]);

  const handleInternalCopy = useCallback(async () => {
    if (!getInternalHtml) return;
    const ok = await copyToClipboard(getInternalHtml());
    showFeedback(ok ? "\u2713 Copied!" : "Copy failed");
    if (ok) setOpen(false);
  }, [getInternalHtml, showFeedback]);

  const accent = accentColor || "var(--accent)";

  type Option = { icon: string; label: string; desc: string; action: () => void };

  const pdfLabel = exporting && feedback === "Generating PDF\u2026" ? "\u23F3 Generating\u2026" : "Export PDF";

  const customerOptions: Option[] = [
    { icon: "\u{1F4CB}", label: feedback === "\u2713 Copied!" ? "\u2713 Copied!" : "Copy to Clipboard", desc: "Paste into Gmail, Docs, etc.", action: handleCopy },
    { icon: "\u{1F4DD}", label: feedback === "\u2713 Word saved" ? "\u2713 Saved!" : "Export Word", desc: "Download as .doc file", action: handleWord },
    { icon: "\u{1F4C4}", label: pdfLabel, desc: "Download as PDF", action: handlePDF },
    { icon: "\u{1F5A8}\uFE0F", label: "Print", desc: "Send to printer", action: handlePrint },
  ];

  const internalOptions: Option[] = getInternalHtml
    ? [
        { icon: "\u{1F4CB}", label: feedback === "\u2713 Copied!" ? "\u2713 Copied!" : "Copy Internal", desc: "With tech notes + pricing", action: handleInternalCopy },
        { icon: "\u{1F4DD}", label: feedback === "\u2713 Internal saved" ? "\u2713 Saved!" : "Internal Word", desc: "Full internal .doc file", action: handleInternalWord },
        { icon: "\u{1F4C4}", label: "Internal PDF", desc: "Full internal PDF", action: handleInternalPDF },
      ]
    : [];

  const renderOption = (opt: Option, i: number, isLast: boolean) => (
    <button
      key={`${opt.label}-${i}`}
      onClick={opt.action}
      disabled={exporting}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "10px 16px",
        background: "transparent",
        border: "none",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
        cursor: exporting ? "wait" : "pointer",
        textAlign: "left",
        color: "var(--text)",
        opacity: exporting ? 0.6 : 1,
        transition: "background 0.15s",
        touchAction: "manipulation",
      }}
      onMouseEnter={(e) => { if (!exporting) (e.currentTarget as HTMLButtonElement).style.background = "var(--bgHover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      <span style={{ fontSize: "16px", flexShrink: 0, width: "24px", textAlign: "center" }}>{opt.icon}</span>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "-0.01em" }}>{opt.label}</div>
        <div style={{ fontSize: "10px", color: "var(--text4)", marginTop: "1px" }}>{opt.desc}</div>
      </div>
    </button>
  );

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: accent,
          border: "none",
          color: "#fff",
          borderRadius: "10px",
          padding: isMobile ? "8px 16px" : "7px 16px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          touchAction: "manipulation",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          transition: "all 0.2s ease",
          letterSpacing: "-0.01em",
        }}
      >
        {"\u{1F4E4}"} {buttonLabel}{" "}
        <span style={{ fontSize: "8px", opacity: 0.6, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>{"\u25BC"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "var(--bgElevated)",
            border: "1px solid var(--border3)",
            borderRadius: "12px",
            overflow: "hidden",
            zIndex: 200,
            minWidth: "240px",
            boxShadow: "var(--shElevated)",
            animation: "scaleIn 0.15s ease",
            transformOrigin: "top right",
          }}
        >
          {/* Customer section header */}
          {getInternalHtml && (
            <div style={{
              padding: "8px 16px 4px",
              fontSize: "9px",
              fontWeight: 700,
              color: "var(--text5)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              Customer Version
            </div>
          )}

          {customerOptions.map((opt, i) =>
            renderOption(opt, i, !getInternalHtml && i === customerOptions.length - 1),
          )}

          {/* Internal section */}
          {getInternalHtml && internalOptions.length > 0 && (
            <>
              <div style={{
                padding: "8px 16px 4px",
                fontSize: "9px",
                fontWeight: 700,
                color: "#F59E0B",
                textTransform: "uppercase",
                letterSpacing: "1px",
                borderTop: "1px solid var(--border)",
              }}>
                Internal Version
              </div>
              {internalOptions.map((opt, i) =>
                renderOption(opt, i, i === internalOptions.length - 1),
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
