"use client";
import type { TemplateField } from "@/lib/proposals/types";

const SANS = "'DM Sans',sans-serif";

function safeJsonArray(val: string | undefined): string[] {
  if (!val) return [];
  try { return JSON.parse(val) as string[]; } catch { return []; }
}

interface ProposalFormFieldProps {
  field: TemplateField;
  value: string;
  onChange: (key: string, value: string) => void;
  animDelay: number;
}

export default function ProposalFormField({ field, value, onChange, animDelay }: ProposalFormFieldProps) {
  const iStyle: React.CSSProperties = {
    width: "100%", background: "var(--iBg)", border: "1px solid var(--iBd)",
    borderRadius: 8, color: "var(--text)", padding: "10px 12px", fontSize: 13,
    fontFamily: SANS, outline: "none",
  };

  return (
    <div style={{ marginBottom: 18, animation: "slideIn 0.25s ease forwards", animationDelay: `${animDelay}s`, opacity: 0 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {field.label}
      </label>

      {field.type === "select" ? (
        <select value={value || ""} onChange={(e) => onChange(field.key, e.target.value)}
          style={{ ...iStyle, cursor: "pointer" }}>
          <option value="">{"\u2014"} Select {"\u2014"}</option>
          {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>

      ) : field.type === "textarea" ? (
        <textarea value={value || ""} onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder} rows={3}
          style={{ ...iStyle, resize: "vertical" }} />

      ) : field.type === "multi-select" ? (
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--iBd)", borderRadius: 8,
          padding: "8px 10px", maxHeight: 240, overflowY: "auto",
        }}>
          {field.options?.map((opt) => {
            const selected = (value || "").split(",").map(s => s.trim()).filter(Boolean);
            const isChecked = selected.includes(opt);
            return (
              <label key={opt} style={{
                display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0",
                cursor: "pointer", fontSize: 12, color: "var(--text)", lineHeight: 1.4,
              }}>
                <input type="checkbox" checked={isChecked}
                  onChange={() => {
                    const next = isChecked ? selected.filter(s => s !== opt) : [...selected, opt];
                    onChange(field.key, next.join(", "));
                  }}
                  style={{ marginTop: 2, flexShrink: 0, accentColor: "var(--accent, #10b981)" }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>

      ) : field.type === "bullet-list" ? (() => {
        const items = safeJsonArray(value);
        if (items.length === 0) items.push("");
        const update = (list: string[]) => onChange(field.key, JSON.stringify(list.length ? list : [""]));
        return (
          <div>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "flex-start" }}>
                <span style={{ color: "var(--text4)", fontSize: 13, fontWeight: 700, marginTop: 9, flexShrink: 0, userSelect: "none" }}>{"\u2022"}</span>
                <textarea value={item}
                  onChange={(e) => { const next = [...items]; next[i] = e.target.value; update(next); }}
                  placeholder={i === 0 ? (field.placeholder || "Enter finding...") : "Enter another finding..."}
                  rows={2}
                  style={{ ...iStyle, resize: "vertical", flex: 1 }} />
                {items.length > 1 && (
                  <button onClick={() => update(items.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "#f85149", cursor: "pointer", fontSize: 14, padding: "8px 4px", flexShrink: 0, lineHeight: 1 }}
                    title="Remove">{"\u2715"}</button>
                )}
              </div>
            ))}
            <button onClick={() => update([...items, ""])}
              style={{
                background: "var(--bg3)", border: "1px solid var(--border3)", borderRadius: 6,
                color: "var(--text3)", cursor: "pointer", padding: "5px 12px", fontSize: 11,
                fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 2,
              }}>
              + Add Finding
            </button>
          </div>
        );
      })()

      : (field.type === "checklist" || field.type === "checklist-add") ? (() => {
        const allChecked = safeJsonArray(value);
        const presetItems = (field.checklistCategories || []).flatMap(c => c.items);
        const customEntries = allChecked.filter(item => !presetItems.includes(item));
        return (
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--iBd)", borderRadius: 8,
            padding: "8px 10px", maxHeight: 320, overflowY: "auto",
          }}>
            {field.checklistCategories?.map((cat) => (
              <div key={cat.category} style={{ marginBottom: 10 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "var(--text3)",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                  padding: "4px 0", borderBottom: "1px solid var(--border)",
                  marginBottom: 4,
                }}>
                  {cat.category}
                </div>
                {cat.items.map((item) => {
                  const isChecked = allChecked.includes(item);
                  return (
                    <label key={item} style={{
                      display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0",
                      cursor: "pointer", fontSize: 12, color: "var(--text)", lineHeight: 1.4,
                    }}>
                      <input type="checkbox" checked={isChecked}
                        onChange={() => {
                          const next = isChecked ? allChecked.filter(i => i !== item) : [...allChecked, item];
                          onChange(field.key, JSON.stringify(next));
                        }}
                        style={{ marginTop: 2, flexShrink: 0, accentColor: "var(--accent, #10b981)" }}
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            ))}
            {field.type === "checklist-add" && customEntries.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "var(--text3)",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                  padding: "4px 0", borderBottom: "1px solid var(--border)",
                  marginBottom: 4,
                }}>Custom</div>
                {customEntries.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>
                    <span style={{ color: "var(--accent, #10b981)", fontSize: 14, flexShrink: 0 }}>{"\u2713"}</span>
                    <span style={{ flex: 1 }}>{item}</span>
                    <button onClick={() => onChange(field.key, JSON.stringify(allChecked.filter(i => i !== item)))}
                      style={{ background: "none", border: "none", color: "#f85149", cursor: "pointer", fontSize: 13, padding: "0 4px", flexShrink: 0, lineHeight: 1 }}
                      title="Remove">{"\u2715"}</button>
                  </div>
                ))}
              </div>
            )}
            {field.type === "checklist-add" && (
              <button onClick={() => {
                const custom = prompt("Enter custom item:");
                if (custom?.trim()) {
                  onChange(field.key, JSON.stringify([...allChecked, custom.trim()]));
                }
              }}
                style={{
                  background: "var(--bg3)", border: "1px solid var(--border3)", borderRadius: 6,
                  color: "var(--text3)", cursor: "pointer", padding: "5px 12px", fontSize: 11,
                  fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 6,
                }}>
                + Add Custom
              </button>
            )}
          </div>
        );
      })()

      : (
        <input type={field.type === "number" ? "number" : "text"} value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          style={iStyle} />
      )}
    </div>
  );
}
