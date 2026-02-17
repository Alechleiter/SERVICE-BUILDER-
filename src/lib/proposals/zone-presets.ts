import type { ZonePreset } from "./types";

export const ZONE_PRESETS: ZonePreset[] = [
  { value: "exterior", label: "Exterior", icon: "\u{1F3E0}" },
  { value: "interior", label: "Interior Common Area", icon: "\u{1F6AA}" },
  { value: "unit", label: "Unit", icon: "\u{1F6CF}\uFE0F" },
  { value: "courtyard", label: "Courtyard", icon: "\u{1F333}" },
  { value: "dumpster", label: "Dumpster / Trash Area", icon: "\u{1F5D1}\uFE0F" },
  { value: "parking", label: "Parking Area", icon: "\u{1F17F}\uFE0F" },
  { value: "pool", label: "Pool Area", icon: "\u{1F3CA}" },
  { value: "leasing", label: "Leasing Office", icon: "\u{1F3E2}" },
  { value: "kitchen", label: "Kitchen", icon: "\u{1F373}" },
  { value: "storage", label: "Storage / Utility", icon: "\u{1F4E6}" },
  { value: "laundry", label: "Laundry Room", icon: "\u{1F9FA}" },
  { value: "hallway", label: "Hallway", icon: "\u{1F6B6}" },
  { value: "crawlspace", label: "Crawl Space", icon: "\u{1F573}\uFE0F" },
  { value: "attic", label: "Attic", icon: "\u{1F3DA}\uFE0F" },
  { value: "breakroom", label: "Breakroom", icon: "\u2615" },
  { value: "hotwater", label: "Hot Water Heater Room", icon: "\u{1F321}\uFE0F" },
  { value: "custom", label: "Other (type your own)", icon: "\u270F\uFE0F" },
];

export function getZoneLabel(photo: { zone: string; unitNumber?: string; customZone?: string }): string {
  if (photo.zone === "unit") return `Unit ${photo.unitNumber || "___"}`;
  if (photo.zone === "custom") return photo.customZone || "Other";
  const preset = ZONE_PRESETS.find((z) => z.value === photo.zone);
  return preset ? preset.label : "Uncategorized";
}

export function getZoneIcon(zone: string): string {
  const preset = ZONE_PRESETS.find((z) => z.value === zone);
  return preset ? preset.icon : "\u{1F4CD}";
}

export function groupByZone<T extends { zone: string; unitNumber?: string; customZone?: string }>(photos: T[]) {
  const groups: Record<string, { icon: string; photos: T[] }> = {};
  photos.forEach((p) => {
    const label = getZoneLabel(p);
    if (!groups[label]) groups[label] = { icon: getZoneIcon(p.zone), photos: [] };
    groups[label].photos.push(p);
  });
  return groups;
}
