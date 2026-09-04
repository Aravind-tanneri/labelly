import { useCallback, useEffect } from "react";
import type {
  DashboardStats,
  InspectionListItem,
  InspectorPerformance,
  ViolationBreakdown,
} from "@labelly/shared";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchDashboardDataThunk } from "../store/slices/dashboardSlice";

export interface DashboardState {
  stats: DashboardStats | null;
  violations: ViolationBreakdown[];
  inspectors: InspectorPerformance["inspectors"];
  recent: InspectionListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function complianceRate(stats: DashboardStats | null): number {
  if (!stats || stats.totalInspections <= 0) return 0;
  return Math.round((stats.compliant / stats.totalInspections) * 100);
}

export function useDashboard(): DashboardState {
  const dispatch = useAppDispatch();
  const { stats, violations, inspectors, recent, loading, error } =
    useAppSelector((state) => state.dashboard);

  const refresh = useCallback(() => {
    dispatch(fetchDashboardDataThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!stats && loading) {
      dispatch(fetchDashboardDataThunk());
    }
  }, [dispatch, stats, loading]);

  return {
    stats,
    violations,
    inspectors,
    recent,
    loading,
    error,
    refresh,
  };
}