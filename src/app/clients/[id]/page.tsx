"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { useProposals, type ProposalListItem } from "@/hooks/useProposals";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Client } from "@/lib/supabase/database.types";
import { TEMPLATES } from "@/lib/proposals/templates";

const VERTICALS = [
  { id: "hotel", icon: "\u{1F3E8}", label: "Hotel / Resort" },
  { id: "restaurant", icon: "\u{1F37D}\uFE0F", label: "Restaurant / Bar" },
  { id: "healthcare", icon: "\u{1F3E5}", label: "Healthcare" },
  { id: "office", icon: "\u{1F3E2}", label: "Office / Commercial" },
  { id: "warehouse", icon: "\u{1F3ED}", label: "Warehouse / Industrial" },
  { id: "residential", icon: "\u{1F3E0}", label: "Residential" },
  { id: "school", icon: "\u{1F3EB}", label: "School / Education" },
  { id: "retail", icon: "\u{1F6CD}\uFE0F", label: "Retail" },
];

const SANS = "'Inter','DM Sans',sans-serif";
const MONO = "'DM Mono',monospace";

/** Map template_id to a human-readable name + icon */
function templateMeta(templateId: string): { name: string; icon: string; color: string } {
  if (templateId === "cost_of_inaction") {
    return { name: "Cost of Inaction", icon: "\u{1F4C9}", color: "#dc2626" };
  }
  const t = TEMPLATES[templateId as keyof typeof TEMPLATES];
  if (t) return { name: t.name, icon: t.icon, color: t.color };
  return { name: templateId, icon: "\u{1F4C4}", color: "#666" };
}

