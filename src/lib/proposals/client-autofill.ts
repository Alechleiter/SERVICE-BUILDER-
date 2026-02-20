import type { Client } from "@/lib/supabase/database.types";
import type { TemplateId } from "./types";

/**
 * Returns a Record<string, string> mapping proposal form‑field keys
 * to values from the given client. Only keys whose client value is
 * non‑null / non‑empty are included.
 *
 * Template‑specific: food_service uses `restaurant_name` / `restaurant_address`
 * while all others use `property_name` / `property_address`.
 */
export function getClientFieldMapping(
  templateId: TemplateId,
  client: Client,
): Record<string, string> {
  const map: Record<string, string> = {};

  const isFoodService = templateId === "food_service";

  // Name
  if (client.name) {
    map[isFoodService ? "restaurant_name" : "property_name"] = client.name;
  }

  // Address
  if (client.address) {
    map[isFoodService ? "restaurant_address" : "property_address"] = client.address;
  }

  // Contact fields — only inspection_report has these
  if (templateId === "inspection_report") {
    if (client.contact_name) map.contact_name = client.contact_name;
    if (client.contact_email) map.contact_email = client.contact_email;
    if (client.contact_phone) map.contact_phone = client.contact_phone;
  }

  return map;
}

/**
 * Merges client field mapping into existing formData, but **only fills
 * fields that are currently empty**. Already‑entered data is never overwritten.
 */
export function mergeClientFields(
  current: Record<string, string>,
  mapping: Record<string, string>,
): Record<string, string> {
  const merged = { ...current };
  for (const [key, value] of Object.entries(mapping)) {
    if (!merged[key]?.trim()) {
      merged[key] = value;
    }
  }
  return merged;
}
