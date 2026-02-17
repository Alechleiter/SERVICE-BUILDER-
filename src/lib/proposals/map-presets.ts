import type { MarkerCategory } from "./types";

export interface CadPreset {
  abbreviation: string;
  label: string;
  color: string;
  category: MarkerCategory;
}

/* ── Category colors ── */
const PEST_COLOR = "#3B82F6";
const ISSUE_COLOR = "#F97316";
const FINDING_COLOR = "#10B981";

/* ── PEST presets (blue circles) ── */
export const PEST_PRESETS: CadPreset[] = [
  { abbreviation: "AN", label: "Ant", color: PEST_COLOR, category: "pest" },
  { abbreviation: "BA", label: "Bat", color: PEST_COLOR, category: "pest" },
  { abbreviation: "BB", label: "Bed Bug", color: PEST_COLOR, category: "pest" },
  { abbreviation: "BD", label: "Bird", color: PEST_COLOR, category: "pest" },
  { abbreviation: "BE", label: "Beetle", color: PEST_COLOR, category: "pest" },
  { abbreviation: "CR", label: "Cockroach", color: PEST_COLOR, category: "pest" },
  { abbreviation: "CT", label: "Cricket", color: PEST_COLOR, category: "pest" },
  { abbreviation: "FL", label: "Flea", color: PEST_COLOR, category: "pest" },
  { abbreviation: "FS", label: "Fly", color: PEST_COLOR, category: "pest" },
  { abbreviation: "MI", label: "Mite", color: PEST_COLOR, category: "pest" },
  { abbreviation: "MO", label: "Mosquito", color: PEST_COLOR, category: "pest" },
  { abbreviation: "MC", label: "Miscellaneous", color: PEST_COLOR, category: "pest" },
  { abbreviation: "OI", label: "Occasional Invader", color: PEST_COLOR, category: "pest" },
  { abbreviation: "RO", label: "Rodent", color: PEST_COLOR, category: "pest" },
  { abbreviation: "SB", label: "Stink Bug", color: PEST_COLOR, category: "pest" },
  { abbreviation: "SI", label: "Stinging Insect", color: PEST_COLOR, category: "pest" },
  { abbreviation: "SP", label: "Stored Product Pest", color: PEST_COLOR, category: "pest" },
  { abbreviation: "SR", label: "Spider", color: PEST_COLOR, category: "pest" },
  { abbreviation: "TM", label: "Termite", color: PEST_COLOR, category: "pest" },
  { abbreviation: "WL", label: "Wildlife", color: PEST_COLOR, category: "pest" },
];

/* ── ITEM presets (multi-color interior/exterior items) ── */
export const ITEM_PRESETS: CadPreset[] = [
  { abbreviation: "AC", label: "AC Unit", color: "#60A5FA", category: "item" },
  { abbreviation: "AA", label: "Attic Access", color: "#A78BFA", category: "item" },
  { abbreviation: "BT", label: "Bathtub", color: "#60A5FA", category: "item" },
  { abbreviation: "BE", label: "Bed", color: "#F472B6", category: "item" },
  { abbreviation: "BR", label: "Break Room", color: "#34D399", category: "item" },
  { abbreviation: "CH", label: "Chair", color: "#A78BFA", category: "item" },
  { abbreviation: "CO", label: "Cooler", color: "#60A5FA", category: "item" },
  { abbreviation: "CB", label: "Cubicle", color: "#9CA3AF", category: "item" },
  { abbreviation: "DR", label: "Door", color: "#F59E0B", category: "item" },
  { abbreviation: "DN", label: "Drain", color: "#60A5FA", category: "item" },
  { abbreviation: "EL", label: "Elevator", color: "#9CA3AF", category: "item" },
  { abbreviation: "FZ", label: "Freezer", color: "#60A5FA", category: "item" },
  { abbreviation: "GP", label: "Gap", color: "#F87171", category: "item" },
  { abbreviation: "JR", label: "Janitor Room", color: "#34D399", category: "item" },
  { abbreviation: "KE", label: "Kitchen Equipment", color: "#F59E0B", category: "item" },
  { abbreviation: "RF", label: "Refrigerator", color: "#60A5FA", category: "item" },
  { abbreviation: "RP", label: "Restroom Placard", color: "#A78BFA", category: "item" },
  { abbreviation: "SH", label: "Scuttle Hole", color: "#9CA3AF", category: "item" },
  { abbreviation: "SV", label: "Shelving", color: "#F59E0B", category: "item" },
  { abbreviation: "SK", label: "Sink", color: "#60A5FA", category: "item" },
  { abbreviation: "ST", label: "Stairs", color: "#9CA3AF", category: "item" },
  { abbreviation: "SG", label: "Storage", color: "#F59E0B", category: "item" },
  { abbreviation: "SM", label: "Storage Room", color: "#F59E0B", category: "item" },
  { abbreviation: "TB", label: "Table", color: "#A78BFA", category: "item" },
  { abbreviation: "TL", label: "Toilet", color: "#60A5FA", category: "item" },
  { abbreviation: "TC", label: "Trash Can", color: "#6B7280", category: "item" },
  { abbreviation: "TH", label: "Trash Chute", color: "#6B7280", category: "item" },
  { abbreviation: "VE", label: "Vent Exists", color: "#34D399", category: "item" },
  { abbreviation: "VN", label: "Vent Needed", color: "#F87171", category: "item" },
];

