import { useCallback, useEffect } from "react";
import {
  API_ENDPOINTS,
  type AnalyzeResponse,
  type ComplianceResult,
  type GeminiExtractionResponse,
  type Inspection,
  type InspectionListItem,
  type ReportInfo,
} from "@labelly/shared";
import { apiClient } from "../services/api";
import { useAppDispatch, useAppSelector } from "../store";
import {
  fetchInspectionThunk,
  setCurrentInspection,
} from "../store/slices/inspectionSlice";

export interface StartedInspection {
  inspectionId: string;
  extraction: GeminiExtractionResponse;
  confidence: Record<string, number>;
}

export async function createInspection(
  productCategory = "Packaged Commodity"
): Promise<string> {
  const created = await apiClient.post<{ _id: string; inspectionId: string }>(
    API_ENDPOINTS.createInspection,
    { productCategory }
  );
  return created.data._id;
}

export async function uploadInspectionImage(
  id: string,
  imageUri: string
): Promise<void> {
  const form = new FormData();
  form.append("image", {
    uri: imageUri,
    name: `label-${Date.now()}.jpg`,
    type: "image/jpeg",
  } as unknown as Blob);
  await apiClient.post(API_ENDPOINTS.uploadImage(id), form);
}

export async function uploadInspectionImages(
  id: string,
  imageUris: string[]
): Promise<void> {
  if (imageUris.length === 0) return;
  const form = new FormData();
  imageUris.forEach((uri, index) => {
    const cleanUri = uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("ph://")
      ? uri
      : `file://${uri}`;
    const filename = cleanUri.split("/").pop() || `label-${index}-${Date.now()}.jpg`;
    const extension = filename.split(".").pop()?.toLowerCase();
    const type = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";

    form.append("images", {
      uri: cleanUri,
      name: filename.includes(".") ? filename : `${filename}.jpg`,
      type,
    } as unknown as Blob);
  });
  await apiClient.post(API_ENDPOINTS.uploadImage(id), form, { timeout: 120000 });
}

export async function analyzeInspection(
  id: string
): Promise<AnalyzeResponse> {
  const analysis = await apiClient.post<AnalyzeResponse>(
    API_ENDPOINTS.analyze(id),
    {},
    { timeout: 90000 }
  );
  return analysis.data;
}

export async function startInspection(
  imageUri: string,
  productCategory = "Packaged Commodity"
): Promise<StartedInspection> {
  const id = await createInspection(productCategory);
  await uploadInspectionImage(id, imageUri);
  const analysis = await analyzeInspection(id);
  return {
    inspectionId: id,
    extraction: analysis.extraction,
    confidence: analysis.confidence,
  };
}

export async function getInspection(id: string): Promise<Inspection> {
  const response = await apiClient.get<{ inspection: Inspection }>(
    API_ENDPOINTS.inspectionById(id)
  );
  return response.data.inspection;
}

export async function listMyInspections(): Promise<InspectionListItem[]> {
  const response = await apiClient.get<{ inspections: InspectionListItem[] }>(
    API_ENDPOINTS.myInspections
  );
  return Array.isArray(response.data.inspections)
    ? response.data.inspections
    : [];
}

export interface InspectionUpdateResult {
  inspection: Inspection;
  updatedCompliance: ComplianceResult;
}

export async function updateInspectionData(
  id: string,
  payload: {
    extractedData?: Inspection["extractedData"];
    remarks?: string;
    product?: { name?: string; category?: string; brand?: string };
  }
): Promise<InspectionUpdateResult> {
  const response = await apiClient.patch<{
    inspection: Inspection;
    updatedCompliance?: ComplianceResult;
  }>(API_ENDPOINTS.updateInspection(id), payload);
  const inspection = response.data.inspection;
  return {
    inspection,
    updatedCompliance:
      response.data.updatedCompliance ?? inspection.compliance,
  };
}


export async function recheckInspection(id: string): Promise<ComplianceResult> {
  const response = await apiClient.post<{ compliance: ComplianceResult }>(
    API_ENDPOINTS.recheck(id)
  );
  return response.data.compliance;
}

export async function generateReport(id: string): Promise<ReportInfo> {
  const response = await apiClient.post<{
    reportUrl: string;
    reportId: string;
  }>(API_ENDPOINTS.generateReport(id));
  const data = response.data;
  return {
    reportId: data.reportId,
    reportUrl: data.reportUrl,
    inspectionId: id,
    generatedAt: new Date().toISOString(),
  };
}

export async function listReports(): Promise<ReportInfo[]> {
  const response = await apiClient.get<{
    reports?: ReportInfo[];
  }>(API_ENDPOINTS.listReports);
  if (Array.isArray(response.data)) {
    return response.data as ReportInfo[];
  }
  return response.data.reports ?? [];
}

export async function deleteInspection(id: string): Promise<void> {
  await apiClient.delete(`/api/inspections/${id}`);
}

export function useInspection(inspectionId?: string) {
  const dispatch = useAppDispatch();
  const { currentInspection, loading, error } = useAppSelector(
    (state) => state.inspection
  );

  const load = useCallback(async () => {
    if (!inspectionId) return;
    try {
      await dispatch(fetchInspectionThunk(inspectionId)).unwrap();
    } catch {
      // Error is caught and stored in Redux slice
    }
  }, [dispatch, inspectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setInspection = useCallback(
    (inspection: Inspection | null) => {
      dispatch(setCurrentInspection(inspection));
    },
    [dispatch]
  );

  return {
    inspection: currentInspection,
    setInspection,
    loading,
    error,
    load,
  };
}