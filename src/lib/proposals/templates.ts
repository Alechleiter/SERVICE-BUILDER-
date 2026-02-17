import type { TemplateId, TemplateDefinition, TemplateField } from "./types";

// ── Shared fields ──

const VERTICAL_FIELDS: TemplateField[] = [
  { key: "vertical_type", label: "Vertical / Industry", type: "select", options: [
    "Multi Family / Apartment", "Office / Corporate", "Retail / Sales Floor",
    "Restaurant / Food Service", "Hotel / Hospitality", "Warehouse / Distribution",
    "Healthcare / Medical", "Education / School", "Church / House of Worship",
    "Auto Dealership / Shop", "Gym / Fitness Center", "Salon / Spa",
    "Single Family Residential", "Other",
  ], section: "Property Details" },
  { key: "vertical_custom", label: "Custom Vertical Name (if Other)", type: "text", placeholder: "e.g., Dog Grooming Facility", showIf: "vertical_type:Other", section: "Property Details" },
];

// ── Shared fields added to all non-bed-bug templates ──

const INSPECTION_FIELDS: TemplateField[] = [
  { key: "inspection_findings", label: "Inspection Findings (what & where)", type: "bullet-list", placeholder: "e.g., German roach activity behind kitchen appliances", section: "Inspection Assessment" },
  { key: "sanitation_level", label: "Sanitation Level", type: "select", options: ["Excellent", "Good", "Fair", "Poor", "Critical"], section: "Inspection Assessment" },
  { key: "exposure_level", label: "Pest Exposure Level", type: "select", options: ["Low", "Moderate", "High", "Severe"], section: "Inspection Assessment" },
];

const TARGET_PEST_FIELD: TemplateField = {
  key: "target_pests", label: "Target Pests", type: "multi-select", options: [
    "Ants (excluding carpenter ants and fire ants)",
    "German Cockroaches",
    "American Cockroaches",
    "Rodents (rats and mice)",
    "Spiders (common species)",
    "Millipedes & Centipedes",
    "Sow Bugs / Pill Bugs",
    "Silverfish",
    "Occasional Invaders",
    "Flies (house flies, drain flies)",
    "Stored Product Pests",
    "Fleas",
    "Bed Bugs",
    "Bird Mites",
    "Rat Mites",
    "Wasps",
    "Bees",
  ],
  section: "Scope of Work",
};

const TECH_START_FIELD: TemplateField = {
  key: "tech_start_instructions", label: "Technician Start Instructions", type: "checklist",
  section: "Technician Instructions",
  checklistCategories: [
    { category: "Exterior Actions", items: [
      "Treat full exterior perimeter with residual product",
      "Inspect and service all exterior rodent stations",
      "Treat eaves, soffits, and entry points for spiders and wasps",
      "Apply granular bait around landscape beds and foundation",
      "Inspect exterior signage and lighting for pest harborage",
    ]},
    { category: "Interior Actions", items: [
      "Apply crack-and-crevice treatment in kitchens, bathrooms, utility rooms",
      "Apply gel bait behind appliances and in cabinet voids",
      "Treat electrical panels, plumbing chases, and wall voids",
      "Vacuum visible insect activity before treatment",
      "Flush floor drains with bio-foam",
    ]},
    { category: "Equipment Setup", items: [
      "Install exterior rodent bait stations per site map",
      "Install interior multi-catch devices per site map",
      "Install or replace fly lights in designated areas",
      "Set up insect monitoring boards at strategic locations",
    ]},
    { category: "Monitoring Placement", items: [
      "Place glue boards behind equipment and along walls",
      "Install pheromone traps for stored product pests",
      "Document all monitoring device placements on site map",
      "Set baseline counts on all monitoring devices",
    ]},
  ],
};

