import type { ComplianceStatus, Severity } from "../types/compliance";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTime(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function relativeTime(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 7) return days === 1 ? "Yesterday" : `${days} days ago`;
  return formatDate(d);
}

export function shortMonthName(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;
  return MONTHS[d.getMonth()];
}

export function formatInspectionId(seq: number, year?: number): string {
  const y = year || new Date().getFullYear();
  return `LM-${y}-${String(seq).padStart(6, "0")}`;
}

export function formatDraftId(): string {
  return `LM-DRAFT-${Date.now().toString(36).toUpperCase()}`;
}

export function formatConfidence(confidence: number): string {
  if (
    typeof confidence !== "number" ||
    Number.isNaN(confidence)
  ) {
    return "0%";
  }
  return `${Math.round(confidence)}%`;
}

export function formatPercent(value: number): string {
  if (Number.isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (Number.isNaN(num)) return String(value ?? "");
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSeverity(severity: Severity): string {
  const map: Record<Severity, string> = {
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
  };
  return map[severity] || severity;
}

export function complianceStatusLabel(status: ComplianceStatus): string {
  const map: Record<ComplianceStatus, string> = {
    COMPLIANT: "Compliant",
    NON_COMPLIANT: "Non-Compliant",
    REVIEW_REQUIRED: "Review Required",
  };
  return map[status] || status;
}

export function truncate(value: string, maxLength = 40): string {
  if (!value) return "";
  return value.length > maxLength
    ? `${value.slice(0, maxLength).trimEnd()}…`
    : value;
}
