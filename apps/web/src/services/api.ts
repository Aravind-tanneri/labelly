/**
 * Labelly web API module.
 *
 * Thin typed wrappers around the shared axios client (@labelly/shared).
 * Token is persisted in localStorage so the session survives reloads.
 * All errors are normalized to human-readable messages by the shared client.
 */
import {
  API_ENDPOINTS,
  createApiClient,
  type AuthUser,
  type DashboardStats,
  type DashboardViolations,
  type Inspection,
  type InspectionListQuery,
  type InspectorPerformance,
  type LoginResponse,
  type PaginatedInspections,
  type TokenStore,
  type ViolationBreakdown,
} from "@labelly/shared";

export const TOKEN_STORAGE_KEY = "labelly.token";
export const USER_STORAGE_KEY = "labelly.user";

export const DEFAULT_API_URL = "http://localhost:5000";

export function resolveApiUrl(): string {
  // Vite exposes both VITE_ and REACT_APP_ prefixed variables.
  // Fall back to the local server so a demo works out of the box.
  return (
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    DEFAULT_API_URL
  );
}

const browserTokenStore: TokenStore = {
  getToken: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  setToken: (token: string | null) => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },
  clear: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
};

export const api = createApiClient({
  store: browserTokenStore,
  baseURL: resolveApiUrl(),
  onUnauthorized: () => {
    clearSession();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("labelly:unauthorized"));
    }
  },
});

// ── Session persistence ────────────────────────────────────────

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function readStoredUser(): AuthUser | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed?.id && parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

// ── Error handling ─────────────────────────────────────────────

export function toErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object") {
    if (
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string" &&
      (err as { message: string }).message
    ) {
      return (err as { message: string }).message;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// ── Auth ───────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function apiLogin(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(
    API_ENDPOINTS.login,
    credentials
  );
  return data;
}

export async function apiLogout(): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.logout);
  } catch {
    // Logout is best-effort on the server; the local session is cleared regardless.
  }
}

// ── Dashboard ──────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>(API_ENDPOINTS.stats);
  return data;
}

export async function fetchTopViolations(): Promise<ViolationBreakdown[]> {
  const { data } = await api.get<DashboardViolations>(
    API_ENDPOINTS.violations
  );
  return data.violations;
}

export async function fetchInspectorPerformance(): Promise<InspectorPerformance> {
  const { data } = await api.get<InspectorPerformance>(
    API_ENDPOINTS.inspectorPerformance
  );
  return data;
}

// ── Inspections ────────────────────────────────────────────────

export async function fetchInspections(
  query: InspectionListQuery = {}
): Promise<PaginatedInspections> {
  const params: Record<string, string | number> = {};
  if (query.page) params.page = query.page;
  if (query.limit) params.limit = query.limit;
  if (query.status) params.status = query.status;
  if (query.complianceStatus) params.complianceStatus = query.complianceStatus;
  if (query.product) params.product = query.product;
  if (query.date) params.date = query.date;
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate) params.endDate = query.endDate;

  const { data } = await api.get<PaginatedInspections>(
    API_ENDPOINTS.listInspections,
    { params }
  );
  return data;
}

export async function fetchInspection(id: string): Promise<Inspection> {
  const { data } = await api.get<{ inspection?: Inspection } | Inspection>(API_ENDPOINTS.inspectionById(id));
  return "inspection" in data && data.inspection ? data.inspection : (data as Inspection);
}

export async function updateInspection(
  id: string,
  payload: {
    status?: string;
    remarks?: string;
    extractedData?: Record<string, string | null>;
    product?: { name?: string; category?: string; brand?: string };
  }
): Promise<{ inspection: Inspection }> {
  const { data } = await api.patch<{ inspection: Inspection }>(
    API_ENDPOINTS.updateInspection(id),
    payload
  );
  return data;
}

export async function recheckInspection(id: string): Promise<void> {
  await api.post(API_ENDPOINTS.recheck(id));
}


// ── Reports ────────────────────────────────────────────────────

export async function fetchReportBlob(id: string): Promise<Blob> {
  const { data } = await api.get<Blob>(API_ENDPOINTS.fetchReport(id), {
    responseType: "blob",
  });
  return data;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadInspectionReport(
  id: string,
  filename?: string
): Promise<void> {
  let blob: Blob;
  try {
    blob = await fetchReportBlob(id);
  } catch {
    // If not yet generated, trigger generation first
    await api.post(API_ENDPOINTS.generateReport(id));
    blob = await fetchReportBlob(id);
  }
  const name = filename || `Inspection-${id}-Report.pdf`;
  triggerDownload(blob, name);
}