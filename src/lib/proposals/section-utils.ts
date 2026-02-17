import type { TemplateField } from "./types";

// ═══════════════════════════════════════════════════════
// Section Utilities — grouping, ordering, completion, icons
// ═══════════════════════════════════════════════════════

/** Display order priority for sections (lower = earlier in section list).
 *  Photos (1) and Map (2) are injected as special sections.
 *  Sections not listed default to priority 4.5 (middle of the pack). */
const SECTION_ORDER: Record<string, number> = {
  "Property Details": 0,
  // "Inspection Photos" → injected at 1
  // "Site Map & Equipment" → injected at 2
  "Treatment Units": 3, // bed bug only
  "Inspection Assessment": 3,
  "Pest Findings": 3.5,
  "Scope of Work": 4,
  "Findings & Notes": 4,
  "Service Schedule": 5,
  "Service Planning": 5,
  "Pricing": 6,
  "Cost": 6,
  "Technician Instructions": 7,
  "Customer Recommendations": 8,
};

const DEFAULT_ORDER = 4.5;

/** Icon map for section names */
const SECTION_ICONS: Record<string, string> = {
  "Property Details": "\u{1F3E0}",
  "Inspection Photos": "\u{1F4F8}",
  "Site Map & Equipment": "\u{1F5FA}\uFE0F",
  "Treatment Units": "\u{1F6CF}\uFE0F",
  "Inspection Assessment": "\u{1F50D}",
  "Pest Findings": "\u{1F41B}",
  "Scope of Work": "\u{1F3AF}",
  "Findings & Notes": "\u{1F4DD}",
  "Service Schedule": "\u{1F4C5}",
  "Service Planning": "\u{1F4CB}",
  "Pricing": "\u{1F3F7}\uFE0F",
  "Cost": "\u{1F4B0}",
  "Technician Instructions": "\u{1F527}",
  "Customer Recommendations": "\u{1F4A1}",
  General: "\u{1F4DD}",
};

export interface FieldGroup {
  section: string;
  fields: TemplateField[];
}

export interface SectionItem {
  id: string;
  title: string;
  icon: string;
  filled: number;
  total: number;
  isSpecial?: "photos" | "map";
  /** Original field group index (for mapping back to fields) */
  groupIndex: number;
  /** Sort priority */
  order: number;
}

/**
 * Groups template fields by their `section` property.
 * Returns groups in their original template-definition order.
 */
export function groupFieldsBySection(fields: TemplateField[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  let cur = "";
  for (const f of fields) {
    const sec = f.section || "General";
    if (sec !== cur) {
      groups.push({ section: sec, fields: [] });
      cur = sec;
    }
    groups[groups.length - 1].fields.push(f);
  }
  return groups;
}

/**
 * Computes how many fields in a group are filled.
 */
export function computeSectionCompletion(
  fields: TemplateField[],
  formData: Record<string, string>,
): { filled: number; total: number } {
  let filled = 0;
  let total = 0;
  for (const f of fields) {
    // Skip conditionally hidden fields
    if (f.showIf) {
      const [depKey, depVal] = f.showIf.split(":");
      if (formData[depKey] !== depVal) continue;
    }
    total++;
    const val = formData[f.key]?.trim();
    if (f.type === "bullet-list" || f.type === "checklist-add" || f.type === "checklist") {
      // JSON array types — count as filled if any non-empty entry
      try { const arr = JSON.parse(val || "[]"); if (arr.some((s: string) => s.trim())) filled++; } catch { /* empty */ }
    } else if (val) {
      filled++;
    }
  }
  return { filled, total };
}

/**
 * Get the emoji icon for a section name.
 */
export function getSectionIcon(sectionName: string): string {
  return SECTION_ICONS[sectionName] || "\u{1F4DD}";
}

/**
 * Get the display-order priority for a section name.
 */
export function getSectionOrder(sectionName: string): number {
  return SECTION_ORDER[sectionName] ?? DEFAULT_ORDER;
}

/**
 * Build the full ordered section list for the UI.
 * Includes field groups from the template, plus special sections (Photos, Map).
 * Returns items sorted by field-workflow order.
 */
export function buildSectionList(
  fields: TemplateField[],
  formData: Record<string, string>,
  options: {
    photoCount: number;
    markerCount: number;
    showMap: boolean;
  },
): SectionItem[] {
  const groups = groupFieldsBySection(fields);
  const items: SectionItem[] = [];

  // Add field groups
  groups.forEach((g, i) => {
    const completion = computeSectionCompletion(g.fields, formData);
    items.push({
      id: `fields-${i}`,
      title: g.section,
      icon: getSectionIcon(g.section),
      filled: completion.filled,
      total: completion.total,
      groupIndex: i,
      order: getSectionOrder(g.section),
    });
  });

  // Inject Photos section
  items.push({
    id: "photos",
    title: "Inspection Photos",
    icon: getSectionIcon("Inspection Photos"),
    filled: options.photoCount,
    total: options.photoCount || 0, // no "required" count — show photo count
    isSpecial: "photos",
    groupIndex: -1,
    order: 1,
  });

  // Inject Map section (only for non-bed-bug templates)
  if (options.showMap) {
    items.push({
      id: "map",
      title: "Site Map & Equipment",
      icon: getSectionIcon("Site Map & Equipment"),
      filled: options.markerCount,
      total: options.markerCount || 0,
      isSpecial: "map",
      groupIndex: -1,
      order: 2,
    });
  }

  // Sort by workflow order (stable sort preserves insertion order for same priority)
  items.sort((a, b) => a.order - b.order);

  return items;
}
