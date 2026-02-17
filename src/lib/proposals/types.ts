export type TemplateId =
  | "bed_bug_heat"
  | "bed_bug_conventional"
  | "general_pest"
  | "food_service"
  | "vertical_shield"
  | "inspection_report";

export interface ChecklistCategory {
  category: string;
  items: string[];
}

export interface TemplateField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checklist" | "checklist-add" | "multi-select" | "bullet-list";
  placeholder?: string;
  options?: string[];
  /** Conditional visibility: "fieldKey:value" */
  showIf?: string;
  /** For checklist fields: predefined items grouped by category */
  checklistCategories?: ChecklistCategory[];
  /** Section name for grouping fields in collapsible accordion UI */
  section?: string;
}

export interface TemplateDefinition {
  name: string;
  icon: string;
  color: string;
  description: string;
  fields: TemplateField[];
}

export interface ProposalContent {
  title: string;
  subtitle: string;
  address: string;
  sections: ProposalSection[];
}

export interface ProposalSection {
  heading: string;
  items: string[];
}

export interface PhotoEntry {
  id: number;
  src: string;
  caption: string;
  fileName: string;
  zone: string;
  unitNumber: string;
  customZone: string;
  concernType: string;
  locationFound: string;
}

export interface ZonePreset {
  value: string;
  label: string;
  icon: string;
}

export type MarkerCategory = "pest" | "item" | "issue" | "finding" | "treatment";

export interface MapMarker {
  id: number;
  x: number;
  y: number;
  /** Legacy type kept for backward compat */
  type: "equipment" | "concern";
  /** New 4-category system */
  category?: MarkerCategory;
  label: string;
  description: string;
  /** 2-letter abbreviation code (e.g., "AN", "CR", "BS") */
  abbreviation?: string;
  /** Hex color for the marker circle */
  color?: string;
  /** @deprecated Legacy emoji icon — use abbreviation instead */
  icon?: string;
}

export type DrawingTool =
  | "pen" | "line" | "rect" | "circle" | "text"
  | "door" | "double-door" | "sliding-door" | "rollup-door" | "window";

export interface DrawingStroke {
  id: number;
  tool: DrawingTool;
  color: string;
  lineWidth: number;
  /** Percentage-based coordinates (0-100):
      pen: [x1, y1, x2, y2, ...] alternating pairs
      line: [x1, y1, x2, y2]
      rect: [x, y, width, height]
      circle: [cx, cy, radius]
      text: [x, y]
      door/double-door/sliding-door/rollup-door/window: [x1, y1, x2, y2] wall opening */
  points: number[];
  /** Only for text tool */
  text?: string;
  fontSize?: number;
  /** Rotation in degrees (0-360), applied around bounding box center */
  rotation?: number;
}

export interface MapData {
  /** base64 image or empty string for blank canvas */
  imageSrc: string;
  /** file name or "blank-canvas" */
  fileName: string;
  markers: MapMarker[];
  /** Canvas drawing strokes (freehand, lines, shapes, text) */
  drawings?: DrawingStroke[];
  /** Aspect ratio hint for blank canvas */
  canvasWidth?: number;
  canvasHeight?: number;
}
