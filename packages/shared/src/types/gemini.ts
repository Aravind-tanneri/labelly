/**
 * Gemini multimodal extraction schema.
 *
 * Gemini extracts only what is visible on the label, reports confidence,
 * never invents missing values and never decides legal compliance.
 */

import type { ProductInfo } from "./inspection";

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

export interface GeminiAnalyzeRequest {
  imageUrl: string;
  inspectionId: string;
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
