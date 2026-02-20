"use client";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { TemplateId, PhotoEntry, TemplateDefinition, MapData } from "@/lib/proposals/types";
import { TEMPLATES } from "@/lib/proposals/templates";
import { generateContent } from "@/lib/proposals/content-generator";
import { buildProposalExportHTML } from "@/lib/proposals/export-html";
import { rasterizeMap } from "@/lib/proposals/map-rasterize";
import { useAuth } from "@/hooks/useAuth";
import { useProposals, type ProposalListItem } from "@/hooks/useProposals";
import { useClients } from "@/hooks/useClients";
import type { Client } from "@/lib/supabase/database.types";
import { buildSectionList, groupFieldsBySection } from "@/lib/proposals/section-utils";
import ProposalPreview from "@/components/proposals/ProposalPreview";
import PhotoUploader from "@/components/proposals/PhotoUploader";
import MapAnnotator from "@/components/proposals/MapAnnotator";
import ProposalFormField from "@/components/proposals/ProposalFormField";
import SectionList from "@/components/proposals/SectionList";
import SectionPanel from "@/components/proposals/SectionPanel";
import ExportMenu from "@/components/ExportMenu";
import ClientSelector from "@/components/ClientSelector";
import { exportWord } from "@/lib/export";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useKeyboardShortcuts, SHORTCUT_LIST } from "@/hooks/useKeyboardShortcuts";
import { useAutoSave, type AutoSaveData } from "@/hooks/useAutoSave";

const SANS = "'DM Sans',sans-serif";
const MONO = "'DM Mono',monospace";

/** Preset accent colours for quick selection */
const ACCENT_PRESETS = [
  "#E63946", "#457B9D", "#2A9D8F", "#E9C46A", "#7B68EE", "#6366F1",
  "#10B981", "#F97316", "#DC2626", "#0EA5E9", "#8B5CF6", "#EC4899",
];

// All templates now show the Site Map & Equipment diagram
// (previously limited to NON_BED_BUG only)

