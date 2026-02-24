"use client";
import { useState, useCallback } from "react";
import type { MapData } from "@/lib/proposals/types";
import MapAnnotator from "./MapAnnotator";

const SANS = "'DM Sans',sans-serif";

interface MultiMapEditorProps {
  maps: MapData[];
  onMapsChange: (maps: MapData[]) => void;
  accentColor: string;
}

export default function MultiMapEditor({ maps, onMapsChange, accentColor }: MultiMapEditorProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(maps.length === 0 ? null : 0);

  const handleAdd = useCallback(() => {
    const newMap: MapData = {
      id: Date.now(),
      title: `Site Map ${maps.length + 1}`,
      imageSrc: "",
      fileName: "",
      markers: [],
      drawings: [],
    };
    const next = [...maps, newMap];
    onMapsChange(next);
    setOpenIndex(next.length - 1);
  }, [maps, onMapsChange]);

  const handleRemove = useCallback((index: number) => {
    const name = maps[index]?.title || `Map ${index + 1}`;
    if (!confirm(`Remove "${name}"? This cannot be undone.`)) return;
    const next = maps.filter((_, i) => i !== index);
    onMapsChange(next);
    if (openIndex === index) setOpenIndex(null);
    else if (openIndex !== null && openIndex > index) setOpenIndex(openIndex - 1);
  }, [maps, onMapsChange, openIndex]);

  const handleTitleChange = useCallback((index: number, title: string) => {
    const next = [...maps];
    next[index] = { ...next[index], title };
    onMapsChange(next);
  }, [maps, onMapsChange]);

  const handleMapDataChange = useCallback((index: number, data: MapData | null) => {
    if (data === null) {
      // MapAnnotator sends null when "Remove Map" is clicked — remove diagram
      handleRemove(index);
      return;
    }
    const next = [...maps];
    next[index] = { ...data, id: maps[index].id, title: maps[index].title };
    onMapsChange(next);
  }, [maps, onMapsChange, handleRemove]);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    const next = [...maps];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onMapsChange(next);
    if (openIndex === index) setOpenIndex(index - 1);
    else if (openIndex === index - 1) setOpenIndex(index);
  }, [maps, onMapsChange, openIndex]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= maps.length - 1) return;
    const next = [...maps];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onMapsChange(next);
    if (openIndex === index) setOpenIndex(index + 1);
    else if (openIndex === index + 1) setOpenIndex(index);
  }, [maps, onMapsChange, openIndex]);

  const getSummary = (md: MapData) => {
    const parts: string[] = [];
    if (md.markers.length > 0) parts.push(`${md.markers.length} marker${md.markers.length !== 1 ? "s" : ""}`);
    if (md.drawings && md.drawings.length > 0) parts.push(`${md.drawings.length} drawing${md.drawings.length !== 1 ? "s" : ""}`);
    if (md.imageSrc) parts.push("has image");
    return parts.length > 0 ? parts.join(", ") : "empty";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Add button */}
      <button
        onClick={handleAdd}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "12px 16px", background: `${accentColor}12`, border: `1.5px dashed ${accentColor}55`,
          borderRadius: 10, color: accentColor, cursor: "pointer", fontSize: 13,
          fontWeight: 600, fontFamily: SANS, transition: "all 0.15s",
        }}
      >
        + Add Map Diagram
      </button>

      {/* Empty state */}
      {maps.length === 0 && (
        <div style={{
          textAlign: "center", padding: "28px 16px", color: "var(--text5)",
          fontSize: 12, fontFamily: SANS,
        }}>
          No site map diagrams yet. Add one to start placing stamps and annotations.
        </div>
      )}

      {/* Map cards */}
      {maps.map((md, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={md.id ?? idx}
            style={{
              border: `1px solid ${isOpen ? accentColor + "55" : "var(--border2)"}`,
              borderRadius: 12, overflow: "hidden",
              background: "var(--bg2)", transition: "border-color 0.2s",
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", cursor: "pointer",
                background: isOpen ? `${accentColor}08` : "transparent",
                transition: "background 0.15s",
              }}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <span style={{
                fontSize: 11, color: isOpen ? accentColor : "var(--text5)",
                fontWeight: 700, transition: "transform 0.2s",
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                display: "inline-block",
              }}>
                {"\u25B6"}
              </span>

              {/* Title (editable inline) */}
              <input
                value={md.title || ""}
                onChange={(e) => handleTitleChange(idx, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={`Map ${idx + 1}`}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "var(--text)", fontSize: 13, fontWeight: 600,
                  fontFamily: SANS, outline: "none", padding: 0,
                  minWidth: 0,
                }}
              />

              {/* Summary badge */}
              <span style={{
                fontSize: 10, color: "var(--text5)", fontFamily: SANS,
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {getSummary(md)}
              </span>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {maps.length > 1 && (
                  <>
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      title="Move up"
                      style={{
                        background: "var(--bg3)", border: "1px solid var(--border3)",
                        borderRadius: 6, color: idx === 0 ? "var(--text5)" : "var(--text4)",
                        cursor: idx === 0 ? "not-allowed" : "pointer",
                        padding: "2px 6px", fontSize: 10, opacity: idx === 0 ? 0.4 : 1,
                      }}
                    >
                      {"\u2191"}
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === maps.length - 1}
                      title="Move down"
                      style={{
                        background: "var(--bg3)", border: "1px solid var(--border3)",
                        borderRadius: 6, color: idx === maps.length - 1 ? "var(--text5)" : "var(--text4)",
                        cursor: idx === maps.length - 1 ? "not-allowed" : "pointer",
                        padding: "2px 6px", fontSize: 10, opacity: idx === maps.length - 1 ? 0.4 : 1,
                      }}
                    >
                      {"\u2193"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleRemove(idx)}
                  title="Remove diagram"
                  style={{
                    background: "transparent", border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 6, color: "#ef4444", cursor: "pointer",
                    padding: "2px 6px", fontSize: 10,
                  }}
                >
                  {"\u2716"}
                </button>
              </div>
            </div>

            {/* Expanded content — MapAnnotator */}
            {isOpen && (
              <div style={{
                borderTop: "1px solid var(--border2)",
                padding: 0, // MapAnnotator manages its own padding
              }}>
                <MapAnnotator
                  mapData={md}
                  onMapDataChange={(data) => handleMapDataChange(idx, data)}
                  accentColor={accentColor}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
