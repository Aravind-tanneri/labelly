import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  DashboardStats,
  InspectionListItem,
  InspectorPerformance,
  ViolationBreakdown,
} from "@labelly/shared";
import {
  fetchDashboardStats,
  fetchInspectorPerformance,
  fetchInspections,
  fetchTopViolations,
  toErrorMessage,
} from "../../services/api";

export interface DashboardSliceState {
  stats: DashboardStats | null;
  violations: ViolationBreakdown[];
  inspectors: InspectorPerformance["inspectors"];
  recent: InspectionListItem[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardSliceState = {
  stats: null,
  violations: [],
  inspectors: [],
  recent: [],
  loading: true,
  error: null,
};

export interface DashboardDataPayload {
  stats: DashboardStats;
  violations: ViolationBreakdown[];
  inspectors: InspectorPerformance["inspectors"];
  recent: InspectionListItem[];
}

export const fetchDashboardDataThunk = createAsyncThunk<
  DashboardDataPayload,
  void,
  { rejectValue: string }
>("dashboard/fetchData", async (_, { rejectWithValue }) => {
  try {
    const [statsRes, violationsRes, inspectorsRes, listRes] = await Promise.all([
      fetchDashboardStats(),
      fetchTopViolations().catch(() => [] as ViolationBreakdown[]),
      fetchInspectorPerformance().catch(() => ({ inspectors: [] })),
      fetchInspections({ page: 1, limit: 5 }),
    ]);

    return {
      stats: statsRes,
      violations: violationsRes,
      inspectors: inspectorsRes.inspectors || [],
      recent: listRes.inspections,
    };
  } catch (err) {
    return rejectWithValue(toErrorMessage(err, "Failed to load dashboard data."));
  }
});

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardDataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDashboardDataThunk.fulfilled,
        (state, action: PayloadAction<DashboardDataPayload>) => {
          state.loading = false;
          state.stats = action.payload.stats;
          state.violations = action.payload.violations;
          state.inspectors = action.payload.inspectors;
          state.recent = action.payload.recent;
          state.error = null;
        }
      )
      .addCase(fetchDashboardDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load dashboard.";
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