/** Route for opening a proposal/COI */
function proposalRoute(p: ProposalListItem): string {
  if (p.template_id === "cost_of_inaction") return `/cost-of-inaction/${p.id}`;
  return `/proposals/${p.id}`;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  draft: { bg: "rgba(156,163,175,0.12)", fg: "#9ca3af" },
  sent: { bg: "rgba(59,130,246,0.12)", fg: "#3b82f6" },
  accepted: { bg: "rgba(16,185,129,0.12)", fg: "#10b981" },
  declined: { bg: "rgba(239,68,68,0.12)", fg: "#ef4444" },
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { get: getClient, save: saveClient } = useClients();
  const { listByClient, updateBucket } = useProposals();
  const isMobile = useIsMobile(768);

  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [clientProposals, setClientProposals] = useState<ProposalListItem[]>([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);

  // Editing client info
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    name: "", address: "", contactName: "", contactEmail: "", contactPhone: "", verticalId: "", notes: "",
  });

  // Bucket UI
  const [activeBucket, setActiveBucket] = useState<string | null>(null); // null = "All"
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(new Set());
  const [bucketDropdownOpen, setBucketDropdownOpen] = useState<string | null>(null); // proposal id
  const [newBucketName, setNewBucketName] = useState("");
  const [creatingBucketFor, setCreatingBucketFor] = useState<string | null>(null); // proposal id

  // ── Load data ──────────────────────────────────────────────
  const fetchClient = useCallback(async () => {
    if (!user || !clientId) return;
    setLoadingClient(true);
    const c = await getClient(clientId);
    setClient(c);
    if (c) {
      setInfoForm({
        name: c.name,
        address: c.address ?? "",
        contactName: c.contact_name ?? "",
        contactEmail: c.contact_email ?? "",
        contactPhone: c.contact_phone ?? "",
        verticalId: c.vertical_id ?? "",
        notes: c.notes ?? "",
      });
    }
    setLoadingClient(false);
  }, [user, clientId, getClient]);

  const fetchProposals = useCallback(async () => {
    if (!user || !clientId) return;
    setLoadingProposals(true);
    const items = await listByClient(clientId);
    setClientProposals(items);
    setLoadingProposals(false);
  }, [user, clientId, listByClient]);

  useEffect(() => {
    fetchClient();
    fetchProposals();
  }, [fetchClient, fetchProposals]);

  // ── Derived: bucket list & grouped proposals ───────────────
  const buckets = useMemo(() => {
    const set = new Set<string>();
    clientProposals.forEach((p) => { if (p.bucket) set.add(p.bucket); });
    return Array.from(set).sort();
  }, [clientProposals]);

  const filteredProposals = useMemo(() => {
    if (activeBucket === null) return clientProposals;
    if (activeBucket === "__none__") return clientProposals.filter((p) => !p.bucket);
    return clientProposals.filter((p) => p.bucket === activeBucket);
  }, [clientProposals, activeBucket]);

  /** Group proposals by bucket for the "All" view */
  const groupedByBucket = useMemo(() => {
    const groups: Record<string, ProposalListItem[]> = {};
    groups["Uncategorized"] = [];
    for (const b of buckets) groups[b] = [];
    for (const p of clientProposals) {
      const key = p.bucket ?? "Uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [clientProposals, buckets]);

  // ── Handlers ───────────────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!client) return;
    await saveClient({
      id: client.id,
      name: infoForm.name.trim() || client.name,
      address: infoForm.address || undefined,
      contactName: infoForm.contactName || undefined,
      contactEmail: infoForm.contactEmail || undefined,
      contactPhone: infoForm.contactPhone || undefined,
      verticalId: infoForm.verticalId || undefined,
      notes: infoForm.notes || undefined,
    });
    setEditingInfo(false);
    fetchClient();
  };

  const handleBucketChange = async (proposalId: string, bucket: string | null) => {
    await updateBucket(proposalId, bucket);
    setBucketDropdownOpen(null);
    fetchProposals();
  };

  const handleNewBucket = async (proposalId: string) => {
    if (!newBucketName.trim()) return;
    await updateBucket(proposalId, newBucketName.trim());
    setNewBucketName("");
    setCreatingBucketFor(null);
    setBucketDropdownOpen(null);
    fetchProposals();
  };

  const toggleCollapse = (bucket: string) => {
    setCollapsedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket); else next.add(bucket);
      return next;
    });
  };

  // ── Styles ─────────────────────────────────────────────────
  const pillBase: React.CSSProperties = {
    padding: "5px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
    fontFamily: SANS,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--bg2)",
    border: "1px solid var(--border2)",
    borderRadius: 10,
    padding: "14px 16px",
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    background: "var(--bg3)",
    border: "1px solid var(--border2)",
    borderRadius: 6,
    color: "var(--text)",
    fontSize: 12,
    fontFamily: SANS,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--text4)",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  };

  // ── Render ─────────────────────────────────────────────────
  if (loadingClient) {
    return (
      <div style={{ minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)", fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text4)", fontSize: 14 }}>Loading client...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)", fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <p style={{ color: "var(--text4)", fontSize: 16 }}>Client not found</p>
        <button onClick={() => router.push("/clients")} style={{ padding: "8px 20px", background: "var(--bg3)", border: "1px solid var(--border3)", borderRadius: 8, color: "var(--text)", cursor: "pointer", fontFamily: SANS, fontSize: 13 }}>
          Back to Clients
        </button>
      </div>
    );
  }

  const vert = VERTICALS.find((v) => v.id === client.vertical_id);

  // Render a proposal card
  const renderProposalCard = (p: ProposalListItem) => {
    const meta = templateMeta(p.template_id);
    const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS.draft;
    const ago = timeAgo(p.updated_at);
    return (
      <div
        key={p.id}
        style={cardStyle}
        onClick={() => router.push(proposalRoute(p))}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = meta.color; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14 }}>{meta.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.name || meta.name}
            </span>
            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: sc.bg, color: sc.fg, fontWeight: 600, fontFamily: MONO }}>{p.status}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text5)", fontFamily: MONO }}>
            {meta.name} &middot; {ago}
          </div>
        </div>
        {/* Bucket dropdown */}
        <div style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setBucketDropdownOpen(bucketDropdownOpen === p.id ? null : p.id)}
            style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11,
              background: p.bucket ? "rgba(16,185,129,0.08)" : "var(--bg3)",
              border: `1px solid ${p.bucket ? "rgba(16,185,129,0.2)" : "var(--border3)"}`,
              color: p.bucket ? "var(--accent, #10b981)" : "var(--text5)",
              cursor: "pointer", fontFamily: MONO, fontWeight: 600,
            }}
          >
            {p.bucket || "No Bucket"}
          </button>
          {bucketDropdownOpen === p.id && (
            <div style={{
              position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 50,
              background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 180, overflow: "hidden",
            }}>
              <button onClick={() => handleBucketChange(p.id, null)} style={ddItemStyle(false)}>
                <span style={{ color: "var(--text5)" }}>No Bucket</span>
              </button>
              {buckets.map((b) => (
                <button key={b} onClick={() => handleBucketChange(p.id, b)} style={ddItemStyle(p.bucket === b)}>
                  {p.bucket === b && <span style={{ marginRight: 4 }}>{"\u2713"}</span>}
                  {b}
                </button>
              ))}
              <div style={{ borderTop: "1px solid var(--border2)" }}>
                {creatingBucketFor === p.id ? (
                  <div style={{ padding: "8px 10px", display: "flex", gap: 6 }}>
                    <input
                      autoFocus
                      value={newBucketName}
                      onChange={(e) => setNewBucketName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleNewBucket(p.id); }}
                      placeholder="Bucket name..."
                      style={{ flex: 1, padding: "4px 6px", borderRadius: 4, border: "1px solid var(--border2)", background: "var(--bg3)", color: "var(--text)", fontSize: 11, fontFamily: SANS, outline: "none" }}
                    />
                    <button onClick={() => handleNewBucket(p.id)} style={{ padding: "4px 8px", borderRadius: 4, background: "var(--accent, #10b981)", color: "#fff", border: "none", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Add</button>
                  </div>
                ) : (
                  <button onClick={() => { setCreatingBucketFor(p.id); setNewBucketName(""); }} style={{ ...ddItemStyle(false), color: "var(--accent, #10b981)", fontWeight: 600 }}>
                    + New Bucket
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)", fontFamily: SANS, padding: isMobile ? "20px 16px" : "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Back + Title ───────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => router.push("/clients")}
            style={{
              padding: "6px 12px", borderRadius: 8, background: "var(--bg3)",
              border: "1px solid var(--border3)", color: "var(--text4)", cursor: "pointer",
              fontSize: 12, fontFamily: SANS, fontWeight: 600,
            }}
          >
            {"\u2190"} Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {vert && <span style={{ fontSize: 20 }}>{vert.icon}</span>}
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{client.name}</h1>
            </div>
            {client.address && (
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text4)" }}>{client.address}</p>
            )}
          </div>
          <button
            onClick={() => setEditingInfo(!editingInfo)}
            style={{
              padding: "6px 14px", borderRadius: 8,
              background: editingInfo ? "rgba(16,185,129,0.08)" : "var(--bg3)",
              border: `1px solid ${editingInfo ? "rgba(16,185,129,0.3)" : "var(--border3)"}`,
              color: editingInfo ? "var(--accent, #10b981)" : "var(--text4)",
              cursor: "pointer", fontSize: 12, fontFamily: SANS, fontWeight: 600,
            }}
          >
            {editingInfo ? "Cancel" : "Edit Info"}
          </button>
        </div>

        {/* ── Client Info Card (editable) ────────────────── */}
        {editingInfo && (
          <div style={{
            background: "var(--glass, var(--bg2))", border: "1px solid var(--glassBorder, var(--border2))",
            borderRadius: 14, padding: 20, marginBottom: 24,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <div style={labelStyle}>Name</div>
                <input value={infoForm.name} onChange={(e) => setInfoForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Address</div>
                <input value={infoForm.address} onChange={(e) => setInfoForm((p) => ({ ...p, address: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Contact Name</div>
                <input value={infoForm.contactName} onChange={(e) => setInfoForm((p) => ({ ...p, contactName: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Contact Email</div>
                <input value={infoForm.contactEmail} onChange={(e) => setInfoForm((p) => ({ ...p, contactEmail: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Contact Phone</div>
                <input value={infoForm.contactPhone} onChange={(e) => setInfoForm((p) => ({ ...p, contactPhone: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Vertical</div>
                <select value={infoForm.verticalId} onChange={(e) => setInfoForm((p) => ({ ...p, verticalId: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">-- Select --</option>
                  {VERTICALS.map((v) => <option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={labelStyle}>Notes</div>
                <textarea value={infoForm.notes} onChange={(e) => setInfoForm((p) => ({ ...p, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
            <button onClick={handleSaveInfo} style={{
              marginTop: 14, padding: "8px 20px", background: "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
              border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS,
            }}>
              Save Changes
            </button>
          </div>
        )}

        {/* ── Quick info row (non-editing) ────────────────── */}
        {!editingInfo && (client.contact_name || client.notes) && (
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12,
            padding: "14px 18px", marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12,
          }}>
            {client.contact_name && (
              <div>
                <span style={{ color: "var(--text5)", fontFamily: MONO, fontSize: 10 }}>CONTACT </span>
                <span style={{ fontWeight: 600 }}>{client.contact_name}</span>
                {client.contact_email && <span style={{ color: "var(--text4)" }}> &middot; {client.contact_email}</span>}
                {client.contact_phone && <span style={{ color: "var(--text4)" }}> &middot; {client.contact_phone}</span>}
              </div>
            )}
            {client.notes && (
              <div style={{ color: "var(--text4)", fontStyle: "italic", flex: 1, minWidth: 200 }}>
                {client.notes}
              </div>
            )}
          </div>
        )}

        {/* ── Stats row ──────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "12px 18px", flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{clientProposals.length}</div>
            <div style={{ fontSize: 11, color: "var(--text4)", fontFamily: MONO }}>TOTAL DOCUMENTS</div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "12px 18px", flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{buckets.length}</div>
            <div style={{ fontSize: 11, color: "var(--text4)", fontFamily: MONO }}>BUCKETS</div>
          </div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10, padding: "12px 18px", flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{clientProposals.filter((p) => p.status === "sent" || p.status === "accepted").length}</div>
            <div style={{ fontSize: 11, color: "var(--text4)", fontFamily: MONO }}>SENT / ACCEPTED</div>
          </div>
        </div>

        {/* ── Bucket filter pills ────────────────────────── */}
        {clientProposals.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            <button
              onClick={() => setActiveBucket(null)}
              style={{
                ...pillBase,
                background: activeBucket === null ? "var(--accent, #10b981)" : "var(--bg3)",
                color: activeBucket === null ? "#fff" : "var(--text4)",
                borderColor: activeBucket === null ? "var(--accent, #10b981)" : "var(--border3)",
              }}
            >
              All ({clientProposals.length})
            </button>
            {buckets.map((b) => {
              const count = clientProposals.filter((p) => p.bucket === b).length;
              return (
                <button
                  key={b}
                  onClick={() => setActiveBucket(activeBucket === b ? null : b)}
                  style={{
                    ...pillBase,
                    background: activeBucket === b ? "var(--accent, #10b981)" : "var(--bg3)",
                    color: activeBucket === b ? "#fff" : "var(--text4)",
                    borderColor: activeBucket === b ? "var(--accent, #10b981)" : "var(--border3)",
                  }}
                >
                  {b} ({count})
                </button>
              );
            })}
            {clientProposals.some((p) => !p.bucket) && (
              <button
                onClick={() => setActiveBucket(activeBucket === "__none__" ? null : "__none__")}
                style={{
                  ...pillBase,
                  background: activeBucket === "__none__" ? "var(--bg3)" : "transparent",
                  color: "var(--text5)",
                  borderColor: activeBucket === "__none__" ? "var(--border3)" : "transparent",
                  fontStyle: "italic",
                }}
              >
                Uncategorized ({clientProposals.filter((p) => !p.bucket).length})
              </button>
            )}
          </div>
        )}

        {/* ── Proposals ──────────────────────────────────── */}
        {loadingProposals && (
          <p style={{ textAlign: "center", color: "var(--text4)", fontSize: 13, padding: 40 }}>Loading documents...</p>
        )}

        {!loadingProposals && clientProposals.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px", background: "var(--bg2)",
            borderRadius: 14, border: "1px solid var(--border2)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{"\u{1F4C2}"}</div>
            <p style={{ color: "var(--text4)", fontSize: 14, margin: "0 0 16px" }}>
              No documents saved to this client yet.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/proposals" style={{
                display: "inline-block", padding: "8px 18px",
                background: "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
                borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, textDecoration: "none",
              }}>
                Create Proposal
              </a>
              <a href="/cost-of-inaction" style={{
                display: "inline-block", padding: "8px 18px",
                background: "var(--bg3)", border: "1px solid var(--border3)",
                borderRadius: 8, color: "var(--text4)", fontSize: 13, textDecoration: "none",
              }}>
                COI Calculator
              </a>
            </div>
          </div>
        )}

        {/* ── Grouped view (when "All" selected) ──────────── */}
        {!loadingProposals && activeBucket === null && clientProposals.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(groupedByBucket).map(([bucketName, items]) => {
              if (items.length === 0) return null;
              const isCollapsed = collapsedBuckets.has(bucketName);
              return (
                <div key={bucketName}>
                  <button
                    onClick={() => toggleCollapse(bucketName)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      background: "none", border: "none", cursor: "pointer", padding: "0 0 8px",
                      color: "var(--text)", fontFamily: SANS, fontSize: 14, fontWeight: 700,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", fontSize: 12 }}>{"\u25BC"}</span>
                    {bucketName}
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text5)", fontFamily: MONO }}>({items.length})</span>
                  </button>
                  {!isCollapsed && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {items.map(renderProposalCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Filtered view (specific bucket selected) ────── */}
        {!loadingProposals && activeBucket !== null && filteredProposals.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredProposals.map(renderProposalCard)}
          </div>
        )}
        {!loadingProposals && activeBucket !== null && filteredProposals.length === 0 && clientProposals.length > 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text4)", fontSize: 13 }}>
            No documents in this bucket.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
function ddItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "block", width: "100%", padding: "8px 14px", background: "none",
    border: "none", color: active ? "var(--accent, #10b981)" : "var(--text)",
    fontSize: 12, fontFamily: "'Inter','DM Sans',sans-serif", cursor: "pointer",
    textAlign: "left", fontWeight: active ? 700 : 400,
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
