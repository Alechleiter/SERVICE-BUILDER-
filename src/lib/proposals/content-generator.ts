import type { TemplateId, ProposalContent } from "./types";

function formatCurrency(v: unknown): string {
  if (!v && v !== 0) return "$___";
  return "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fp(v: unknown, fallback = "___"): string {
  return v && String(v).trim() ? String(v).trim() : fallback;
}

function safeJsonArray(val: string | undefined): string[] {
  if (!val) return [];
  try { return JSON.parse(val) as string[]; } catch { return []; }
}

type FormData = Record<string, string>;

/** Check if any inspection-report pricing field is filled (exported for preview/export) */
export function hasInspectionPricing(data: FormData): boolean {
  return !!(
    data.ir_initial_cost?.trim() ||
    data.ir_recurring_cost?.trim() ||
    data.ir_onetime_cost?.trim() ||
    data.ir_pricing_notes?.trim()
  );
}

/** Check if any inspection-report scope field is filled */
function hasInspectionScope(data: FormData): boolean {
  return !!(
    data.ir_scope_description?.trim() ||
    data.ir_service_frequency?.trim() ||
    data.ir_service_areas?.trim()
  );
}

/** Build the Inspection Report section if any inspection fields are filled */
function buildInspectionSection(data: FormData): { heading: string; items: string[] } | null {
  const items: string[] = [];
  // inspection_findings is now a bullet-list (JSON array string)
  const findings = safeJsonArray(data.inspection_findings).filter(f => f.trim());
  if (findings.length) {
    findings.forEach(f => items.push(f.trim().endsWith(".") ? f.trim() : `${f.trim()}.`));
  }
  if (data.sanitation_level) items.push(`Sanitation level: ${data.sanitation_level}.`);
  if (data.exposure_level) items.push(`Pest exposure level: ${data.exposure_level}.`);
  return items.length ? { heading: "Inspection Report", items } : null;
}

/** Build the Target Pest Coverage section */
function buildTargetPestSection(data: FormData): { heading: string; items: string[] } {
  const pests = data.target_pests
    ? data.target_pests.split(",").map(p => p.trim()).filter(Boolean).map(p => p + ".")
    : ["Ants (excluding carpenter ants and fire ants), cockroaches, rodents (rats and mice), common spiders, and occasional invaders."];
  return { heading: "Target Pest Coverage", items: pests };
}

/** Build the Technician Start Instructions section if any items are checked */
function buildTechStartSection(data: FormData): { heading: string; items: string[] } | null {
  const items = safeJsonArray(data.tech_start_instructions);
  return items.length ? { heading: "Technician Start Instructions", items } : null;
}

/** Build the Customer Recommendations section if any items are checked */
function buildCustomerRecsSection(data: FormData): { heading: string; items: string[] } | null {
  const items = safeJsonArray(data.customer_recommendations);
  return items.length ? { heading: "Customer Recommendations", items } : null;
}

