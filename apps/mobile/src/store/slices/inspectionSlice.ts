import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  API_ENDPOINTS,
  type ComplianceResult,
  type Inspection,
  type InspectionListItem,
} from "@labelly/shared";
import { apiClient } from "../../services/api";

export interface MobileInspectionState {
  currentInspection: Inspection | null;
  loading: boolean;
  error: string | null;
  myInspections: InspectionListItem[];
  myInspectionsLoading: boolean;
  myInspectionsError: string | null;
}

const initialState: MobileInspectionState = {
  currentInspection: null,
  loading: false,
  error: null,
  myInspections: [],
  myInspectionsLoading: false,
  myInspectionsError: null,
};

function toErrorMessage(error: unknown, fallback = "Operation failed."): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const msg = (error as { message?: unknown })?.message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

export const fetchInspectionThunk = createAsyncThunk<
  Inspection,
  string,
  { rejectValue: string }
>("inspection/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ inspection: Inspection }>(
      API_ENDPOINTS.inspectionById(id)
    );
    return response.data.inspection;
  } catch (err) {
    return rejectWithValue(toErrorMessage(err, "Failed to load inspection."));
  }
});

export const fetchMyInspectionsThunk = createAsyncThunk<
  InspectionListItem[],
  void,
  { rejectValue: string }
>("inspection/fetchMyInspections", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ inspections: InspectionListItem[] }>(
      API_ENDPOINTS.myInspections
    );
    return Array.isArray(response.data.inspections)
      ? response.data.inspections
      : [];
  } catch (err) {
    return rejectWithValue(
      toErrorMessage(err, "Failed to load inspections list.")
    );
  }
});

export interface UpdateInspectionPayload {
  id: string;
  payload: {
    extractedData?: Inspection["extractedData"];
    remarks?: string;
    product?: { name?: string; category?: string; brand?: string };
  };
}

export const updateInspectionThunk = createAsyncThunk<
  { inspection: Inspection; updatedCompliance: ComplianceResult },
  UpdateInspectionPayload,
  { rejectValue: string }
>("inspection/updateData", async ({ id, payload }, { rejectWithValue }) => {
  try {
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
  } catch (err) {
    return rejectWithValue(toErrorMessage(err, "Failed to update inspection."));
  }
});

export const recheckInspectionThunk = createAsyncThunk<
  ComplianceResult,
  string,
  { rejectValue: string }
>("inspection/recheck", async (id, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ compliance: ComplianceResult }>(
      API_ENDPOINTS.recheck(id)
    );
    return response.data.compliance;
  } catch (err) {
    return rejectWithValue(toErrorMessage(err, "Failed to recheck compliance."));
  }
});

export const deleteInspectionThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("inspection/delete", async (id, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/api/inspections/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(toErrorMessage(err, "Failed to delete inspection."));
  }
});

export const inspectionSlice = createSlice({
  name: "inspection",
  initialState,
  reducers: {
    setCurrentInspection: (
      state,
      action: PayloadAction<Inspection | null>
    ) => {
      state.currentInspection = action.payload;
    },
    clearInspectionError: (state) => {
      state.error = null;
      state.myInspectionsError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Inspection by ID
    builder
      .addCase(fetchInspectionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInspectionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInspection = action.payload;
        state.error = null;
      })
      .addCase(fetchInspectionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load inspection.";
      });

    // Fetch My Inspections
    builder
      .addCase(fetchMyInspectionsThunk.pending, (state) => {
        state.myInspectionsLoading = true;
        state.myInspectionsError = null;
      })
      .addCase(fetchMyInspectionsThunk.fulfilled, (state, action) => {
        state.myInspectionsLoading = false;
        state.myInspections = action.payload;
        state.myInspectionsError = null;
      })
      .addCase(fetchMyInspectionsThunk.rejected, (state, action) => {
        state.myInspectionsLoading = false;
        state.myInspectionsError =
          action.payload || "Failed to load inspections.";
      });

    // Update Inspection
    builder
      .addCase(updateInspectionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInspectionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInspection = {
          ...action.payload.inspection,
          compliance: action.payload.updatedCompliance,
        };
        state.error = null;
      })
      .addCase(updateInspectionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update inspection.";
      });

    // Recheck
    builder.addCase(recheckInspectionThunk.fulfilled, (state, action) => {
      if (state.currentInspection) {
        state.currentInspection.compliance = action.payload;
      }
    });

    // Delete
    builder.addCase(deleteInspectionThunk.fulfilled, (state, action) => {
      state.myInspections = state.myInspections.filter(
        (i) => i._id !== action.payload
      );
      if (state.currentInspection?._id === action.payload) {
        state.currentInspection = null;
      }
    });
  },
});

export const { setCurrentInspection, clearInspectionError } =
  inspectionSlice.actions;
export default inspectionSlice.reducer;