/* ── ISSUE presets (orange circles) ── */
export const ISSUE_PRESETS: CadPreset[] = [
  { abbreviation: "A", label: "Active Infestation", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "AF", label: "Improper Air Flow", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "DR", label: "Dry Rot", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "EF", label: "Excessive Food Debris", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "EM", label: "Excessive Moisture", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "FG", label: "Faulty Grade", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "IA", label: "Inaccessible Area", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "MS", label: "Miscellaneous", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "P", label: "Utility Penetration", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "VD", label: "Visible Damage", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "WC", label: "Wood-to-Ground Contact", color: ISSUE_COLOR, category: "issue" },
  { abbreviation: "CL", label: "Clutter", color: ISSUE_COLOR, category: "issue" },
];

/* ── FINDING presets (evidence found during inspection) ── */
export const FINDING_PRESETS: CadPreset[] = [
  { abbreviation: "AI", label: "Active Infestation", color: "#E63946", category: "finding" },
  { abbreviation: "BC", label: "Barcode", color: "#9CA3AF", category: "finding" },
  { abbreviation: "LB", label: "Live Bed Bugs", color: "#E63946", category: "finding" },
  { abbreviation: "DB", label: "Dead Bed Bugs", color: "#E63946", category: "finding" },
  { abbreviation: "CS", label: "Bed Bug Cast Skin", color: "#E63946", category: "finding" },
  { abbreviation: "BD", label: "Bed Bug Droppings", color: "#E63946", category: "finding" },
  { abbreviation: "BN", label: "Bed Bug Encasement", color: "#E63946", category: "finding" },
  { abbreviation: "GW", label: "Gateway", color: "#9CA3AF", category: "finding" },
  { abbreviation: "PM", label: "Pest Monitor", color: "#2A9D8F", category: "finding" },
  { abbreviation: "RC", label: "Restroom Care", color: FINDING_COLOR, category: "finding" },
];

/* ── Category color for treatment/equipment ── */
const TREATMENT_COLOR = "#8B5CF6";

/* ── TREATMENT & EQUIPMENT presets (devices placed or serviced) ── */
export const TREATMENT_PRESETS: CadPreset[] = [
  { abbreviation: "AC", label: "Air Curtain", color: "#6366F1", category: "treatment" },
  { abbreviation: "AS", label: "Scent Shield", color: "#6366F1", category: "treatment" },
  { abbreviation: "AF", label: "AutoFresh AutoClean", color: TREATMENT_COLOR, category: "treatment" },
  { abbreviation: "BS", label: "Bait Station", color: "#2A9D8F", category: "treatment" },
  { abbreviation: "BX", label: "Bait Station-S", color: "#2A9D8F", category: "treatment" },
  { abbreviation: "BI", label: "Bird Control", color: "#F59E0B", category: "treatment" },
  { abbreviation: "DS", label: "Door Sweep", color: "#F59E0B", category: "treatment" },
  { abbreviation: "FB", label: "Fly Bait Station", color: "#2A9D8F", category: "treatment" },
  { abbreviation: "FL", label: "Fly Light", color: "#A78BFA", category: "treatment" },
  { abbreviation: "FS", label: "Foaming Service", color: TREATMENT_COLOR, category: "treatment" },
  { abbreviation: "GT", label: "Glue Trap", color: "#F59E0B", category: "treatment" },
  { abbreviation: "GD", label: "Green Drain", color: TREATMENT_COLOR, category: "treatment" },
  { abbreviation: "LF", label: "LED Fly Light", color: "#A78BFA", category: "treatment" },
  { abbreviation: "MQ", label: "Mosquito Traps", color: "#6366F1", category: "treatment" },
  { abbreviation: "MT", label: "Mouse Snap Trap", color: "#E63946", category: "treatment" },
  { abbreviation: "MX", label: "Mouse Snap Trap-S", color: "#E63946", category: "treatment" },
  { abbreviation: "PT", label: "Pheromone Trap", color: "#F59E0B", category: "treatment" },
  { abbreviation: "RT", label: "Rat Snap Trap", color: "#E63946", category: "treatment" },
  { abbreviation: "RX", label: "Rat Snap Trap-S", color: "#E63946", category: "treatment" },
  { abbreviation: "SS", label: "Sanitizing Services", color: TREATMENT_COLOR, category: "treatment" },
  { abbreviation: "TN", label: "Tin Cat", color: "#F59E0B", category: "treatment" },
  { abbreviation: "TS", label: "Tin Cat-S", color: "#F59E0B", category: "treatment" },
  { abbreviation: "WT", label: "Wild Life Trap", color: "#F59E0B", category: "treatment" },
];

export const ALL_PRESETS: Record<MarkerCategory, CadPreset[]> = {
  pest: PEST_PRESETS,
  item: ITEM_PRESETS,
  issue: ISSUE_PRESETS,
  finding: FINDING_PRESETS,
  treatment: TREATMENT_PRESETS,
};

export const CATEGORY_META: Record<MarkerCategory, { label: string; defaultColor: string }> = {
  pest: { label: "Pest", defaultColor: PEST_COLOR },
  item: { label: "Item", defaultColor: "#6B7280" },
  issue: { label: "Issue", defaultColor: ISSUE_COLOR },
  finding: { label: "Findings", defaultColor: FINDING_COLOR },
  treatment: { label: "Treatment", defaultColor: TREATMENT_COLOR },
};
