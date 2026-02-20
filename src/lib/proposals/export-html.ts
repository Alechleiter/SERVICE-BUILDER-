import type { ProposalContent, PhotoEntry, MapData, MapMarker, DrawingStroke } from "./types";
import { groupByZone } from "./zone-presets";

const EQUIPMENT_COLOR = "#2A9D8F";
const CONCERN_COLOR = "#E63946";

function markerContent(m: { abbreviation?: string; icon?: string }, index: number): string {
  return m.abbreviation || m.icon || String(index + 1);
}
function markerColor(m: { color?: string; type?: string }): string {
  if (m.color) return m.color;
  if (m.type === "equipment") return EQUIPMENT_COLOR;
  if (m.type === "concern") return CONCERN_COLOR;
  return "#6B7280";
}
function markerCategoryLabel(m: { category?: string; type?: string }): string {
  return m.category || m.type || "marker";
}
function markerShape(m: { category?: string }): string {
  switch (m.category) {
    case "pest": return "diamond";
    case "item": return "square";
    case "issue": return "triangle";
    case "finding": return "circle";
    case "treatment": return "hexagon";
    default: return "circle";
  }
}

/** Generate HTML for a shaped marker icon (used in PDF/clipboard) */
function shapedMarkerHTML(color: string, content: string, shape: string, sz: number): string {
  const fs = content.length > 2 ? Math.round(sz * 0.3) : content.length > 1 ? Math.round(sz * 0.35) : Math.round(sz * 0.45);
  const textStyle = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${fs}px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:-0.3px;line-height:1;z-index:1;`;
  const shadow = "0 1px 4px rgba(0,0,0,0.4)";
  const border = "2px solid #fff";

  if (shape === "diamond") {
    return `<div style="position:relative;width:${sz}px;height:${sz}px;"><div style="position:absolute;inset:0;background:${color};border:${border};border-radius:3px;transform:rotate(45deg);box-shadow:${shadow};"></div><span style="${textStyle}">${content}</span></div>`;
  }
  if (shape === "square") {
    return `<div style="position:relative;width:${sz}px;height:${sz}px;background:${color};border:${border};border-radius:5px;box-shadow:${shadow};"><span style="${textStyle}">${content}</span></div>`;
  }
  if (shape === "triangle") {
    const tfs = Math.round(fs * 0.85);
    return `<div style="position:relative;width:${sz}px;height:${sz}px;"><div style="position:absolute;inset:-1px;background:#fff;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);"></div><div style="position:absolute;inset:1px;background:${color};clip-path:polygon(50% 8%, 4% 100%, 96% 100%);"></div><span style="position:absolute;left:0;right:0;top:30%;bottom:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${tfs}px;font-weight:800;font-family:Arial,sans-serif;letter-spacing:-0.3px;line-height:1;z-index:1;">${content}</span></div>`;
  }
  if (shape === "hexagon") {
    const hexClip = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
    return `<div style="position:relative;width:${sz}px;height:${sz}px;"><div style="position:absolute;inset:-1px;background:#fff;clip-path:${hexClip};"></div><div style="position:absolute;inset:1px;background:${color};clip-path:${hexClip};"></div><span style="${textStyle}">${content}</span></div>`;
  }
  // circle
  return `<div style="position:relative;width:${sz}px;height:${sz}px;background:${color};border:${border};border-radius:50%;box-shadow:${shadow};"><span style="${textStyle}">${content}</span></div>`;
}

/**
 * Word-safe marker icon — simple colored circle with abbreviation.
 * Word doesn't support clip-path, absolute positioning inside inline blocks, etc.
 * We use a simple <span> with a colored background and rounded border.
 */
function wordSafeMarkerHTML(color: string, content: string, sz: number): string {
  const fs = content.length > 2 ? Math.round(sz * 0.3) : content.length > 1 ? Math.round(sz * 0.35) : Math.round(sz * 0.45);
  return `<span style="display:inline-block;width:${sz}px;height:${sz}px;line-height:${sz}px;text-align:center;background:${color};color:#fff;font-size:${fs}px;font-weight:800;font-family:Arial,sans-serif;border-radius:50%;border:2px solid #fff;">${content}</span>`;
}

/** Group markers by abbreviation+label for legend aggregation */
function groupMarkersForExport(markers: MapMarker[]) {
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

/** Compute center of a stroke's bounding box (for rotation) */
function strokeCenter(s: DrawingStroke): { cx: number; cy: number } {
  const p = s.points;
  switch (s.tool) {
    case "pen":
    case "line": {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < p.length; i += 2) {
        minX = Math.min(minX, p[i]); maxX = Math.max(maxX, p[i]);
        if (i + 1 < p.length) { minY = Math.min(minY, p[i + 1]); maxY = Math.max(maxY, p[i + 1]); }
      }
      return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
    }
    case "rect": return { cx: p[0] + p[2] / 2, cy: p[1] + p[3] / 2 };
    case "circle": return { cx: p[0], cy: p[1] };
    case "text": return { cx: p[0], cy: p[1] };
    default: return { cx: 50, cy: 50 };
  }
}

/** Convert a DrawingStroke to an SVG element string for export */
function strokeToSVG(s: DrawingStroke): string {
  const { tool, color, lineWidth, points } = s;
  const sw = (lineWidth * 0.35).toFixed(2);
  const rotAttr = s.rotation ? (() => {
    const c = strokeCenter(s);
    return ` transform="rotate(${s.rotation}, ${c.cx}, ${c.cy})"`;
  })() : "";

  switch (tool) {
    case "pen": {
      if (points.length < 4) return "";
      const pairs: string[] = [];
      for (let i = 0; i < points.length; i += 2) {
        pairs.push(`${points[i]},${points[i + 1]}`);
      }
      return `<polyline points="${pairs.join(" ")}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${rotAttr}/>`;
    }
    case "line": {
      if (points.length < 4) return "";
      return `<line x1="${points[0]}" y1="${points[1]}" x2="${points[2]}" y2="${points[3]}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"${rotAttr}/>`;
    }
    case "rect": {
      if (points.length < 4) return "";
      return `<rect x="${points[0]}" y="${points[1]}" width="${points[2]}" height="${points[3]}" fill="none" stroke="${color}" stroke-width="${sw}"${rotAttr}/>`;
    }
    case "circle": {
      if (points.length < 3) return "";
      return `<circle cx="${points[0]}" cy="${points[1]}" r="${points[2]}" fill="none" stroke="${color}" stroke-width="${sw}"${rotAttr}/>`;
    }
    case "text": {
      if (points.length < 2 || !s.text) return "";
      const fs = ((s.fontSize || 16) * 0.28).toFixed(1);
      const escaped = s.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<text x="${points[0]}" y="${points[1]}" fill="${color}" font-size="${fs}" font-family="Arial,sans-serif" font-weight="600"${rotAttr}>${escaped}</text>`;
    }
    default:
      return "";
  }
}

/** Build SVG overlay string for drawings */
function buildDrawingsSVG(drawings: DrawingStroke[]): string {
  if (!drawings || drawings.length === 0) return "";
  const inner = drawings.map((s) => strokeToSVG(s)).filter(Boolean).join("");
  if (!inner) return "";
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">${inner}</svg>`;
}

