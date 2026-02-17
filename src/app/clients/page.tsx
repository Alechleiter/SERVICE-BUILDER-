"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { useProposals, type ProposalListItem } from "@/hooks/useProposals";
import type { Client } from "@/lib/supabase/database.types";

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

export default function ClientsPage() {
  const { user, isConfigured } = useAuth();
  const { clients, loading, list, save, remove } = useClients();
  const { proposals, list: listProposals } = useProposals();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    verticalId: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      list();
      listProposals();
    }
  }, [user, list, listProposals]);

  const resetForm = () => {
    setForm({ name: "", address: "", contactName: "", contactEmail: "", contactPhone: "", verticalId: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (client: Client) => {
    setForm({
      name: client.name,
      address: client.address ?? "",
      contactName: client.contact_name ?? "",
      contactEmail: client.contact_email ?? "",
      contactPhone: client.contact_phone ?? "",
      verticalId: client.vertical_id ?? "",
      notes: client.notes ?? "",
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;
    await save({
      id: editingId ?? undefined,
      name: form.name.trim(),
      address: form.address || undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      verticalId: form.verticalId || undefined,
      notes: form.notes || undefined,
    });
    resetForm();
    list();
  }, [form, editingId, save, list]);

  const handleDelete = useCallback(async (id: string) => {
    await remove(id);
    list();
  }, [remove, list]);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--iBg, var(--bg2))",
    border: "1px solid var(--iBd, var(--border2))",
    borderRadius: 8,
    color: "var(--text)",
    fontSize: 13,
    fontFamily: SANS,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: 11,
    fontWeight: 600 as const,
    color: "var(--text4)",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  };

  // Not authenticated
  if (!isConfigured || !user) {
    return (
      <div style={{
        minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)",
        fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", padding: 40, maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u{1F465}"}</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Client Management</h2>
          <p style={{ color: "var(--text4)", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
            Sign in to save and manage your client and property records.
          </p>
          <a href="/auth" style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
            borderRadius: 8,
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}>Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "calc(100vh - 48px)", background: "var(--bg)", color: "var(--text)",
      fontFamily: SANS, padding: "32px 24px",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{"\u{1F465}"} Clients</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text4)", fontFamily: MONO }}>
              {clients.length} client{clients.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{
              padding: "8px 18px",
              background: "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: SANS,
            }}
          >
            + New Client
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{
            background: "var(--glass, var(--bg2))",
            border: "1px solid var(--glassBorder, var(--border2))",
            borderRadius: 14,
            padding: 24,
            marginBottom: 24,
            animation: "slideIn 0.2s ease forwards",
          }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700 }}>
              {editingId ? "Edit Client" : "New Client"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Property or business name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="123 Main St" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Name</label>
                <input value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                  placeholder="John Smith" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Email</label>
                <input type="email" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  placeholder="john@example.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="(555) 123-4567" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Vertical</label>
                <select value={form.verticalId} onChange={(e) => setForm((p) => ({ ...p, verticalId: e.target.value }))}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">-- Select --</option>
                  {VERTICALS.map((v) => (
                    <option key={v.id} value={v.id}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Any relevant notes..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={handleSave} style={{
                padding: "8px 20px",
                background: "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
                border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
                fontWeight: 600, cursor: "pointer", fontFamily: SANS,
              }}>
                {editingId ? "Update" : "Save"}
              </button>
              <button onClick={resetForm} style={{
                padding: "8px 20px",
                background: "var(--bg3)", border: "1px solid var(--border3)",
                borderRadius: 8, color: "var(--text4)", fontSize: 13,
                cursor: "pointer", fontFamily: SANS,
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p style={{ textAlign: "center", color: "var(--text4)", fontSize: 13, padding: 40 }}>Loading...</p>
        )}

        {/* Empty state */}
        {!loading && clients.length === 0 && !showForm && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "var(--bg2)", borderRadius: 14,
            border: "1px solid var(--border2)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{"\u{1F4C1}"}</div>
            <p style={{ color: "var(--text4)", fontSize: 14, margin: 0 }}>
              No clients yet. Click &quot;+ New Client&quot; to add your first one.
            </p>
          </div>
        )}

        {/* Client list */}
        {clients.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clients.map((client) => {
              const vert = VERTICALS.find((v) => v.id === client.vertical_id);
              const proposalCount = proposals.filter((p) => p.client_id === client.id).length;
              return (
                <div key={client.id} style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border2)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  transition: "all 0.15s",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      {vert && <span style={{ fontSize: 14 }}>{vert.icon}</span>}
                      <span style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {client.name}
                      </span>
                      {proposalCount > 0 && (
                        <span style={{
                          fontSize: 10, padding: "1px 7px", borderRadius: 10,
                          background: "rgba(16,185,129,0.1)", color: "var(--accent, #10b981)",
                          fontWeight: 600, fontFamily: MONO,
                        }}>
                          {proposalCount} proposal{proposalCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {client.address && (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text4)" }}>{client.address}</p>
                    )}
                    {client.contact_name && (
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text5)", fontFamily: MONO }}>
                        {client.contact_name} {client.contact_email ? `\u00B7 ${client.contact_email}` : ""}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => startEdit(client)} style={{
                      background: "var(--bg3)", border: "1px solid var(--border3)",
                      borderRadius: 6, color: "var(--text4)", cursor: "pointer",
                      padding: "4px 10px", fontSize: 11,
                    }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(client.id)} style={{
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 6, color: "#ef4444", cursor: "pointer",
                      padding: "4px 10px", fontSize: 11,
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
