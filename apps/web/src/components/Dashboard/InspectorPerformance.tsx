import type { InspectorPerformance as InspectorPerformanceType } from "@labelly/shared";
import { Icon } from "../Common/Icon";
import { initialsOf } from "../../utils";

interface InspectorPerformanceProps {
  inspectors: InspectorPerformanceType["inspectors"];
  loading: boolean;
}

export function InspectorPerformance({
  inspectors,
  loading,
}: InspectorPerformanceProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Inspector Performance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspection volume and compliance distribution per field officer.
          </p>
        </div>
        <span className="text-slate-400 p-1">
          <Icon name="users" size={18} />
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          <div className="h-12 w-full rounded-lg animate-shimmer" />
          <div className="h-12 w-full rounded-lg animate-shimmer" />
          <div className="h-12 w-full rounded-lg animate-shimmer" />
        </div>
      ) : inspectors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
          <Icon name="users" size={20} />
          <p className="text-xs">No inspector activity recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {inspectors.map((inspector) => (
            <div key={inspector.id} className="flex items-center justify-between gap-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#5e6ad2] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {initialsOf(inspector.name)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">{inspector.name}</div>
                  <div className="text-[0.7rem] text-slate-500">
                    {inspector.inspectionCount}{" "}
                    {inspector.inspectionCount === 1 ? "inspection" : "inspections"}
                  </div>
                </div>
              </div>

              <div className="w-36">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Compliance Rate</span>
                  <span className="font-bold text-slate-800">{inspector.complianceRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      inspector.complianceRate >= 80
                        ? "bg-emerald-500"
                        : inspector.complianceRate >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, inspector.complianceRate))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
