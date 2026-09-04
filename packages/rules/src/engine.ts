import type {
  ComplianceResult,
  ComplianceStatus,
  PassedRule,
  ReviewItem,
  Violation,
} from "@labelly/shared/types";
import { allRules } from "./rules";
import type {
  EngineOptions,
  EngineResult,
  ExtractionInput,
  ScoreWeights,
} from "./types";

/**
 * Default severity-weighted penalties for the 0–100 compliance score.
 *
 * Rationale:
 *  - HIGH violation  → −20 pts  (legally mandatory, critical)
 *  - MEDIUM violation → −10 pts
 *  - LOW violation   →  −5 pts
 *  - Any review item →  −5 pts  (uncertainty, not confirmed)
 *
 * A product with 5 HIGH violations scores 0 (floored).
 * A product with all PASS scores 100.
 */
const DEFAULT_WEIGHTS: ScoreWeights = {
  highPenalty: 20,
  mediumPenalty: 10,
  lowPenalty: 5,
  reviewPenalty: 5,
  maxScore: 100,
};

export function determineStatus(
  violations: Violation[],
  review: ReviewItem[]
): ComplianceStatus {
  if (violations.some((v) => v.status === "FAIL")) return "NON_COMPLIANT";
  if (review.length > 0) return "REVIEW_REQUIRED";
  return "COMPLIANT";
}

/**
 * Calculates a weighted 0–100 compliance score.
 *
 * Each violation is penalised according to its severity:
 *   HIGH → −{highPenalty}, MEDIUM → −{mediumPenalty}, LOW → −{lowPenalty}
 * Each review item subtracts a flat {reviewPenalty}.
 * Score is clamped to [0, 100].
 *
 * @example
 *   // 1 HIGH violation + 1 review item → 100 − 20 − 5 = 75
 *   calculateComplianceScore([{ severity: "HIGH" }], [{}]) // → 75
 */
export function calculateComplianceScore(
  violations: Violation[],
  review: ReviewItem[],
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  const violationDeduction = violations.reduce((acc, v) => {
    if (v.status !== "FAIL") return acc;
    switch (v.severity) {
      case "HIGH":   return acc + weights.highPenalty;
      case "MEDIUM": return acc + weights.mediumPenalty;
      case "LOW":    return acc + weights.lowPenalty;
      default:       return acc + weights.mediumPenalty;
    }
  }, 0);

  const reviewDeduction = review.length * weights.reviewPenalty;

  return Math.max(0, weights.maxScore - violationDeduction - reviewDeduction);
}

export function runComplianceCheck(
  extractedData: ExtractionInput,
  options: EngineOptions = {}
): EngineResult {
  const weights = { ...DEFAULT_WEIGHTS, ...options.scoreWeights };
  const violations: Violation[] = [];
  const passedRules: PassedRule[] = [];
  const reviewRequired: ReviewItem[] = [];

  const ctx = {
    data: extractedData,
    violations,
    passedRules,
    reviewRequired,
  };

  const rules = options.rules ?? allRules;
  for (const rule of rules) {
    rule(ctx);
  }

  const status = determineStatus(violations, reviewRequired);
  const score = calculateComplianceScore(violations, reviewRequired, weights);

  return {
    status,
    score,
    violations,
    passedRules,
    reviewRequired,
  };
}

/**
 * Re-evaluates compliance for already-extracted data (e.g., after inspector
 * edits). Functionally identical to `runComplianceCheck` — provided as a
 * distinct entry point so call sites communicate intent clearly.
 */
export function recheck(
  extractedData: ExtractionInput,
  options: EngineOptions = {}
): EngineResult {
  return runComplianceCheck(extractedData, options);
}

export type { ComplianceResult, EngineResult, ExtractionInput, EngineOptions };
