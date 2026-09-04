import type { ViolationBreakdown } from "@labelly/shared";
import { Icon } from "../Common/Icon";
import { labelForField } from "../../utils";

interface TopViolationsProps {
  violations: ViolationBreakdown[];
  loading: boolean;
}

export function TopViolations({ violations, loading }: TopViolationsProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Compliance Issues</h2>
          <p className="text-xs text-slate-500 mt-0.5">Most common declarations flagged by inspectors.</p>
        </div>
        <span className="text-slate-400 p-1">
          <Icon name="alert" size={18} />
        </span>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2.5">
          <div className="h-9 w-full rounded-lg animate-shimmer" />
          <div className="h-9 w-full rounded-lg animate-shimmer" />
          <div className="h-9 w-full rounded-lg animate-shimmer" />
        </div>
      ) : violations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
          <Icon name="check" size={20} />
          <p className="text-xs">No recurring compliance issues.</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-2.5 list-none p-0 m-0">
          {violations.map((v) => (
            <li key={v.title} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="w-1 h-5 bg-rose-500 rounded-full shrink-0" aria-hidden="true" />
              <span className="flex-1 text-xs font-semibold text-slate-800">{labelForField(v.title)}</span>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2 py-0.5 rounded-full">{v.count}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}