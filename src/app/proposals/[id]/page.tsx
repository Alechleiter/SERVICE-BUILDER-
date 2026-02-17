"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProposals } from "@/hooks/useProposals";
import { useClients } from "@/hooks/useClients";
import type { Client } from "@/lib/supabase/database.types";
import type { TemplateId, PhotoEntry, MapData } from "@/lib/proposals/types";
import { TEMPLATES } from "@/lib/proposals/templates";
import { generateContent } from "@/lib/proposals/content-generator";
import { buildProposalExportHTML } from "@/lib/proposals/export-html";
import { rasterizeMap } from "@/lib/proposals/map-rasterize";
import { buildSectionList, groupFieldsBySection } from "@/lib/proposals/section-utils";
import ProposalPreview from "@/components/proposals/ProposalPreview";
import PhotoUploader from "@/components/proposals/PhotoUploader";
import MapAnnotator from "@/components/proposals/MapAnnotator";
import ProposalFormField from "@/components/proposals/ProposalFormField";
import SectionList from "@/components/proposals/SectionList";
import SectionPanel from "@/components/proposals/SectionPanel";
import ExportMenu from "@/components/ExportMenu";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useKeyboardShortcuts, SHORTCUT_LIST } from "@/hooks/useKeyboardShortcuts";

const SANS = "'DM Sans',sans-serif";
const MONO = "'DM Mono',monospace";

// All templates now show the Site Map & Equipment diagram

