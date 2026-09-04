import type { Request } from "express";

export * from "./compliance";
export * from "./inspection";
export * from "./gemini";

// ── Users / Auth ─────────────────────────────────────────

export type UserRole = "INSPECTOR" | "SUPERVISOR";

export interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  passwordHash: string;
  role: UserRole;
  department: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  role: UserRole;
}

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ── API shapes ───────────────────────────────────────────

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

export interface SuccessMessage {
  message: string;
}

export type AuditAction =
  | "INSPECTION_CREATED"
  | "IMAGE_UPLOADED"
  | "EXTRACTION_EDITED"
  | "COMPLIANCE_REVIEWED"
  | "REPORT_GENERATED";

export interface RecheckResponse {
  compliance: NonNullable<import("./inspection").Inspection["compliance"]>;
}

// ── Express request augmentation ─────────────────────────

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  inspection?: import("./inspection").Inspection;
}