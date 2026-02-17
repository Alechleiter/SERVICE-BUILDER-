"use client";
import { useRef, useState, useCallback } from "react";
import type { PhotoEntry } from "@/lib/proposals/types";
import { ZONE_PRESETS, getZoneLabel } from "@/lib/proposals/zone-presets";

const iS: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border3)", borderRadius: 6,
  color: "var(--text)", padding: "6px 8px", fontSize: 12, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box" as const,
};

const CONCERN_TYPES = [
  "Active Infestation",
  "Harborage Area",
  "Entry Point / Gap",
  "Moisture / Water Damage",
  "Sanitation Issue",
  "Structural Deficiency",
  "Equipment Needed",
  "Previous Treatment Residue",
  "Other",
];

interface PhotoUploaderProps {
  photos: PhotoEntry[];
  onPhotosChange: React.Dispatch<React.SetStateAction<PhotoEntry[]>>;
  inspectionDate: string;
  onDateChange: (v: string) => void;
  accentColor: string;
}

export default function PhotoUploader({ photos, onPhotosChange, inspectionDate, onDateChange, accentColor }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag-to-reorder state ──
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onPhotosChange((prev) => [...prev, {
          id: Date.now() + Math.random(),
          src: ev.target?.result as string,
          caption: "",
          fileName: file.name,
          zone: "exterior",
          unitNumber: "",
          customZone: "",
          concernType: "",
          locationFound: "",
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const updatePhoto = (id: number, update: Partial<PhotoEntry>) =>
    onPhotosChange((prev) => prev.map((p) => p.id === id ? { ...p, ...update } : p));

  const removePhoto = (id: number) =>
    onPhotosChange((prev) => prev.filter((p) => p.id !== id));

  // ── Drag handlers ──
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    const target = e.currentTarget as HTMLDivElement;
    e.dataTransfer.setDragImage(target, 40, 40);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    onPhotosChange((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(targetIdx, 0, moved);
      return arr;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }, [dragIdx, onPhotosChange]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);

  return (
    <div style={{ marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{"\u{1F4F8}"} Inspection Report Photos</div>
          <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>Add photos with concern details — drag to reorder</div>
        </div>
        <span style={{ fontSize: 11, color: "var(--text4)", background: "var(--bg3)", padding: "2px 8px", borderRadius: 10 }}>
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Inspection Date */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Inspection Date
        </label>
        <input type="date" value={inspectionDate} onChange={(e) => onDateChange(e.target.value)}
          style={{ ...iS, width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 8 }} />
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = accentColor; }}
        onDragLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}44`; }}
        onDrop={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}44`;
          const imageFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
          if (imageFiles.length) handleFiles(imageFiles);
        }}
        style={{
          border: `2px dashed ${accentColor}44`, borderRadius: 10, padding: "20px 16px",
          textAlign: "center", cursor: "pointer", transition: "all 0.2s",
          background: "var(--bg2)", marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>{"\u{1F4F7}"}</div>
        <div style={{ fontSize: 13, color: "var(--text4)" }}>Click or drag & drop inspection photos here</div>
        <div style={{ fontSize: 11, color: "var(--text5)", marginTop: 4 }}>JPG, PNG — add as many as needed</div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        style={{ display: "none" }} />

      {/* Photo list */}
      {photos.map((photo, idx) => (
        <div
          key={photo.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          style={{
            marginBottom: 14, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, position: "relative",
            opacity: dragIdx === idx ? 0.35 : 1,
            borderTop: dragOverIdx === idx && dragIdx !== idx ? `3px solid ${accentColor}` : undefined,
            transition: "opacity 0.15s",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {/* Drag handle */}
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                cursor: "grab", flexShrink: 0, padding: "8px 2px",
                color: "var(--text5)", userSelect: "none",
              }}
              title="Drag to reorder"
            >
              <span style={{ fontSize: 16, lineHeight: 1, letterSpacing: 2 }}>{"\u2630"}</span>
            </div>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={photo.src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, display: "block", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: -6, left: -6, background: accentColor, color: "#fff", width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Zone selector */}
              <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                <select value={photo.zone} onChange={(e) => updatePhoto(photo.id, { zone: e.target.value })}
                  style={{ ...iS, flex: 1, minWidth: 140, cursor: "pointer" }}>
                  {ZONE_PRESETS.map((z) => (
                    <option key={z.value} value={z.value}>{z.icon} {z.label}</option>
                  ))}
                </select>
                {photo.zone === "unit" && (
                  <input type="text" value={photo.unitNumber} onChange={(e) => updatePhoto(photo.id, { unitNumber: e.target.value })}
                    placeholder="Unit #" style={{ ...iS, width: 70 }} />
                )}
                {photo.zone === "custom" && (
                  <input type="text" value={photo.customZone} onChange={(e) => updatePhoto(photo.id, { customZone: e.target.value })}
                    placeholder="Zone name" style={{ ...iS, flex: 1, minWidth: 100 }} />
                )}
              </div>

              {/* Concern type */}
              <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                <select value={photo.concernType || ""} onChange={(e) => updatePhoto(photo.id, { concernType: e.target.value })}
                  style={{ ...iS, flex: 1, minWidth: 140, cursor: "pointer" }}>
                  <option value="">-- Concern Type --</option>
                  {CONCERN_TYPES.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              {/* Location found */}
              <input type="text" value={photo.locationFound || ""}
                onChange={(e) => updatePhoto(photo.id, { locationFound: e.target.value })}
                placeholder="Where was this found? e.g., Behind unit 101 kitchen sink"
                style={{ ...iS, width: "100%", marginBottom: 6 }}
              />

              {/* Caption */}
              <textarea value={photo.caption} onChange={(e) => updatePhoto(photo.id, { caption: e.target.value })}
                placeholder="Add caption / additional notes..."
                rows={2}
                style={{ ...iS, width: "100%", resize: "vertical" }} />
              <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                <button onClick={() => removePhoto(photo.id)}
                  style={{ background: "none", border: "none", color: "#f85149", cursor: "pointer", padding: "2px 8px", fontSize: 11 }}>{"\u2715"} Remove</button>
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", top: 8, right: 8, background: `${accentColor}22`, color: accentColor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {getZoneLabel(photo)}
          </div>
        </div>
      ))}
    </div>
  );
}
