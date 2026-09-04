/**
 * Deterministic compliance output types used by the rule engine.
 *
 * The engine never makes AI-based decisions:
 * AI EXTRACTS. RULES DECIDE. HUMANS VERIFY.
 */

export type ComplianceStatus =
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "REVIEW_REQUIRED";

export type RuleCheckStatus = "PASS" | "FAIL" | "REVIEW";

export type Severity = "HIGH" | "MEDIUM" | "LOW";

export interface Violation {
  ruleId: string;
  field: string;
  status: "FAIL";
  severity: Severity;
  message: string;
  expectedValue?: string;
  actualValue?: string;
}

export interface ReviewItem {
  ruleId?: string;
  field: string;
  status: "REVIEW";
  severity: Severity;
  message: string;
}

export interface PassedRule {
  ruleId: string;
  field: string;
  status: "PASS";
  message?: string;
}

export interface ComplianceResult {
  status: ComplianceStatus;
  score: number;
  violations: Violation[];
  passedRules: PassedRule[];
  reviewRequired: ReviewItem[];
}

export interface ViolationBreakdown {
  title: string;
  count: number;
}