"use client";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useCalculations } from "@/hooks/useCalculations";
import { useClients } from "@/hooks/useClients";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAutoSave, type AutoSaveData } from "@/hooks/useAutoSave";
import { INDUSTRY_PRESETS } from "@/lib/cost-of-inaction/presets";
import { buildCOIExportHTML, buildCOIPlainText } from "@/lib/cost-of-inaction/export-html";
import type { CostEntry, CalculationData } from "@/lib/cost-of-inaction/types";
import type { Client } from "@/lib/supabase/database.types";
import CostInputRow from "@/components/cost-of-inaction/CostInputRow";
import TimeframeSelector from "@/components/cost-of-inaction/TimeframeSelector";
import ExportMenu from "@/components/ExportMenu";

const ResultsDashboard = dynamic(
  () => import("@/components/cost-of-inaction/ResultsDashboard"),
  { ssr: false, loading: () => <div style={{ padding: 40, textAlign: "center", color: "var(--text5)" }}>Loading charts...</div> },
);

const SANS = "'DM Sans',sans-serif";
const MONO = "'DM Mono',monospace";

export default function SavedCalculationPage() {
  const params = useParams();
  const calcId = params.id as string;
  const { user } = useAuth();
  const { save, load, saveError } = useCalculations();
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
  const [saving, setSaving] = useState(false);
  const [loadingCalc, setLoadingCalc] = useState(true);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const preset = selectedIndustry ? INDUSTRY_PRESETS[selectedIndustry] : null;

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

  const { clear: clearDraft } = useAutoSave(`coi-${calcId}`, autoSaveData);

  // ── Load saved calculation ──
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!user || !calcId || loadedRef.current) return;
    loadedRef.current = true;
    listClients().then(setClientsList);
    (async () => {
      setLoadingCalc(true);
      const data = await load(calcId);
      if (data) {
        setSelectedIndustry(data.industryId);
        setEntries(data.entries);
        setCustomEntries(data.customEntries || []);
        setTimeframeMonths(data.timeframeMonths);
        setPropertyName(data.propertyName || "");
        setNotes(data.notes || "");
      }
      setLoadingCalc(false);
    })();
  }, [user, calcId, load, listClients]);

  // ── Handlers ──
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
    if (!user || !selectedIndustry || !preset) return;
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
      const result = await save(data, calcId, selectedClientId || undefined);
      if (result) {
        clearDraft();
        alert("Saved successfully!");
      } else {
        alert("Save failed — check the error banner.");
      }
    } catch (err) {
      alert("Save failed: " + (err instanceof Error ? err.message : String(err)));
    }
    setSaving(false);
  }, [user, selectedIndustry, preset, propertyName, entries, customEntries, timeframeMonths, notes, calcId, selectedClientId, save, clearDraft]);

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

  if (loadingCalc || !preset) {
    return (
      <div ref={mobileRef} style={{ minHeight: "calc(100vh - 48px)", background: "var(--bg)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: "var(--text4)", fontSize: 14, fontFamily: SANS }}>Loading...</div>
      </div>
    );
  }

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
          <button onClick={() => window.location.href = "/cost-of-inaction"}
            style={{ background: "var(--bg3)", border: "1px solid var(--border3)", borderRadius: 8, color: "var(--text3)", cursor: "pointer", padding: "5px 12px", fontSize: 12, flexShrink: 0 }}>
            ← {isMobile ? "" : "Back"}
          </button>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{preset.icon}</span>
          <input
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder={preset.name}
            style={{
              background: "transparent", border: "none", color: "var(--text)",
              fontWeight: 700, fontSize: isMobile ? 12 : 14, outline: "none", fontFamily: SANS,
              width: isMobile ? "auto" : 200, minWidth: 0, flex: isMobile ? 1 : undefined, maxWidth: isMobile ? 120 : undefined,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
          {isMobile && (["calculator", "results"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "var(--bg3)" : "transparent",
                border: `1px solid ${activeTab === tab ? "var(--border3)" : "transparent"}`,
                borderRadius: 8, color: activeTab === tab ? "var(--text)" : "var(--text4)",
                cursor: "pointer", padding: "5px 10px", fontSize: 11, fontWeight: 600,
              }}>
              {tab === "calculator" ? "✏️ Edit" : "📊 Results"}
            </button>
          ))}
          <button onClick={handleSave} disabled={saving}
            style={{
              background: saving ? "var(--bg3)" : "linear-gradient(135deg,#10b981,#059669)",
              border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
              padding: isMobile ? "5px 10px" : "5px 14px", fontSize: isMobile ? 11 : 12, fontWeight: 600, opacity: saving ? 0.6 : 1,
            }}>
            {saving ? "..." : "Save"}
          </button>
          <ExportMenu
            getHtml={getExportHtml}
            getPlainText={getPlainText}
            filename={`cost-of-inaction-${propertyName || preset.name}`.toLowerCase().replace(/\s+/g, "-")}
            title="Cost of Inaction"
            accentColor={preset.color}
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
              <div style={{ fontSize: 12, color: "var(--text)", wordBreak: "break-word" }}>{saveError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto", minHeight: "calc(100vh - 106px)" }}>
        {/* Left: Calculator */}
        <div style={{
          width: isMobile ? "100%" : "45%", padding: isMobile ? "16px 12px" : "20px",
          display: isMobile && activeTab !== "calculator" ? "none" : "block", overflowY: "auto",
        }}>
          <div style={{ marginBottom: 20 }}>
            <TimeframeSelector months={timeframeMonths} onChange={setTimeframeMonths} accentColor={preset.color} />
          </div>

          <div style={{
            background: `${preset.color}15`, border: `1px solid ${preset.color}30`, borderRadius: 12,
            padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Monthly Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: preset.color, fontFamily: MONO }}>${monthlyTotal.toLocaleString()}</span>
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
            Cost Categories (per month)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {entries.map((e) => (
              <CostInputRow key={e.categoryId} entry={e} onAmountChange={handleAmountChange} onToggle={handleToggle} accentColor={preset.color} />
            ))}
            {customEntries.map((e) => (
              <CostInputRow key={e.categoryId} entry={e} onAmountChange={handleAmountChange} onToggle={handleToggle} onRemove={handleRemoveCustom} accentColor={preset.color} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom(); }}
              placeholder="Add custom cost category..."
              style={{ flex: 1, padding: "8px 12px", background: "var(--iBg)", border: "1px solid var(--iBd)", borderRadius: 8, color: "var(--text)", fontSize: 12, fontFamily: SANS, outline: "none" }}
            />
            <button onClick={handleAddCustom}
              style={{ background: preset.color, border: "none", borderRadius: 8, color: "#fff", padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              + Add
            </button>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              style={{ width: "100%", padding: "10px 14px", background: "var(--iBg)", border: "1px solid var(--iBd)", borderRadius: 10, color: "var(--text)", fontSize: 12, fontFamily: SANS, outline: "none", resize: "vertical" }}
            />
          </div>
        </div>

        {/* Right: Results */}
        <div style={{
          width: isMobile ? "100%" : "55%", padding: isMobile ? "16px 12px" : "20px",
          display: isMobile && activeTab !== "results" ? "none" : "block",
          borderLeft: isMobile ? "none" : "1px solid var(--border)", overflowY: "auto",
        }}>
          <ResultsDashboard
            entries={entries} customEntries={customEntries} timeframeMonths={timeframeMonths}
            accentColor={preset.color} industryName={preset.name} isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}
