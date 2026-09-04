import { useState } from "react";

export function DesktopOnlyNotice() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="lg:hidden fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 sm:p-7 text-center relative animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        {/* Icon & Badge */}
        <div className="flex justify-center mb-4 mt-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner text-[#5e6ad2] relative">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              !
            </span>
          </div>
        </div>

        {/* Heading */}
        <span className="inline-block mx-auto text-[10px] font-bold uppercase tracking-widest text-[#5e6ad2] bg-indigo-50 px-2.5 py-1 rounded-full mb-2">
          Supervisor Portal
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          Please Open on Desktop
        </h2>
        <p className="text-xs font-medium text-rose-600 mt-1">
          Not Available on Mobile Screen
        </p>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed mt-3">
          The <strong>Labelly Supervisor Oversight Portal</strong> is optimized
          exclusively for desktop displays to review high-resolution package label
          inspections, legal compliance checklists, and statutory notice compounding matrices.
        </p>

        {/* Recommendation Box */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left flex items-start gap-2.5">
          <svg
            className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <div className="text-[11px] text-slate-700 leading-normal">
            <strong>Using a phone or tablet?</strong>
            <br />
            For field officers conducting on-site scans, please launch the{" "}
            <span className="text-emerald-700 font-semibold">Labelly Mobile App</span>.
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          <div className="text-[11px] text-slate-400">
            Recommended viewport width: 1024px or higher
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="mt-1 text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Dismiss & preview on mobile anyway →
          </button>
        </div>
      </div>
    </div>
  );
}
