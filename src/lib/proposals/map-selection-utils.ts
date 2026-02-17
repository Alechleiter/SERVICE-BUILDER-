import type { DrawingStroke, MapMarker, MapData } from "./types";

// ═══════════════════════════════════════════════════════
// Map Selection Utilities — bounding boxes, hit testing,
// move/resize math for the MapAnnotator select mode
// ═══════════════════════════════════════════════════════

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// ── Bounding box computation ──

/** Compute a bounding box from a DrawingStroke's percentage-based points */
export function getStrokeBBox(s: DrawingStroke): BoundingBox {
  switch (s.tool) {
    case "pen":
    case "line": {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < s.points.length; i += 2) {
        minX = Math.min(minX, s.points[i]);
        maxX = Math.max(maxX, s.points[i]);
        if (i + 1 < s.points.length) {
          minY = Math.min(minY, s.points[i + 1]);
          maxY = Math.max(maxY, s.points[i + 1]);
        }
      }
      return { minX, minY, maxX, maxY };
    }
    case "rect": {
      // points = [x, y, width, height] — width/height can be negative
      const [x, y, w, h] = s.points;
      return {
        minX: Math.min(x, x + w),
        minY: Math.min(y, y + h),
        maxX: Math.max(x, x + w),
        maxY: Math.max(y, y + h),
      };
    }
    case "circle": {
      // points = [cx, cy, radius]
      const [cx, cy, r] = s.points;
      return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };
    }
    case "text": {
      // Approximate: text at (x, y), estimate width from text length
      const estW = (s.text?.length || 1) * (s.fontSize || 14) * 0.06;
      const estH = (s.fontSize || 14) * 0.15;
      return {
        minX: s.points[0],
        minY: s.points[1] - estH,
        maxX: s.points[0] + estW,
        maxY: s.points[1] + estH * 0.5,
      };
    }
    default:
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
}

// ── Hit testing ──

/** Check if a point (pct coords) is near a stroke's bounding box */
export function isPointNearStroke(
  px: number,
  py: number,
  s: DrawingStroke,
  tolerance = 2.5,
): boolean {
  const bb = getStrokeBBox(s);
  return (
    px >= bb.minX - tolerance &&
    px <= bb.maxX + tolerance &&
    py >= bb.minY - tolerance &&
    py <= bb.maxY + tolerance
  );
}

/** Check if a point (pct coords) is near a marker */
export function isPointNearMarker(
  px: number,
  py: number,
  m: MapMarker,
  tolerance = 2.5,
): boolean {
  return Math.abs(m.x - px) < tolerance && Math.abs(m.y - py) < tolerance;
}

/** Check if two bounding boxes overlap */
export function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return a.maxX >= b.minX && a.minX <= b.maxX && a.maxY >= b.minY && a.minY <= b.maxY;
}

// ── Resize handles ──

export interface ResizeHandle {
  position: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
  cursor: string;
  x: number;
  y: number;
}

/** Get the 8 resize handle positions for a bounding box */
export function getResizeHandles(bb: BoundingBox): ResizeHandle[] {
  const midX = (bb.minX + bb.maxX) / 2;
  const midY = (bb.minY + bb.maxY) / 2;
  return [
    { position: "nw", cursor: "nwse-resize", x: bb.minX, y: bb.minY },
    { position: "ne", cursor: "nesw-resize", x: bb.maxX, y: bb.minY },
    { position: "sw", cursor: "nesw-resize", x: bb.minX, y: bb.maxY },
    { position: "se", cursor: "nwse-resize", x: bb.maxX, y: bb.maxY },
    { position: "n", cursor: "ns-resize", x: midX, y: bb.minY },
    { position: "s", cursor: "ns-resize", x: midX, y: bb.maxY },
    { position: "e", cursor: "ew-resize", x: bb.maxX, y: midY },
    { position: "w", cursor: "ew-resize", x: bb.minX, y: midY },
  ];
}

// ── Group bounding box ──

