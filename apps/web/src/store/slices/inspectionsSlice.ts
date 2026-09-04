import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ComplianceStatus,
  InspectionLifecycleStatus,
  InspectionListItem,
  InspectionListQuery,
  PaginatedInspections,
} from "@labelly/shared";
import { fetchInspections, toErrorMessage } from "../../services/api";

export interface InspectionsSliceState {
  inspections: InspectionListItem[];
  total: number;
  page: number;
  limit: number;
  searchTerm: string;
  statusFilter: ComplianceStatus | "ALL";
  lifecycleFilter: InspectionLifecycleStatus | "ALL";
  dateFilter: string;
  startDateFilter: string;
  endDateFilter: string;
  selectedInspection: InspectionListItem | null;
  loading: boolean;
  error: string | null;
}

const initialState: InspectionsSliceState = {
  inspections: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: "",
  statusFilter: "ALL",
  lifecycleFilter: "ALL",
  dateFilter: "",
  startDateFilter: "",
  endDateFilter: "",
  selectedInspection: null,
  loading: false,
  error: null,
};

export const fetchInspectionsListThunk = createAsyncThunk<
  PaginatedInspections,
  InspectionListQuery | undefined,
  { state: { inspections: InspectionsSliceState }; rejectValue: string }
>("inspections/fetchList", async (customQuery, { getState, rejectWithValue }) => {
  try {
    const state = getState().inspections;
    const query: InspectionListQuery = customQuery ?? {
      page: state.page,
      limit: state.limit,
      status:
        state.lifecycleFilter !== "ALL" ? state.lifecycleFilter : undefined,
      complianceStatus:
        state.statusFilter !== "ALL" ? state.statusFilter : undefined,
      product: state.searchTerm.trim() || undefined,
      date: state.dateFilter || undefined,
      startDate: state.startDateFilter || undefined,
      endDate: state.endDateFilter || undefined,
    };

    const res = await fetchInspections(query);
    return res;
  } catch (err) {
    return rejectWithValue(toErrorMessage(err, "Failed to load inspections list."));
  }
});

export const inspectionsSlice = createSlice({
  name: "inspections",
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.page = 1;
    },
    setStatusFilter: (state, action: PayloadAction<ComplianceStatus | "ALL">) => {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setLifecycleFilter: (
      state,
      action: PayloadAction<InspectionLifecycleStatus | "ALL">
    ) => {
      state.lifecycleFilter = action.payload;
      state.page = 1;
    },
    setDateFilter: (state, action: PayloadAction<string>) => {
      state.dateFilter = action.payload;
      state.page = 1;
    },
    setStartDateFilter: (state, action: PayloadAction<string>) => {
      state.startDateFilter = action.payload;
      state.page = 1;
    },
    setEndDateFilter: (state, action: PayloadAction<string>) => {
      state.endDateFilter = action.payload;
      state.page = 1;
    },
    setDateRange: (
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>
    ) => {
      state.startDateFilter = action.payload.startDate;
      state.endDateFilter = action.payload.endDate;
      state.page = 1;
    },
    resetFilters: (state) => {
      state.searchTerm = "";
      state.statusFilter = "ALL";
      state.lifecycleFilter = "ALL";
      state.dateFilter = "";
      state.startDateFilter = "";
      state.endDateFilter = "";
      state.page = 1;
    },
    setSelectedInspection: (
      state,
      action: PayloadAction<InspectionListItem | null>
    ) => {
      state.selectedInspection = action.payload;
    },
    clearInspectionsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInspectionsListThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInspectionsListThunk.fulfilled,
        (state, action: PayloadAction<PaginatedInspections>) => {
          state.loading = false;
          state.inspections = action.payload.inspections;
          state.total = action.payload.total;
          state.error = null;
        }
      )
      .addCase(fetchInspectionsListThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load inspections.";
      });
  },
});

export const {
  setPage,
  setSearchTerm,
  setStatusFilter,
  setLifecycleFilter,
  setDateFilter,
  setStartDateFilter,
  setEndDateFilter,
  setDateRange,
  resetFilters,
  setSelectedInspection,
  clearInspectionsError,
} = inspectionsSlice.actions;

export default inspectionsSlice.reducer;