const CUSTOMER_RECS_FIELD: TemplateField = {
  key: "customer_recommendations", label: "Customer Recommendations", type: "checklist",
  section: "Customer Recommendations",
  checklistCategories: [
    { category: "Sanitation", items: [
      "Remove food debris and spills promptly",
      "Clean grease traps and drain covers regularly",
      "Store all food in sealed, airtight containers",
      "Empty indoor trash receptacles daily",
      "Keep dumpster lids closed at all times",
    ]},
    { category: "Structural", items: [
      "Seal cracks and gaps around pipes, wires, and utility penetrations",
      "Repair or replace damaged door sweeps and weather stripping",
      "Fix plumbing leaks and eliminate standing water",
      "Screen or seal ventilation openings",
    ]},
    { category: "Landscaping & Exterior", items: [
      "Trim vegetation and tree branches away from the building (minimum 18 inches)",
      "Remove leaf litter and ground cover near the foundation",
      "Ensure exterior lighting does not attract insects near entry doors",
    ]},
  ],
};

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  bed_bug_heat: {
    name: "Bed Bug Heat Treatment",
    icon: "\u{1F525}",
    color: "#E63946",
    description: "Heat treatment with K-9 inspection, barrier treatment, and rescheduling terms.",
    fields: [
      { key: "property_name", label: "Property Name", type: "text", placeholder: "e.g., Sunrise Apartments", section: "Property Details" },
      { key: "property_address", label: "Property Address", type: "text", placeholder: "e.g., 123 Main St, Riverside, CA 92501", section: "Property Details" },
      { key: "heat_units", label: "Units for Heat Treatment", type: "text", placeholder: "e.g., 101, 102, 205", section: "Treatment Units" },
      { key: "num_conventional_visits", label: "# Conventional Follow-up Visits", type: "number", placeholder: "e.g., 3", section: "Treatment Units" },
      { key: "adjacent_units", label: "Adjacent Units (Proactive Barrier)", type: "text", placeholder: "e.g., 100, 103, 204, 206", section: "Treatment Units" },
      { key: "adjacent_visits", label: "# Visits for Adjacent Units", type: "number", placeholder: "e.g., 1", section: "Treatment Units" },
      { key: "inspection_units", label: "Units for Post K-9 Inspection", type: "text", placeholder: "e.g., 101, 102, 205", section: "Treatment Units" },
      { key: "reschedule_fee", label: "Rescheduling Fee per Heated Unit ($)", type: "number", placeholder: "e.g., 150", section: "Cost" },
      { key: "heat_service_cost", label: "Total Heat Treatment Cost ($)", type: "number", placeholder: "e.g., 4500", section: "Cost" },
    ],
  },

  bed_bug_conventional: {
    name: "Bed Bug Conventional Treatment",
    icon: "\u{1F6E1}\uFE0F",
    color: "#457B9D",
    description: "Non-heat conventional treatment with follow-up visits and K-9 verification.",
    fields: [
      { key: "property_name", label: "Property Name", type: "text", placeholder: "e.g., Sunrise Apartments", section: "Property Details" },
      { key: "property_address", label: "Property Address", type: "text", placeholder: "e.g., 123 Main St, Riverside, CA 92501", section: "Property Details" },
      { key: "target_units", label: "Units for Conventional Treatment", type: "text", placeholder: "e.g., 301, 302, 303", section: "Treatment Units" },
      { key: "num_service_visits", label: "# Service Visits", type: "number", placeholder: "e.g., 3", section: "Treatment Units" },
      { key: "adjacent_units", label: "Adjacent Units (Proactive Barrier)", type: "text", placeholder: "e.g., 300, 304", section: "Treatment Units" },
      { key: "adjacent_visits", label: "# Visits for Adjacent Units", type: "number", placeholder: "e.g., 1", section: "Treatment Units" },
      { key: "inspection_units", label: "Units for Post K-9 Inspection", type: "text", placeholder: "e.g., 301, 302, 303", section: "Treatment Units" },
      { key: "conventional_service_cost", label: "Total Conventional Treatment Cost ($)", type: "number", placeholder: "e.g., 2800", section: "Cost" },
    ],
  },

  general_pest: {
    name: "Multi Family Shield",
    icon: "\u{1F3E2}",
    color: "#2A9D8F",
    description: "Multi Family Shield\u2122 \u2014 recurring IPM program for apartment communities with tiered pricing.",
    fields: [
      { key: "property_name", label: "Property Name", type: "text", placeholder: "e.g., Vista Ridge Community", section: "Property Details" },
      { key: "property_address", label: "Property Address", type: "text", placeholder: "e.g., 456 Oak Ave, Riverside, CA 92507", section: "Property Details" },
      ...VERTICAL_FIELDS,
      ...INSPECTION_FIELDS,
      TARGET_PEST_FIELD,
      { key: "service_frequency", label: "Service Frequency (times/month)", type: "number", placeholder: "e.g., 2", section: "Service Schedule" },
      { key: "initial_month_work", label: "Initial Month Work Description", type: "textarea", placeholder: "e.g., Full exterior perimeter treatment...", section: "Service Schedule" },
      { key: "exterior_frequency", label: "Exterior Treatment Frequency", type: "text", placeholder: "e.g., twice per month", section: "Service Schedule" },
      { key: "common_area_frequency", label: "Common Area Treatment Frequency", type: "text", placeholder: "e.g., once per month", section: "Service Schedule" },
      { key: "max_units_per_visit", label: "Max Units Per Service Visit", type: "number", placeholder: "e.g., 15", section: "Service Schedule" },
      { key: "initial_month_cost", label: "Initial Month Cost ($)", type: "number", placeholder: "e.g., 1200", section: "Pricing" },
      { key: "monthly_cost", label: "Recurring Monthly Cost ($)", type: "number", placeholder: "e.g., 800", section: "Pricing" },
      { key: "price_per_visit", label: "Price Per Visit ($)", type: "number", placeholder: "e.g., 400", section: "Pricing" },
      { key: "service_day_unit_rate", label: "Add'l Units on Service Day ($/unit)", type: "number", placeholder: "e.g., 25", section: "Pricing" },
      { key: "non_service_day_rate", label: "Non-Service Day Call Rate ($)", type: "number", placeholder: "e.g., 175", section: "Pricing" },
      { key: "non_service_day_unit_limit", label: "Units Included in Non-Service Day Rate", type: "number", placeholder: "e.g., 5", section: "Pricing" },
      { key: "non_service_day_extra_unit_rate", label: "Extra Units Beyond Limit ($/unit)", type: "number", placeholder: "e.g., 25", section: "Pricing" },
      { key: "roach_treatment_cost", label: "Intensive Roach Treatment ($/unit)", type: "number", placeholder: "e.g., 350", section: "Pricing" },
      TECH_START_FIELD,
      CUSTOMER_RECS_FIELD,
    ],
  },

  food_service: {
    name: "Food Service Shield",
    icon: "\u{1F37D}\uFE0F",
    color: "#E9C46A",
    description: "Food Service Shield\u2122 \u2014 stabilization + ongoing monitoring for commercial kitchens.",
    fields: [
      { key: "restaurant_name", label: "Restaurant / Business Name", type: "text", placeholder: "e.g., Golden Dragon Chinese", section: "Property Details" },
      { key: "restaurant_address", label: "Address", type: "text", placeholder: "e.g., 789 Commerce Blvd, Riverside, CA 92504", section: "Property Details" },
      ...VERTICAL_FIELDS,
      ...INSPECTION_FIELDS,
      TARGET_PEST_FIELD,
      { key: "num_multi_catch_devices", label: "# Multi-Catch Monitoring Devices", type: "number", placeholder: "e.g., 12", section: "Scope of Work" },
      { key: "num_initial_visits", label: "# Initial Stabilization Visits", type: "number", placeholder: "e.g., 4", section: "Scope of Work" },
      { key: "initial_phase_duration", label: "Initial Phase Duration", type: "text", placeholder: "e.g., the first 14 days", section: "Scope of Work" },
      { key: "num_floor_drains", label: "# Floor Drains to Foam", type: "number", placeholder: "e.g., 6", section: "Scope of Work" },
      { key: "initial_phase_cost", label: "Initial Stabilization Phase Cost ($)", type: "number", placeholder: "e.g., 2500", section: "Pricing" },
      { key: "monthly_program_cost", label: "Monthly Protection Cost ($)", type: "number", placeholder: "e.g., 450", section: "Pricing" },
      TECH_START_FIELD,
      CUSTOMER_RECS_FIELD,
    ],
  },

  vertical_shield: {
    name: "Vertical Shield",
    icon: "\u{1F3D7}\uFE0F",
    color: "#7B68EE",
    description: "Vertical Shield\u2122 \u2014 tailored IPM for any commercial vertical: office, retail, healthcare, and more.",
    fields: [
      { key: "property_name", label: "Property / Business Name", type: "text", placeholder: "e.g., Summit Office Park", section: "Property Details" },
      { key: "property_address", label: "Address", type: "text", placeholder: "e.g., 500 Corporate Dr, Riverside, CA 92507", section: "Property Details" },
      ...VERTICAL_FIELDS,
      ...INSPECTION_FIELDS,
      TARGET_PEST_FIELD,
      { key: "service_areas", label: "Service Areas (comma-separated)", type: "text", placeholder: "e.g., Exterior, Interior, Kitchen, Patio, Trash Room", section: "Property Details" },
      { key: "exterior_monthly_tasks", label: "Exterior \u2014 Monthly Tasks", type: "textarea", placeholder: "e.g., Inspection and maintenance of exterior rodent devices...", section: "Service Planning" },
      { key: "exterior_biweekly_tasks", label: "Exterior \u2014 Twice Monthly Tasks", type: "textarea", placeholder: "e.g., Inspection of all exterior areas...", section: "Service Planning" },
      { key: "exterior_onetime_tasks", label: "Exterior \u2014 One-Time Installation", type: "textarea", placeholder: "e.g., Installation of rodent devices...", section: "Service Planning" },
      { key: "interior_monthly_tasks", label: "Interior \u2014 Monthly Tasks", type: "textarea", placeholder: "e.g., Crawling insect treatment...", section: "Service Planning" },
      { key: "interior_biweekly_tasks", label: "Interior \u2014 Twice Monthly Tasks", type: "textarea", placeholder: "e.g., Inspection of all interior areas...", section: "Service Planning" },
      { key: "interior_onetime_tasks", label: "Interior \u2014 One-Time Installation", type: "textarea", placeholder: "e.g., Inspect existing fly lights...", section: "Service Planning" },
      { key: "other_area_tasks", label: "Other Area Tasks", type: "textarea", placeholder: "e.g., Kitchen/Patio \u2014 monthly crawling insect treatment...", section: "Service Planning" },
      { key: "equipment_summary", label: "Equipment Summary", type: "textarea", placeholder: "e.g., 3 Tin Cats (2x/mo), 5 Bait Stations (monthly)...", section: "Service Planning" },
      { key: "initial_month_cost", label: "Initial Month Cost ($)", type: "number", placeholder: "e.g., 650", section: "Pricing" },
      { key: "per_visit_cost", label: "Per Service Visit Cost ($)", type: "number", placeholder: "e.g., 175", section: "Pricing" },
      { key: "monthly_cost", label: "Recurring Monthly Cost ($)", type: "number", placeholder: "e.g., 350", section: "Pricing" },
      { key: "annual_cost", label: "Annual Cost ($)", type: "number", placeholder: "e.g., 4200", section: "Pricing" },
      TECH_START_FIELD,
      CUSTOMER_RECS_FIELD,
    ],
  },

  inspection_report: {
    name: "Inspection Report",
    icon: "\u{1F50D}",
    color: "#6366F1",
    description: "Inspection Report \u2014 document site conditions, pest findings, photos, and recommendations.",
    fields: [
      // ── Property Details ──
      { key: "property_name", label: "Property / Business Name", type: "text", placeholder: "e.g., Riverside Plaza", section: "Property Details" },
      { key: "property_address", label: "Address", type: "text", placeholder: "e.g., 100 Main St, Riverside, CA 92501", section: "Property Details" },
      { key: "contact_name", label: "Contact Name", type: "text", placeholder: "e.g., John Smith", section: "Property Details" },
      { key: "contact_phone", label: "Contact Phone", type: "text", placeholder: "e.g., (951) 555-0100", section: "Property Details" },
      { key: "contact_email", label: "Contact Email", type: "text", placeholder: "e.g., john@example.com", section: "Property Details" },
      ...VERTICAL_FIELDS,
      // ── Inspection Assessment (reuse shared) ──
      ...INSPECTION_FIELDS,
      // ── Pest Findings (reuse target pests with section override) ──
      { ...TARGET_PEST_FIELD, section: "Pest Findings" },
      // ── Findings & Notes ──
      { key: "areas_inspected", label: "Areas Inspected", type: "checklist-add", section: "Findings & Notes", checklistCategories: [
        { category: "Exterior", items: [
          "Exterior perimeter", "Roof / roofline", "Dumpster / trash area", "Parking area",
          "Loading dock", "Courtyard / patio", "Landscaping / mulch beds",
        ]},
        { category: "Interior — Common", items: [
          "Kitchen", "Breakroom", "Restrooms", "Hallways / corridors",
          "Lobby / reception", "Storage rooms", "Laundry room", "Mechanical / utility room",
        ]},
        { category: "Interior — Specialty", items: [
          "Crawl space", "Attic", "Hot water heater room", "Electrical / server room",
          "Office areas", "Dining area",
        ]},
        { category: "Residential", items: [
          "Unit interior", "Common stairwells", "Garage / carport", "Pool area",
        ]},
      ]},
      { key: "conditions_observed", label: "Conditions Observed", type: "checklist-add", section: "Findings & Notes", checklistCategories: [
        { category: "Moisture / Water", items: [
          "Plumbing leaks present", "Standing water observed", "Condensation on pipes",
          "Water-damaged walls or ceilings", "Clogged or slow drains",
        ]},
        { category: "Structural / Exclusion", items: [
          "Gaps around pipes / utility penetrations", "Damaged door sweeps or weather stripping",
          "Cracks in foundation or walls", "Unsealed vents or openings",
          "Damaged screens or windows",
        ]},
        { category: "Sanitation", items: [
          "Food debris / spills present", "Grease buildup observed",
          "Trash / debris accumulation", "Improper food storage",
          "Overflowing or open trash receptacles",
        ]},
        { category: "Harborage / Environment", items: [
          "Clutter providing pest harborage", "Vegetation touching structure",
          "Stored cardboard boxes", "Mulch or ground cover against foundation",
          "Exterior lighting attracting insects",
        ]},
      ]},
      { key: "additional_notes", label: "Recommendations", type: "checklist-add", section: "Findings & Notes", checklistCategories: [
        { category: "Sanitation", items: [
          "Remove food debris and spills promptly",
          "Clean grease traps and drain covers regularly",
          "Store all food in sealed, airtight containers",
          "Empty indoor trash receptacles daily",
          "Keep dumpster lids closed at all times",
        ]},
        { category: "Structural / Exclusion", items: [
          "Seal cracks and gaps around pipes, wires, and utility penetrations",
          "Repair or replace damaged door sweeps and weather stripping",
          "Fix plumbing leaks and eliminate standing water",
          "Screen or seal ventilation openings",
          "Repair damaged screens or windows",
        ]},
        { category: "Landscaping / Exterior", items: [
          "Trim vegetation away from building (minimum 18 inches)",
          "Remove leaf litter and ground cover near foundation",
          "Ensure exterior lighting does not attract insects near entry doors",
          "Reduce mulch depth near foundation to under 2 inches",
        ]},
        { category: "Follow-Up", items: [
          "Schedule follow-up inspection in 30 days",
          "Schedule follow-up inspection in 60 days",
          "Request access to locked or inaccessible areas for next visit",
          "Recommend regular ongoing pest management program",
        ]},
      ]},
      // ── Scope of Work (optional — turns report into quick quote) ──
      { key: "ir_scope_description", label: "Scope Description", type: "textarea", placeholder: "e.g., Monthly exterior perimeter treatment, interior crack-and-crevice as needed", section: "Scope of Work" },
      { key: "ir_service_frequency", label: "Service Frequency", type: "text", placeholder: "e.g., Twice per month", section: "Scope of Work" },
      { key: "ir_service_areas", label: "Treatment / Service Areas", type: "text", placeholder: "e.g., Exterior perimeter, kitchen, storage rooms", section: "Scope of Work" },
      // ── Pricing (optional — if any filled, document becomes a quote) ──
      { key: "ir_initial_cost", label: "Initial Service Cost ($)", type: "text", placeholder: "e.g., 650", section: "Pricing" },
      { key: "ir_recurring_cost", label: "Monthly / Recurring Cost ($)", type: "text", placeholder: "e.g., 350", section: "Pricing" },
      { key: "ir_onetime_cost", label: "One-Time Service Cost ($)", type: "text", placeholder: "e.g., 450", section: "Pricing" },
      { key: "ir_pricing_notes", label: "Pricing Notes", type: "textarea", placeholder: "e.g., Quarterly exterior-only option available at $175/visit", section: "Pricing" },
      // ── Customer Recommendations (reuse shared) ──
      CUSTOMER_RECS_FIELD,
    ],
  },
};
