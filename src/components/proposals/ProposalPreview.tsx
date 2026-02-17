"use client";
import type { TemplateId, TemplateDefinition, PhotoEntry, MapData, MapMarker, DrawingStroke } from "@/lib/proposals/types";
import { generateContent, hasInspectionPricing } from "@/lib/proposals/content-generator";
import { groupByZone } from "@/lib/proposals/zone-presets";

const EQUIPMENT_COLOR = "#2A9D8F";
const CONCERN_COLOR = "#E63946";

/** Convert a DrawingStroke to an inline SVG element (JSX) */
function renderStrokeSVG(s: DrawingStroke, key: number) {
  const { tool, color, lineWidth, points } = s;
  const sw = lineWidth * 0.35; // scale for viewBox 0-100

  switch (tool) {
    case "pen": {
      if (points.length < 4) return null;
      const pairs: string[] = [];
      for (let i = 0; i < points.length; i += 2) {
        pairs.push(`${points[i]},${points[i + 1]}`);
      }
      return (
        <polyline key={key} points={pairs.join(" ")} fill="none" stroke={color}
          strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      );
    }
    case "line": {
      if (points.length < 4) return null;
      return (
        <line key={key} x1={points[0]} y1={points[1]} x2={points[2]} y2={points[3]}
          stroke={color} strokeWidth={sw} strokeLinecap="round" />
      );
    }
    case "rect": {
      if (points.length < 4) return null;
      return (
        <rect key={key} x={points[0]} y={points[1]} width={points[2]} height={points[3]}
          fill="none" stroke={color} strokeWidth={sw} />
      );
    }
    case "circle": {
      if (points.length < 3) return null;
      return (
        <circle key={key} cx={points[0]} cy={points[1]} r={points[2]}
          fill="none" stroke={color} strokeWidth={sw} />
      );
    }
    case "text": {
      if (points.length < 2 || !s.text) return null;
      const fs = (s.fontSize || 16) * 0.28;
      return (
        <text key={key} x={points[0]} y={points[1]} fill={color}
          fontSize={fs} fontFamily="Arial,sans-serif" fontWeight="600">{s.text}</text>
      );
    }
    default:
      return null;
  }
}

/** Resolve marker display — abbreviation > icon > index number */
function markerContent(m: { abbreviation?: string; icon?: string }, index: number): string {
  return m.abbreviation || m.icon || String(index + 1);
}
/** Resolve marker color — explicit color > legacy type-based */
function markerColor(m: { color?: string; type?: string; category?: string }): string {
  if (m.color) return m.color;
  if (m.type === "equipment") return EQUIPMENT_COLOR;
  if (m.type === "concern") return CONCERN_COLOR;
  return "#6B7280";
}
/** Resolve display category */
function markerCategoryLabel(m: { category?: string; type?: string }): string {
  return m.category || m.type || "marker";
}

/** Get marker shape based on category */
function markerShape(m: { category?: string }): "diamond" | "square" | "triangle" | "circle" {
  switch (m.category) {
    case "pest": return "diamond";
    case "item": return "square";
    case "issue": return "triangle";
    case "finding": return "circle";
    default: return "circle";
  }
}

/** Render a shaped marker icon (JSX) */
function ShapedMarker({ color, content, shape, size }: { color: string; content: string; shape: string; size: number }) {
  const fs = content.length > 2 ? size * 0.3 : content.length > 1 ? size * 0.35 : size * 0.45;

  const textEl = (
    <span style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: fs, fontWeight: 800,
      fontFamily: "'Arial',sans-serif", letterSpacing: "-0.3px", lineHeight: 1,
      zIndex: 1,
    }}>
      {content}
    </span>
  );

  const shadow = "0 1px 4px rgba(0,0,0,0.4)";
  const border = "2px solid #fff";

  if (shape === "diamond") {
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <div style={{
          position: "absolute", inset: 0,
          background: color, border,
          borderRadius: 3, transform: "rotate(45deg)",
          boxShadow: shadow,
        }} />
        {textEl}
      </div>
    );
  }
  if (shape === "square") {
    return (
      <div style={{
        position: "relative", width: size, height: size,
        background: color, border, borderRadius: 5,
        boxShadow: shadow,
      }}>
        {textEl}
      </div>
    );
  }
  if (shape === "triangle") {
    // Triangle using clip-path with a background div, text overlaid
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <div style={{
          position: "absolute", inset: -1,
          background: "#fff", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 1,
          background: color, clipPath: "polygon(50% 8%, 4% 100%, 96% 100%)",
          filter: `drop-shadow(${shadow})`,
        }} />
        <span style={{
          position: "absolute", left: 0, right: 0,
          top: "30%", bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: fs * 0.85, fontWeight: 800,
          fontFamily: "'Arial',sans-serif", letterSpacing: "-0.3px", lineHeight: 1,
          zIndex: 1,
        }}>
          {content}
        </span>
      </div>
    );
  }
  // circle (default / finding)
  return (
    <div style={{
      position: "relative", width: size, height: size,
      background: color, border, borderRadius: "50%",
      boxShadow: shadow,
    }}>
      {textEl}
    </div>
  );
}

