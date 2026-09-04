import type { InspectionListItem } from "@labelly/shared";
import { formatDateTime } from "@labelly/shared";
import { Icon } from "./Icon";
import { ComplianceBadge, LifecycleBadge } from "./Badge";

interface InspectionTableProps {
  inspections: InspectionListItem[];
  loading?: boolean;
  onRowClick?: (inspection: InspectionListItem) => void;
  emptyMessage?: string;
}

const TABLE_HEADERS = [
  "Inspection ID",
  "Product",
  "Compliance",
  "Violations",
  "Order / Action",
  "Inspector",
  "Date",
] as const;

export function InspectionTable({
  inspections,
  loading = false,
  onRowClick,
  emptyMessage = "No inspections found.",
}: InspectionTableProps) {
  if (loading) {
    return <TableSkeleton />;
  }

  if (inspections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-5 text-slate-500 gap-2">
        <Icon name="search" size={20} />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {TABLE_HEADERS.map((header) => (
              <th
                key={header}
                className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-4 py-3"
              >
                {header}
              </th>
            ))}
            <th className="bg-slate-50 px-4 py-3" aria-label="Open" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {inspections.map((item) => (
            <tr
              key={item._id}
              className={`transition-colors duration-100 ${
                onRowClick
                  ? "cursor-pointer hover:bg-slate-50/80 focus:bg-slate-50 focus:outline-none"
                  : ""
              }`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === "Enter") onRowClick(item);
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "link" : undefined}
              title={onRowClick ? "Open inspection details" : undefined}
            >
              <td className="px-4 py-3.5 align-middle">
                <span className="font-mono text-xs tracking-tight text-slate-700">
                  {item.inspectionId || "—"}
                </span>
              </td>
              <td className="px-4 py-3.5 align-middle">
                <span className="flex flex-col">
                  <span className="font-semibold text-slate-800">
                    {item.product?.name || "Untitled product"}
                  </span>
                  {item.product?.brand && (
                    <span className="text-xs text-slate-500">
                      {item.product.brand}
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3.5 align-middle">
                <ComplianceBadge status={item.complianceStatus} />
              </td>
              <td className="px-4 py-3.5 align-middle">
                <ViolationCount count={item.violations} />
              </td>
              <td className="px-4 py-3.5 align-middle">
                <LifecycleBadge status={item.status} />
              </td>
              <td className="px-4 py-3.5 align-middle text-slate-600">
                {item.inspectorName || "—"}
              </td>
              <td className="px-4 py-3.5 align-middle text-slate-500 text-xs whitespace-nowrap">
                {formatDateTime(item.createdAt)}
              </td>
              <td className="px-4 py-3.5 align-middle text-slate-400 text-right pr-4">
                <Icon name="chevron-right" size={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ViolationCount({ count }: { count: number }) {
  if (count <= 0) return <span className="text-emerald-600 font-semibold">0</span>;
  return <span className="text-red-600 font-bold">{count}</span>;
}

function TableSkeleton() {
  const [leadingCells, trailingCells] = [6, 1];
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {TABLE_HEADERS.map((header) => (
              <th
                key={header}
                className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider px-4 py-3"
              >
                {header}
              </th>
            ))}
            <th className="bg-slate-50 px-4 py-3" aria-label="Open" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: 5 }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: leadingCells }, (_, col) => (
                <td key={col} className="px-4 py-3.5 align-middle">
                  <span className="block h-3.5 w-full rounded-sm animate-shimmer" />
                </td>
              ))}
              {Array.from({ length: trailingCells }, (_, col) => (
                <td key={`action-${col}`} className="px-4 py-3.5 align-middle">
                  <span className="block w-4 h-4 rounded-full animate-shimmer ml-auto" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}