/** Sections excluded from customer-facing export */
const INTERNAL_ONLY_SECTIONS = new Set([
  "TECHNICIAN INSTRUCTIONS",
  "CUSTOMER RECOMMENDATIONS",
  "TECH START NOTES",
]);

export type ExportVariant = "customer" | "internal";

/**
 * Build a full proposal HTML document for PDF/Word/Clipboard export.
 *
 * @param forWord — when true, produces Word-compatible HTML:
 *   - Tables instead of flexbox
 *   - No clip-path / SVG / absolute positioning
 *   - Pre-rasterized map image via mapImageSrc
 *   - Explicit image dimensions
 *
 * @param mapImageSrc — pre-rasterized base64 PNG of the map (for Word export).
 *   When provided, this single image replaces the SVG + absolute-positioned markers.
 */
export function buildProposalExportHTML(
  content: ProposalContent,
  color: string,
  photos: PhotoEntry[],
  inspectionDate: string,
  forWord = false,
  mapData?: MapData | null,
  variant: ExportVariant = "customer",
  mapImageSrc?: string | null,
  companyName?: string,
): string {
  const brandName = companyName || "PEST CONTROL";
  const groups = groupByZone(photos || []);
  const fmtDate = inspectionDate
    ? new Date(inspectionDate + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const isInternal = variant === "internal";

  // ── Start HTML ──
  let html = "";

  if (!forWord) {
    // Print CSS for PDF/clipboard
    html += `<style>
@media print {
  .pb-avoid { page-break-inside: avoid; break-inside: avoid; }
  .pb-before { page-break-before: always; break-before: page; }
  .pb-after { page-break-after: auto; }
  .keep-with-next { page-break-after: avoid; break-after: avoid; }
  h2 { page-break-after: avoid !important; break-after: avoid !important; }
}
</style>`;
  }

  html += `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;max-width:750px;margin:0 auto;padding:40px;">`;

  // Internal banner
  if (isInternal) {
    html += `<div style="background:#FEF3C7;border:2px solid #F59E0B;padding:8px 14px;margin-bottom:16px;text-align:center;">`;
    html += `<span style="font-size:11px;font-weight:800;color:#92400E;letter-spacing:2px;text-transform:uppercase;">INTERNAL \u2014 NOT FOR DISTRIBUTION</span>`;
    html += `</div>`;
  }

  // ── Header ──
  const isInspection = content.title.includes("Inspection");
  const isQuote = content.title.includes("Quote");
  const headerSubtitle = isInspection ? (isQuote ? "Inspection Report & Quote" : "Inspection Report") : "Service Proposal";
  if (forWord) {
    // Table-based header for Word
    html += `<table style="width:100%;border-bottom:3px solid ${color};margin-bottom:24px;" cellpadding="0" cellspacing="0"><tr>`;
    html += `<td style="padding-bottom:14px;"><div style="font-size:26px;font-weight:900;color:${color};">${brandName}</div>`;
    html += `<div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;">${headerSubtitle}</div></td>`;
    html += `<td style="padding-bottom:14px;text-align:right;font-size:12px;color:#666;vertical-align:top;">Prepared: ${today}</td>`;
    html += `</tr></table>`;
  } else {
    html += `<div style="display:flex;justify-content:space-between;border-bottom:3px solid ${color};padding-bottom:14px;margin-bottom:24px;">`;
    html += `<div><div style="font-size:26px;font-weight:900;color:${color};letter-spacing:-0.5px;">${brandName}</div>`;
    html += `<div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;">${headerSubtitle}</div></div>`;
    html += `<div style="text-align:right;font-size:12px;color:#666;"><div>Prepared: ${today}</div></div></div>`;
  }

  // Title
  if (!forWord) html += `<div class="keep-with-next" style="page-break-after:avoid;">`;
  html += `<h1 style="font-size:22px;font-weight:700;margin:0 0 6px;">${content.title}</h1>`;
  html += `<div style="font-size:17px;font-weight:600;color:${color};margin-bottom:4px;">${content.subtitle}</div>`;
  html += `<div style="font-size:13px;color:#555;margin-bottom:28px;">${content.address}</div>`;
  if (!forWord) html += `</div>`;

  // ── Split sections: early vs late ──
  const LATE_SECTION_KEYWORDS = [
    "TARGET PEST", "SCOPE", "SERVICE FREQUENCY", "INITIAL MONTH",
    "MONTHLY SERVICE", "PRICING", "INVESTMENT", "STABILIZATION",
    "ONGOING MONTHLY", "MONITORING", "SERVICE AREAS", "EXTERIOR SERVICES",
    "INTERIOR SERVICES", "ADDITIONAL AREA", "EQUIPMENT SUMMARY",
    "PRICING & SCHEDULE", "ADDITIONAL NOTES",
    "TECHNICIAN", "CUSTOMER RECOMMENDATIONS", "TECH START",
  ];

  const earlySections: typeof content.sections = [];
  const lateSections: typeof content.sections = [];

  content.sections.forEach((s) => {
    if (!isInternal && INTERNAL_ONLY_SECTIONS.has(s.heading.toUpperCase())) return;
    const upper = s.heading.toUpperCase();
    const isLate = LATE_SECTION_KEYWORDS.some((kw) => upper.includes(kw));
    if (isLate) lateSections.push(s);
    else earlySections.push(s);
  });

  // Section renderer
  const renderSection = (s: { heading: string; items: string[] }) => {
    if (!forWord) html += `<div class="pb-avoid" style="page-break-inside:avoid;">`;
    html += `<h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${color};border-bottom:1px solid ${color}44;padding-bottom:5px;margin:20px 0 10px;">${s.heading}</h2>`;
    s.items.forEach((item) => {
      html += `<p style="font-size:13px;color:#333;margin:0 0 6px;padding-left:14px;">\u2022 ${item}</p>`;
    });
    if (!forWord) html += `</div>`;
  };

  // Early sections
  earlySections.forEach(renderSection);

  // ── Photos ──
  if (photos && photos.length > 0) {
    if (forWord) {
      html += `<br clear="all" style="page-break-before:always;">`;
    } else {
      html += `<div class="pb-before" style="margin-top:32px;page-break-before:always;">`;
    }
    html += `<h2 style="text-align:center;font-size:16px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:2px;border-top:2px solid ${color};border-bottom:2px solid ${color};padding:8px 0;margin-bottom:8px;">Inspection Report</h2>`;
    if (fmtDate) html += `<p style="text-align:center;font-size:13px;color:#444;font-weight:600;margin-bottom:4px;">Inspection Date: ${fmtDate}</p>`;
    html += `<p style="text-align:center;font-size:12px;color:#555;font-style:italic;margin-bottom:20px;">The following photographs document conditions observed during the site inspection.</p>`;

    Object.entries(groups).forEach(([zone, group]) => {
      html += `<h3 style="font-size:13px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #ddd;padding-bottom:4px;margin:16px 0 10px;page-break-after:avoid;">${group.icon} ${zone} \u2014 ${group.photos.length} photo${group.photos.length !== 1 ? "s" : ""}</h3>`;

      if (forWord) {
        // Word: use table grid for photos, 2 per row with fixed-size cells
        const zonePhotos = group.photos as PhotoEntry[];
        html += `<table style="width:100%;border-collapse:collapse;table-layout:fixed;" cellpadding="0" cellspacing="0">`;
        // Fixed column widths
        html += `<colgroup><col style="width:50%;" /><col style="width:50%;" /></colgroup>`;
        for (let i = 0; i < zonePhotos.length; i += 2) {
          html += `<tr style="page-break-inside:avoid;">`;
          for (let j = i; j < Math.min(i + 2, zonePhotos.length); j++) {
            const p = zonePhotos[j];
            html += `<td style="width:50%;vertical-align:top;padding:4px;page-break-inside:avoid;">`;
            html += `<table style="width:100%;border-collapse:collapse;border:1px solid #d0d0d0;page-break-inside:avoid;" cellpadding="0" cellspacing="0">`;
            // Image cell with fixed height — Word respects width+height on img
            html += `<tr><td style="padding:0;text-align:center;background:#f9f9f9;height:220px;vertical-align:middle;">`;
            html += `<img src="${p.src}" width="310" height="210" style="width:310px;height:210px;object-fit:cover;display:block;margin:0 auto;" />`;
            html += `</td></tr>`;
            // Caption cell
            html += `<tr><td style="padding:6px 8px;font-size:11px;border-top:1px solid #e0e0e0;font-family:Arial,sans-serif;">`;
            if (p.concernType) html += `<div style="color:${color};font-weight:700;font-size:10px;margin-bottom:2px;">Concern: ${p.concernType}</div>`;
            if (p.locationFound) html += `<div style="color:#555;font-size:10px;margin-bottom:2px;">Location: ${p.locationFound}</div>`;
            if (p.caption) html += `<div style="color:#333;">${p.caption}</div>`;
            if (!p.caption && !p.concernType && !p.locationFound) html += `<div style="color:#999;">No caption provided</div>`;
            html += `</td></tr></table>`;
            html += `</td>`;
          }
          // If odd number, fill the empty cell
          if (i + 1 >= zonePhotos.length) {
            html += `<td style="width:50%;padding:4px;"></td>`;
          }
          html += `</tr>`;
        }
        html += `</table>`;
      } else {
        // PDF/clipboard: grid layout — 2 photos per row, each row in its own pb-avoid block
        const zonePhotosArr = group.photos as PhotoEntry[];
        for (let pi = 0; pi < zonePhotosArr.length; pi += 2) {
          html += `<div class="pb-avoid" style="display:flex;gap:12px;margin-bottom:12px;page-break-inside:avoid;">`;
          const row = zonePhotosArr.slice(pi, pi + 2);
          row.forEach((p) => {
            html += `<div style="flex:1;min-width:45%;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">`;
            html += `<img src="${p.src}" style="width:100%;max-height:280px;object-fit:cover;display:block;" />`;
            html += `<div style="padding:8px 10px;font-size:11px;border-top:1px solid #eee;">`;
            if (p.concernType) html += `<div style="color:${color};font-weight:700;font-size:10px;margin-bottom:2px;">Concern: ${p.concernType}</div>`;
            if (p.locationFound) html += `<div style="color:#555;font-size:10px;margin-bottom:2px;">Location: ${p.locationFound}</div>`;
            if (p.caption) html += `<div style="color:#333;">${p.caption}</div>`;
            if (!p.caption && !p.concernType && !p.locationFound) html += `<div style="color:#999;">No caption provided</div>`;
            html += `</div></div>`;
          });
          html += `</div>`;
        }
      }
    });
    if (!forWord) html += `</div>`;
  }

  // ── Site Map ──
  const hasMarkers = mapData && mapData.markers.length > 0;
  const hasDrawings = mapData && mapData.drawings && mapData.drawings.length > 0;
  if (mapData && (hasMarkers || hasDrawings)) {
    if (forWord) {
      html += `<br clear="all" style="page-break-before:always;">`;
    } else {
      html += `<div class="pb-before" style="margin-top:32px;page-break-before:always;">`;
    }
    html += `<h2 style="text-align:center;font-size:16px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:2px;border-top:2px solid ${color};border-bottom:2px solid ${color};padding:8px 0;margin-bottom:8px;">Site Map</h2>`;
    html += `<p style="text-align:center;font-size:12px;color:#555;font-style:italic;margin-bottom:16px;">Equipment placement and areas of concern identified during inspection.</p>`;

    if (forWord && mapImageSrc) {
      // Word: use a single pre-rasterized image (no SVG, no absolute positioning)
      html += `<div style="margin-bottom:16px;border:1px solid #e0e0e0;text-align:center;">`;
      html += `<img src="${mapImageSrc}" width="650" style="width:100%;height:auto;display:block;" />`;
      html += `</div>`;
    } else if (!forWord) {
      // PDF/clipboard: SVG overlay + absolute-positioned markers
      html += `<div class="pb-avoid" style="position:relative;margin-bottom:16px;border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;page-break-inside:avoid;">`;
      if (mapData.imageSrc) {
        html += `<img src="${mapData.imageSrc}" style="width:100%;display:block;" />`;
      } else {
        const cw = mapData.canvasWidth || 800;
        const ch = mapData.canvasHeight || 600;
        html += `<div style="width:100%;aspect-ratio:${cw}/${ch};background:#ffffff;"></div>`;
      }
      if (mapData.drawings && mapData.drawings.length > 0) {
        html += buildDrawingsSVG(mapData.drawings);
      }
      mapData.markers.forEach((m, i) => {
        const mc = markerContent(m, i);
        const mClr = markerColor(m);
        const shape = markerShape(m);
        html += `<div style="position:absolute;left:${m.x}%;top:${m.y}%;transform:translate(-50%,-50%);">${shapedMarkerHTML(mClr, mc, shape, 26)}</div>`;
      });
      html += `</div>`;
    }

    // Legend table
    if (hasMarkers) {
      const legendGroups = groupMarkersForExport(mapData.markers);
      if (!forWord) html += `<div class="pb-avoid" style="page-break-inside:avoid;">`;
      html += `<table style="width:100%;border-collapse:collapse;font-size:11px;" cellpadding="0" cellspacing="0">`;
      html += `<tr style="border-bottom:2px solid #ddd;"><th style="text-align:left;padding:5px 8px;color:#666;text-transform:uppercase;">Icon</th><th style="text-align:left;padding:5px 8px;color:#666;text-transform:uppercase;">Type</th><th style="text-align:left;padding:5px 8px;color:#666;text-transform:uppercase;">Label</th><th style="text-align:center;padding:5px 8px;color:#666;text-transform:uppercase;">Qty</th><th style="text-align:left;padding:5px 8px;color:#666;text-transform:uppercase;">Notes</th></tr>`;
      legendGroups.forEach((g) => {
        const iconCell = forWord
          ? wordSafeMarkerHTML(g.color, g.abbreviation, 22)
          : shapedMarkerHTML(g.color, g.abbreviation, g.shape, 22);
        const notes = g.descriptions.join("; ") || "\u2014";
        html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:5px 8px;">${iconCell}</td><td style="padding:5px 8px;color:${g.color};font-weight:600;text-transform:capitalize;">${g.category}</td><td style="padding:5px 8px;font-weight:600;">${g.label}</td><td style="padding:5px 8px;text-align:center;font-weight:700;font-size:13px;">${g.count}</td><td style="padding:5px 8px;color:#666;">${notes}</td></tr>`;
      });
      html += `</table>`;
      if (!forWord) html += `</div>`;
    }
    if (!forWord) html += `</div>`;
  }

  // ── Late sections ──
  if (lateSections.length > 0) {
    if (forWord) {
      html += `<br clear="all" style="page-break-before:always;">`;
    } else {
      html += `<div class="pb-before" style="margin-top:32px;page-break-before:always;">`;
    }
    html += `<h2 style="text-align:center;font-size:16px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:2px;border-top:2px solid ${color};border-bottom:2px solid ${color};padding:8px 0;margin-bottom:16px;">${isInspection ? (isQuote ? "Service Proposal" : "Additional Details") : "Service Proposal"}</h2>`;
    lateSections.forEach(renderSection);
    if (!forWord) html += `</div>`;
  }

  const footerText = isInspection
    ? (isQuote
      ? "This proposal is valid for 30 days from the date of preparation. Pricing subject to change based on final site assessment."
      : "This inspection report documents conditions observed at the time of inspection. A separate proposal will be provided for recommended services.")
    : "This proposal is valid for 30 days from the date of preparation. Pricing subject to change based on final site assessment.";
  html += `<p style="margin-top:24px;text-align:center;font-size:9px;color:#aaa;">${footerText}</p>`;
  html += `</div>`;
  html += `</div>`;

  return html;
}