export default function SavedProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { load, save, finalize } = useProposals();
  const { list: listClients } = useClients();
  const [isMobile, mobileRef] = useIsMobile(768);

  const proposalId = params.id as string;

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [inspectionDate, setInspectionDate] = useState("");
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [isDark, setIsDark] = useState(true);
  const [proposalName, setProposalName] = useState("");
  const [loadingProposal, setLoadingProposal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizedVersion, setFinalizedVersion] = useState<number | null>(null);
  const [openSectionIndex, setOpenSectionIndex] = useState<number | null>(null);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Sync theme
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current) setIsDark(current === "dark");
  }, []);

  // Load proposal + clients
  useEffect(() => {
    if (!user || !proposalId) return;
    listClients().then((items) => setClientsList(items));
    (async () => {
      setLoadingProposal(true);
      const proposal = await load(proposalId);
      if (proposal) {
        setSelectedTemplate(proposal.template_id as TemplateId);
        setFormData((proposal.form_data ?? {}) as Record<string, string>);
        setProposalName(proposal.name ?? "");
        if (proposal.inspection_date) setInspectionDate(proposal.inspection_date);
        if (proposal.client_id) setSelectedClientId(proposal.client_id);
      }
      setLoadingProposal(false);
    })();
  }, [user, proposalId, load, listClients]);

  const handleSave = useCallback(async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    await save({
      id: proposalId,
      templateId: selectedTemplate,
      name: proposalName || undefined,
      formData,
      inspectionDate: inspectionDate || undefined,
      clientId: selectedClientId || undefined,
    });
    setSaving(false);
  }, [proposalId, selectedTemplate, proposalName, formData, inspectionDate, selectedClientId, save]);

  const handleFinalize = useCallback(async () => {
    if (!selectedTemplate) return;
    setFinalizing(true);
    // First save current state
    await save({
      id: proposalId,
      templateId: selectedTemplate,
      name: proposalName || undefined,
      formData,
      inspectionDate: inspectionDate || undefined,
      clientId: selectedClientId || undefined,
    });
    // Generate both versions
    const content = generateContent(selectedTemplate, formData);
    const customerHtml = buildProposalExportHTML(content, TEMPLATES[selectedTemplate].color, photos, inspectionDate, false, mapData, "customer");
    const internalHtml = buildProposalExportHTML(content, TEMPLATES[selectedTemplate].color, photos, inspectionDate, false, mapData, "internal");
    // Save snapshots
    const version = await finalize({ proposalId, customerHtml, internalHtml, formData });
    setFinalizedVersion(version);
    setFinalizing(false);
    // Clear notification after 3 seconds
    setTimeout(() => setFinalizedVersion(null), 3000);
  }, [proposalId, selectedTemplate, proposalName, formData, inspectionDate, selectedClientId, photos, mapData, save, finalize]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFormData((p) => ({ ...p, [key]: value }));
  }, []);

  const filledCount = selectedTemplate
    ? TEMPLATES[selectedTemplate].fields.filter((f) => formData[f.key]?.trim()).length
    : 0;
  const totalFields = selectedTemplate ? TEMPLATES[selectedTemplate].fields.length : 0;

  const getFileName = useCallback(() => {
    const name = formData.property_name || formData.restaurant_name || proposalName || "Proposal";
    return name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
  }, [formData, proposalName]);

  const getExportHtml = useCallback((opts?: { forWord?: boolean }) => {
    if (!selectedTemplate) return "";
    const fw = opts?.forWord ?? false;
    const content = generateContent(selectedTemplate, formData);
    return buildProposalExportHTML(content, TEMPLATES[selectedTemplate].color, photos, inspectionDate, fw, mapData, "customer", fw ? mapImageRef.current : null);
  }, [selectedTemplate, formData, photos, inspectionDate, mapData]);

  const getInternalHtml = useCallback((opts?: { forWord?: boolean }) => {
    if (!selectedTemplate) return "";
    const fw = opts?.forWord ?? false;
    const content = generateContent(selectedTemplate, formData);
    return buildProposalExportHTML(content, TEMPLATES[selectedTemplate].color, photos, inspectionDate, fw, mapData, "internal", fw ? mapImageRef.current : null);
  }, [selectedTemplate, formData, photos, inspectionDate, mapData]);

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
    onSave: handleSave,
    onTogglePreview: () => { setActiveTab("preview"); setOpenSectionIndex(null); },
    onToggleEdit: () => setActiveTab("form"),
    onFinalize: handleFinalize,
    onEscape: () => {
      if (openSectionIndex !== null) setOpenSectionIndex(null);
      else router.push("/proposals");
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
          accentColor={tmpl.color}
        />
      );
    }

    if (section.isSpecial === "map") {
      return (
        <MapAnnotator
          mapData={mapData}
          onMapDataChange={setMapData}
          accentColor={tmpl.color}
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

  if (loadingProposal) {
    return (
      <div style={{
        minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)",
        fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ color: "var(--text4)", fontSize: 14 }}>Loading proposal...</p>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div style={{
        minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)",
        fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text4)", fontSize: 14, marginBottom: 16 }}>Proposal not found.</p>
          <button onClick={() => router.push("/proposals")} style={{
            padding: "8px 20px", background: "var(--bg3)", border: "1px solid var(--border3)",
            borderRadius: 8, color: "var(--text4)", cursor: "pointer", fontSize: 13,
          }}>
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  const openSection = openSectionIndex !== null ? sections[openSectionIndex] : null;

  return (
    <div ref={mobileRef} style={{ minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)", fontFamily: SANS, overflowX: "hidden" }}>
      {/* Top Bar */}
      <div style={{
        position: "sticky", top: 48, zIndex: 100,
        background: isDark ? "rgba(15,15,15,0.92)" : "rgba(245,245,240,0.92)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)",
        padding: isMobile ? "8px 12px" : "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: isMobile ? 6 : 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, minWidth: 0 }}>
          <button onClick={() => router.push("/proposals")}
            style={{ background: "var(--bg3)", border: "1px solid var(--border3)", borderRadius: 8, color: "var(--text3)", cursor: "pointer", padding: "5px 12px", fontSize: 12, flexShrink: 0 }}>
            {"\u2190"}{isMobile ? "" : " Back"}
          </button>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{tmpl!.icon}</span>
          <input
            value={proposalName}
            onChange={(e) => setProposalName(e.target.value)}
            placeholder="Untitled Proposal"
            style={{
              background: "transparent", border: "none", color: "var(--text)",
              fontWeight: 700, fontSize: isMobile ? 12 : 14, outline: "none", fontFamily: SANS,
              width: isMobile ? "auto" : 200, minWidth: 0, flex: isMobile ? 1 : undefined, maxWidth: isMobile ? 120 : undefined,
            }}
          />
        </div>

        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 100, height: 5, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${(filledCount / totalFields) * 100}%`, height: "100%", background: tmpl!.color, borderRadius: 3, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text4)", fontFamily: MONO }}>{filledCount}/{totalFields}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {!isMobile && (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{
                background: "var(--bg3)", border: "1px solid var(--border3)", borderRadius: 8,
                color: "var(--text)", padding: "5px 10px", fontSize: 12, fontFamily: SANS,
                cursor: "pointer", maxWidth: 160,
              }}>
              <option value="">— No Client —</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            background: saving ? "var(--bg3)" : "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
            border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            padding: "5px 14px", fontSize: 12, fontWeight: 600, opacity: saving ? 0.6 : 1,
          }}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={handleFinalize} disabled={finalizing} style={{
            background: finalizing
              ? "var(--bg3)"
              : finalizedVersion
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "linear-gradient(135deg,#F59E0B,#D97706)",
            border: "none", borderRadius: 8, color: "#fff", cursor: finalizing ? "not-allowed" : "pointer",
            padding: "5px 14px", fontSize: 12, fontWeight: 600, opacity: finalizing ? 0.6 : 1,
          }}>
            {finalizing ? "Finalizing..." : finalizedVersion ? `\u2713 v${finalizedVersion}` : "\u{1F4E8} Finalize"}
          </button>
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
          <ExportMenu getHtml={getExportHtml} getInternalHtml={getInternalHtml} getPlainText={getPlainText} filename={getFileName()} title={tmpl!.name} accentColor={tmpl!.color} />
        </div>
      </div>

      {/* Content */}
      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto", minHeight: "calc(100vh - 106px)" }}>
        {/* Left: Section List + Slide Panel */}
        <div
          style={{
            width: activeTab === "form" ? (isMobile ? "100%" : 220) : 0,
            overflow: activeTab === "form" ? "visible" : "hidden",
            transition: "width 0.3s",
            borderRight: activeTab === "form" && !isMobile ? "1px solid var(--border)" : "none",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {/* Section list */}
          {activeTab === "form" && (
            <SectionList
              sections={sections}
              activeIndex={openSectionIndex}
              onSectionClick={handleSectionClick}
              accentColor={tmpl!.color}
            />
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
              accentColor={tmpl!.color}
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
            accentColor={tmpl!.color}
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
            <ProposalPreview templateKey={selectedTemplate} data={formData} templateConfig={tmpl!} photos={photos} inspectionDate={inspectionDate} mapData={mapData} />
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
