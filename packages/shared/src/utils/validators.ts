import type { ComplianceStatus, Severity } from "../types/compliance";

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isRequired(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidConfidence(value: unknown): boolean {
  return (
    typeof value === "number" &&
    !Number.isNaN(value) &&
    value >= 0 &&
    value <= 100
  );
}

export function isValidSeverity(value: unknown): value is Severity {
  return value === "HIGH" || value === "MEDIUM" || value === "LOW";
}

export function isValidComplianceStatus(
  value: unknown
): value is ComplianceStatus {
  return (
    value === "COMPLIANT" ||
    value === "NON_COMPLIANT" ||
    value === "REVIEW_REQUIRED"
  );
}

export function isUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function inRange(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && value >= min && value <= max;
}

export function isInspectionId(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  return /^LM-\d{4}-\d{6}$/.test(value);
}
