import type { ProductInfo } from "./inspection";

/**
 * Gemini multimodal extraction schema.
 *
 * Gemini extracts only what is visible on the label, reports confidence,
 * never invents missing values and never decides legal compliance.
 */

export interface GeminiDeclaration {
  value: string | null;
  confidence: number;
  found: boolean;
}

export interface GeminiExtractionResponse {
  product: ProductInfo;
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
  visualObservations: string[];
  uncertainFields: string[];
}

export interface AnalyzeResponse {
  extraction: GeminiExtractionResponse;
  confidence: Record<string, number>;
}

export type GeminiErrorCode =
  | "IMAGE_UNREADABLE"
  | "GLARE_REFLECTION"
  | "UNSUPPORTED_MEDIA"
  | "SERVICE_UNAVAILABLE"
  | "RATE_LIMITED"
  | "UNKNOWN";

export const GEMINI_SYSTEM_PROMPT = `You are a Legal Metrology package label analyzer.
Your task is to:
1. Analyze packaged commodity labels
2. Extract declared information accurately
3. Return only information visible in the image
4. Preserve uncertainty (confidence scores)
5. Do NOT invent missing values
6. Do NOT make legal compliance decisions

Return ONLY valid JSON matching the provided schema.
Do NOT add explanations or preamble.`;

export const GEMINI_SCHEMA_PROMPT = `Respond with a single JSON object using this schema:
{
  "product": { "name": string, "category": string, "brand": string },
  "declarations": {
    "manufacturer": { "value": string, "confidence": number (0-100), "found": boolean },
    "packer": { "value": string, "confidence": number, "found": boolean },
    "importer": { "value": string, "confidence": number, "found": boolean },
    "netQuantity": { "value": string, "confidence": number, "found": boolean },
    "mrp": { "value": string, "confidence": number, "found": boolean },
    "manufacturingDate": { "value": string, "confidence": number, "found": boolean },
    "consumerCare": { "value": string, "confidence": number, "found": boolean },
    "batchNumber": { "value": string, "confidence": number, "found": boolean }
  },
  "visualObservations": string[],
  "uncertainFields": string[]
}
Leave "value" null when a declaration is not visible. Do NOT invent values. Do NOT judge compliance.`;