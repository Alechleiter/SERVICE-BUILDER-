// ══════════════════════════════════════════════════════════
// Cost of Inaction — Industry Presets
// 14 industries with 6-8 cost categories each
// ══════════════════════════════════════════════════════════

import type { IndustryPreset } from "./types";

export const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  restaurant_food_service: {
    id: "restaurant_food_service",
    name: "Restaurant / Food Service",
    icon: "🍽️",
    color: "#E9C46A",
    description: "Health code violations, closure risk, contamination, and lost business",
    categories: [
      { id: "health_violations", label: "Health Code Violations & Fines", description: "State/county fines for pest evidence during inspections", defaultAmount: 2000, icon: "⚠️" },
      { id: "temp_closure", label: "Temporary Closure Costs", description: "Revenue lost per day of forced shutdown", defaultAmount: 5000, icon: "🚫" },
      { id: "food_contamination", label: "Food Contamination & Waste", description: "Spoiled inventory, discarded prep, and wasted product", defaultAmount: 1500, icon: "🗑️" },
      { id: "lost_business", label: "Customer Complaints & Lost Business", description: "Customers who leave and never return", defaultAmount: 3000, icon: "👥" },
      { id: "reputation", label: "Reputation Damage / Bad Reviews", description: "Online review damage impacting future revenue", defaultAmount: 2500, icon: "⭐" },
      { id: "turnover", label: "Employee Turnover from Conditions", description: "Cost to recruit and train replacement staff", defaultAmount: 1000, icon: "🔄" },
      { id: "emergency_treatment", label: "Emergency Extermination", description: "Reactive pest treatment at premium pricing", defaultAmount: 800, icon: "🚨" },
      { id: "lawsuit_liability", label: "Lawsuit / Liability Risk", description: "Legal exposure from customer illness or injury", defaultAmount: 10000, icon: "⚖️" },
    ],
  },

  hotel_hospitality: {
    id: "hotel_hospitality",
    name: "Hotel / Hospitality",
    icon: "🏨",
    color: "#E76F51",
    description: "Guest refunds, reputation damage, and regulatory exposure",
    categories: [
      { id: "guest_refunds", label: "Guest Refunds & Comps", description: "Room refunds, free nights, and service credits", defaultAmount: 3000, icon: "💳" },
      { id: "negative_reviews", label: "Negative Online Reviews", description: "Lost bookings from pest-related reviews", defaultAmount: 5000, icon: "⭐" },
      { id: "room_downtime", label: "Room Downtime for Treatment", description: "Revenue loss from rooms pulled out of service", defaultAmount: 2000, icon: "🚪" },
      { id: "health_violations", label: "Health Department Violations", description: "Fines and citations from inspections", defaultAmount: 3000, icon: "⚠️" },
      { id: "brand_damage", label: "Brand Reputation Damage", description: "Long-term impact on brand perception and bookings", defaultAmount: 10000, icon: "📉" },
      { id: "staff_turnover", label: "Staff Complaints & Turnover", description: "Housekeeping and front-desk staff loss", defaultAmount: 1500, icon: "🔄" },
      { id: "emergency_treatment", label: "Emergency Pest Treatment", description: "Urgent after-hours service at premium rates", defaultAmount: 1200, icon: "🚨" },
      { id: "legal_liability", label: "Legal Liability", description: "Lawsuits from guest injuries or illness", defaultAmount: 15000, icon: "⚖️" },
    ],
  },

  multi_family_apartment: {
    id: "multi_family_apartment",
    name: "Multi Family / Apartment",
    icon: "🏢",
    color: "#2A9D8F",
    description: "Tenant complaints, vacancies, and property value decline",
    categories: [
      { id: "tenant_turnover", label: "Tenant Complaints & Turnover", description: "Early lease breaks and lost tenants", defaultAmount: 2500, icon: "🚪" },
      { id: "vacancy_costs", label: "Unit Vacancy Costs", description: "Lost rent from vacant units during treatment", defaultAmount: 3000, icon: "🏚️" },
      { id: "emergency_treatment", label: "Emergency Treatments", description: "Reactive pest control at premium pricing", defaultAmount: 800, icon: "🚨" },
      { id: "health_violations", label: "Health Code Violations", description: "Municipal fines and citations", defaultAmount: 2000, icon: "⚠️" },
      { id: "property_value", label: "Property Value Decline", description: "Reduced appraisal and rental rates", defaultAmount: 5000, icon: "📉" },
      { id: "legal_liability", label: "Legal Liability from Tenants", description: "Tenant lawsuits for habitability issues", defaultAmount: 8000, icon: "⚖️" },
      { id: "repair_costs", label: "Repair Costs from Pest Damage", description: "Drywall, wiring, insulation repair", defaultAmount: 1500, icon: "🔧" },
    ],
  },

  office_corporate: {
    id: "office_corporate",
    name: "Office / Corporate",
    icon: "🏢",
    color: "#264653",
    description: "Productivity loss, OSHA risk, and client impression damage",
    categories: [
      { id: "productivity_loss", label: "Employee Productivity Loss", description: "Distracted and uncomfortable staff", defaultAmount: 3000, icon: "📉" },
      { id: "osha_risk", label: "Health Complaints & OSHA Risk", description: "Workplace safety violations and complaints", defaultAmount: 2500, icon: "⚠️" },
      { id: "client_impression", label: "Client Impression Damage", description: "Lost deals from unprofessional appearance", defaultAmount: 5000, icon: "🤝" },
      { id: "emergency_treatment", label: "Emergency Pest Treatment", description: "Reactive service at premium rates", defaultAmount: 1000, icon: "🚨" },
      { id: "equipment_damage", label: "Equipment / Wiring Damage", description: "Rodent damage to cables and infrastructure", defaultAmount: 2000, icon: "🔌" },
      { id: "lease_violations", label: "Lease Violation Penalties", description: "Landlord penalties for pest conditions", defaultAmount: 4000, icon: "📋" },
    ],
  },

  retail_sales_floor: {
    id: "retail_sales_floor",
    name: "Retail / Sales Floor",
    icon: "🛍️",
    color: "#F4A261",
    description: "Product damage, lost sales, and brand reputation",
    categories: [
      { id: "product_damage", label: "Product Contamination & Damage", description: "Destroyed merchandise and packaging", defaultAmount: 3000, icon: "📦" },
      { id: "lost_sales", label: "Customer Complaints & Lost Sales", description: "Shoppers who leave and don't return", defaultAmount: 4000, icon: "👥" },
      { id: "health_violations", label: "Health Department Violations", description: "Fines from retail inspections", defaultAmount: 2000, icon: "⚠️" },
      { id: "brand_damage", label: "Brand Reputation Damage", description: "Social media and review impact", defaultAmount: 5000, icon: "📉" },
      { id: "emergency_treatment", label: "Emergency Treatment Costs", description: "Reactive pest control services", defaultAmount: 800, icon: "🚨" },
      { id: "inventory_loss", label: "Inventory Write-Offs", description: "Product that must be discarded", defaultAmount: 2500, icon: "🗑️" },
    ],
  },

  healthcare_medical: {
    id: "healthcare_medical",
    name: "Healthcare / Medical",
    icon: "🏥",
    color: "#457B9D",
    description: "Regulatory fines, patient safety, and accreditation risk",
    categories: [
      { id: "regulatory_fines", label: "Regulatory Violations & Fines", description: "State and federal healthcare compliance fines", defaultAmount: 10000, icon: "⚠️" },
      { id: "patient_safety", label: "Patient Safety Incidents", description: "Infection risk and patient harm exposure", defaultAmount: 15000, icon: "🏥" },
      { id: "accreditation_risk", label: "Accreditation Risk", description: "Risk of losing JCAHO or state certification", defaultAmount: 20000, icon: "📋" },
      { id: "lawsuit_exposure", label: "Lawsuit / Malpractice Exposure", description: "Legal claims from patients or families", defaultAmount: 25000, icon: "⚖️" },
      { id: "emergency_remediation", label: "Emergency Pest Remediation", description: "Urgent treatment to maintain compliance", defaultAmount: 2000, icon: "🚨" },
      { id: "reputation_damage", label: "Reputation Damage", description: "Community trust and patient referral loss", defaultAmount: 8000, icon: "📉" },
    ],
  },

  education_school: {
    id: "education_school",
    name: "Education / School",
    icon: "🏫",
    color: "#6366F1",
    description: "Parent complaints, enrollment risk, and regulatory exposure",
    categories: [
      { id: "enrollment_loss", label: "Parent Complaints & Enrollment Loss", description: "Families leaving for other schools", defaultAmount: 5000, icon: "👨‍👩‍👧" },
      { id: "closure_risk", label: "Health Department Closure Risk", description: "Forced temporary closure costs", defaultAmount: 8000, icon: "🚫" },
      { id: "student_health", label: "Student Health Incidents", description: "Allergic reactions, bites, and illness", defaultAmount: 3000, icon: "🏥" },
      { id: "emergency_treatment", label: "Emergency Treatment Costs", description: "Reactive pest control during school year", defaultAmount: 1200, icon: "🚨" },
      { id: "regulatory_fines", label: "Regulatory Fines", description: "State education and health department fines", defaultAmount: 2500, icon: "⚠️" },
      { id: "staff_morale", label: "Staff Morale & Retention", description: "Teacher dissatisfaction and turnover", defaultAmount: 1500, icon: "🔄" },
    ],
  },

  warehouse_distribution: {
    id: "warehouse_distribution",
    name: "Warehouse / Distribution",
    icon: "🏭",
    color: "#78716C",
    description: "Product recalls, failed audits, and contract loss",
    categories: [
      { id: "contamination_recalls", label: "Product Contamination & Recalls", description: "Recalled goods and disposal costs", defaultAmount: 10000, icon: "📦" },
      { id: "failed_audits", label: "Failed Audits & Lost Contracts", description: "Client audit failures ending business relationships", defaultAmount: 15000, icon: "📋" },
      { id: "regulatory_fines", label: "Regulatory Fines", description: "FDA, USDA, or state compliance fines", defaultAmount: 5000, icon: "⚠️" },
      { id: "inventory_damage", label: "Inventory Damage & Write-Offs", description: "Pest-damaged stored goods", defaultAmount: 8000, icon: "🗑️" },
      { id: "emergency_fumigation", label: "Emergency Fumigation", description: "Full-facility fumigation at premium cost", defaultAmount: 3000, icon: "🚨" },
      { id: "client_loss", label: "Client Loss from Quality Issues", description: "Contracts cancelled due to pest history", defaultAmount: 12000, icon: "📉" },
    ],
  },

  church_worship: {
    id: "church_worship",
    name: "Church / House of Worship",
    icon: "⛪",
    color: "#8B5CF6",
    description: "Attendance impact, structural damage, and event disruption",
    categories: [
      { id: "attendance_drop", label: "Member Complaints & Attendance Drop", description: "Members avoiding services due to pest issues", defaultAmount: 2000, icon: "👥" },
      { id: "structural_damage", label: "Structural Damage from Pests", description: "Wood damage, nesting, insulation destruction", defaultAmount: 3000, icon: "🔧" },
      { id: "event_cancellations", label: "Event Cancellations", description: "Weddings, potlucks, and gatherings cancelled", defaultAmount: 1500, icon: "📅" },
      { id: "emergency_treatment", label: "Emergency Treatment Costs", description: "Reactive pest control services", defaultAmount: 800, icon: "🚨" },
      { id: "food_pantry", label: "Food Pantry Contamination", description: "Donated food destroyed by pests", defaultAmount: 1000, icon: "🥫" },
      { id: "community_reputation", label: "Reputation in Community", description: "Negative community perception", defaultAmount: 2500, icon: "📉" },
    ],
  },

  auto_dealership: {
    id: "auto_dealership",
    name: "Auto Dealership / Shop",
    icon: "🚗",
    color: "#DC2626",
    description: "Vehicle damage, customer complaints, and insurance claims",
    categories: [
      { id: "vehicle_damage", label: "Vehicle Damage from Rodents", description: "Chewed wiring, nesting, upholstery damage", defaultAmount: 5000, icon: "🚗" },
      { id: "customer_complaints", label: "Customer Complaints", description: "Buyers discovering pest evidence in vehicles", defaultAmount: 3000, icon: "👥" },
      { id: "inventory_contamination", label: "Inventory Contamination", description: "Parts and supplies damaged by pests", defaultAmount: 2000, icon: "📦" },
      { id: "emergency_treatment", label: "Emergency Treatment Costs", description: "Urgent pest control services", defaultAmount: 1000, icon: "🚨" },
      { id: "insurance_claims", label: "Insurance Claims from Damage", description: "Vehicle warranty and insurance costs", defaultAmount: 4000, icon: "📋" },
      { id: "health_violations", label: "Health Violations in Service Area", description: "Shop area hygiene citations", defaultAmount: 1500, icon: "⚠️" },
    ],
  },

  gym_fitness: {
    id: "gym_fitness",
    name: "Gym / Fitness Center",
    icon: "💪",
    color: "#059669",
    description: "Member cancellations, health violations, and facility issues",
    categories: [
      { id: "member_cancellations", label: "Member Complaints & Cancellations", description: "Lost memberships from pest sightings", defaultAmount: 3000, icon: "👥" },
      { id: "health_violations", label: "Health Department Violations", description: "Gym facility inspection fines", defaultAmount: 2500, icon: "⚠️" },
      { id: "facility_issues", label: "Locker Room / Shower Issues", description: "Pest issues in wet areas and changing rooms", defaultAmount: 1500, icon: "🚿" },
      { id: "emergency_treatment", label: "Emergency Treatment Costs", description: "Reactive pest control services", defaultAmount: 800, icon: "🚨" },
      { id: "brand_damage", label: "Brand Reputation Damage", description: "Social media and review impact", defaultAmount: 4000, icon: "📉" },
      { id: "staff_complaints", label: "Staff Complaints", description: "Employee dissatisfaction and turnover", defaultAmount: 1000, icon: "🔄" },
    ],
  },

  salon_spa: {
    id: "salon_spa",
    name: "Salon / Spa",
    icon: "💇",
    color: "#EC4899",
    description: "Client loss, health violations, and review damage",
    categories: [
      { id: "client_loss", label: "Client Loss from Pest Sightings", description: "Clients who never return after seeing pests", defaultAmount: 4000, icon: "👥" },
      { id: "health_violations", label: "Health Code Violations", description: "Cosmetology board and health department fines", defaultAmount: 3000, icon: "⚠️" },
      { id: "online_reviews", label: "Online Review Damage", description: "Lost new clients from pest-related reviews", defaultAmount: 5000, icon: "⭐" },
      { id: "emergency_treatment", label: "Emergency Treatment Costs", description: "Reactive pest control services", defaultAmount: 800, icon: "🚨" },
      { id: "product_contamination", label: "Product Contamination", description: "Damaged or contaminated supplies", defaultAmount: 1500, icon: "🧴" },
      { id: "staff_turnover", label: "Staff Turnover", description: "Stylists leaving due to conditions", defaultAmount: 1200, icon: "🔄" },
    ],
  },

  single_family_residential: {
    id: "single_family_residential",
    name: "Single Family Residential",
    icon: "🏠",
    color: "#10B981",
    description: "Structural damage, health risks, and property value decline",
    categories: [
      { id: "structural_damage", label: "Structural Damage", description: "Foundation, framing, and insulation damage", defaultAmount: 3000, icon: "🏠" },
      { id: "health_risks", label: "Health Risks to Family", description: "Allergies, asthma triggers, and disease exposure", defaultAmount: 2000, icon: "🏥" },
      { id: "property_value", label: "Property Value Decline", description: "Reduced home value and sale difficulty", defaultAmount: 5000, icon: "📉" },
      { id: "food_contamination", label: "Food Contamination", description: "Pantry items destroyed by pests", defaultAmount: 500, icon: "🥫" },
      { id: "emergency_treatment", label: "Emergency Treatment Costs", description: "Reactive pest control at premium pricing", defaultAmount: 600, icon: "🚨" },
      { id: "medical_costs", label: "Allergic Reactions & Medical Costs", description: "Doctor visits, medications, and treatment", defaultAmount: 1500, icon: "💊" },
    ],
  },

  other: {
    id: "other",
    name: "Other",
    icon: "🏗️",
    color: "#6B7280",
    description: "General pest-related costs for any property type",
    categories: [
      { id: "general_damage", label: "General Pest Damage", description: "Physical damage to property and materials", defaultAmount: 2000, icon: "🔧" },
      { id: "health_violations", label: "Health & Safety Violations", description: "Regulatory fines and citations", defaultAmount: 3000, icon: "⚠️" },
      { id: "complaints", label: "Customer / Client Complaints", description: "Lost business from pest incidents", defaultAmount: 2500, icon: "👥" },
      { id: "emergency_treatment", label: "Emergency Treatment Costs", description: "Reactive pest control at premium rates", defaultAmount: 1000, icon: "🚨" },
      { id: "property_damage", label: "Property Damage", description: "Structural and cosmetic repairs", defaultAmount: 1500, icon: "🏠" },
      { id: "legal_liability", label: "Legal Liability", description: "Lawsuit exposure and legal fees", defaultAmount: 5000, icon: "⚖️" },
    ],
  },
};

/** Ordered array of industry IDs for display */
export const INDUSTRY_ORDER = [
  "restaurant_food_service",
  "hotel_hospitality",
  "multi_family_apartment",
  "healthcare_medical",
  "warehouse_distribution",
  "office_corporate",
  "retail_sales_floor",
  "education_school",
  "gym_fitness",
  "salon_spa",
  "auto_dealership",
  "church_worship",
  "single_family_residential",
  "other",
];
