"use client";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import type { MapData, MapMarker, MarkerCategory, DrawingTool, DrawingStroke } from "@/lib/proposals/types";
import { ALL_PRESETS, CATEGORY_META, type CadPreset } from "@/lib/proposals/map-presets";
import { isArchTool, drawArchSymbol } from "@/lib/proposals/map-draw-utils";
import {
  getStrokeBBox,
  isPointNearStroke,
  isPointNearMarker,
  getResizeHandles,
  getGroupBBox,
  scaleStrokePoints,
  shiftStrokePoints,
  computeResizedBBox,
  type BoundingBox,
} from "@/lib/proposals/map-selection-utils";

/* ── Legacy fallback colors ── */
const EQUIPMENT_COLOR = "#2A9D8F";
const CONCERN_COLOR = "#E63946";

/* ── CSS grid background for map canvas ── */
const GRID_BG = `
  linear-gradient(rgba(128,128,128,0.12) 1px, transparent 1px),
  linear-gradient(90deg, rgba(128,128,128,0.12) 1px, transparent 1px)
`;

const DRAW_COLORS = ["#1a1a2e", "#E63946", "#F97316", "#F59E0B", "#10B981", "#3B82F6"];
const LINE_WIDTHS = [1, 2, 4];
const DRAWING_TOOLS: { id: DrawingTool; label: string; icon: string; group: "draw" | "arch" }[] = [
  { id: "pen", label: "Pen", icon: "\u270F\uFE0F", group: "draw" },
  { id: "line", label: "Line", icon: "\u2571", group: "draw" },
  { id: "rect", label: "Rect", icon: "\u25AD", group: "draw" },
  { id: "circle", label: "Circle", icon: "\u25CB", group: "draw" },
  { id: "text", label: "Text", icon: "T", group: "draw" },
  { id: "door", label: "Door", icon: "\u{1F6AA}", group: "arch" },
  { id: "double-door", label: "Dbl Door", icon: "\u{1F6AA}", group: "arch" },
  { id: "sliding-door", label: "Sliding", icon: "\u2194\uFE0F", group: "arch" },
  { id: "rollup-door", label: "Roll-Up", icon: "\u{1F3ED}", group: "arch" },
  { id: "window", label: "Window", icon: "\u2B1C", group: "arch" },
];

const SEL_COLOR = "#3B82F6"; // blue for selection UI

interface MapAnnotatorProps {
  mapData: MapData | null;
  onMapDataChange: (data: MapData | null) => void;
  accentColor: string;
}

/** Resize image to max width to keep base64 size reasonable */
function resizeImage(dataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) { resolve(dataUrl); return; }
      const scale = maxWidth / img.width;
      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  });
}

/** Get display content for a marker (abbreviation > icon > index) */
function markerContent(m: MapMarker, index: number): string {
  return m.abbreviation || m.icon || String(index + 1);
}

/** Get display color for a marker (color > legacy type-based) */
function markerColor(m: MapMarker): string {
  return m.color || (m.type === "equipment" ? EQUIPMENT_COLOR : CONCERN_COLOR);
}

/** Get marker shape based on category */
function markerShape(m: MapMarker): "diamond" | "square" | "triangle" | "circle" | "hexagon" {
  switch (m.category) {
    case "pest": return "diamond";
    case "item": return "square";
    case "issue": return "triangle";
    case "finding": return "circle";
    case "treatment": return "hexagon";
    default: return "circle";
  }
}

const CATEGORIES: MarkerCategory[] = ["pest", "item", "issue", "finding", "treatment"];