export function generateContent(templateKey: TemplateId, data: FormData): ProposalContent {
  const f = (key: string, fallback?: string) => fp(data[key], fallback || `{${key}}`);
  const c = (key: string) => formatCurrency(data[key]);

  const generators: Record<TemplateId, () => ProposalContent> = {

    bed_bug_heat: () => ({
      title: "Bed Bug Heat Treatment Proposal",
      subtitle: f("property_name", "[Property Name]"),
      address: f("property_address", "[Property Address]"),
      sections: [
        { heading: "Scope of Service", items: [
          `Targeted units for heat treatment: ${f("heat_units")}.`,
          `Conventional (non-heat) follow-up visits: ${f("num_conventional_visits")}. Units must be fully prepared before each visit.`,
          `Proactive barrier treatment: ${f("adjacent_visits", "1")} visit(s) in adjacent units ${f("adjacent_units")}.`,
          `Post K-9 assisted inspection: to confirm eradication in units ${f("inspection_units")}.`,
        ]},
        { heading: "Important Conditions", items: [
          "Residents must follow preparation sheets, clean, and de-clutter before service; failure voids warranty.",
          `A rescheduling fee of ${c("reschedule_fee")} per heated unit applies if work is rescheduled with less than 48 hours' notice.`,
          "Parking must be arranged for heat equipment (vehicle must remain near building for ~8 hours).",
          "Fire sprinklers should be capped and drained prior to heat service; if not, they will be insulated.",
          "Proactive treatments reduce the spread of bed bugs but do not guarantee adjacent units will remain bed-bug-free.",
        ]},
        { heading: "Investment", items: [
          `Total cost of this heat-treatment package: ${c("heat_service_cost")}.`,
        ]},
      ],
    }),

    bed_bug_conventional: () => ({
      title: "Bed Bug Conventional Treatment Proposal",
      subtitle: f("property_name", "[Property Name]"),
      address: f("property_address", "[Property Address]"),
      sections: [
        { heading: "Scope of Service", items: [
          `Targeted units for conventional treatment: ${f("target_units")}.`,
          `Service visits: ${f("num_service_visits")}; a post-treatment K-9 inspection will follow the last visit.`,
          `Proactive barrier treatment: ${f("adjacent_visits", "1")} visit(s) in adjacent units ${f("adjacent_units")}.`,
          `Post K-9 assisted inspection: to confirm eradication in units ${f("inspection_units")}.`,
        ]},
        { heading: "Important Conditions", items: [
          "Residents must prepare units according to prep sheets and remove clutter before each visit.",
          "Selected items may need to be discarded; failure to do so voids the warranty.",
          "Proactive treatments help reduce the spread but do not guarantee that adjacent units remain bed-bug-free.",
        ]},
        { heading: "Investment", items: [
          `Total cost of this conventional treatment package: ${c("conventional_service_cost")}.`,
        ]},
      ],
    }),

    general_pest: () => {
      const sections: ProposalContent["sections"] = [];

      // Property Type
      if (data.vertical_type) {
        const vt = data.vertical_type === "Other" ? f("vertical_custom", "Commercial") : data.vertical_type;
        sections.push({ heading: "Property Type", items: [`${vt}.`] });
      }

      // Inspection Report
      const inspection = buildInspectionSection(data);
      if (inspection) sections.push(inspection);

      // Target Pest Coverage (replaces old hardcoded "Covered Pests")
      sections.push(buildTargetPestSection(data));

      // Service Frequency
      sections.push({ heading: "Service Frequency", items: [
        `${f("service_frequency")} times per month.`,
      ]});

      // Initial Month Work
      sections.push({ heading: "Initial Month Work", items: [
        f("initial_month_work", "To be determined based on site assessment."),
      ]});

      // Monthly Service Breakdown
      sections.push({ heading: "Monthly Service Breakdown", items: [
        `Exterior treatments: treat the full exterior perimeter ${f("exterior_frequency")}.`,
        `Common-area treatments: treat select common areas such as dumpster rooms, leasing offices, courtyards or pools ${f("common_area_frequency")}.`,
        `Interior treatments: provide IPM treatments as needed for up to ${f("max_units_per_visit")} units per service visit using baits, gels, residual treatments and monitor boards.`,
        "Inspect and advise: notify the property manager of any problems or opportunities to prevent pest issues.",
        "Documentation: provide a detailed written Sanitation/Service Report after every visit.",
      ]});

      // Pricing
      sections.push({ heading: "Pricing", items: [
        `Initial month cost: ${c("initial_month_cost")}.`,
        `Recurring monthly cost: ${c("monthly_cost")} (price per visit: ${c("price_per_visit")}).`,
        `Additional units on service day: ${c("service_day_unit_rate")} per unit.`,
        `Additional units on non-service day: ${c("non_service_day_rate")} (includes up to ${f("non_service_day_unit_limit")} units); additional units beyond that are ${c("non_service_day_extra_unit_rate")} each.`,
        `Optional intensive roach treatment: ${c("roach_treatment_cost")} per unit (includes 3 visits).`,
      ]});

      // Technician Start Instructions
      const techStart = buildTechStartSection(data);
      if (techStart) sections.push(techStart);

      // Customer Recommendations
      const customerRecs = buildCustomerRecsSection(data);
      if (customerRecs) sections.push(customerRecs);

      return {
        title: "Multi Family Shield\u2122 Proposal",
        subtitle: f("property_name", "[Property Name]"),
        address: f("property_address", "[Property Address]"),
        sections,
      };
    },

    food_service: () => {
      const sections: ProposalContent["sections"] = [];

      // Property Type
      if (data.vertical_type) {
        const vt = data.vertical_type === "Other" ? f("vertical_custom", "Commercial") : data.vertical_type;
        sections.push({ heading: "Property Type", items: [`${vt}.`] });
      }

      // Inspection Report
      const inspection = buildInspectionSection(data);
      if (inspection) sections.push(inspection);

      // Executive Overview
      sections.push({ heading: "Executive Overview", items: [
        "Food Service Shield\u2122 is a structured Integrated Pest Management program designed specifically for food-service environments. It stabilizes infestations, eliminates breeding sources, reduces regulatory risk, and establishes long-term pest prevention through monitoring, documentation and corrective action.",
      ]});

      // Target Pest Coverage
      sections.push(buildTargetPestSection(data));

      // Initial Stabilization Phase
      sections.push({ heading: `Initial Stabilization Phase (First ${f("initial_phase_duration", "14 days")})`, items: [
        `Install ${f("num_multi_catch_devices")} interior multi-catch monitoring devices in strategic high-risk areas.`,
        `Intensive cockroach elimination program: ${f("num_initial_visits")} service visits within ${f("initial_phase_duration")}.`,
        "Exterior measures: perform perimeter inspection and treatment to reduce entry pressure.",
      ]});

      // Ongoing Monthly Protection Program
      sections.push({ heading: "Ongoing Monthly Protection Program", items: [
        `Monitoring and servicing of ${f("num_multi_catch_devices")} multi-catch devices per visit.`,
        "Interior inspection and proactive treatment for general pests.",
        `Foaming service of ${f("num_floor_drains")} floor drains.`,
        "Review and documentation of cockroach activity levels.",
        "Identification and reporting of conducive conditions.",
        "Exterior perimeter inspection and treatment as necessary.",
        "Provide detailed service reports to support regulatory compliance and audit readiness.",
      ]});

      // Monitoring & Escalation
      sections.push({ heading: "Monitoring & Escalation", items: [
        "Within the first 60 days of service, additional pest activity identified through monitoring will be documented via photographs and written findings. Additional charges may apply if service efforts must exceed the standard scope.",
      ]});

      // Pricing
      sections.push({ heading: "Pricing", items: [
        `Initial stabilization phase cost: ${c("initial_phase_cost")}.`,
        `Ongoing monthly protection program cost: ${c("monthly_program_cost")} per month.`,
      ]});

      // Technician Start Instructions
      const techStart = buildTechStartSection(data);
      if (techStart) sections.push(techStart);

      // Customer Recommendations
      const customerRecs = buildCustomerRecsSection(data);
      if (customerRecs) sections.push(customerRecs);

      return {
        title: "Food Service Shield\u2122 Proposal",
        subtitle: f("restaurant_name", "[Restaurant Name]"),
        address: f("restaurant_address", "[Restaurant Address]"),
        sections,
      };
    },

    vertical_shield: () => {
      const vt = data.vertical_type === "Other"
        ? f("vertical_custom", "Commercial")
        : f("vertical_type", "Commercial");

      const sections: ProposalContent["sections"] = [];

      // Inspection Report
      const inspection = buildInspectionSection(data);
      if (inspection) sections.push(inspection);

      // Executive Overview
      sections.push({ heading: "Executive Overview", items: [
        `Vertical Shield\u2122 is a tailored Integrated Pest Management program designed for ${vt.toLowerCase()} environments. This program addresses pest pressures specific to your industry through scheduled inspections, targeted treatments, monitoring, and documentation.`,
      ]});

      // Target Pest Coverage
      sections.push(buildTargetPestSection(data));

      // Service Areas
      sections.push({ heading: "Service Areas", items:
        f("service_areas", "Exterior, Interior").split(",").map(a => a.trim()).filter(Boolean).map(a => `${a}.`),
      });

      const extItems: string[] = [];
      if (data.exterior_monthly_tasks) extItems.push(`Monthly: ${data.exterior_monthly_tasks}`);
      if (data.exterior_biweekly_tasks) extItems.push(`Twice monthly: ${data.exterior_biweekly_tasks}`);
      if (data.exterior_onetime_tasks) extItems.push(`One-time installation: ${data.exterior_onetime_tasks}`);
      if (extItems.length) sections.push({ heading: "Exterior Services", items: extItems });

      const intItems: string[] = [];
      if (data.interior_monthly_tasks) intItems.push(`Monthly: ${data.interior_monthly_tasks}`);
      if (data.interior_biweekly_tasks) intItems.push(`Twice monthly: ${data.interior_biweekly_tasks}`);
      if (data.interior_onetime_tasks) intItems.push(`One-time installation: ${data.interior_onetime_tasks}`);
      if (intItems.length) sections.push({ heading: "Interior Services", items: intItems });

      if (data.other_area_tasks) sections.push({ heading: "Additional Area Services", items: data.other_area_tasks.split(";").map(t => t.trim()).filter(Boolean) });
      if (data.equipment_summary) sections.push({ heading: "Equipment Summary", items: data.equipment_summary.split(",").map(t => t.trim()).filter(Boolean) });

      sections.push({ heading: "Pricing & Schedule", items: [
        `Initial month cost (includes equipment installation and first month of service): ${c("initial_month_cost")}.`,
        `Per service visit cost: ${c("per_visit_cost")}.`,
        `Recurring monthly cost: ${c("monthly_cost")}.`,
        `Annual cost: ${c("annual_cost")}.`,
        "Quote excludes tax and replacement cost of pest-control equipment.",
      ]});

      // Technician Start Instructions
      const techStart = buildTechStartSection(data);
      if (techStart) sections.push(techStart);

      // Customer Recommendations
      const customerRecs = buildCustomerRecsSection(data);
      if (customerRecs) sections.push(customerRecs);

      sections.push({ heading: "Additional Notes", items: [
        "Services are tailored to this property\u2019s specific service areas and pest pressures.",
        "Sanitation and structural maintenance by the property complement pest-control efforts and are essential for long-term results.",
      ]});

      return {
        title: `Vertical Shield\u2122 Proposal \u2014 ${vt}`,
        subtitle: f("property_name", "[Property Name]"),
        address: f("property_address", "[Property Address]"),
        sections,
      };
    },

    inspection_report: () => {
      const vt = data.vertical_type === "Other"
        ? f("vertical_custom", "Commercial")
        : f("vertical_type", "Commercial");

      const sections: ProposalContent["sections"] = [];

      // Inspection Assessment (reuses shared helper)
      const inspection = buildInspectionSection(data);
      if (inspection) sections.push(inspection);

      // Property Type
      sections.push({ heading: "Property Type", items: [`${vt}.`] });

      // Contact Info
      const contactItems: string[] = [];
      if (data.contact_name) contactItems.push(`Contact: ${data.contact_name}.`);
      if (data.contact_phone) contactItems.push(`Phone: ${data.contact_phone}.`);
      if (data.contact_email) contactItems.push(`Email: ${data.contact_email}.`);
      if (contactItems.length) sections.push({ heading: "Contact Information", items: contactItems });

      // Pests Observed
      const pests = data.target_pests
        ? data.target_pests.split(",").map(p => p.trim()).filter(Boolean)
        : [];
      if (pests.length > 0) {
        sections.push({ heading: "Pests Observed", items: pests.map(p => `${p}.`) });
      }

      // Areas Inspected (checklist-add → JSON array)
      const areasArr = safeJsonArray(data.areas_inspected);
      if (areasArr.length > 0) {
        sections.push({ heading: "Areas Inspected", items: areasArr.map(a => `${a}.`) });
      }

      // Conditions Observed (checklist-add → JSON array)
      const condArr = safeJsonArray(data.conditions_observed);
      if (condArr.length > 0) {
        sections.push({ heading: "Conditions Observed", items: condArr.map(c => `${c}.`) });
      }

      // Recommendations (checklist-add → JSON array)
      const recsArr = safeJsonArray(data.additional_notes);
      if (recsArr.length > 0) {
        sections.push({ heading: "Recommendations", items: recsArr.map(n => `${n}.`) });
      }

      // Customer Recommendations (reuses shared helper)
      const customerRecs = buildCustomerRecsSection(data);
      if (customerRecs) sections.push(customerRecs);

      // ── Optional Scope of Work (turns report into quick quote) ──
      if (hasInspectionScope(data)) {
        const scopeItems: string[] = [];
        if (data.ir_scope_description) scopeItems.push(data.ir_scope_description.trim());
        if (data.ir_service_frequency) scopeItems.push(`Service frequency: ${data.ir_service_frequency.trim()}.`);
        if (data.ir_service_areas) scopeItems.push(`Service areas: ${data.ir_service_areas.trim()}.`);
        sections.push({ heading: "Scope of Work", items: scopeItems });
      }

      // ── Optional Pricing ──
      if (hasInspectionPricing(data)) {
        const pricingItems: string[] = [];
        if (data.ir_initial_cost) {
          const v = Number(data.ir_initial_cost);
          pricingItems.push(`Initial service cost: ${isNaN(v) ? data.ir_initial_cost.trim() : formatCurrency(v)}.`);
        }
        if (data.ir_recurring_cost) {
          const v = Number(data.ir_recurring_cost);
          pricingItems.push(`Monthly / recurring cost: ${isNaN(v) ? data.ir_recurring_cost.trim() : formatCurrency(v)}.`);
        }
        if (data.ir_onetime_cost) {
          const v = Number(data.ir_onetime_cost);
          pricingItems.push(`One-time service cost: ${isNaN(v) ? data.ir_onetime_cost.trim() : formatCurrency(v)}.`);
        }
        if (data.ir_pricing_notes) pricingItems.push(data.ir_pricing_notes.trim());
        sections.push({ heading: "Pricing", items: pricingItems });
      }

      return {
        title: hasInspectionPricing(data) ? "Site Inspection Report & Quote" : "Site Inspection Report",
        subtitle: f("property_name", "[Property Name]"),
        address: f("property_address", "[Property Address]"),
        sections,
      };
    },
  };

  return generators[templateKey]();
}
