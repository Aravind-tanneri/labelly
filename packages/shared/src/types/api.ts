import type { ComplianceResult, ViolationBreakdown } from "./compliance";

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export interface DashboardStats {
  totalInspections: number;
  compliant: number;
  nonCompliant: number;
  highSeverity: number;
}

export interface DashboardViolations {
  violations: ViolationBreakdown[];
}

export interface InspectorPerformance {
  inspectors: {
    id: string;
    name: string;
    inspectionCount: number;
    complianceRate: number;
  }[];
}

export interface ReportInfo {
  reportId: string;
  reportUrl: string;
  inspectionId: string;
  generatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface SuccessMessage {
  message: string;
}

export interface RecheckResponse {
  compliance: ComplianceResult;
}
