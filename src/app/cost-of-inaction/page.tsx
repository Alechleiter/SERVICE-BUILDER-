"use client";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useCalculations } from "@/hooks/useCalculations";
import { useClients } from "@/hooks/useClients";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAutoSave, type AutoSaveData } from "@/hooks/useAutoSave";
import { INDUSTRY_PRESETS, INDUSTRY_ORDER } from "@/lib/cost-of-inaction/presets";
import { buildCOIExportHTML, buildCOIPlainText } from "@/lib/cost-of-inaction/export-html";
import type { IndustryPreset, CostEntry, CalculationData } from "@/lib/cost-of-inaction/types";
import type { ProposalListItem } from "@/hooks/useProposals";
import type { Client } from "@/lib/supabase/database.types";
import IndustryCard from "@/components/cost-of-inaction/IndustryCard";
import CostInputRow from "@/components/cost-of-inaction/CostInputRow";
import TimeframeSelector from "@/components/cost-of-inaction/TimeframeSelector";
import ExportMenu from "@/components/ExportMenu";

// Dynamic import of ResultsDashboard to avoid SSR issues with recharts
const ResultsDashboard = dynamic(
  () => import("@/components/cost-of-inaction/ResultsDashboard"),
  { ssr: false, loading: () => <div style={{ padding: 40, textAlign: "center", color: "var(--text5)" }}>Loading charts...</div> },
);

const SERIF = "'Playfair Display','Georgia',serif";
const SANS = "'Plus Jakarta Sans','DM Sans',sans-serif";

function initEntries(preset: IndustryPreset): CostEntry[] {
  return preset.categories.map((c) => ({
    categoryId: c.id,
    label: c.label,
    amount: c.defaultAmount,
    enabled: true,
  }));
}

