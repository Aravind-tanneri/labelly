import { useState } from "react";
import toast from "react-hot-toast";
import type { InspectionListItem } from "@labelly/shared";
import { useDashboard } from "../hooks/useDashboard";
import { KPICards } from "../components/Dashboard/KPICards";
import { TopViolations } from "../components/Dashboard/TopViolations";
import { InspectorPerformance } from "../components/Dashboard/InspectorPerformance";
import { RecentInspections } from "../components/Dashboard/RecentInspections";
import { InspectionDetailModal } from "../components/Inspections/InspectionDetailModal";
import { Icon } from "../components/Common/Icon";

export function DashboardPage() {
  const { stats, violations, inspectors, recent, loading, error, refresh } =
    useDashboard();
  const [selectedInspection, setSelectedInspection] =
    useState<InspectionListItem | null>(null);

  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success("Dashboard metrics refreshed.");
    } catch {
      toast.error("Failed to refresh dashboard data.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Compliance Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time Legal Metrology enforcement metrics, recurring non-compliance trends, and field officer activity.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh dashboard data"
          >
            <Icon name="refresh" size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <KPICards stats={stats} loading={loading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Left/Main Column: Recent Inspections */}
        <div className="flex flex-col gap-6">
          <RecentInspections
            inspections={recent}
            loading={loading}
            error={error}
            onSelect={setSelectedInspection}
          />
        </div>

        {/* Right Column: Violation Breakdown & Inspector Performance */}
        <div className="flex flex-col gap-6">
          <TopViolations violations={violations} loading={loading} />
          <InspectorPerformance inspectors={inspectors} loading={loading} />
        </div>
      </div>

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspectionSummary={selectedInspection}
          onClose={() => setSelectedInspection(null)}
          onInspectionUpdated={() => {
            refresh();
          }}
        />
      )}
    </div>
  );
}
