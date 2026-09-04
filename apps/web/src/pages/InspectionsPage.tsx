import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import type { ComplianceStatus, InspectionLifecycleStatus, InspectionListItem } from "@labelly/shared";
import { useAppDispatch, useAppSelector } from "../store";
import {
  fetchInspectionsListThunk,
  resetFilters,
  setDateFilter,
  setEndDateFilter,
  setLifecycleFilter,
  setPage,
  setSearchTerm,
  setSelectedInspection,
  setStartDateFilter,
  setStatusFilter,
} from "../store/slices/inspectionsSlice";
import { InspectionTable } from "../components/Common/InspectionTable";
import { InspectionDetailModal } from "../components/Inspections/InspectionDetailModal";
import { Icon } from "../components/Common/Icon";

export function InspectionsPage() {
  const dispatch = useAppDispatch();
  const {
    inspections,
    total,
    page,
    limit,
    searchTerm,
    statusFilter,
    lifecycleFilter,
    dateFilter,
    startDateFilter,
    endDateFilter,
    selectedInspection,
    loading,
    error,
  } = useAppSelector((state) => state.inspections);

  const loadData = useCallback(() => {
    dispatch(fetchInspectionsListThunk());
  }, [dispatch]);

  const handleRefresh = async () => {
    try {
      await dispatch(fetchInspectionsListThunk()).unwrap();
      toast.success("Inspections list refreshed.");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to refresh inspections.");
    }
  };

  useEffect(() => {
    dispatch(fetchInspectionsListThunk());
  }, [dispatch, page, statusFilter, lifecycleFilter, searchTerm, dateFilter, startDateFilter, endDateFilter]);

  const handleSearchChange = (val: string) => {
    dispatch(setSearchTerm(val));
  };

  const handleStatusChange = (val: ComplianceStatus | "ALL") => {
    dispatch(setStatusFilter(val));
  };

  const handleLifecycleChange = (val: InspectionLifecycleStatus | "ALL") => {
    dispatch(setLifecycleFilter(val));
  };

  const handleStartDateChange = (val: string) => {
    dispatch(setStartDateFilter(val));
  };

  const handleEndDateChange = (val: string) => {
    dispatch(setEndDateFilter(val));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  const handleRowClick = (item: InspectionListItem) => {
    dispatch(setSelectedInspection(item));
  };

  const handleCloseModal = () => {
    dispatch(setSelectedInspection(null));
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "ALL" ||
    lifecycleFilter !== "ALL" ||
    dateFilter !== "" ||
    startDateFilter !== "" ||
    endDateFilter !== "";

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inspections Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and inspect package compliance records across all assigned field officers.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh inspections"
          >
            <Icon name="refresh" size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search by Product / ID */}
          <div className="relative flex-1 min-w-[240px]">
            <Icon
              name="search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              className="w-full pl-9 pr-8 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#5e6ad2] focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="Search product name or inspection ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
              >
                <Icon name="cross" size={14} />
              </button>
            )}
          </div>

          {/* Supervisor Action / Lifecycle Filter */}
          <div className="min-w-[190px]">
            <select
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#5e6ad2] focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer font-medium"
              value={lifecycleFilter}
              onChange={(e) =>
                handleLifecycleChange(e.target.value as InspectionLifecycleStatus | "ALL")
              }
              aria-label="Filter by supervisor action or approval status"
            >
              <option value="ALL">All Supervisor Actions</option>
              <option value="APPROVED">✓ Approved & Cleared</option>
              <option value="ACTION_REQUIRED">! Notice Issued (Sec 36)</option>
              <option value="REINSPECTION_REQUESTED">? Re-Inspection Ordered</option>
              <option value="SUBMITTED">Submitted (Pending Review)</option>
            </select>
          </div>

          {/* Compliance Status Filter */}
          <div className="min-w-[170px]">
            <select
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#5e6ad2] focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              value={statusFilter}
              onChange={(e) =>
                handleStatusChange(e.target.value as ComplianceStatus | "ALL")
              }
              aria-label="Filter by compliance status"
            >
              <option value="ALL">All Compliance Statuses</option>
              <option value="COMPLIANT">Compliant Only</option>
              <option value="NON_COMPLIANT">Non-Compliant Only</option>
              <option value="REVIEW_REQUIRED">Review Required Only</option>
            </select>
          </div>

          {/* Date Range Filters (From & To) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-[#5e6ad2] focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                From
              </span>
              <input
                type="date"
                className="text-xs text-slate-800 bg-transparent outline-none cursor-pointer"
                value={startDateFilter}
                onChange={(e) => handleStartDateChange(e.target.value)}
                aria-label="Filter start date"
              />
              {startDateFilter && (
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  onClick={() => handleStartDateChange("")}
                  title="Clear start date"
                >
                  <Icon name="cross" size={12} />
                </button>
              )}
            </div>

            <span className="text-slate-400 text-xs font-medium select-none">to</span>

            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-[#5e6ad2] focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                To
              </span>
              <input
                type="date"
                className="text-xs text-slate-800 bg-transparent outline-none cursor-pointer"
                value={endDateFilter}
                min={startDateFilter || undefined}
                onChange={(e) => handleEndDateChange(e.target.value)}
                aria-label="Filter end date"
              />
              {endDateFilter && (
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  onClick={() => handleEndDateChange("")}
                  title="Clear end date"
                >
                  <Icon name="cross" size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs"
          role="alert"
        >
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Inspections Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 text-xs text-slate-500">
          <span>
            Showing <strong>{inspections.length}</strong> of{" "}
            <strong>{total}</strong> inspections
          </span>
        </div>

        <InspectionTable
          inspections={inspections}
          loading={loading}
          onRowClick={handleRowClick}
          emptyMessage={
            hasActiveFilters
              ? "No inspections match your search criteria. Try clearing the filters."
              : "No inspections have been logged yet."
          }
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-white">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
                onClick={() => dispatch(setPage(Math.max(1, page - 1)))}
                disabled={page <= 1 || loading}
              >
                <Icon name="arrow-left" size={14} />
                Previous
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
                onClick={() => dispatch(setPage(Math.min(totalPages, page + 1)))}
                disabled={page >= totalPages || loading}
              >
                Next
                <Icon name="arrow-right" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspectionSummary={selectedInspection}
          onClose={handleCloseModal}
          onInspectionUpdated={() => {
            void loadData();
          }}
        />
      )}
    </div>
  );
}
