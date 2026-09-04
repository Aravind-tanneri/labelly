import {
  isNonEmptyString,
  isValidSeverity,
  isNonEmptyArray,
  isValidConfidence,
  isValidComplianceStatus,
  isObject,
} from "../utils/validators";
import type {
  ComplianceResult,
  ComplianceStatus,
  Violation,
  ReviewItem,
  PassedRule,
} from "../types/compliance";
import type { ValidationResult } from "./inspection";

export interface RecheckInput {
  extractedData?: Record<string, string | null>;
}

export const complianceValidation = {
  recheck(input: RecheckInput): ValidationResult {
    const errors: Record<string, string> = {};
    if (input.extractedData !== undefined && !isObject(input.extractedData)) {
      errors.extractedData = "extractedData must be an object.";
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },
};

export function validateViolation(v: Violation): boolean {
  return (
    isNonEmptyString(v.ruleId) &&
    isNonEmptyString(v.field) &&
    v.status === "FAIL" &&
    isValidSeverity(v.severity) &&
    isNonEmptyString(v.message)
  );
}

export function validateReviewItem(r: ReviewItem): boolean {
  return (
    isNonEmptyString(r.field) &&
    r.status === "REVIEW" &&
    isValidSeverity(r.severity) &&
    isNonEmptyString(r.message)
  );
}

export function validatePassedRule(r: PassedRule): boolean {
  return isNonEmptyString(r.ruleId) && r.status === "PASS";
}

export function validateComplianceResult(
  result: ComplianceResult
): boolean {
  if (!isValidComplianceStatus(result.status)) return false;
  if (typeof result.score !== "number" || result.score < 0 || result.score > 100) {
    return false;
  }
  if (!Array.isArray(result.violations)) return false;
  if (result.violations.some((v) => !validateViolation(v))) return false;
  if (result.reviewRequired.some((r) => !validateReviewItem(r))) return false;
  if (result.passedRules.some((r) => !validatePassedRule(r))) return false;
  return true;
}

export function complianceStatusFromResult(
  status: ComplianceStatus,
  violations: Violation[],
  review: ReviewItem[]
): ComplianceStatus {
  if (violations.some((v) => v.status === "FAIL")) return "NON_COMPLIANT";
  if (isNonEmptyArray(review)) return "REVIEW_REQUIRED";
  return status;
}

export { isValidConfidence };
