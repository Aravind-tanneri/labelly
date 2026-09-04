/**
 * Small shared helpers for the web UI.
 */

export function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function initialsOf(name?: string): string {
  if (!name) return "S";
  const cleaned = name.replace(/[^\w\s]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "S";
}

/** camelCase field keys → human readable labels, e.g. "netQuantity" → "Net Quantity". */
export function labelForField(field: string): string {
  if (!field) return "";
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatInspectionCount(value: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return value.toLocaleString("en-IN");
}