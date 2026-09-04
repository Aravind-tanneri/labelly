import type { ComplianceResult } from "./compliance";

export interface ProductInfo {
  name: string;
  category: string;
  brand: string;
}

export interface ProductImage {
  originalUrl: string;
  thumbnailUrl: string;
  uploadedAt: Date | string;
}

export interface InspectorEdit {
  field: string;
  before: string;
  after: string;
  editedAt: Date | string;
}

export type InspectionLifecycleStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "ACTION_REQUIRED"
  | "REINSPECTION_REQUESTED";

export type Declarations = {
  manufacturer: string | null;
  packer: string | null;
  importer: string | null;
  netQuantity: string | null;
  mrp: string | null;
  manufacturingDate: string | null;
  consumerCare: string | null;
  batchNumber: string | null;
  otherDeclarations?: Record<string, string>;
};

export interface Inspection {
  _id: string;
  inspectionId: string;
  inspectorId: string;
  supervisorId?: string;

  product: ProductInfo;

  images: ProductImage[];

  extractedData: Declarations;
  extractionConfidence: Record<string, number>;
  visualObservations: string[];
  uncertainFields: string[];

  compliance: ComplianceResult | null;

  inspectorEdits: InspectorEdit[];

  remarks?: string;

  reportUrl?: string;
  reportGeneratedAt?: Date | string;

  status: InspectionLifecycleStatus;

  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateInspectionRequest {
  productCategory: string;
  notes?: string;
}

export interface InspectionListItem {
  _id: string;
  inspectionId: string;
  product: ProductInfo;
  status: InspectionLifecycleStatus;
  complianceStatus: ComplianceResult["status"];
  violations: number;
  inspectorName: string;
  inspectorId: string;
  createdAt: Date | string;
}

export interface PaginatedInspections {
  inspections: InspectionListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InspectionListQuery {
  page?: number;
  limit?: number;
  status?: InspectionLifecycleStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  product?: string;
  complianceStatus?: ComplianceResult["status"];
}