/** Compute a combined bounding box for selected markers + strokes */
export function getGroupBBox(
  markers: MapMarker[],
  strokes: DrawingStroke[],
  selectedMarkerIds: Set<number>,
  selectedStrokeIds: Set<number>,
): BoundingBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  markers.forEach((m) => {
    if (!selectedMarkerIds.has(m.id)) return;
    minX = Math.min(minX, m.x);
    maxX = Math.max(maxX, m.x);
    minY = Math.min(minY, m.y);
    maxY = Math.max(maxY, m.y);
  });

  strokes.forEach((s) => {
    if (!selectedStrokeIds.has(s.id)) return;
    const bb = getStrokeBBox(s);
    minX = Math.min(minX, bb.minX);
    maxX = Math.max(maxX, bb.maxX);
    minY = Math.min(minY, bb.minY);
    maxY = Math.max(maxY, bb.maxY);
  });

  // If nothing selected, return zero box
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

// ── Move ──

/** Shift stroke points by a percentage delta (handles circle radius correctly) */
export function shiftStrokePoints(s: DrawingStroke, origPoints: number[], dx: number, dy: number): number[] {
  const newPts = [...origPoints];
  if (s.tool === "circle") {
    // circle: [cx, cy, radius] — only shift cx, cy; radius stays
    newPts[0] += dx;
    newPts[1] += dy;
    // radius (index 2) unchanged
  } else {
    for (let i = 0; i < newPts.length; i += 2) {
      newPts[i] += dx;
      if (i + 1 < newPts.length) newPts[i + 1] += dy;
    }
  }
  return newPts;
}

// ── Resize ──

/** Scale stroke points proportionally from old bounding box to new bounding box */
export function scaleStrokePoints(
  s: DrawingStroke,
  origBBox: BoundingBox,
  newBBox: BoundingBox,
): number[] {
  const ow = origBBox.maxX - origBBox.minX || 1;
  const oh = origBBox.maxY - origBBox.minY || 1;
  const nw = newBBox.maxX - newBBox.minX;
  const nh = newBBox.maxY - newBBox.minY;
  const scaleX = nw / ow;
  const scaleY = nh / oh;

  switch (s.tool) {
    case "pen":
    case "line": {
      const newPts = [...s.points];
      for (let i = 0; i < newPts.length; i += 2) {
        newPts[i] = newBBox.minX + (newPts[i] - origBBox.minX) * scaleX;
        if (i + 1 < newPts.length) {
          newPts[i + 1] = newBBox.minY + (newPts[i + 1] - origBBox.minY) * scaleY;
        }
      }
      return newPts;
    }
    case "rect":
      return [newBBox.minX, newBBox.minY, nw, nh];
    case "circle": {
      const newR = Math.min(nw, nh) / 2;
      return [(newBBox.minX + newBBox.maxX) / 2, (newBBox.minY + newBBox.maxY) / 2, Math.max(newR, 0.5)];
    }
    case "text":
      return [newBBox.minX, newBBox.minY + nh * 0.75]; // reposition text baseline
    default:
      return s.points;
  }
}

/** Compute a new bounding box after dragging a resize handle */
export function computeResizedBBox(
  handle: string,
  origBBox: BoundingBox,
  dx: number,
  dy: number,
): BoundingBox {
  const bb = { ...origBBox };
  const minSize = 2; // minimum 2% in each dimension

  switch (handle) {
    case "nw": bb.minX += dx; bb.minY += dy; break;
    case "ne": bb.maxX += dx; bb.minY += dy; break;
    case "sw": bb.minX += dx; bb.maxY += dy; break;
    case "se": bb.maxX += dx; bb.maxY += dy; break;
    case "n": bb.minY += dy; break;
    case "s": bb.maxY += dy; break;
    case "e": bb.maxX += dx; break;
    case "w": bb.minX += dx; break;
  }

  // Ensure minimum size
  if (bb.maxX - bb.minX < minSize) bb.maxX = bb.minX + minSize;
  if (bb.maxY - bb.minY < minSize) bb.maxY = bb.minY + minSize;

  return bb;
}
