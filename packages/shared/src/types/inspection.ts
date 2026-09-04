import type { ComplianceResult } from "./compliance";
import type { UserRole } from "./user";

export interface ExtractedDeclaration {
  value: string | null;
  confidence: number;
  found: boolean;
}

export interface ProductInfo {
  name: string;
  category: string;
  brand: string;
}

export interface ProductImage {
  originalUrl: string;
  thumbnailUrl: string;
  uploadedAt: string;
}

export interface InspectorEdit {
  field: string;
  before: string;
  after: string;
  editedAt: string;
}

export type InspectionLifecycleStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "ACTION_REQUIRED"
  | "REINSPECTION_REQUESTED";


export interface Inspection {
  _id: string;
  inspectionId: string;
  inspectorId: string;
  supervisorId?: string;

  product: ProductInfo;

  images: ProductImage[];

  extractedData: {
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

  extractionConfidence: Record<string, number>;

  compliance: ComplianceResult;

  inspectorEdits: InspectorEdit[];

  remarks?: string;

  reportUrl?: string;
  reportGeneratedAt?: string;

  status: InspectionLifecycleStatus;

  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
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

export interface DraftInspection {
  inspectionId: string;
  images: ProductImage[];
  status: "DRAFT";
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  createdAt: string;
}

export type RolesView = UserRole[];
