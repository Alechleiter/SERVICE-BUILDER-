/**
 * Rasterize a MapData (image + drawings + markers) into a single base64 PNG.
 * Used for Word export where absolute positioning and SVG don't work.
 */
import type { MapData, MapMarker, DrawingStroke } from "./types";

// ── Shape drawing helpers ──

const SHAPE_PATHS: Record<string, (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void> = {
  diamond(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  },
  square(ctx, cx, cy, r) {
    const s = r * 0.85;
    ctx.beginPath();
    ctx.rect(cx - s, cy - s, s * 2, s * 2);
  },
  triangle(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.75);
    ctx.lineTo(cx - r, cy + r * 0.75);
    ctx.closePath();
  },
  hexagon(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  },
  circle(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  },
};

function categoryToShape(cat?: string): string {
  switch (cat) {
    case "pest": return "diamond";
    case "item": return "square";
    case "issue": return "triangle";
    case "treatment": return "hexagon";
    case "finding":
    default: return "circle";
  }
}

function getMarkerColor(m: MapMarker): string {
  if (m.color) return m.color;
  if ((m as { type?: string }).type === "equipment") return "#2A9D8F";
  if ((m as { type?: string }).type === "concern") return "#E63946";
  return "#6B7280";
}

function getMarkerText(m: MapMarker, idx: number): string {
  return m.abbreviation || m.icon || String(idx + 1);
}

// ── Drawing stroke renderer ──

function drawStroke(ctx: CanvasRenderingContext2D, s: DrawingStroke, cw: number, ch: number) {
  const toX = (pct: number) => (pct / 100) * cw;
  const toY = (pct: number) => (pct / 100) * ch;
  const lw = s.lineWidth * 0.35 * (cw / 100);

  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Apply rotation if present
  if (s.rotation) {
    const p = s.points;
    let cx: number, cy: number;
    if (s.tool === "circle") { cx = toX(p[0]); cy = toY(p[1]); }
    else if (s.tool === "rect") { cx = toX(p[0] + p[2] / 2); cy = toY(p[1] + p[3] / 2); }
    else {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < p.length; i += 2) {
        minX = Math.min(minX, p[i]); maxX = Math.max(maxX, p[i]);
        if (i + 1 < p.length) { minY = Math.min(minY, p[i + 1]); maxY = Math.max(maxY, p[i + 1]); }
      }
      cx = toX((minX + maxX) / 2); cy = toY((minY + maxY) / 2);
    }
    ctx.translate(cx, cy);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  switch (s.tool) {
    case "pen": {
      if (s.points.length < 4) break;
      ctx.beginPath();
      ctx.moveTo(toX(s.points[0]), toY(s.points[1]));
      for (let i = 2; i < s.points.length; i += 2) {
        ctx.lineTo(toX(s.points[i]), toY(s.points[i + 1]));
      }
      ctx.stroke();
      break;
    }
    case "line": {
      if (s.points.length < 4) break;
      ctx.beginPath();
      ctx.moveTo(toX(s.points[0]), toY(s.points[1]));
      ctx.lineTo(toX(s.points[2]), toY(s.points[3]));
      ctx.stroke();
      break;
    }
    case "rect": {
      if (s.points.length < 4) break;
      ctx.beginPath();
      ctx.rect(toX(s.points[0]), toY(s.points[1]), toX(s.points[2]), toY(s.points[3]));
      ctx.stroke();
      break;
    }
    case "circle": {
      if (s.points.length < 3) break;
      ctx.beginPath();
      const rx = toX(s.points[2]);
      const ry = toY(s.points[2]);
      const r = (rx + ry) / 2;
      ctx.arc(toX(s.points[0]), toY(s.points[1]), r, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "text": {
      if (s.points.length < 2 || !s.text) break;
      const fs = (s.fontSize || 16) * 0.28 * (cw / 100);
      ctx.fillStyle = s.color;
      ctx.font = `600 ${fs}px Arial, sans-serif`;
      ctx.fillText(s.text, toX(s.points[0]), toY(s.points[1]));
      break;
    }
  }
  ctx.restore();
}

// ── Main rasterize function ──

/**
 * Rasterize the entire map (background + drawings + markers) into a base64 PNG string.
 * Returns a promise that resolves with the data URL.
 */
export async function rasterizeMap(mapData: MapData): Promise<string> {
  const cw = mapData.canvasWidth || 800;
  const ch = mapData.canvasHeight || 600;

  // Use a higher resolution for quality
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = cw * scale;
  canvas.height = ch * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // White background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, cw, ch);

  // Draw background image if present
  if (mapData.imageSrc) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = mapData.imageSrc!;
    });
  }

  // Draw strokes
  if (mapData.drawings) {
    for (const s of mapData.drawings) {
      drawStroke(ctx, s, cw, ch);
    }
  }

  // Draw markers
  const markerR = 13; // radius in pixels
  mapData.markers.forEach((m, i) => {
    const mx = (m.x / 100) * cw;
    const my = (m.y / 100) * ch;
    const color = getMarkerColor(m);
    const shape = categoryToShape(m.category);
    const text = getMarkerText(m, i);

    // Draw shape
    const drawShape = SHAPE_PATHS[shape] || SHAPE_PATHS.circle;

    // White border
    ctx.fillStyle = "#fff";
    drawShape(ctx, mx, my, markerR + 2);
    ctx.fill();

    // Colored fill
    ctx.fillStyle = color;
    drawShape(ctx, mx, my, markerR);
    ctx.fill();

    // Text label
    const fontSize = text.length > 2 ? markerR * 0.6 : text.length > 1 ? markerR * 0.7 : markerR * 0.9;
    ctx.fillStyle = "#fff";
    ctx.font = `800 ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textY = shape === "triangle" ? my + markerR * 0.15 : my;
    ctx.fillText(text, mx, textY);
  });

  return canvas.toDataURL("image/png");
}
