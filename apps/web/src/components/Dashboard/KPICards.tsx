import type { DashboardStats } from "@labelly/shared";
import { Icon, type IconName } from "../Common/Icon";
import { formatInspectionCount } from "../../utils";

interface KPICardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

interface KpiCardItem {
  label: string;
  hint: string;
  icon: IconName;
  tone: "primary" | "success" | "error" | "warning";
  value: string;
}

const TONE_ICON_STYLES: Record<KpiCardItem["tone"], string> = {
  primary: "bg-[#eef0fb] text-[#5e6ad2]",
  success: "bg-emerald-50 text-emerald-600",
  error: "bg-rose-50 text-rose-600",
  warning: "bg-amber-50 text-amber-600",
};

export function KPICards({ stats, loading }: KPICardsProps) {
  const rate =
    stats && stats.totalInspections > 0
      ? Math.round((stats.compliant / stats.totalInspections) * 100)
      : 0;

  const items: KpiCardItem[] = [
    {
      label: "Total Inspections",
      hint: "All inspections to date",
      icon: "grid",
      tone: "primary",
      value: stats ? formatInspectionCount(stats.totalInspections) : "0",
    },
    {
      label: "Non-Compliant",
      hint: "Failed compliance checks",
      icon: "alert",
      tone: "error",
      value: stats ? formatInspectionCount(stats.nonCompliant) : "0",
    },
    {
      label: "Compliance Rate",
      hint: "Compliant ÷ total inspections",
      icon: "check",
      tone: "success",
      value: `${rate}%`,
    },
    {
      label: "High-Severity Violations",
      hint: "Violations rated HIGH",
      icon: "shield",
      tone: "warning",
      value: stats ? formatInspectionCount(stats.highSeverity) : "0",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Key performance indicators">
      {items.map((item) => (
        <KpiCard key={item.label} item={item} loading={loading} />
      ))}
    </section>
  );
}

function KpiCard({
  item,
  loading,
}: {
  item: KpiCardItem;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="h-16 w-full rounded-lg animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col relative overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${TONE_ICON_STYLES[item.tone]}`}>
          <Icon name={item.icon} size={20} />
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">{item.value}</div>
      <div className="text-xs text-slate-500 mt-1.5">{item.hint}</div>
    </div>
  );
}