/**
 * Centralized API endpoint definitions.
 * Both mobile and web use these so paths never drift between clients.
 */

const AUTH = "/api/auth";
const INSPECTIONS = "/api/inspections";
const REPORTS = "/api/reports";
const DASHBOARD = "/api/dashboard";

export const API_ENDPOINTS = {
  // Auth
  login: `${AUTH}/login`,
  logout: `${AUTH}/logout`,

  // Inspections
  createInspection: INSPECTIONS,
  listInspections: INSPECTIONS,
  myInspections: `${INSPECTIONS}/mine`,

  // Inspection-scoped
  inspectionById: (id: string) => `${INSPECTIONS}/${id}`,
  uploadImage: (id: string) => `${INSPECTIONS}/${id}/images`,
  analyze: (id: string) => `${INSPECTIONS}/${id}/analyze`,
  updateInspection: (id: string) => `${INSPECTIONS}/${id}`,
  recheck: (id: string) => `${INSPECTIONS}/${id}/recheck`,

  // Reports
  generateReport: (id: string) => `${INSPECTIONS}/${id}/report`,
  fetchReport: (id: string) => `${INSPECTIONS}/${id}/report`,
  listReports: REPORTS,

  // Dashboard
  stats: `${DASHBOARD}/stats`,
  violations: `${DASHBOARD}/violations`,
  inspectorPerformance: `${DASHBOARD}/inspector-performance`,
} as const;

export function buildEndpoint(
  endpoint: string,
  params?: Record<string, string | number>
): string {
  if (!params) return endpoint;
  let url = endpoint;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, encodeURIComponent(String(value)));
  }
  return url;
}
