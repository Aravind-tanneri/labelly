import { runComplianceCheck } from "../rules/ruleEngine";
import type { ExtractionInput } from "../rules/ruleEngine";
import type {
  ComplianceResult,
  Declarations,
  GeminiExtractionResponse,
  ProductInfo,
} from "../types";

/**
 * Bridges Gemini extractions and stored inspection documents to the deterministic
 * rule engine. `AI EXTRACTS. RULES DECIDE. HUMANS VERIFY.`
 */

export const DECLARATION_FIELDS = [
  "manufacturer",
  "packer",
  "importer",
  "netQuantity",
  "mrp",
  "manufacturingDate",
  "consumerCare",
  "batchNumber",
] as const;

export type DeclarationField = (typeof DECLARATION_FIELDS)[number];

export interface StoredExtraction {
  product: ProductInfo;
  extractedData: Declarations;
  extractionConfidence: Record<string, number>;
  visualObservations: string[];
  uncertainFields: string[];
}

export function emptyDeclarations(): Declarations {
  return {
    manufacturer: null,
    packer: null,
    importer: null,
    netQuantity: null,
    mrp: null,
    manufacturingDate: null,
    consumerCare: null,
    batchNumber: null,
  };
}

function toEngineInput(stored: StoredExtraction): ExtractionInput {
  const declarations = {} as ExtractionInput["declarations"];
  for (const field of DECLARATION_FIELDS) {
    const value = stored.extractedData[field] ?? null;
    declarations[field] = {
      value,
      confidence: stored.extractionConfidence[field] ?? 0,
      found: value !== null && value !== "",
    };
  }
  return { declarations, visualObservations: stored.visualObservations };
}

/** Runs the deterministic rule engine over stored extraction data. */
export function runCompliance(stored: StoredExtraction): ComplianceResult {
  return runComplianceCheck(toEngineInput(stored)) as ComplianceResult;
}

/** Converts a Gemini extraction into the shape persisted on the inspection. */
export function geminiToStored(
  extraction: GeminiExtractionResponse
): StoredExtraction {
  const d = extraction.declarations;
  const extractedData: Declarations = {
    manufacturer: d.manufacturer.value,
    packer: d.packer.value,
    importer: d.importer.value,
    netQuantity: d.netQuantity.value,
    mrp: d.mrp.value,
    manufacturingDate: d.manufacturingDate.value,
    consumerCare: d.consumerCare.value,
    batchNumber: d.batchNumber.value,
  };

  const extractionConfidence: Record<string, number> = {};
  for (const field of DECLARATION_FIELDS) {
    extractionConfidence[field] = d[field].confidence;
  }

  return {
    product: extraction.product,
    extractedData,
    extractionConfidence,
    visualObservations: extraction.visualObservations,
    uncertainFields: extraction.uncertainFields,
  };
}