/** Group markers by abbreviation+label for legend aggregation */
function groupMarkers(markers: MapMarker[]) {
  const groups: {
    key: string;
    abbreviation: string;
    label: string;
    color: string;
    category: string;
    shape: string;
    count: number;
    descriptions: string[];
  }[] = [];
  const map = new Map<string, number>();

  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    const abbr = m.abbreviation || m.icon || String(i + 1);
    const groupKey = `${abbr}::${m.label}`;
    const idx = map.get(groupKey);
    if (idx !== undefined) {
      groups[idx].count++;
      if (m.description && !groups[idx].descriptions.includes(m.description)) {
        groups[idx].descriptions.push(m.description);
      }
    } else {
      map.set(groupKey, groups.length);
      groups.push({
        key: groupKey,
        abbreviation: abbr,
        label: m.label,
        color: markerColor(m),
        category: markerCategoryLabel(m),
        shape: markerShape(m),
        count: 1,
        descriptions: m.description ? [m.description] : [],
      });
    }
  }
  return groups;
}

interface ProposalPreviewProps {
  templateKey: TemplateId;
  data: Record<string, string>;
  templateConfig: TemplateDefinition;
  photos: PhotoEntry[];
  inspectionDate: string;
  mapData?: MapData | null;
}

export default function ProposalPreview({ templateKey, data, templateConfig, photos, inspectionDate, mapData }: ProposalPreviewProps) {
  const content = generateContent(templateKey, data);
  const isQuote = templateKey === "inspection_report" && hasInspectionPricing(data);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const fmtDate = inspectionDate
    ? new Date(inspectionDate + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const groups = groupByZone(photos || []);
  const cc = templateConfig.color;

  return (
    <div id="proposal-preview" style={{ background: "#fff", color: "#1a1a2e", fontFamily: "'Georgia','Times New Roman',serif", padding: "clamp(16px, 4vw, 48px) clamp(12px, 3vw, 40px)", lineHeight: 1.65 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `3px solid ${cc}`, paddingBottom: 16, marginBottom: 28, gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Arial Black','Helvetica',sans-serif", fontSize: "clamp(18px, 5vw, 28px)", fontWeight: 900, color: cc, letterSpacing: "-0.5px", lineHeight: 1.2 }}>PEST CONTROL</div>
          <div style={{ fontFamily: "'Arial',sans-serif", fontSize: 10, letterSpacing: "2px", color: "#666", marginTop: 2, textTransform: "uppercase" }}>{content.title.includes("Inspection") ? (isQuote ? "Inspection Report & Quote" : "Inspection Report") : "Service Proposal"}</div>
        </div>
        <div style={{ textAlign: "right", fontFamily: "'Arial',sans-serif", fontSize: 12, color: "#666" }}>
          <div>Prepared: {today}</div>
        </div>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: "'Arial','Helvetica',sans-serif", fontSize: 22, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>{content.title}</h1>
      <div style={{ fontSize: 17, fontWeight: 600, color: cc, marginBottom: 4 }}>{content.subtitle}</div>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 32, fontFamily: "'Arial',sans-serif" }}>{content.address}</div>

      {/* Sections */}
      {content.sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 26 }}>
          <h2 style={{ fontFamily: "'Arial','Helvetica',sans-serif", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: cc, borderBottom: `1px solid ${cc}33`, paddingBottom: 6, marginBottom: 12 }}>{s.heading}</h2>
          {s.items.map((item, j) => (
            <div key={j} style={{ marginBottom: 8, fontSize: 14, color: "#333", paddingLeft: 16, position: "relative", fontFamily: "'Arial',sans-serif" }}>
              <span style={{ position: "absolute", left: 0, color: cc, fontWeight: 700 }}>{"\u2022"}</span>{item}
            </div>
          ))}
        </div>
      ))}

      {/* Inspection Photos */}
      {photos && photos.length > 0 && (
        <div style={{ marginTop: 36, pageBreakBefore: "always" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 2, background: cc }} />
            <div style={{ fontFamily: "'Arial Black','Helvetica',sans-serif", fontSize: 16, fontWeight: 900, color: cc, textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>Inspection Report</div>
            <div style={{ flex: 1, height: 2, background: cc }} />
          </div>
          {fmtDate && <div style={{ textAlign: "center", fontFamily: "'Arial',sans-serif", fontSize: 13, color: "#444", marginBottom: 6, fontWeight: 600 }}>Inspection Date: {fmtDate}</div>}
          <div style={{ fontFamily: "'Arial',sans-serif", fontSize: 13, color: "#555", marginBottom: 28, textAlign: "center", fontStyle: "italic" }}>
            The following photographs document conditions observed during the site inspection.
          </div>

          {Object.entries(groups).map(([zone, group]) => (
            <div key={zone} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid #e0e0e0" }}>
                <span style={{ fontSize: 18 }}>{group.icon}</span>
                <h3 style={{ margin: 0, fontFamily: "'Arial','Helvetica',sans-serif", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{zone}</h3>
                <span style={{ fontFamily: "'Arial',sans-serif", fontSize: 11, color: "#999" }}>{"\u2014"} {group.photos.length} photo{group.photos.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: group.photos.length === 1 ? "1fr" : "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 16 }}>
                {(group.photos as PhotoEntry[]).map((p) => (
                  <div key={p.id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden", background: "#fafafa", pageBreakInside: "avoid" }}>
                    <img src={p.src} alt="" style={{ width: "100%", height: "auto", aspectRatio: "16 / 10", objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "10px 14px", fontFamily: "'Arial',sans-serif", fontSize: 12, lineHeight: 1.5, borderTop: "1px solid #eee" }}>
                      {p.concernType && (
                        <div style={{ color: cc, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>Concern: {p.concernType}</div>
                      )}
                      {p.locationFound && (
                        <div style={{ color: "#555", fontSize: 11, marginBottom: 2 }}>Location: {p.locationFound}</div>
                      )}
                      {p.caption && (
                        <div style={{ color: "#333" }}>{p.caption}</div>
                      )}
                      {!p.caption && !p.concernType && !p.locationFound && (
                        <div style={{ color: "#999" }}>No caption provided</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Site Map */}
      {mapData && (mapData.markers.length > 0 || (mapData.drawings && mapData.drawings.length > 0)) && (
        <div style={{ marginTop: 36, pageBreakBefore: "always" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 2, background: cc }} />
            <div style={{ fontFamily: "'Arial Black','Helvetica',sans-serif", fontSize: 16, fontWeight: 900, color: cc, textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>Site Map</div>
            <div style={{ flex: 1, height: 2, background: cc }} />
          </div>
          <div style={{ fontFamily: "'Arial',sans-serif", fontSize: 13, color: "#555", marginBottom: 16, textAlign: "center", fontStyle: "italic" }}>
            Equipment placement and areas of concern identified during inspection.
          </div>

          {/* Map image/canvas with drawings + markers */}
          <div style={{ position: "relative", marginBottom: 16, borderRadius: 8, overflow: "hidden", border: "1px solid #e0e0e0" }}>
            {mapData.imageSrc ? (
              <img src={mapData.imageSrc} alt="Site map" style={{ width: "100%", display: "block" }} />
            ) : (
              <div style={{
                width: "100%",
                aspectRatio: `${mapData.canvasWidth || 800} / ${mapData.canvasHeight || 600}`,
                background: "#ffffff",
              }} />
            )}

            {/* Drawing SVG overlay */}
            {mapData.drawings && mapData.drawings.length > 0 && (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  position: "absolute", top: 0, left: 0,
                  width: "100%", height: "100%",
                  pointerEvents: "none",
                }}
              >
                {mapData.drawings.map((s, i) => renderStrokeSVG(s, i))}
              </svg>
            )}

            {/* Markers — shaped by category */}
            {mapData.markers.map((m, i) => {
              const mc = markerContent(m, i);
              const mClr = markerColor(m);
              const shape = markerShape(m);
              const sz = 26;
              return (
                <div key={m.id} style={{
                  position: "absolute",
                  left: `${m.x}%`, top: `${m.y}%`,
                  transform: "translate(-50%, -50%)",
                }}>
                  <ShapedMarker color={mClr} content={mc} shape={shape} size={sz} />
                </div>
              );
            })}
          </div>

          {/* Legend — grouped with counts */}
          {mapData.markers.length > 0 && (() => {
            const legendGroups = groupMarkers(mapData.markers);
            return (
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Arial',sans-serif", fontSize: 12, minWidth: 400 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #ddd" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#666", textTransform: "uppercase" }}>Icon</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#666", textTransform: "uppercase" }}>Type</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#666", textTransform: "uppercase" }}>Label</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#666", textTransform: "uppercase" }}>Qty</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, fontSize: 11, color: "#666", textTransform: "uppercase" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {legendGroups.map((g) => (
                    <tr key={g.key} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "6px 8px" }}>
                        <ShapedMarker color={g.color} content={g.abbreviation} shape={g.shape} size={22} />
                      </td>
                      <td style={{ padding: "6px 8px", color: g.color, fontWeight: 600, textTransform: "capitalize" }}>{g.category}</td>
                      <td style={{ padding: "6px 8px", fontWeight: 600 }}>{g.label}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, fontSize: 13 }}>{g.count}</td>
                      <td style={{ padding: "6px 8px", color: "#666" }}>{g.descriptions.join("; ") || "\u2014"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            );
          })()}
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: "center", fontFamily: "'Arial',sans-serif", fontSize: 10, color: "#aaa" }}>
        {content.title.includes("Inspection")
          ? (isQuote
            ? "This proposal is valid for 30 days from the date of preparation."
            : "This inspection report documents conditions observed at the time of inspection.")
          : "This proposal is valid for 30 days from the date of preparation."}
      </div>
    </div>
  );
}