export default function ProposalGeneratorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { list: listProposals, save: saveProposal, finalize: finalizeProposal, remove: removeProposal, saveError } = useProposals();
  const { list: listClients, save: saveClient } = useClients();
  const [isMobile, mobileRef] = useIsMobile(768);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [inspectionDate, setInspectionDate] = useState("");
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [isDark, setIsDark] = useState(true);
  const [savedProposals, setSavedProposals] = useState<ProposalListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(null);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState<AutoSaveData | null>(null);
  const [showBrandBar, setShowBrandBar] = useState(false);

  // Sync theme
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current) setIsDark(current === "dark");
  }, []);

  // ── Auto-save to IndexedDB (includes photos + map) ──
  const autoSaveData = useMemo<AutoSaveData | null>(() => {
    if (!selectedTemplate || Object.keys(formData).length === 0) return null;
    return {
      templateId: selectedTemplate,
      formData,
      inspectionDate,
      selectedClientId: selectedClientId || undefined,
      photos,
      mapData,
      savedAt: Date.now(),
    };
  }, [selectedTemplate, formData, inspectionDate, selectedClientId, photos, mapData]);

  const { clear: clearDraft, restore: restoreDraft } = useAutoSave("new-proposal", autoSaveData);

  // Check for a saved draft on mount (async)
  useEffect(() => {
    restoreDraft().then((draft) => {
      if (draft && draft.templateId && Object.keys(draft.formData).length > 0) {
        setRestoredDraft(draft);
        setShowRestore(true);
      }
    });
  }, [restoreDraft]);

  const handleRestoreDraft = useCallback(() => {
    if (!restoredDraft) return;
    setSelectedTemplate(restoredDraft.templateId as TemplateId);
    setFormData(restoredDraft.formData);
    setInspectionDate(restoredDraft.inspectionDate || "");
    if (restoredDraft.selectedClientId) setSelectedClientId(restoredDraft.selectedClientId);
    if (restoredDraft.photos?.length) setPhotos(restoredDraft.photos);
    if (restoredDraft.mapData) setMapData(restoredDraft.mapData);
    setShowRestore(false);
    setRestoredDraft(null);
  }, [restoredDraft]);

  const handleDismissRestore = useCallback(() => {
    setShowRestore(false);
    setRestoredDraft(null);
    clearDraft();
  }, [clearDraft]);

  // Clear auto-save draft when proposal is saved to Supabase
  const clearDraftOnSave = clearDraft;

  // Warn before tab close / refresh
  const hasUnsavedWork = selectedTemplate !== null && Object.keys(formData).length > 0;
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedWork]);

  // Load saved proposals + clients
  useEffect(() => {
    if (user) {
      listProposals().then((items) => setSavedProposals(items.filter((p) => p.template_id !== "cost_of_inaction")));
      listClients().then((items) => {
        setClientsList(items);
        // Pre-select client from ?clientId query param
        const qClientId = new URLSearchParams(window.location.search).get("clientId");
        if (qClientId && items.some((c) => c.id === qClientId)) {
          setSelectedClientId(qClientId);
        }
      });
    }
  }, [user, listProposals, listClients]);

  const handleCreateClient = useCallback(async (name: string): Promise<string | null> => {
    const newId = await saveClient({ name });
    if (newId) {
      const updated = await listClients();
      setClientsList(updated);
    }
    return newId;
  }, [saveClient, listClients]);

  const handleSaveProposal = useCallback(async () => {
    if (!selectedTemplate) {
      alert("No template selected. Please select a template first.");
      return;
    }
    if (!user) {
      alert("You must be signed in to save. Please log in.");
      return;
    }
    setSaving(true);
    try {
      const name = formData.property_name || formData.restaurant_name || TEMPLATES[selectedTemplate].name;
      console.log("[SaveDraft] Starting save for:", name, "template:", selectedTemplate, "user:", user.id);
      const id = await saveProposal({
        templateId: selectedTemplate,
        name,
        formData,
        inspectionDate: inspectionDate || undefined,
        clientId: selectedClientId || undefined,
        mapData: mapData || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
      console.log("[SaveDraft] Save returned id:", id);
      if (id) {
        clearDraftOnSave(); // Only clear auto-save AFTER confirmed save
        router.push(`/proposals/${id}`);
      } else {
        alert("Save failed — check the red error banner below the toolbar. Your data is safe in auto-save.");
      }
    } catch (err) {
      console.error("[ProposalPage] Save error:", err);
      alert("Save failed unexpectedly. Your data is safe in auto-save.\n\nError: " + (err instanceof Error ? err.message : String(err)));
    }
    setSaving(false);
  }, [selectedTemplate, formData, inspectionDate, selectedClientId, mapData, photos, saveProposal, router, clearDraftOnSave, user]);

  const handleSaveAndFinalize = useCallback(async () => {
    if (!selectedTemplate) {
      alert("No template selected. Please select a template first.");
      return;
    }
    if (!user) {
      alert("You must be signed in to save. Please log in.");
      return;
    }
    setFinalizing(true);
    try {
      const name = formData.property_name || formData.restaurant_name || TEMPLATES[selectedTemplate].name;
      console.log("[Save&Finalize] Starting save for:", name, "template:", selectedTemplate, "user:", user.id);
      // 1. Save everything to Supabase first
      const id = await saveProposal({
        templateId: selectedTemplate,
        name,
        formData,
        inspectionDate: inspectionDate || undefined,
        clientId: selectedClientId || undefined,
        mapData: mapData || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
      console.log("[Save&Finalize] Save returned id:", id);
      if (id) {
        // 2. Generate finalized HTML (Word-formatted for download)
        const content = generateContent(selectedTemplate, formData);
        const customerHtml = buildProposalExportHTML(content, accentColor, photos, inspectionDate, false, mapData, "customer", null, companyName);
        const internalHtml = buildProposalExportHTML(content, accentColor, photos, inspectionDate, false, mapData, "internal", null, companyName);
        const customerWordHtml = buildProposalExportHTML(content, accentColor, photos, inspectionDate, true, mapData, "customer", mapImageRef.current, companyName);
        const internalWordHtml = buildProposalExportHTML(content, accentColor, photos, inspectionDate, true, mapData, "internal", mapImageRef.current, companyName);
        // 3. Save snapshots + mark as "sent"
        const version = await finalizeProposal({ proposalId: id, customerHtml, internalHtml, formData });
        console.log("[Save&Finalize] Finalize returned version:", version);
        if (version) {
          // 4. Auto-download both Word docs so user has the finished reports
          const fileName = name.replace(/[<>:"/\\|?*]/g, "").trim() || "Proposal";
          exportWord(customerWordHtml, fileName);
          exportWord(internalWordHtml, `${fileName}_Internal`);
          clearDraftOnSave();
          router.push(`/proposals/${id}`);
        } else {
          alert("Finalize failed — the proposal was saved but the finalized version could not be created. Check the error banner below the toolbar.");
        }
      } else {
        alert("Save failed — could not save proposal to database. Check the red error banner below the toolbar. Your data is safe in auto-save.");
      }
    } catch (err) {
      console.error("[ProposalPage] Save & Finalize error:", err);
      alert("Save & Finalize failed unexpectedly. Your data is safe in auto-save.\n\nError: " + (err instanceof Error ? err.message : String(err)));
    }
    setFinalizing(false);
  }, [selectedTemplate, formData, inspectionDate, selectedClientId, mapData, photos, saveProposal, finalizeProposal, router, clearDraftOnSave, user]);

  const handleTemplateSelect = (key: TemplateId) => {
    setSelectedTemplate(key);
    setFormData({});
    setPhotos([]);
    setInspectionDate("");
    setMapData(null);
    setActiveTab("form");
    setOpenSectionIndex(null);
  };

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFormData((p) => ({ ...p, [key]: value }));
  }, []);

  // Effective accent color — user override stored in formData, fallback to template
  const accentColor = formData.accent_color || (selectedTemplate ? TEMPLATES[selectedTemplate].color : "#2A9D8F");
  // Company name — user override stored in formData, fallback to "PEST CONTROL"
  const companyName = formData.company_name || "PEST CONTROL";

  const getFileName = useCallback(() => {
    const name = formData.property_name || formData.restaurant_name || "Proposal";
    // Keep original name — only strip characters unsafe for filenames
    return name.replace(/[<>:"/\\|?*]/g, "").trim();
  }, [formData]);

  const getExportHtml = useCallback((opts?: { forWord?: boolean }) => {
    if (!selectedTemplate) return "";
    const fw = opts?.forWord ?? false;
    const content = generateContent(selectedTemplate, formData);
    return buildProposalExportHTML(content, accentColor, photos, inspectionDate, fw, mapData, "customer", fw ? mapImageRef.current : null, companyName);
  }, [selectedTemplate, formData, photos, inspectionDate, mapData, accentColor, companyName]);

  const getInternalHtml = useCallback((opts?: { forWord?: boolean }) => {
    if (!selectedTemplate) return "";
    const fw = opts?.forWord ?? false;
    const content = generateContent(selectedTemplate, formData);
    return buildProposalExportHTML(content, accentColor, photos, inspectionDate, fw, mapData, "internal", fw ? mapImageRef.current : null, companyName);
  }, [selectedTemplate, formData, photos, inspectionDate, mapData, accentColor, companyName]);

  const getPlainText = useCallback(() => {
    if (!selectedTemplate) return "";
    const content = generateContent(selectedTemplate, formData);
    let text = `${content.title}\n${content.subtitle}\n${content.address}\n\n`;
    content.sections.forEach((s) => {
      text += `${s.heading}\n`;
      s.items.forEach((item) => { text += `\u2022 ${item}\n`; });
      text += "\n";
    });
    return text;
  }, [selectedTemplate, formData]);

  const fillExample = useCallback(() => {
    if (!selectedTemplate) return;
    const d: Record<string, string> = {};
    TEMPLATES[selectedTemplate].fields.forEach((f) => {
      if (f.type === "checklist" || f.type === "checklist-add" || f.type === "multi-select" || f.type === "bullet-list") return;
      d[f.key] = f.placeholder?.replace("e.g., ", "") || "";
    });
    setFormData(d);
  }, [selectedTemplate]);

  const showMapAnnotator = !!selectedTemplate;
  const tmpl = selectedTemplate ? TEMPLATES[selectedTemplate] : null;

  // Cache rasterized map image for Word export
  const mapImageRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mapData || (mapData.markers.length === 0 && (!mapData.drawings || mapData.drawings.length === 0))) {
      mapImageRef.current = null;
      return;
    }
    rasterizeMap(mapData).then((src) => { mapImageRef.current = src; }).catch(() => { mapImageRef.current = null; });
  }, [mapData]);

  const filledCount = selectedTemplate
    ? TEMPLATES[selectedTemplate].fields.filter((f) => formData[f.key]?.trim()).length
    : 0;
  const totalFields = selectedTemplate ? TEMPLATES[selectedTemplate].fields.length : 0;

  // Build ordered section list
  const fieldGroups = useMemo(
    () => (tmpl ? groupFieldsBySection(tmpl.fields) : []),
    [tmpl],
  );

  const sections = useMemo(
    () =>
      tmpl
        ? buildSectionList(tmpl.fields, formData, {
            photoCount: photos.length,
            markerCount: mapData?.markers.length ?? 0,
            showMap: showMapAnnotator,
          })
        : [],
    [tmpl, formData, photos.length, mapData?.markers.length, showMapAnnotator],
  );

  // Section navigation
  const handleSectionClick = useCallback((index: number) => {
    setOpenSectionIndex(index);
    setActiveTab("form");
  }, []);

  const handleSectionClose = useCallback(() => {
    setOpenSectionIndex(null);
  }, []);

  const handleSectionPrev = useCallback(() => {
    setOpenSectionIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const handleSectionNext = useCallback(() => {
    setOpenSectionIndex((prev) =>
      prev !== null && prev < sections.length - 1 ? prev + 1 : prev,
    );
  }, [sections.length]);

  // Keyboard shortcuts (desktop)
  useKeyboardShortcuts({
    onSave: handleSaveProposal,
    onTogglePreview: () => { setActiveTab("preview"); setOpenSectionIndex(null); },
    onToggleEdit: () => setActiveTab("form"),
    onEscape: () => {
      if (openSectionIndex !== null) setOpenSectionIndex(null);
      else setSelectedTemplate(null);
    },
    onNextSection: handleSectionNext,
    onPrevSection: handleSectionPrev,
    onToggleHelp: () => setShowShortcuts((p) => !p),
  }, !!selectedTemplate);

  // Render content for a given section
  const renderSectionContent = (sectionIdx: number) => {
    const section = sections[sectionIdx];
    if (!section || !tmpl) return null;

    if (section.isSpecial === "photos") {
      return (
        <PhotoUploader
          photos={photos}
          onPhotosChange={setPhotos}
          inspectionDate={inspectionDate}
          onDateChange={setInspectionDate}
          accentColor={accentColor}
        />
      );
    }

    if (section.isSpecial === "map") {
      return (
        <MapAnnotator
          mapData={mapData}
          onMapDataChange={setMapData}
          accentColor={accentColor}
        />
      );
    }

    // Regular field group
    const group = fieldGroups[section.groupIndex];
    if (!group) return null;

    return (
      <>
        {group.fields.map((field, i) => {
          if (field.showIf) {
            const [depKey, depVal] = field.showIf.split(":");
            if (formData[depKey] !== depVal) return null;
          }
          return (
            <ProposalFormField
              key={field.key}
              field={field}
              value={formData[field.key] || ""}
              onChange={handleFieldChange}
              animDelay={i * 0.02}
            />
          );
        })}
      </>
    );
  };

  // ── Template Selection Screen ──
  if (!selectedTemplate) {
    return (
      <div style={{ minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)", fontFamily: SANS }}>
        <style>{`
          @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div style={{ textAlign: "center", padding: "50px 20px 36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#E63946,#457B9D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{"\u{1F4CB}"}</div>
            <div style={{ textAlign: "left" }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: "'Playfair Display',serif", background: "linear-gradient(135deg,#E63946,#457B9D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Proposal Builder</h1>
              <p style={{ margin: 0, fontSize: 11, color: "var(--text4)", letterSpacing: "2px", textTransform: "uppercase", fontFamily: MONO }}>Pest Control Services</p>
            </div>
          </div>
          <p style={{ color: "var(--text4)", fontSize: 14, maxWidth: 500, margin: "12px auto 0" }}>Select a template to create a professional, client-ready proposal in minutes.</p>
        </div>

        {/* Restore Draft Banner */}
        {showRestore && restoredDraft && (
          <div style={{
            maxWidth: 960, margin: "0 auto 20px", padding: "0 16px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 12, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 20 }}>{"\u{1F4BE}"}</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                  Unsaved draft found
                </div>
                <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>
                  {TEMPLATES[restoredDraft.templateId as TemplateId]?.name ?? "Proposal"}
                  {restoredDraft.photos?.length ? ` · ${restoredDraft.photos.length} photo${restoredDraft.photos.length > 1 ? "s" : ""}` : ""}
                  {restoredDraft.mapData ? " · map" : ""}
                  {" — "}{new Date(restoredDraft.savedAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleRestoreDraft} style={{
                  background: "linear-gradient(135deg,#F59E0B,#D97706)", border: "none",
                  borderRadius: 8, color: "#fff", cursor: "pointer", padding: "7px 16px",
                  fontSize: 12, fontWeight: 600,
                }}>
                  Restore
                </button>
                <button onClick={handleDismissRestore} style={{
                  background: "var(--bg3)", border: "1px solid var(--border3)",
                  borderRadius: 8, color: "var(--text4)", cursor: "pointer", padding: "7px 14px",
                  fontSize: 12, fontWeight: 500,
                }}>
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Proposals */}
        {user && savedProposals.length > 0 && (
          <div style={{ maxWidth: 960, margin: "0 auto 28px", padding: "0 16px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px", fontFamily: MONO }}>
              Saved Proposals
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedProposals.slice(0, 5).map((p) => {
                const t = TEMPLATES[p.template_id as TemplateId];
                const clientName = p.client_id ? clientsList.find((c) => c.id === p.client_id)?.name : null;
                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 0,
                    background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10,
                    overflow: "hidden",
                  }}>
                    <button onClick={() => router.push(`/proposals/${p.id}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                        background: "transparent", border: "none", borderRadius: 0,
                        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                        color: "var(--text)", fontFamily: SANS, flex: 1, minWidth: 0,
                      }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{t?.icon ?? "\u{1F4CB}"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name || "Untitled"}
                          {clientName && <span style={{ fontWeight: 400, color: "var(--text4)", marginLeft: 6 }}>— {clientName}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text5)", fontFamily: MONO }}>
                          {t?.name ?? p.template_id} {"\u00B7"} {p.status} {"\u00B7"} {new Date(p.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 6,
                        background: p.status === "accepted" ? "rgba(16,185,129,0.1)" : "var(--bg3)",
                        color: p.status === "accepted" ? "var(--accent)" : "var(--text5)",
                        fontWeight: 600, textTransform: "uppercase", flexShrink: 0,
                      }}>
                        {p.status}
                      </span>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Delete "${p.name || "Untitled"}"? This cannot be undone.`)) return;
                        await removeProposal(p.id);
                        setSavedProposals((prev) => prev.filter((x) => x.id !== p.id));
                      }}
                      style={{
                        background: "transparent", border: "none", borderLeft: "1px solid var(--border2)",
                        color: "#ef4444", cursor: "pointer", padding: "0 14px", fontSize: 16,
                        flexShrink: 0, height: "100%", minHeight: 52, display: "flex", alignItems: "center",
                        transition: "background 0.15s",
                      }}
                      title="Delete proposal"
                    >
                      {"\u{1F5D1}"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 260px),1fr))", gap: 16, maxWidth: 960, margin: "0 auto", padding: "0 16px 60px" }}>
          {(Object.entries(TEMPLATES) as [TemplateId, TemplateDefinition][]).map(([key, t], i) => (
            <button key={key} onClick={() => handleTemplateSelect(key)}
              style={{
                background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 14,
                padding: "28px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                animation: "slideIn 0.3s ease forwards", animationDelay: `${i * 0.06}s`, opacity: 0,
                position: "relative", overflow: "hidden", touchAction: "manipulation",
              }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: t.color, opacity: 0.7 }} />
              <div style={{ fontSize: 32, marginBottom: 10 }}>{t.icon}</div>
              <h3 style={{ margin: "0 0 6px", color: "var(--text)", fontSize: 16, fontWeight: 700 }}>{t.name}</h3>
              <p style={{ margin: 0, color: "var(--text4)", fontSize: 12, lineHeight: 1.5 }}>{t.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Form + Preview View with Section List + Slide Panel ──
  const openSection = openSectionIndex !== null ? sections[openSectionIndex] : null;

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
          <button onClick={() => setSelectedTemplate(null)}
            style={{ background: "var(--bg3)", border: "1px solid var(--border3)", borderRadius: 8, color: "var(--text3)", cursor: "pointer", padding: "5px 12px", fontSize: 12, flexShrink: 0 }}>
            {"\u2190"}{isMobile ? "" : " Templates"}
          </button>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{tmpl!.icon}</span>
          <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tmpl!.name}</span>
        </div>

        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 100, height: 5, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${(filledCount / totalFields) * 100}%`, height: "100%", background: accentColor, borderRadius: 3, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text4)", fontFamily: MONO }}>{filledCount}/{totalFields}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
          {(["form", "preview"] as const).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); if (tab === "preview") setOpenSectionIndex(null); }}
              style={{
                background: activeTab === tab ? "var(--bg3)" : "transparent",
                border: `1px solid ${activeTab === tab ? "var(--border3)" : "transparent"}`,
                borderRadius: 8, color: activeTab === tab ? "var(--text)" : "var(--text4)",
                cursor: "pointer", padding: isMobile ? "5px 10px" : "5px 14px", fontSize: 12, fontWeight: 600,
              }}>
              {tab === "form" ? "\u270F\uFE0F Edit" : "\u{1F441}\uFE0F Preview"}
            </button>
          ))}
          {user && (
            <>
              <ClientSelector
                clients={clientsList}
                selectedClientId={selectedClientId}
                onSelect={setSelectedClientId}
                onCreateClient={handleCreateClient}
                isMobile={isMobile}
              />
              <button onClick={handleSaveProposal} disabled={saving || finalizing}
                style={{
                  background: saving ? "var(--bg3)" : "linear-gradient(135deg,#10b981,#059669)",
                  border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                  padding: isMobile ? "5px 10px" : "5px 14px", fontSize: isMobile ? 11 : 12, fontWeight: 600, opacity: saving ? 0.6 : 1,
                }}>
                {saving ? "..." : isMobile ? "Save" : "Save Draft"}
              </button>
              <button onClick={handleSaveAndFinalize} disabled={saving || finalizing}
                style={{
                  background: finalizing ? "var(--bg3)" : "linear-gradient(135deg,#F59E0B,#D97706)",
                  border: "none", borderRadius: 8, color: "#fff", cursor: finalizing ? "not-allowed" : "pointer",
                  padding: isMobile ? "5px 10px" : "5px 14px", fontSize: isMobile ? 11 : 12, fontWeight: 600, opacity: finalizing ? 0.6 : 1,
                }}>
                {finalizing ? "..." : isMobile ? "Finalize" : "\u{1F4E8} Save & Finalize"}
              </button>
            </>
          )}
          <button
            onClick={() => setShowBrandBar((p) => !p)}
            title="Brand & Color Settings"
            style={{
              background: showBrandBar ? accentColor : "var(--bg3)",
              border: `1px solid ${showBrandBar ? accentColor : "var(--border3)"}`,
              borderRadius: 8,
              color: showBrandBar ? "#fff" : "var(--text4)",
              cursor: "pointer",
              padding: isMobile ? "5px 10px" : "5px 12px",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4,
              transition: "all 0.2s",
            }}>
            {"\u{1F3A8}"}{isMobile ? "" : " Brand"}
          </button>
          <ExportMenu
            getHtml={getExportHtml}
            getInternalHtml={getInternalHtml}
            getPlainText={getPlainText}
            filename={getFileName()}
            title={tmpl!.name}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Brand & Color Settings Bar */}
      {showBrandBar && (
        <div style={{
          position: isMobile ? "relative" : "sticky", top: isMobile ? undefined : 107, zIndex: 99,
          background: isDark ? "rgba(20,20,20,0.95)" : "rgba(250,250,245,0.95)",
          backdropFilter: isMobile ? undefined : "blur(12px)",
          borderBottom: "1px solid var(--border)",
          padding: isMobile ? "10px 12px" : "10px 20px",
        }}>
          <div style={{
            maxWidth: 1400, margin: "0 auto",
            display: "flex", alignItems: "center", gap: isMobile ? 10 : 20, flexWrap: "wrap",
          }}>
            {/* Company Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text4)", whiteSpace: "nowrap", fontFamily: SANS }}>
                Company
              </label>
              <input
                value={formData.company_name || ""}
                onChange={(e) => handleFieldChange("company_name", e.target.value)}
                placeholder="PEST CONTROL"
                style={{
                  background: "var(--bg3)", border: "1px solid var(--border3)",
                  borderRadius: 8, color: "var(--text)", padding: "5px 10px",
                  fontSize: 13, fontWeight: 700, fontFamily: SANS,
                  width: isMobile ? "100%" : 200, outline: "none",
                  letterSpacing: "-0.01em",
                }}
              />
            </div>

            {/* Accent Color */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text4)", whiteSpace: "nowrap", fontFamily: SANS }}>
                Color
              </label>
              <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleFieldChange("accent_color", c)}
                    title={c}
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: c, border: accentColor === c ? "2.5px solid #fff" : "2px solid transparent",
                      cursor: "pointer", flexShrink: 0,
                      boxShadow: accentColor === c ? `0 0 0 2px ${c}, 0 2px 6px rgba(0,0,0,0.3)` : "0 1px 3px rgba(0,0,0,0.15)",
                      transition: "all 0.15s",
                    }}
                  />
                ))}
                {/* Custom color picker */}
                <div style={{ position: "relative", width: 22, height: 22, flexShrink: 0 }}>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => handleFieldChange("accent_color", e.target.value)}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      opacity: 0, cursor: "pointer",
                    }}
                  />
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
                    border: "2px solid var(--border3)",
                    pointerEvents: "none",
                  }} />
                </div>
              </div>
            </div>

            {/* Reset button */}
            {(formData.accent_color || formData.company_name) && (
              <button
                onClick={() => {
                  handleFieldChange("accent_color", "");
                  handleFieldChange("company_name", "");
                }}
                style={{
                  background: "transparent", border: "1px solid var(--border3)",
                  borderRadius: 8, color: "var(--text5)", cursor: "pointer",
                  padding: "4px 10px", fontSize: 10, fontWeight: 600, fontFamily: SANS,
                  whiteSpace: "nowrap",
                }}>
                Reset to Default
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Error Banner */}
      {saveError && (
        <div style={{
          maxWidth: 1400, margin: "0 auto", padding: isMobile ? "8px 12px" : "8px 20px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 10, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 18 }}>{"\u26A0\uFE0F"}</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#DC2626" }}>Save Error</div>
              <div style={{ fontSize: 12, color: "var(--text)", marginTop: 2, wordBreak: "break-word" }}>{saveError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ display: "flex", maxWidth: isMobile ? "100%" : 1400, margin: "0 auto", minHeight: "calc(100vh - 106px)", overflowX: "hidden" }}>
        {/* Left: Section List + Slide Panel */}
        <div
          style={{
            width: activeTab === "form" ? (isMobile ? "100%" : 220) : 0,
            overflow: activeTab === "form" ? "visible" : "hidden",
            transition: isMobile ? "none" : "width 0.3s",
            borderRight: activeTab === "form" && !isMobile ? "1px solid var(--border)" : "none",
            flexShrink: isMobile ? 1 : 0,
            position: "relative",
          }}
        >
          {/* Section list */}
          {activeTab === "form" && (
            <SectionList
              sections={sections}
              activeIndex={openSectionIndex}
              onSectionClick={handleSectionClick}
              accentColor={accentColor}
            />
          )}

          {/* Fill example data button */}
          {activeTab === "form" && !isMobile && (
            <div style={{ padding: "8px 14px" }}>
              <button onClick={fillExample}
                style={{
                  width: "100%", background: "var(--bg3)", border: "1px solid var(--border3)",
                  borderRadius: 8, color: "var(--text4)", cursor: "pointer", padding: "8px 12px",
                  fontSize: 11, fontFamily: SANS,
                }}>
                {"\u26A1"} Fill example
              </button>
            </div>
          )}

          {/* Slide-over section panel (desktop) */}
          {!isMobile && (
            <SectionPanel
              isOpen={openSectionIndex !== null}
              title={openSection?.title ?? ""}
              icon={openSection?.icon ?? ""}
              sectionIndex={openSectionIndex ?? 0}
              totalSections={sections.length}
              onClose={handleSectionClose}
              onPrev={handleSectionPrev}
              onNext={handleSectionNext}
              accentColor={accentColor}
              isMobile={false}
            >
              {openSectionIndex !== null && renderSectionContent(openSectionIndex)}
            </SectionPanel>
          )}
        </div>

        {/* Mobile: Section panel as full-screen overlay */}
        {isMobile && (
          <SectionPanel
            isOpen={openSectionIndex !== null}
            title={openSection?.title ?? ""}
            icon={openSection?.icon ?? ""}
            sectionIndex={openSectionIndex ?? 0}
            totalSections={sections.length}
            onClose={handleSectionClose}
            onPrev={handleSectionPrev}
            onNext={handleSectionNext}
            accentColor={accentColor}
            isMobile={true}
          >
            {openSectionIndex !== null && renderSectionContent(openSectionIndex)}
          </SectionPanel>
        )}

        {/* Preview Panel */}
        <div style={{
          flex: 1, overflow: "auto", padding: isMobile ? 12 : 20,
          display: isMobile ? (activeTab === "preview" ? "block" : "none") : (activeTab === "preview" || activeTab === "form" ? "block" : "none"),
          background: "var(--bg2)",
        }}>
          <div style={{ maxWidth: 750, margin: "0 auto", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.15)" }}>
            <ProposalPreview templateKey={selectedTemplate} data={formData} templateConfig={tmpl!} photos={photos} inspectionDate={inspectionDate} mapData={mapData} colorOverride={accentColor} companyNameOverride={companyName} />
          </div>
        </div>
      </div>

      {/* Keyboard shortcut help button (desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setShowShortcuts((p) => !p)}
          title="Keyboard shortcuts (Ctrl+/)"
          style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 200,
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--bg3)", border: "1px solid var(--border3)",
            color: "var(--text4)", cursor: "pointer", fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}>
          ?
        </button>
      )}

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div
          onClick={() => setShowShortcuts(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg2)", border: "1px solid var(--border2)",
              borderRadius: 14, padding: isMobile ? "20px 16px" : "24px 28px", width: "90%", maxWidth: 360,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Keyboard Shortcuts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SHORTCUT_LIST.map((s) => (
                <div key={s.keys} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
                  <span style={{ fontSize: 13, color: "var(--text4)" }}>{s.label}</span>
                  <kbd style={{
                    fontSize: 11, padding: "3px 8px", borderRadius: 6,
                    background: "var(--bg3)", border: "1px solid var(--border3)",
                    color: "var(--text)", fontFamily: MONO, fontWeight: 600,
                  }}>{s.keys}</kbd>
                </div>
              ))}
            </div>
            <p style={{ margin: "16px 0 0", fontSize: 11, color: "var(--text5)", textAlign: "center" }}>
              Press Esc or click outside to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
