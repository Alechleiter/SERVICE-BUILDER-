// ══════════════════════════════════════════════════════════
// Cost of Inaction — Type Definitions
// ══════════════════════════════════════════════════════════

/** A single cost category within an industry preset */
export interface CostCategory {
  id: string;
  label: string;
  description: string;
  defaultAmount: number;
  icon: string;
  /** Research-backed rationale for the default amount */
  rationale?: string;
}

/** An industry preset with its default cost categories */
export interface IndustryPreset {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  categories: CostCategory[];
}

/** A user-editable cost entry (based on a CostCategory) */
export interface CostEntry {
  categoryId: string;
  label: string;
  amount: number;
  enabled: boolean;
}

/** Full calculation data stored per saved calculation */
export interface CalculationData {
  industryId: string;
  industryName: string;
  propertyName: string;
  entries: CostEntry[];
  customEntries: CostEntry[];
  timeframeMonths: number;
  notes: string;
}

/** Key used inside form_data JSONB for serialized CalculationData */
export const COI_DATA_KEY = "__coi_data";
export const COI_TEMPLATE_ID = "cost_of_inaction";
