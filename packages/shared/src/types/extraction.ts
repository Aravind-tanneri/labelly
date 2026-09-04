/**
 * ExtractionInput — canonical input shape for the compliance rule engine.
 *
 * Defined here (in @labelly/shared) so both @labelly/rules and server can
 * import the same type without duplication. A `GeminiExtractionResponse` is
 * structurally assignable to this type, meaning it can be passed directly to
 * `runComplianceCheck()` without any adapter layer.
 */

import type { GeminiDeclaration } from "./gemini";

export interface ExtractionInput {
  declarations: {
    manufacturer: GeminiDeclaration;
    packer: GeminiDeclaration;
    importer: GeminiDeclaration;
    netQuantity: GeminiDeclaration;
    mrp: GeminiDeclaration;
    manufacturingDate: GeminiDeclaration;
    consumerCare: GeminiDeclaration;
    batchNumber: GeminiDeclaration;
  };
  /**
   * Free-text observations about image quality from Gemini (e.g., "glare",
   * "blur", "small text"). Consumed by LM-PC-007 readability rule.
   */
  visualObservations?: string[];
}