/* ── Canvas drawing helpers ── */
function drawStrokeOnCtx(ctx: CanvasRenderingContext2D, s: DrawingStroke, w: number, h: number) {
  const px = (pct: number) => (pct / 100) * w;
  const py = (pct: number) => (pct / 100) * h;

  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Apply rotation around bounding-box center if set
  if (s.rotation) {
    const bb = getStrokeBBox(s);
    const cx = px((bb.minX + bb.maxX) / 2);
    const cy = py((bb.minY + bb.maxY) / 2);
    ctx.translate(cx, cy);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  switch (s.tool) {
    case "pen": {
      if (s.points.length < 4) break;
      ctx.beginPath();
      ctx.moveTo(px(s.points[0]), py(s.points[1]));
      for (let i = 2; i < s.points.length; i += 2) {
        ctx.lineTo(px(s.points[i]), py(s.points[i + 1]));
      }
      ctx.stroke();
      break;
    }
    case "line": {
      if (s.points.length < 4) break;
      ctx.beginPath();
      ctx.moveTo(px(s.points[0]), py(s.points[1]));
      ctx.lineTo(px(s.points[2]), py(s.points[3]));
      ctx.stroke();
      break;
    }
    case "rect": {
      if (s.points.length < 4) break;
      ctx.strokeRect(px(s.points[0]), py(s.points[1]), px(s.points[2]), py(s.points[3]));
      break;
    }
    case "circle": {
      if (s.points.length < 3) break;
      ctx.beginPath();
      ctx.arc(px(s.points[0]), py(s.points[1]), px(s.points[2]), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "text": {
      if (!s.text || s.points.length < 2) break;
      const fs = (s.fontSize || 14) * (w / 800);
      ctx.font = `bold ${fs}px Arial, sans-serif`;
      ctx.fillText(s.text, px(s.points[0]), py(s.points[1]));
      break;
    }
    default: {
      // Architectural tools: door, double-door, sliding-door, rollup-door, window
      if (isArchTool(s.tool) && s.points.length >= 4) {
        drawArchSymbol(ctx, s.tool, px(s.points[0]), py(s.points[1]), px(s.points[2]), py(s.points[3]));
      }
      break;
    }
  }
  ctx.restore();
}

function redrawAll(canvas: HTMLCanvasElement, drawings: DrawingStroke[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawings.forEach(s => drawStrokeOnCtx(ctx, s, canvas.width, canvas.height));
}

type MapMode = "stamp" | "draw" | "select";

export default function MapAnnotator({ mapData, onMapDataChange, accentColor }: MapAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Mode: stamp (place markers), draw, or select */
  const [mode, setMode] = useState<MapMode>("stamp");

  /* Stamp picker state */
  const [activeCategory, setActiveCategory] = useState<MarkerCategory>("finding");
  const [selectedPreset, setSelectedPreset] = useState<CadPreset | null>(null);
  const [markerDesc, setMarkerDesc] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customAbbr, setCustomAbbr] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  /* Draw state */
  const [drawTool, setDrawTool] = useState<DrawingTool>("pen");
  const [drawColor, setDrawColor] = useState("#1a1a2e");
  const [drawWidth, setDrawWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const drawPointsRef = useRef<number[]>([]);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputVal, setTextInputVal] = useState("");

  /* Map interaction state */
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [flashHint, setFlashHint] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  /* ── Selection state ── */
  const [selMarkers, setSelMarkers] = useState<Set<number>>(new Set());
  const [selStrokes, setSelStrokes] = useState<Set<number>>(new Set());
  const [lassoRect, setLassoRect] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const lassoStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDraggingSel, setIsDraggingSel] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragSnapMarkers = useRef<MapMarker[]>([]);
  const dragSnapStrokes = useRef<DrawingStroke[]>([]);
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeOrigBBox = useRef<BoundingBox | null>(null);
  const resizeSnapMarkers = useRef<MapMarker[]>([]);
  const resizeSnapStrokes = useRef<DrawingStroke[]>([]);

  const drawings = mapData?.drawings || [];

  const selCount = selMarkers.size + selStrokes.size;

  /** Switch mode and clear selection */
  const changeMode = useCallback((m: MapMode) => {
    setMode(m);
    setSelMarkers(new Set());
    setSelStrokes(new Set());
    setLassoRect(null);
    setIsDraggingSel(false);
    setResizingHandle(null);
  }, []);

  /* Close expanded mode on Escape */
  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isExpanded]);

  /* ── Resize canvas to match container ── */
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const ro = new ResizeObserver(() => {
      const c = containerRef.current;
      const cv = canvasRef.current;
      if (!c || !cv) return;
      const rect = c.getBoundingClientRect();
      if (cv.width !== rect.width || cv.height !== rect.height) {
        cv.width = rect.width;
        cv.height = rect.height;
        redrawAll(cv, drawings);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  });

  /* Redraw canvas when drawings change */
  useEffect(() => {
    if (!canvasRef.current) return;
    redrawAll(canvasRef.current, drawings);
  }, [drawings]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      const resized = await resizeImage(raw, 1500);
      onMapDataChange({ imageSrc: resized, fileName: file.name, markers: [], drawings: [] });
    };
    reader.readAsDataURL(file);
  }, [onMapDataChange]);

  const handleBlankCanvas = useCallback(() => {
    onMapDataChange({ imageSrc: "", fileName: "blank-canvas", markers: [], drawings: [], canvasWidth: 800, canvasHeight: 600 });
  }, [onMapDataChange]);

  /* Helper: get percentage coords from a pointer event on the container */
  const getContainerPct = useCallback((e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  /* ── Stamp: click the map to place a marker ── */
  const handleStampClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "stamp" || !containerRef.current || !mapData) return;
    if ((e.target as HTMLElement).closest("[data-marker]")) return;

    if (!selectedPreset && !customMode) {
      setFlashHint(true);
      setTimeout(() => setFlashHint(false), 1200);
      return;
    }

    const abbr = selectedPreset?.abbreviation || customAbbr;
    const label = selectedPreset?.label || customLabel;
    const color = selectedPreset?.color || CATEGORY_META[activeCategory].defaultColor;
    const category = selectedPreset?.category || activeCategory;

    if (!label.trim() || !abbr.trim()) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const marker: MapMarker = {
      id: Date.now() + Math.random(),
      x, y,
      type: category === "pest" || category === "issue" ? "concern" : "equipment",
      category,
      label: label.trim(),
      description: markerDesc.trim(),
      abbreviation: abbr,
      color,
    };

    onMapDataChange({ ...mapData, markers: [...mapData.markers, marker] });
  }, [mode, containerRef, mapData, selectedPreset, customMode, customAbbr, customLabel, activeCategory, markerDesc, onMapDataChange]);

  /* ── Draw: pointer events ── */
  const getPctCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return { x: 0, y: 0 };
    const rect = cv.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "draw" || !mapData) return;
    e.preventDefault();
    const { x, y } = getPctCoords(e);

    if (drawTool === "text") {
      setTextInputPos({ x, y });
      setTextInputVal("");
      return;
    }

    setIsDrawing(true);
    drawStartRef.current = { x, y };
    drawPointsRef.current = [x, y];
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }, [mode, mapData, drawTool, getPctCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !mapData) return;
    const { x, y } = getPctCoords(e);
    const cv = canvasRef.current;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    if (drawTool === "pen") {
      drawPointsRef.current.push(x, y);
      const pts = drawPointsRef.current;
      const len = pts.length;
      if (len >= 4) {
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo((pts[len - 4] / 100) * cv.width, (pts[len - 3] / 100) * cv.height);
        ctx.lineTo((pts[len - 2] / 100) * cv.width, (pts[len - 1] / 100) * cv.height);
        ctx.stroke();
      }
    } else {
      redrawAll(cv, drawings);
      const start = drawStartRef.current;
      if (!start) return;
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawWidth;
      ctx.lineCap = "round";
      ctx.setLineDash([4, 4]);

      const sx = (start.x / 100) * cv.width;
      const sy = (start.y / 100) * cv.height;
      const ex = (x / 100) * cv.width;
      const ey = (y / 100) * cv.height;

      if (drawTool === "line") {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else if (drawTool === "rect") {
        ctx.strokeRect(sx, sy, ex - sx, ey - sy);
      } else if (drawTool === "circle") {
        const r = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isArchTool(drawTool)) {
        // Preview: show dashed line for wall opening, full symbol on commit
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }, [isDrawing, mapData, drawTool, drawColor, drawWidth, drawings, getPctCoords]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !mapData) return;
    setIsDrawing(false);
    const { x, y } = getPctCoords(e);
    const start = drawStartRef.current;
    if (!start) return;

    let stroke: DrawingStroke | null = null;
    const id = Date.now() + Math.random();

    if (drawTool === "pen") {
      const pts = drawPointsRef.current;
      if (pts.length >= 4) {
        stroke = { id, tool: "pen", color: drawColor, lineWidth: drawWidth, points: [...pts] };
      }
    } else if (drawTool === "line") {
      stroke = { id, tool: "line", color: drawColor, lineWidth: drawWidth, points: [start.x, start.y, x, y] };
    } else if (drawTool === "rect") {
      stroke = { id, tool: "rect", color: drawColor, lineWidth: drawWidth, points: [start.x, start.y, x - start.x, y - start.y] };
    } else if (drawTool === "circle") {
      const r = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2);
      if (r > 0.5) {
        stroke = { id, tool: "circle", color: drawColor, lineWidth: drawWidth, points: [start.x, start.y, r] };
      }
    } else if (isArchTool(drawTool)) {
      const dist = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2);
      if (dist > 0.5) {
        stroke = { id, tool: drawTool, color: drawColor, lineWidth: drawWidth, points: [start.x, start.y, x, y] };
      }
    }

    if (stroke) {
      const newDrawings = [...drawings, stroke];
      onMapDataChange({ ...mapData, drawings: newDrawings });
    }

    drawStartRef.current = null;
    drawPointsRef.current = [];
  }, [isDrawing, mapData, drawTool, drawColor, drawWidth, drawings, getPctCoords, onMapDataChange]);

  const handleTextCommit = useCallback(() => {
    if (!textInputPos || !textInputVal.trim() || !mapData) return;
    const stroke: DrawingStroke = {
      id: Date.now() + Math.random(),
      tool: "text",
      color: drawColor,
      lineWidth: drawWidth,
      points: [textInputPos.x, textInputPos.y],
      text: textInputVal.trim(),
      fontSize: 14,
    };
    onMapDataChange({ ...mapData, drawings: [...drawings, stroke] });
    setTextInputPos(null);
    setTextInputVal("");
  }, [textInputPos, textInputVal, mapData, drawColor, drawWidth, drawings, onMapDataChange]);

  const undoDrawing = useCallback(() => {
    if (!mapData || drawings.length === 0) return;
    onMapDataChange({ ...mapData, drawings: drawings.slice(0, -1) });
  }, [mapData, drawings, onMapDataChange]);

  const clearDrawings = useCallback(() => {
    if (!mapData) return;
    onMapDataChange({ ...mapData, drawings: [] });
  }, [mapData, onMapDataChange]);

  const removeMarker = useCallback((id: number) => {
    if (!mapData) return;
    onMapDataChange({ ...mapData, markers: mapData.markers.filter(m => m.id !== id) });
  }, [mapData, onMapDataChange]);

  /* ── SELECT MODE: pointer events on the container ── */

  const handleSelectPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "select" || !containerRef.current || !mapData) return;
    if ((e.target as HTMLElement).closest("[data-resize-handle]")) return; // resize handle has its own handler
    e.preventDefault();
    const { x, y } = getContainerPct(e);
    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;

    // Check if pointer is on an already-selected item → start drag
    const hitSelMarker = mapData.markers.find(m => selMarkers.has(m.id) && isPointNearMarker(x, y, m));
    const hitSelStroke = drawings.find(s => selStrokes.has(s.id) && isPointNearStroke(x, y, s));

    if (hitSelMarker || hitSelStroke) {
      setIsDraggingSel(true);
      dragStartRef.current = { x, y };
      dragSnapMarkers.current = mapData.markers.filter(m => selMarkers.has(m.id)).map(m => ({ ...m }));
      dragSnapStrokes.current = drawings.filter(s => selStrokes.has(s.id)).map(s => ({ ...s, points: [...s.points] }));
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    // Check if pointer hits any (unselected) item → select it
    const hitMarker = mapData.markers.find(m => isPointNearMarker(x, y, m));
    if (hitMarker) {
      setSelMarkers(prev => {
        const next = new Set(isMulti ? prev : []);
        if (prev.has(hitMarker.id)) next.delete(hitMarker.id); else next.add(hitMarker.id);
        return next;
      });
      if (!isMulti) setSelStrokes(new Set());
      return;
    }

    for (let i = drawings.length - 1; i >= 0; i--) {
      if (isPointNearStroke(x, y, drawings[i])) {
        const sid = drawings[i].id;
        setSelStrokes(prev => {
          const next = new Set(isMulti ? prev : []);
          if (prev.has(sid)) next.delete(sid); else next.add(sid);
          return next;
        });
        if (!isMulti) setSelMarkers(new Set());
        return;
      }
    }

    // Empty space → start lasso
    if (!isMulti) {
      setSelMarkers(new Set());
      setSelStrokes(new Set());
    }
    lassoStartRef.current = { x, y };
    setLassoRect({ sx: x, sy: y, ex: x, ey: y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [mode, mapData, drawings, selMarkers, selStrokes, getContainerPct]);

  const handleSelectPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "select" || !containerRef.current) return;
    const { x, y } = getContainerPct(e);

    // Dragging selected items
    if (isDraggingSel && dragStartRef.current && mapData) {
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;

      const newMarkers = mapData.markers.map(m => {
        const orig = dragSnapMarkers.current.find(om => om.id === m.id);
        if (!orig) return m;
        return { ...m, x: orig.x + dx, y: orig.y + dy };
      });

      const newDrawings = drawings.map(s => {
        const orig = dragSnapStrokes.current.find(os => os.id === s.id);
        if (!orig) return s;
        return { ...s, points: shiftStrokePoints(s, orig.points, dx, dy) };
      });

      onMapDataChange({ ...mapData, markers: newMarkers, drawings: newDrawings });
      return;
    }

    // Lasso
    if (lassoStartRef.current) {
      setLassoRect(prev => prev ? { ...prev, ex: x, ey: y } : null);
    }
  }, [mode, isDraggingSel, mapData, drawings, getContainerPct, onMapDataChange]);

  const handleSelectPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "select") return;

    // End drag
    if (isDraggingSel) {
      setIsDraggingSel(false);
      dragStartRef.current = null;
      dragSnapMarkers.current = [];
      dragSnapStrokes.current = [];
      return;
    }

    // End lasso
    if (lassoRect && mapData) {
      const lx1 = Math.min(lassoRect.sx, lassoRect.ex);
      const ly1 = Math.min(lassoRect.sy, lassoRect.ey);
      const lx2 = Math.max(lassoRect.sx, lassoRect.ex);
      const ly2 = Math.max(lassoRect.sy, lassoRect.ey);

      // Only treat as lasso if dragged > 2% in either direction
      if (lx2 - lx1 > 2 || ly2 - ly1 > 2) {
        const hitM = new Set<number>();
        mapData.markers.forEach(m => {
          if (m.x >= lx1 && m.x <= lx2 && m.y >= ly1 && m.y <= ly2) hitM.add(m.id);
        });
        const hitS = new Set<number>();
        const lassoBB: BoundingBox = { minX: lx1, minY: ly1, maxX: lx2, maxY: ly2 };
        drawings.forEach(s => {
          const bb = getStrokeBBox(s);
          if (bb.maxX >= lassoBB.minX && bb.minX <= lassoBB.maxX && bb.maxY >= lassoBB.minY && bb.minY <= lassoBB.maxY) {
            hitS.add(s.id);
          }
        });
        setSelMarkers(hitM);
        setSelStrokes(hitS);
      }
    }

    lassoStartRef.current = null;
    setLassoRect(null);
  }, [mode, isDraggingSel, lassoRect, mapData, drawings]);

  /* ── RESIZE: handle drag ── */

  const handleResizePointerDown = useCallback((handle: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!mapData) return;
    const { x, y } = getContainerPct(e);
    setResizingHandle(handle);
    resizeStartRef.current = { x, y };
    const bb = getGroupBBox(mapData.markers, drawings, selMarkers, selStrokes);
    resizeOrigBBox.current = bb;
    resizeSnapMarkers.current = mapData.markers.filter(m => selMarkers.has(m.id)).map(m => ({ ...m }));
    resizeSnapStrokes.current = drawings.filter(s => selStrokes.has(s.id)).map(s => ({ ...s, points: [...s.points] }));
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [mapData, drawings, selMarkers, selStrokes, getContainerPct]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizingHandle || !resizeStartRef.current || !resizeOrigBBox.current || !mapData) return;
    e.stopPropagation();
    const { x, y } = getContainerPct(e);
    const dx = x - resizeStartRef.current.x;
    const dy = y - resizeStartRef.current.y;
    const newBB = computeResizedBBox(resizingHandle, resizeOrigBBox.current, dx, dy);
    const origBB = resizeOrigBBox.current;
    const ow = origBB.maxX - origBB.minX || 1;
    const oh = origBB.maxY - origBB.minY || 1;

    // Scale markers
    const newMarkers = mapData.markers.map(m => {
      const orig = resizeSnapMarkers.current.find(om => om.id === m.id);
      if (!orig) return m;
      return {
        ...m,
        x: newBB.minX + ((orig.x - origBB.minX) / ow) * (newBB.maxX - newBB.minX),
        y: newBB.minY + ((orig.y - origBB.minY) / oh) * (newBB.maxY - newBB.minY),
      };
    });

    // Scale strokes
    const newDrawings = drawings.map(s => {
      const orig = resizeSnapStrokes.current.find(os => os.id === s.id);
      if (!orig) return s;
      return { ...s, points: scaleStrokePoints(orig, origBB, newBB) };
    });

    onMapDataChange({ ...mapData, markers: newMarkers, drawings: newDrawings });
  }, [resizingHandle, mapData, drawings, getContainerPct, onMapDataChange]);

  const handleResizePointerUp = useCallback(() => {
    setResizingHandle(null);
    resizeStartRef.current = null;
    resizeOrigBBox.current = null;
    resizeSnapMarkers.current = [];
    resizeSnapStrokes.current = [];
  }, []);

  /* ── Select mode actions ── */
  const selectAll = useCallback(() => {
    if (!mapData) return;
    setSelMarkers(new Set(mapData.markers.map(m => m.id)));
    setSelStrokes(new Set(drawings.map(s => s.id)));
  }, [mapData, drawings]);

  const deleteSelected = useCallback(() => {
    if (!mapData) return;
    const newMarkers = mapData.markers.filter(m => !selMarkers.has(m.id));
    const newDrawings = drawings.filter(s => !selStrokes.has(s.id));
    onMapDataChange({ ...mapData, markers: newMarkers, drawings: newDrawings });
    setSelMarkers(new Set());
    setSelStrokes(new Set());
  }, [mapData, drawings, selMarkers, selStrokes, onMapDataChange]);

  const deselectAll = useCallback(() => {
    setSelMarkers(new Set());
    setSelStrokes(new Set());
  }, []);

  /** Duplicate selected markers + strokes, offset copies by 3% */
  const duplicateSelected = useCallback(() => {
    if (!mapData || selCount === 0) return;
    const offset = 3; // 3% offset for copies
    const newMarkerIds = new Set<number>();
    const newStrokeIds = new Set<number>();
    let newMarkers = [...mapData.markers];
    let newDrawings = [...drawings];

    // Clone selected markers
    mapData.markers.forEach(m => {
      if (!selMarkers.has(m.id)) return;
      const newId = Date.now() + Math.random();
      newMarkers.push({ ...m, id: newId, x: m.x + offset, y: m.y + offset });
      newMarkerIds.add(newId);
    });

    // Clone selected strokes
    drawings.forEach(s => {
      if (!selStrokes.has(s.id)) return;
      const newId = Date.now() + Math.random();
      const newPts = shiftStrokePoints(s, s.points, offset, offset);
      newDrawings.push({ ...s, id: newId, points: newPts });
      newStrokeIds.add(newId);
    });

    onMapDataChange({ ...mapData, markers: newMarkers, drawings: newDrawings });
    // Select the new copies
    setSelMarkers(newMarkerIds);
    setSelStrokes(newStrokeIds);
  }, [mapData, drawings, selMarkers, selStrokes, selCount, onMapDataChange]);

  /** Rotate selected strokes by a given number of degrees */
  const rotateSelected = useCallback((deg: number) => {
    if (!mapData || selStrokes.size === 0) return;
    const newDrawings = drawings.map(s => {
      if (!selStrokes.has(s.id)) return s;
      const cur = s.rotation || 0;
      return { ...s, rotation: (cur + deg) % 360 };
    });
    onMapDataChange({ ...mapData, drawings: newDrawings });
  }, [mapData, drawings, selStrokes, onMapDataChange]);

  /* Keyboard shortcuts in select mode */
  useEffect(() => {
    if (mode !== "select" || selCount === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!mapData) return;
        const newMarkers = mapData.markers.filter(m => !selMarkers.has(m.id));
        const newDrawings = drawings.filter(s => !selStrokes.has(s.id));
        onMapDataChange({ ...mapData, markers: newMarkers, drawings: newDrawings });
        setSelMarkers(new Set());
        setSelStrokes(new Set());
      }
      if (e.key === "Escape") {
        setSelMarkers(new Set());
        setSelStrokes(new Set());
      }
      // Ctrl/Cmd+D or Ctrl/Cmd+C = duplicate selected
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "c")) {
        e.preventDefault();
        duplicateSelected();
      }
      // R = rotate 15° clockwise, Shift+R = rotate 15° counter-clockwise
      if (e.key === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        rotateSelected(e.shiftKey ? -15 : 15);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, selCount, selMarkers, selStrokes, mapData, drawings, onMapDataChange, duplicateSelected, rotateSelected]);

  /* Category counts */
  const counts: Record<string, number> = {};
  CATEGORIES.forEach(c => { counts[c] = mapData?.markers.filter(m => m.category === c).length ?? 0; });
  const legacyCount = mapData?.markers.filter(m => !m.category).length ?? 0;
  const totalMarkers = mapData?.markers.length ?? 0;
  const currentPresets = ALL_PRESETS[activeCategory];
  const isBlank = mapData && !mapData.imageSrc;
  const aspectRatio = isBlank ? `${mapData!.canvasWidth || 800} / ${mapData!.canvasHeight || 600}` : undefined;

  /* Compute group bounding box + resize handles for selection */
  const groupBBox = useMemo(() => {
    if (selCount === 0 || !mapData) return null;
    return getGroupBBox(mapData.markers, drawings, selMarkers, selStrokes);
  }, [selCount, mapData, drawings, selMarkers, selStrokes]);

  const resizeHandles = useMemo(() => {
    if (!groupBBox) return [];
    // Only show if there are selected strokes (markers don't individually resize) or 2+ items
    if (selStrokes.size > 0 || selCount >= 2) return getResizeHandles(groupBBox);
    return [];
  }, [groupBBox, selStrokes.size, selCount]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>
          {mapData
            ? mode === "stamp"
              ? "Select a marker, then click map to place"
              : mode === "draw"
                ? "Use drawing tools below"
                : "Click, lasso, drag to move, handles to resize"
            : "Upload a floor plan or draw from scratch"}
        </div>
        {mapData && (
          <button onClick={() => onMapDataChange(null)}
            style={{ background: "none", border: "none", color: "#f85149", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>
            {"\u2715"} Remove Map
          </button>
        )}
      </div>

      {/* ── START SCREEN: Upload or Draw from Scratch ── */}
      {!mapData && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = accentColor; }}
              onDragLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}44`; }}
              onDrop={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}44`;
                const imageFile = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/"));
                if (imageFile) handleFile(imageFile);
              }}
              style={{
                border: `2px dashed ${accentColor}44`, borderRadius: 10, padding: "24px 12px",
                textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "var(--bg2)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{"\u{1F4E4}"}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>Upload Floor Plan</div>
              <div style={{ fontSize: 10, color: "var(--text5)", marginTop: 4 }}>JPG, PNG image</div>
            </div>
            <div
              onClick={handleBlankCanvas}
              style={{
                border: `2px dashed ${accentColor}44`, borderRadius: 10, padding: "24px 12px",
                textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "var(--bg2)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{"\u270F\uFE0F"}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>Draw from Scratch</div>
              <div style={{ fontSize: 10, color: "var(--text5)", marginTop: 4 }}>Blank canvas with grid</div>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
            style={{ display: "none" }} />
        </>
      )}

      {/* ── CAD WORKSPACE ── */}
      {mapData && (() => {
        const workspaceContent = (
          <>
          {/* ── MODE TOGGLE + EXPAND ── */}
          <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
            {(["stamp", "draw", "select"] as const).map(m => (
              <button key={m} onClick={() => changeMode(m)}
                style={{
                  flex: 1, padding: "7px 0", fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: "pointer",
                  background: mode === m ? (m === "select" ? SEL_COLOR : accentColor) : "var(--bg3)",
                  color: mode === m ? "#fff" : "var(--text4)",
                  border: "none", textTransform: "uppercase", letterSpacing: "0.5px",
                  transition: "all 0.15s",
                }}>
                {m === "stamp" ? "\u{1F4CD} Stamp" : m === "draw" ? "\u270F\uFE0F Draw" : "\u2B1C Select"}
              </button>
            ))}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                padding: "7px 10px", fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: "pointer",
                background: isExpanded ? "#F59E0B" : "var(--bg3)",
                color: isExpanded ? "#fff" : "var(--text4)",
                border: "none", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 4,
                flexShrink: 0,
              }}
              title={isExpanded ? "Minimize map (Esc)" : "Expand map to full screen"}
            >
              {isExpanded ? "\u2716 Minimize" : "\u26F6 Expand"}
            </button>
          </div>

          {/* ── STAMP PICKER PANEL ── */}
          {mode === "stamp" && (
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "10px 10px 0 0", padding: 10,
            }}>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                {CATEGORIES.map(cat => {
                  const meta = CATEGORY_META[cat];
                  const isActive = activeCategory === cat;
                  return (
                    <button key={cat}
                      onClick={() => { setActiveCategory(cat); setSelectedPreset(null); setCustomMode(false); }}
                      style={{
                        flex: 1, padding: "6px 0", fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: "pointer",
                        background: isActive ? meta.defaultColor : "var(--bg3)",
                        color: isActive ? "#fff" : "var(--text4)",
                        border: "none", textTransform: "uppercase", letterSpacing: "0.5px",
                        transition: "all 0.15s",
                      }}>
                      {meta.label} {counts[cat] > 0 ? `(${counts[cat]})` : ""}
                    </button>
                  );
                })}
              </div>

              {/* Icon picker grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 3, maxHeight: 150, overflowY: "auto",
                padding: 4, background: "var(--bg)", borderRadius: 8,
                border: "1px solid var(--border)",
              }}>
                {currentPresets.map((preset) => {
                  const isSelected = selectedPreset?.abbreviation === preset.abbreviation
                    && selectedPreset?.label === preset.label
                    && !customMode;
                  return (
                    <button key={`${preset.abbreviation}-${preset.label}`}
                      onClick={() => { setSelectedPreset(preset); setCustomMode(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 6px", borderRadius: 5, cursor: "pointer",
                        background: isSelected ? `${preset.color}20` : "transparent",
                        border: isSelected ? `1.5px solid ${preset.color}` : "1.5px solid transparent",
                        color: isSelected ? preset.color : "var(--text)",
                        fontSize: 10, fontWeight: isSelected ? 700 : 500,
                        textAlign: "left", transition: "all 0.12s",
                        lineHeight: 1.3,
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        background: preset.color, color: "#fff",
                        fontSize: 7, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "Arial, sans-serif", letterSpacing: "-0.3px",
                        lineHeight: 1,
                      }}>
                        {preset.abbreviation}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}

                {/* Custom option */}
                <button
                  onClick={() => { setCustomMode(true); setSelectedPreset(null); setCustomAbbr(""); setCustomLabel(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 6px", borderRadius: 5, cursor: "pointer",
                    background: customMode ? `${CATEGORY_META[activeCategory].defaultColor}20` : "transparent",
                    border: customMode ? `1.5px solid ${CATEGORY_META[activeCategory].defaultColor}` : "1.5px solid transparent",
                    color: customMode ? CATEGORY_META[activeCategory].defaultColor : "var(--text4)",
                    fontSize: 10, fontWeight: customMode ? 700 : 500,
                    textAlign: "left",
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: "var(--bg3)", color: "var(--text4)",
                    fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>+</span>
                  <span>Custom...</span>
                </button>
              </div>

              {/* Custom inputs */}
              {customMode && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input type="text" value={customAbbr}
                    onChange={(e) => setCustomAbbr(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder="Code" maxLength={3}
                    style={{
                      width: 52, background: "var(--bg)", border: "1px solid var(--border3)",
                      borderRadius: 6, color: "var(--text)", padding: "5px 6px", fontSize: 11,
                      fontFamily: "Arial, sans-serif", fontWeight: 700, textAlign: "center",
                      outline: "none", textTransform: "uppercase",
                    }} />
                  <input type="text" value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Label (e.g., Custom Equipment)"
                    style={{
                      flex: 1, background: "var(--bg)", border: "1px solid var(--border3)",
                      borderRadius: 6, color: "var(--text)", padding: "5px 8px", fontSize: 11,
                      fontFamily: "inherit", outline: "none",
                    }} />
                </div>
              )}

              {/* Description + selected indicator */}
              <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input type="text" value={markerDesc}
                  onChange={(e) => setMarkerDesc(e.target.value)}
                  placeholder="Description / notes (optional)"
                  style={{
                    flex: 1, minWidth: 140, background: "var(--bg)", border: "1px solid var(--border3)",
                    borderRadius: 6, color: "var(--text)", padding: "5px 8px", fontSize: 11,
                    fontFamily: "inherit", outline: "none",
                  }} />
                {(selectedPreset || (customMode && customAbbr && customLabel)) && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: `${(selectedPreset?.color || CATEGORY_META[activeCategory].defaultColor)}15`,
                    color: selectedPreset?.color || CATEGORY_META[activeCategory].defaultColor,
                    border: `1px solid ${(selectedPreset?.color || CATEGORY_META[activeCategory].defaultColor)}40`,
                    whiteSpace: "nowrap",
                  }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      background: selectedPreset?.color || CATEGORY_META[activeCategory].defaultColor,
                      color: "#fff", fontSize: 7, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "Arial, sans-serif",
                    }}>
                      {selectedPreset?.abbreviation || customAbbr}
                    </span>
                    {selectedPreset?.label || customLabel}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DRAW TOOLBAR ── */}
          {mode === "draw" && (
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "10px 10px 0 0", padding: 10,
            }}>
              {/* Draw tools group */}
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                Draw
              </div>
              <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
                {DRAWING_TOOLS.filter(t => t.group === "draw").map(t => (
                  <button key={t.id} onClick={() => { setDrawTool(t.id); setTextInputPos(null); }}
                    style={{
                      flex: "1 1 auto", minWidth: 50, padding: "6px 8px", fontSize: 10, fontWeight: 700,
                      borderRadius: 6, cursor: "pointer",
                      background: drawTool === t.id ? accentColor : "var(--bg3)",
                      color: drawTool === t.id ? "#fff" : "var(--text4)",
                      border: "none", transition: "all 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                    }}>
                    <span style={{ fontSize: 12 }}>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>

              {/* Architecture tools divider + group */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                  Architecture
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
                {DRAWING_TOOLS.filter(t => t.group === "arch").map(t => (
                  <button key={t.id} onClick={() => { setDrawTool(t.id); setTextInputPos(null); }}
                    style={{
                      flex: "1 1 auto", minWidth: 52, padding: "6px 8px", fontSize: 10, fontWeight: 700,
                      borderRadius: 6, cursor: "pointer",
                      background: drawTool === t.id ? accentColor : "var(--bg3)",
                      color: drawTool === t.id ? "#fff" : "var(--text4)",
                      border: drawTool === t.id ? "none" : "1px solid var(--border3)",
                      transition: "all 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                    }}>
                    <span style={{ fontSize: 12 }}>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "var(--text5)", fontWeight: 600 }}>Color:</span>
                  {DRAW_COLORS.map(c => (
                    <button key={c} onClick={() => setDrawColor(c)}
                      style={{
                        width: 18, height: 18, borderRadius: "50%", border: drawColor === c ? "2px solid var(--text)" : "2px solid transparent",
                        background: c, cursor: "pointer", padding: 0, flexShrink: 0,
                      }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "var(--text5)", fontWeight: 600 }}>Size:</span>
                  {LINE_WIDTHS.map(w => (
                    <button key={w} onClick={() => setDrawWidth(w)}
                      style={{
                        width: 24, height: 24, borderRadius: 5, cursor: "pointer",
                        background: drawWidth === w ? accentColor : "var(--bg3)",
                        color: drawWidth === w ? "#fff" : "var(--text4)",
                        border: "none", fontSize: 10, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      {w}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                  <button onClick={undoDrawing} disabled={drawings.length === 0}
                    style={{
                      background: "var(--bg3)", border: "none", borderRadius: 5, color: drawings.length === 0 ? "var(--text5)" : "var(--text4)",
                      cursor: drawings.length === 0 ? "default" : "pointer", padding: "4px 8px", fontSize: 10, fontWeight: 600,
                    }}>
                    {"\u21A9"} Undo
                  </button>
                  <button onClick={clearDrawings} disabled={drawings.length === 0}
                    style={{
                      background: "var(--bg3)", border: "none", borderRadius: 5, color: drawings.length === 0 ? "var(--text5)" : "#f85149",
                      cursor: drawings.length === 0 ? "default" : "pointer", padding: "4px 8px", fontSize: 10, fontWeight: 600,
                    }}>
                    {"\u{1F5D1}"} Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SELECT TOOLBAR ── */}
          {mode === "select" && (
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "10px 10px 0 0", padding: "8px 10px",
              display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            }}>
              <button onClick={selectAll}
                style={{
                  background: "var(--bg3)", border: "none", borderRadius: 6, color: "var(--text4)",
                  cursor: "pointer", padding: "5px 10px", fontSize: 10, fontWeight: 600,
                }}>
                Select All
              </button>
              <button onClick={duplicateSelected} disabled={selCount === 0}
                style={{
                  background: selCount > 0 ? "#3B82F620" : "var(--bg3)", border: "none", borderRadius: 6,
                  color: selCount > 0 ? "#3B82F6" : "var(--text5)",
                  cursor: selCount > 0 ? "pointer" : "default", padding: "5px 10px", fontSize: 10, fontWeight: 600,
                }}
                title="Duplicate (Ctrl+D)">
                {"\u{1F4CB}"} Copy
              </button>
              <button onClick={() => rotateSelected(15)} disabled={selStrokes.size === 0}
                style={{
                  background: selStrokes.size > 0 ? "#10B98120" : "var(--bg3)", border: "none", borderRadius: 6,
                  color: selStrokes.size > 0 ? "#10B981" : "var(--text5)",
                  cursor: selStrokes.size > 0 ? "pointer" : "default", padding: "5px 10px", fontSize: 10, fontWeight: 600,
                }}
                title="Rotate 15° (R / Shift+R)">
                {"\u{21BB}"} Rotate
              </button>
              <button onClick={deleteSelected} disabled={selCount === 0}
                style={{
                  background: selCount > 0 ? "#f8514920" : "var(--bg3)", border: "none", borderRadius: 6,
                  color: selCount > 0 ? "#f85149" : "var(--text5)",
                  cursor: selCount > 0 ? "pointer" : "default", padding: "5px 10px", fontSize: 10, fontWeight: 600,
                }}>
                {"\u{1F5D1}"} Delete
              </button>
              <button onClick={deselectAll} disabled={selCount === 0}
                style={{
                  background: "var(--bg3)", border: "none", borderRadius: 6,
                  color: selCount > 0 ? "var(--text4)" : "var(--text5)",
                  cursor: selCount > 0 ? "pointer" : "default", padding: "5px 10px", fontSize: 10, fontWeight: 600,
                }}>
                Deselect
              </button>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text5)", fontWeight: 600 }}>
                {selCount > 0 ? `${selCount} selected` : "Click or lasso to select"}
              </span>
            </div>
          )}

          {/* Flash hint */}
          {flashHint && (
            <div style={{
              padding: "6px 12px", background: "#F59E0B20", border: "1px solid #F59E0B40",
              borderRadius: 0, fontSize: 11, color: "#F59E0B", textAlign: "center", fontWeight: 600,
            }}>
              Select a marker type from the panel above first
            </div>
          )}

          {/* ── MAP CANVAS ── */}
          <div
            ref={containerRef}
            onClick={mode === "stamp" ? handleStampClick : undefined}
            onPointerDown={mode === "select" ? handleSelectPointerDown : undefined}
            onPointerMove={mode === "select" ? handleSelectPointerMove : undefined}
            onPointerUp={mode === "select" ? handleSelectPointerUp : undefined}
            style={{
              position: "relative",
              cursor: mode === "draw"
                ? "crosshair"
                : mode === "select"
                  ? (isDraggingSel ? "grabbing" : "default")
                  : ((selectedPreset || customMode) ? "crosshair" : "default"),
              borderRadius: (mode === "stamp" || mode === "draw" || mode === "select") ? "0 0 8px 8px" : 8,
              overflow: "hidden",
              border: "1px solid var(--border)",
              borderTop: "none",
              background: "#fff",
              backgroundImage: GRID_BG,
              backgroundSize: "20px 20px",
              aspectRatio: aspectRatio,
              touchAction: mode === "select" ? "none" : "auto",
            }}
          >
            {/* Background image (if uploaded) */}
            {mapData.imageSrc && (
              <img src={mapData.imageSrc} alt="Site map"
                style={{ width: "100%", display: "block", userSelect: "none", opacity: 0.92 }}
                draggable={false} />
            )}
            {/* Blank canvas placeholder (if no image) */}
            {!mapData.imageSrc && (
              <div style={{ width: "100%", aspectRatio: aspectRatio, display: "block" }} />
            )}

            {/* Drawing canvas overlay */}
            <canvas
              ref={canvasRef}
              onPointerDown={mode === "draw" ? handlePointerDown : undefined}
              onPointerMove={mode === "draw" ? handlePointerMove : undefined}
              onPointerUp={mode === "draw" ? handlePointerUp : undefined}
              style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                pointerEvents: mode === "draw" ? "auto" : "none",
                touchAction: mode === "draw" ? "none" : "auto",
              }}
            />

            {/* Text input overlay */}
            {textInputPos && mode === "draw" && (
              <div style={{
                position: "absolute",
                left: `${textInputPos.x}%`, top: `${textInputPos.y}%`,
                transform: "translate(-4px, -12px)", zIndex: 25,
              }}>
                <input
                  autoFocus
                  value={textInputVal}
                  onChange={(e) => setTextInputVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTextCommit(); if (e.key === "Escape") setTextInputPos(null); }}
                  onBlur={handleTextCommit}
                  placeholder="Type text..."
                  style={{
                    background: "rgba(255,255,255,0.95)", border: `2px solid ${drawColor}`,
                    borderRadius: 4, color: drawColor, padding: "3px 6px", fontSize: 13,
                    fontWeight: 700, outline: "none", fontFamily: "Arial, sans-serif",
                    minWidth: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
            )}

            {/* Rendered markers — shaped by category */}
            {mapData.markers.map((m, i) => {
              const mc = markerColor(m);
              const content = markerContent(m, i);
              const shape = markerShape(m);
              const sz = 26;
              const fs = content.length > 2 ? sz * 0.3 : content.length > 1 ? sz * 0.35 : sz * 0.45;
              const isSel = mode === "select" && selMarkers.has(m.id);

              const textStyle: React.CSSProperties = {
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: fs, fontWeight: 800,
                fontFamily: "Arial, sans-serif", letterSpacing: "-0.3px", lineHeight: 1, zIndex: 1,
              };
              const bdr = "2px solid #fff";
              const shadow = "0 1px 4px rgba(0,0,0,0.4)";

              let shapeEl: React.ReactNode;
              if (shape === "diamond") {
                shapeEl = (
                  <div style={{ position: "relative", width: sz, height: sz }}>
                    <div style={{ position: "absolute", inset: 0, background: mc, border: bdr, borderRadius: 3, transform: "rotate(45deg)", boxShadow: shadow }} />
                    <span style={textStyle}>{content}</span>
                  </div>
                );
              } else if (shape === "square") {
                shapeEl = (
                  <div style={{ position: "relative", width: sz, height: sz, background: mc, border: bdr, borderRadius: 5, boxShadow: shadow }}>
                    <span style={textStyle}>{content}</span>
                  </div>
                );
              } else if (shape === "triangle") {
                shapeEl = (
                  <div style={{ position: "relative", width: sz, height: sz }}>
                    <div style={{ position: "absolute", inset: -1, background: "#fff", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
                    <div style={{ position: "absolute", inset: 1, background: mc, clipPath: "polygon(50% 8%, 4% 100%, 96% 100%)" }} />
                    <span style={{ ...textStyle, top: "30%", inset: undefined, left: 0, right: 0, bottom: 0, position: "absolute", fontSize: fs * 0.85 }}>{content}</span>
                  </div>
                );
              } else if (shape === "hexagon") {
                const hexClip = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
                shapeEl = (
                  <div style={{ position: "relative", width: sz, height: sz }}>
                    <div style={{ position: "absolute", inset: -1, background: "#fff", clipPath: hexClip }} />
                    <div style={{ position: "absolute", inset: 1, background: mc, clipPath: hexClip }} />
                    <span style={textStyle}>{content}</span>
                  </div>
                );
              } else {
                shapeEl = (
                  <div style={{ position: "relative", width: sz, height: sz, background: mc, border: bdr, borderRadius: "50%", boxShadow: shadow }}>
                    <span style={textStyle}>{content}</span>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  data-marker="true"
                  onMouseEnter={() => setHoveredId(m.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: "absolute",
                    left: `${m.x}%`, top: `${m.y}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: isSel ? 22 : hoveredId === m.id ? 20 : 10,
                    pointerEvents: (mode === "stamp" || mode === "select") ? "auto" : "none",
                    cursor: mode === "select" ? (isDraggingSel && isSel ? "grabbing" : "grab") : "pointer",
                    outline: isSel ? `2px dashed ${SEL_COLOR}` : "none",
                    outlineOffset: 3,
                    borderRadius: 4,
                  }}
                >
                  {shapeEl}

                  {hoveredId === m.id && mode === "stamp" && (
                    <div style={{
                      position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                      background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
                      padding: "8px 10px", minWidth: 180, marginBottom: 6,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                      pointerEvents: "auto", zIndex: 30,
                    }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: mc,
                        textTransform: "uppercase", marginBottom: 2,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {m.category || m.type}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{m.label}</div>
                      {m.description && <div style={{ fontSize: 11, color: "var(--text4)" }}>{m.description}</div>}
                      <button
                        data-marker="true"
                        onClick={(e) => { e.stopPropagation(); removeMarker(m.id); }}
                        style={{ background: "none", border: "none", color: "#f85149", cursor: "pointer", fontSize: 10, marginTop: 4, padding: 0 }}
                      >
                        {"\u2715"} Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Selection overlays for drawing strokes ── */}
            {mode === "select" && drawings.filter(s => selStrokes.has(s.id)).map(s => {
              const bb = getStrokeBBox(s);
              return (
                <div key={`sel-s-${s.id}`} style={{
                  position: "absolute",
                  left: `${bb.minX}%`, top: `${bb.minY}%`,
                  width: `${Math.max(bb.maxX - bb.minX, 0.5)}%`,
                  height: `${Math.max(bb.maxY - bb.minY, 0.5)}%`,
                  border: `2px dashed ${SEL_COLOR}`,
                  background: `${SEL_COLOR}08`,
                  pointerEvents: "none",
                  zIndex: 15,
                  borderRadius: 2,
                }} />
              );
            })}

            {/* ── Lasso rectangle ── */}
            {lassoRect && (
              <div style={{
                position: "absolute",
                left: `${Math.min(lassoRect.sx, lassoRect.ex)}%`,
                top: `${Math.min(lassoRect.sy, lassoRect.ey)}%`,
                width: `${Math.abs(lassoRect.ex - lassoRect.sx)}%`,
                height: `${Math.abs(lassoRect.ey - lassoRect.sy)}%`,
                border: `2px dashed ${SEL_COLOR}`,
                background: `${SEL_COLOR}0D`,
                pointerEvents: "none",
                zIndex: 30,
              }} />
            )}

            {/* ── Group bounding box + resize handles ── */}
            {mode === "select" && groupBBox && selCount > 0 && !lassoRect && !isDraggingSel && (
              <>
                {/* Group bbox outline */}
                <div style={{
                  position: "absolute",
                  left: `${groupBBox.minX}%`, top: `${groupBBox.minY}%`,
                  width: `${Math.max(groupBBox.maxX - groupBBox.minX, 0.5)}%`,
                  height: `${Math.max(groupBBox.maxY - groupBBox.minY, 0.5)}%`,
                  border: `1px solid ${SEL_COLOR}66`,
                  pointerEvents: "none",
                  zIndex: 23,
                }} />

                {/* Resize handles */}
                {resizeHandles.map(h => (
                  <div
                    key={h.position}
                    data-resize-handle="true"
                    onPointerDown={(e) => handleResizePointerDown(h.position, e)}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerUp}
                    style={{
                      position: "absolute",
                      left: `${h.x}%`, top: `${h.y}%`,
                      transform: "translate(-50%, -50%)",
                      width: 12, height: 12,
                      background: "#fff",
                      border: `2px solid ${SEL_COLOR}`,
                      borderRadius: "50%",
                      cursor: h.cursor,
                      zIndex: 25,
                      touchAction: "none",
                      // 48px invisible hit area for touch
                      boxShadow: `0 0 0 18px transparent`,
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* ── LEGEND TABLE — grouped with counts ── */}
          {totalMarkers > 0 && (() => {
            const legendGroups: { key: string; abbr: string; label: string; color: string; category: string; shape: string; count: number; ids: number[] }[] = [];
            const gMap = new Map<string, number>();
            for (let i = 0; i < mapData.markers.length; i++) {
              const m = mapData.markers[i];
              const abbr = markerContent(m, i);
              const gk = `${abbr}::${m.label}`;
              const idx = gMap.get(gk);
              if (idx !== undefined) {
                legendGroups[idx].count++;
                legendGroups[idx].ids.push(m.id);
              } else {
                gMap.set(gk, legendGroups.length);
                legendGroups.push({
                  key: gk, abbr, label: m.label,
                  color: markerColor(m), category: m.category || m.type,
                  shape: markerShape(m), count: 1, ids: [m.id],
                });
              }
            }

            return (
              <div style={{ marginTop: 10 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "var(--text4)", marginBottom: 5,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  Marker Legend ({totalMarkers})
                </div>
                {legendGroups.map((g, gi) => {
                  const sz = 18;
                  const fs = g.abbr.length > 2 ? sz * 0.3 : g.abbr.length > 1 ? sz * 0.35 : sz * 0.45;
                  const textStyle: React.CSSProperties = {
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: fs, fontWeight: 800,
                    fontFamily: "Arial, sans-serif", letterSpacing: "-0.3px", lineHeight: 1, zIndex: 1,
                  };

                  let shapeIcon: React.ReactNode;
                  if (g.shape === "diamond") {
                    shapeIcon = (
                      <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
                        <div style={{ position: "absolute", inset: 0, background: g.color, borderRadius: 2, transform: "rotate(45deg)" }} />
                        <span style={textStyle}>{g.abbr}</span>
                      </div>
                    );
                  } else if (g.shape === "square") {
                    shapeIcon = (
                      <div style={{ position: "relative", width: sz, height: sz, background: g.color, borderRadius: 3, flexShrink: 0 }}>
                        <span style={textStyle}>{g.abbr}</span>
                      </div>
                    );
                  } else if (g.shape === "triangle") {
                    shapeIcon = (
                      <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
                        <div style={{ position: "absolute", inset: 0, background: g.color, clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
                        <span style={{ ...textStyle, top: "25%" }}>{g.abbr}</span>
                      </div>
                    );
                  } else if (g.shape === "hexagon") {
                    const hexClip = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
                    shapeIcon = (
                      <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
                        <div style={{ position: "absolute", inset: 0, background: g.color, clipPath: hexClip }} />
                        <span style={textStyle}>{g.abbr}</span>
                      </div>
                    );
                  } else {
                    shapeIcon = (
                      <div style={{ position: "relative", width: sz, height: sz, background: g.color, borderRadius: "50%", flexShrink: 0 }}>
                        <span style={textStyle}>{g.abbr}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={g.key} style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "5px 6px",
                      background: gi % 2 === 0 ? "var(--bg2)" : "transparent",
                      borderRadius: 5, fontSize: 11,
                    }}>
                      {shapeIcon}
                      <span style={{
                        fontWeight: 600, color: g.color, fontSize: 9,
                        textTransform: "uppercase", width: 55, flexShrink: 0,
                      }}>
                        {g.category}
                      </span>
                      <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 11, flex: 1, minWidth: 0 }}>{g.label}</span>
                      <span style={{
                        fontWeight: 700, fontSize: 12, color: "var(--text)",
                        background: "var(--bg3)", borderRadius: 4, padding: "1px 6px", flexShrink: 0,
                      }}>
                        {"\u00D7"}{g.count}
                      </span>
                      <button onClick={() => g.ids.forEach((id) => removeMarker(id))}
                        style={{
                          background: "none", border: "none", color: "#f85149",
                          cursor: "pointer", fontSize: 10, flexShrink: 0,
                        }}>
                        {"\u2715"}
                      </button>
                    </div>
                  );
                })}
                {legacyCount > 0 && (
                  <div style={{ fontSize: 9, color: "var(--text5)", marginTop: 4, fontStyle: "italic" }}>
                    {legacyCount} marker(s) from a previous version
                  </div>
                )}
              </div>
            );
          })()}
        </>
        );

        // When expanded, use a portal to render workspace fullscreen on document.body
        if (isExpanded) {
          return createPortal(
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "var(--bg)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderBottom: "1px solid var(--border)",
                background: "var(--bg)", flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{"\u{1F5FA}\uFE0F"}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Site Map &amp; Equipment</span>
                  <span style={{ fontSize: 11, color: "var(--text5)" }}>Expanded View</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  style={{
                    background: "var(--bg3)", border: "1px solid var(--border3)",
                    borderRadius: 8, color: "var(--text3)", cursor: "pointer",
                    padding: "6px 14px", fontSize: 12, fontWeight: 600,
                    touchAction: "manipulation",
                  }}
                >
                  {"\u2716"} Minimize (Esc)
                </button>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                {workspaceContent}
              </div>
            </div>,
            document.body,
          );
        }

        return workspaceContent;
      })()}
    </div>
  );
}
