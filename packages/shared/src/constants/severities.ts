import type { Severity } from "../types/compliance";

export const VIOLATION_SEVERITIES: {
  HIGH: Severity;
  MEDIUM: Severity;
  LOW: Severity;
} = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export const SEVERITY_LABELS: Record<Severity, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const SEVERITY_ORDER: Severity[] = ["HIGH", "MEDIUM", "LOW"];

export const SEVERITY_RANK: Record<Severity, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const MIN_CONFIDENCE_THRESHOLD = 75;
