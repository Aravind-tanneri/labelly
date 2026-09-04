import type {
  ComplianceResult,
  ComplianceStatus,
  ExtractionInput,
  PassedRule,
  ReviewItem,
  Violation,
} from "@labelly/shared/types";

/**
 * ExtractionInput is re-exported from @labelly/shared/types — the canonical
 * definition lives there so @labelly/rules and the server share one type,
 * eliminating drift. A `GeminiExtractionResponse` is structurally assignable
 * to `ExtractionInput` and can be passed directly to `runComplianceCheck()`
 * without an adapter.
 */
export type { ExtractionInput } from "@labelly/shared/types";

export interface RuleContext {
  data: ExtractionInput;
  violations: Violation[];
  passedRules: PassedRule[];
  reviewRequired: ReviewItem[];
}

export type ComplianceRule = (ctx: RuleContext) => void;

export interface RuleConfig {
  ruleId: string;
  field: string;
  title: string;
  required: boolean;
  severity: Violation["severity"];
  confidenceThreshold?: number;
}

export interface EngineOptions {
  rules?: ComplianceRule[];
  scoreWeights?: ScoreWeights;
}

export interface ScoreWeights {
  highPenalty: number;
  mediumPenalty: number;
  lowPenalty: number;
  reviewPenalty: number;
  maxScore: number;
}

/** The output of `runComplianceCheck` and `recheck`. Equivalent to ComplianceResult. */
export type EngineResult = ComplianceResult;

export { ComplianceResult, ComplianceStatus, Violation, ReviewItem, PassedRule };
