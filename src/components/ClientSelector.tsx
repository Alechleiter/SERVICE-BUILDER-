"use client";
import { useState, useRef, useEffect } from "react";
import type { Client } from "@/lib/supabase/database.types";

const SANS = "'Inter','DM Sans',sans-serif";

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string;
  onSelect: (clientId: string) => void;
  /** Called after a new client is created — returns the new client id */
  onCreateClient: (name: string) => Promise<string | null>;
  isMobile?: boolean;
}

export default function ClientSelector({
  clients,
  selectedClientId,
  onSelect,
  onCreateClient,
  isMobile = false,
}: ClientSelectorProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Focus input when creating
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  // Close on outside click
  useEffect(() => {
    if (!creating) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setCreating(false);
        setNewName("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [creating]);

  // Brief green flash after creating a client
  useEffect(() => {
    if (!justCreated) return;
    const t = setTimeout(() => setJustCreated(false), 2000);
    return () => clearTimeout(t);
  }, [justCreated]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const newId = await onCreateClient(trimmed);
    setSaving(false);
    if (newId) {
      onSelect(newId);
      setCreating(false);
      setNewName("");
      setJustCreated(true);
    }
  };

  const handleSelectChange = (val: string) => {
    if (val === "__new__") {
      setCreating(true);
    } else {
      onSelect(val);
    }
  };

  const hasClient = !!selectedClientId;

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-flex" }}>
      {!creating ? (
        <select
          value={selectedClientId}
          onChange={(e) => handleSelectChange(e.target.value)}
          style={{
            background: hasClient ? "rgba(16,185,129,0.08)" : "var(--bg3)",
            border: `1px solid ${justCreated ? "#10b981" : hasClient ? "rgba(16,185,129,0.3)" : "var(--border3)"}`,
            borderRadius: 8,
            color: hasClient ? "var(--text)" : "var(--text4)",
            padding: "5px 10px",
            fontSize: isMobile ? 11 : 12,
            fontFamily: SANS,
            fontWeight: hasClient ? 600 : 400,
            cursor: "pointer",
            maxWidth: isMobile ? 130 : 170,
            transition: "all 0.2s",
          }}
        >
          <option value="">— No Client —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="__new__">+ New Client</option>
        </select>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
          }}
        >
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setCreating(false); setNewName(""); }
            }}
            placeholder="Client name..."
            disabled={saving}
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--accent, #10b981)",
              borderRadius: 6,
              color: "var(--text)",
              padding: "5px 8px",
              fontSize: isMobile ? 11 : 12,
              fontFamily: SANS,
              outline: "none",
              width: isMobile ? 110 : 140,
            }}
          />
          <button
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            style={{
              padding: "5px 8px",
              borderRadius: 6,
              fontSize: isMobile ? 10 : 11,
              fontWeight: 700,
              background: saving ? "var(--bg3)" : "var(--accent, #10b981)",
              color: "#fff",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: SANS,
              opacity: saving || !newName.trim() ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {saving ? "..." : "Add"}
          </button>
          <button
            onClick={() => { setCreating(false); setNewName(""); }}
            style={{
              padding: "5px 6px",
              borderRadius: 6,
              fontSize: 11,
              background: "none",
              color: "var(--text4)",
              border: "1px solid var(--border3)",
              cursor: "pointer",
              fontFamily: SANS,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