export default function CostOfInactionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { list: listCalcs, save, remove, saveError } = useCalculations();
  const { list: listClients } = useClients();
  const [isMobile, mobileRef] = useIsMobile(768);

  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [customEntries, setCustomEntries] = useState<CostEntry[]>([]);
  const [timeframeMonths, setTimeframeMonths] = useState(12);
  const [propertyName, setPropertyName] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"calculator" | "results">("calculator");
  const [isDark, setIsDark] = useState(true);
  const [savedCalcs, setSavedCalcs] = useState<ProposalListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const preset = selectedIndustry ? INDUSTRY_PRESETS[selectedIndustry] : null;

  // Sync theme
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current) setIsDark(current === "dark");
  }, []);

  // ── Auto-save ──
  const autoSaveData = useMemo<AutoSaveData | null>(() => {
    if (!selectedIndustry || entries.length === 0) return null;
    return {
      templateId: "cost_of_inaction",
      formData: { __restore: JSON.stringify({ selectedIndustry, entries, customEntries, timeframeMonths, propertyName, notes, selectedClientId }) },
      inspectionDate: "",
      photos: [],
      mapData: null,
      savedAt: Date.now(),
    };
  }, [selectedIndustry, entries, customEntries, timeframeMonths, propertyName, notes, selectedClientId]);

  const { clear: clearDraft } = useAutoSave("coi-new", autoSaveData);

  // Load saved calculations + clients
  useEffect(() => {
    if (!user) return;
    listCalcs().then(setSavedCalcs);
    listClients().then(setClientsList);
  }, [user, listCalcs, listClients]);

  // ── Handlers ──
  const handleSelectIndustry = useCallback((id: string) => {
    const p = INDUSTRY_PRESETS[id];
    if (!p) return;
    setSelectedIndustry(id);
    setEntries(initEntries(p));
    setCustomEntries([]);
    setTimeframeMonths(12);
    setPropertyName("");
    setNotes("");
    setActiveTab("calculator");
  }, []);

  const handleAmountChange = useCallback((id: string, amount: number) => {
    setEntries((prev) => prev.map((e) => e.categoryId === id ? { ...e, amount } : e));
    setCustomEntries((prev) => prev.map((e) => e.categoryId === id ? { ...e, amount } : e));
  }, []);

  const handleToggle = useCallback((id: string) => {
    setEntries((prev) => prev.map((e) => e.categoryId === id ? { ...e, enabled: !e.enabled } : e));
    setCustomEntries((prev) => prev.map((e) => e.categoryId === id ? { ...e, enabled: !e.enabled } : e));
  }, []);

  const handleRemoveCustom = useCallback((id: string) => {
    setCustomEntries((prev) => prev.filter((e) => e.categoryId !== id));
  }, []);

  const handleAddCustom = useCallback(() => {
    if (!customLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    setCustomEntries((prev) => [...prev, { categoryId: id, label: customLabel.trim(), amount: 0, enabled: true }]);
    setCustomLabel("");
  }, [customLabel]);

  const handleSave = useCallback(async () => {
    if (!user || !selectedIndustry || !preset) {
      alert("Please sign in and select an industry first.");
      return;
    }
    setSaving(true);
    try {
      const data: CalculationData = {
        industryId: selectedIndustry,
        industryName: preset.name,
        propertyName,
        entries,
        customEntries,
        timeframeMonths,
        notes,
      };
      const id = await save(data, undefined, selectedClientId || undefined);
      if (id) {
        clearDraft();
        router.push(`/cost-of-inaction/${id}`);
      } else {
        alert("Save failed — check the error banner.");
      }
    } catch (err) {
      alert("Save failed: " + (err instanceof Error ? err.message : String(err)));
    }
    setSaving(false);
  }, [user, selectedIndustry, preset, propertyName, entries, customEntries, timeframeMonths, notes, selectedClientId, save, clearDraft, router]);

  // ── Export helpers ──
  const getCalcData = useCallback((): CalculationData => ({
    industryId: selectedIndustry || "",
    industryName: preset?.name || "",
    propertyName,
    entries,
    customEntries,
    timeframeMonths,
    notes,
  }), [selectedIndustry, preset, propertyName, entries, customEntries, timeframeMonths, notes]);

  const getExportHtml = useCallback((opts?: { forWord?: boolean }) => {
    return buildCOIExportHTML(getCalcData(), preset?.color || "#DC2626", opts?.forWord);
  }, [getCalcData, preset]);

  const getPlainText = useCallback(() => {
    return buildCOIPlainText(getCalcData());
  }, [getCalcData]);

  // ── Template Selection View ──
  if (!selectedIndustry) {
    return (
      <div ref={mobileRef} style={{ minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)", fontFamily: SANS }}>
        {/* Hero */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "32px 16px 20px" : "56px 16px 28px", textAlign: "center" }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 24,
            background: "rgba(220,38,38,0.08)", color: "#DC2626",
            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4em",
            marginBottom: 16, fontFamily: SANS,
          }}>
            Sales Architecture Tool
          </div>
          <h1 style={{
            fontSize: isMobile ? 28 : 40, fontFamily: SERIF, fontWeight: 700,
            marginBottom: 10, lineHeight: 1.15, letterSpacing: "-0.5px",
          }}>
            Cost of{" "}
            <span style={{ fontStyle: "italic", fontWeight: 400, color: "#DC2626" }}>Inaction.</span>
          </h1>
          <p style={{
            color: "var(--text4)", fontSize: 12, maxWidth: 440, margin: "0 auto",
            lineHeight: 1.7, fontWeight: 300, fontFamily: SANS,
          }}>
            Quantify the high price of doing nothing. Reframe service as risk control.
          </p>
        </div>

        {/* Saved Calculations */}
        {user && savedCalcs.length > 0 && (
          <div style={{ maxWidth: 960, margin: "0 auto 28px", padding: "0 16px" }}>
            <h3 style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.25em", fontFamily: SANS }}>
              Saved Calculations
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedCalcs.slice(0, 5).map((p) => {
                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 0,
                    background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 20,
                    overflow: "hidden",
                  }}>
                    <button onClick={() => router.push(`/cost-of-inaction/${p.id}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                        background: "transparent", border: "none", borderRadius: 0,
                        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                        color: "var(--text)", fontFamily: SANS, flex: 1, minWidth: 0,
                      }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>💸</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name || "Untitled"}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text5)", fontFamily: SANS, fontWeight: 300 }}>
                          {new Date(p.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Delete "${p.name || "Untitled"}"? This cannot be undone.`)) return;
                        await remove(p.id);
                        setSavedCalcs((prev) => prev.filter((x) => x.id !== p.id));
                      }}
                      style={{
                        background: "transparent", border: "none", borderLeft: "1px solid var(--border2)",
                        color: "#ef4444", cursor: "pointer", padding: "0 14px", fontSize: 16,
                        flexShrink: 0, height: "100%", minHeight: 52, display: "flex", alignItems: "center",
                      }}
                      title="Delete calculation"
                    >🗑️</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Industry Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 260px),1fr))", gap: 16, maxWidth: 960, margin: "0 auto", padding: "0 16px 60px" }}>
          {INDUSTRY_ORDER.map((id, i) => {
            const p = INDUSTRY_PRESETS[id];
            if (!p) return null;
            return <IndustryCard key={id} preset={p} onClick={() => handleSelectIndustry(id)} index={i} />;
          })}
        </div>
      </div>
    );
  }

  // ── Calculator View ──
  const activeEntries = [...entries, ...customEntries].filter((e) => e.enabled && e.amount > 0);
  const monthlyTotal = activeEntries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div ref={mobileRef} style={{ minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)", fontFamily: SANS, overflowX: "hidden" }}>
      {/* Top Bar */}
      <div style={{
        position: isMobile ? "relative" : "sticky", top: isMobile ? undefined : 48, zIndex: 100,
        background: isDark ? "rgba(15,15,15,0.92)" : "rgba(245,245,240,0.92)",
        backdropFilter: isMobile ? undefined : "blur(12px)", borderBottom: "1px solid var(--border)",
        padding: isMobile ? "8px 12px" : "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: isMobile ? 6 : 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, minWidth: 0 }}>
          <button onClick={() => setSelectedIndustry(null)}
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 16, color: "var(--text3)", cursor: "pointer", padding: "6px 14px", fontSize: 11, flexShrink: 0, fontWeight: 600, fontFamily: SANS }}>
            ← {isMobile ? "" : "Industries"}
          </button>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{preset!.icon}</span>
          <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preset!.name}</span>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
          {isMobile && (["calculator", "results"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "var(--bg3)" : "transparent",
                border: `1px solid ${activeTab === tab ? "var(--border)" : "transparent"}`,
                borderRadius: 16, color: activeTab === tab ? "var(--text)" : "var(--text4)",
                cursor: "pointer", padding: "6px 12px", fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: SANS,
              }}>
              {tab === "calculator" ? "✏️ Edit" : "📊 Results"}
            </button>
          ))}
          {user && (
            <button onClick={handleSave} disabled={saving}
              style={{
                background: saving ? "var(--bg3)" : "#1a1a1a",
                border: "none", borderRadius: 16, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                padding: isMobile ? "6px 12px" : "6px 16px", fontSize: 10, fontWeight: 700, opacity: saving ? 0.6 : 1,
                textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: SANS,
              }}>
              {saving ? "..." : "Save"}
            </button>
          )}
          <ExportMenu
            getHtml={getExportHtml}
            getPlainText={getPlainText}
            filename={`cost-of-inaction-${preset!.name.toLowerCase().replace(/\s+/g, "-")}`}
            title="Cost of Inaction"
            accentColor={preset!.color}
          />
        </div>
      </div>

      {/* Save Error Banner */}
      {saveError && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "8px 12px" : "8px 20px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#DC2626" }}>Save Error</div>
              <div style={{ fontSize: 12, color: "var(--text)", marginTop: 2, wordBreak: "break-word" }}>{saveError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto", minHeight: "calc(100vh - 106px)" }}>
        {/* Left: Calculator inputs */}
        <div style={{
          width: isMobile ? "100%" : "45%", padding: isMobile ? "16px 12px" : "20px",
          display: isMobile && activeTab !== "calculator" ? "none" : "block",
          overflowY: "auto",
        }}>
          {/* Property Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase", letterSpacing: "0.25em", display: "block", marginBottom: 8, fontFamily: SANS }}>
              Property / Business Name
            </label>
            <input
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="e.g. Hilton Garden Inn Downtown"
              style={{
                width: "100%", padding: "12px 16px", background: "var(--iBg)", border: "1px solid var(--iBd)",
                borderRadius: 16, color: "var(--text)", fontSize: 14, fontFamily: SANS, outline: "none",
                fontWeight: 600,
              }}
            />
          </div>

          {/* Timeframe */}
          <div style={{ marginBottom: 20 }}>
            <TimeframeSelector months={timeframeMonths} onChange={setTimeframeMonths} accentColor={preset!.color} />
          </div>

          {/* Quick Total Display */}
          <div style={{
            background: `${preset!.color}12`, border: `2px solid ${preset!.color}30`, borderRadius: 20,
            padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: SANS }}>Monthly Total</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: preset!.color, fontFamily: SERIF }}>
              ${monthlyTotal.toLocaleString()}
            </span>
          </div>

          {/* Cost Categories */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: 12, fontFamily: SANS }}>
              Cost Categories (per month)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entries.map((e) => (
                <CostInputRow key={e.categoryId} entry={e} onAmountChange={handleAmountChange} onToggle={handleToggle} accentColor={preset!.color} rationale={preset!.categories.find((c) => c.id === e.categoryId)?.rationale} />
              ))}
              {customEntries.map((e) => (
                <CostInputRow key={e.categoryId} entry={e} onAmountChange={handleAmountChange} onToggle={handleToggle} onRemove={handleRemoveCustom} accentColor={preset!.color} />
              ))}
            </div>
          </div>

          {/* Add Custom */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom(); }}
              placeholder="Add custom cost category..."
              style={{
                flex: 1, padding: "10px 14px", background: "var(--iBg)", border: "1px solid var(--iBd)",
                borderRadius: 16, color: "var(--text)", fontSize: 12, fontFamily: SANS, outline: "none",
              }}
            />
            <button onClick={handleAddCustom}
              style={{
                background: preset!.color, border: "none", borderRadius: 16, color: "#fff",
                padding: "10px 18px", fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: SANS,
              }}>
              + Add
            </button>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase", letterSpacing: "0.25em", display: "block", marginBottom: 8, fontFamily: SANS }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for this analysis..."
              rows={3}
              style={{
                width: "100%", padding: "12px 16px", background: "var(--iBg)", border: "1px solid var(--iBd)",
                borderRadius: 16, color: "var(--text)", fontSize: 12, fontFamily: SANS, outline: "none", resize: "vertical",
                lineHeight: 1.6,
              }}
            />
          </div>
        </div>

        {/* Right: Results Dashboard */}
        <div style={{
          width: isMobile ? "100%" : "55%", padding: isMobile ? "16px 12px" : "20px",
          display: isMobile && activeTab !== "results" ? "none" : "block",
          borderLeft: isMobile ? "none" : "1px solid var(--border)",
          overflowY: "auto",
        }}>
          <ResultsDashboard
            entries={entries}
            customEntries={customEntries}
            timeframeMonths={timeframeMonths}
            accentColor={preset!.color}
            industryName={preset!.name}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}
