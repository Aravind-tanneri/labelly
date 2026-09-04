import type { Inspection, InspectionLifecycleStatus } from "../types/inspection";
import { isNonEmptyString, isUrl, isValidConfidence, isNonEmptyArray } from "../utils/validators";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface CreateInspectionInput {
  productCategory?: string;
  notes?: string;
}

export const inspectionValidation = {
  create(input: CreateInspectionInput): ValidationResult {
    const errors: Record<string, string> = {};
    if (!isNonEmptyString(input.productCategory)) {
      errors.productCategory = "Product category is required.";
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },

  update(
    input: Partial<Pick<Inspection, "remarks">> & {
      extractedData?: Inspection["extractedData"];
    }
  ): ValidationResult {
    const errors: Record<string, string> = {};
    if (input.remarks !== undefined && typeof input.remarks !== "string") {
      errors.remarks = "Remarks must be a string.";
    }
    const data = input.extractedData;
    if (data !== undefined) {
      for (const [field, value] of Object.entries(data)) {
        if (value !== null && typeof value !== "string") {
          errors[field] = `${field} must be a string or null.`;
        }
      }
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },

  image(input: { image?: File | Blob }): ValidationResult {
    const errors: Record<string, string> = {};
    if (!input.image) {
      errors.image = "An image is required.";
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },
};

export function isValidLifecycleStatus(value: unknown): value is InspectionLifecycleStatus {
  return (
    value === "DRAFT" ||
    value === "SUBMITTED" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "ACTION_REQUIRED" ||
    value === "REINSPECTION_REQUESTED"
  );
}

export function validateInspection(inspection: Inspection): ValidationResult {
  const errors: Record<string, string> = {};
  if (!isNonEmptyString(inspection.inspectionId)) {
    errors.inspectionId = "Inspection ID is required.";
  }
  if (!isNonEmptyString(inspection.inspectorId)) {
    errors.inspectorId = "Inspector is required.";
  }
  if (!isNonEmptyString(inspection.product?.name)) {
    errors.productName = "Product name is required.";
  }
  if (inspection.images && !isNonEmptyArray(inspection.images)) {
    errors.images = "At least one image is required.";
  }
  if (inspection.images?.some((img) => !isUrl(img.originalUrl))) {
    errors.imageUrl = "Image URLs must be valid.";
  }
  if (
    inspection.extractionConfidence &&
    Object.values(inspection.extractionConfidence).some(
      (c) => !isValidConfidence(c)
    )
  ) {
    errors.extractionConfidence = "Confidence values must be between 0 and 100.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
