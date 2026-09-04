import type { InspectionListItem } from "@labelly/shared";
import { Link } from "react-router-dom";
import { Icon } from "../Common/Icon";
import { InspectionTable } from "../Common/InspectionTable";

interface RecentInspectionsProps {
  inspections: InspectionListItem[];
  loading: boolean;
  error: string | null;
  onSelect?: (inspection: InspectionListItem) => void;
}

export function RecentInspections({
  inspections,
  loading,
  error,
  onSelect,
}: RecentInspectionsProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Recent Inspections</h2>
          <p className="text-xs text-slate-500 mt-0.5">Latest activity across your inspectors.</p>
        </div>
        <Link
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          to="/inspections"
        >
          View all
          <Icon name="arrow-right" size={14} />
        </Link>
      </div>
      {error ? (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </div>
      ) : (
        <InspectionTable inspections={inspections} loading={loading} onRowClick={onSelect} />
      )}
    </section>
  );
}