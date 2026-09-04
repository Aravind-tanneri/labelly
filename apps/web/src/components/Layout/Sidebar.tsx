import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "../Common/Icon";
import { useSidebar } from "../../context/SidebarContext";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "grid", end: true },
  { to: "/inspections", label: "Inspections", icon: "list", end: false },
];

export function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200 flex flex-col z-40 transition-all duration-200 ease-in-out ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Sidebar Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-200 transition-all ${
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="w-9 h-9 bg-[#5e6ad2] text-white font-extrabold text-lg flex items-center justify-center rounded-lg shadow-sm hover:bg-[#4d58bf] transition-colors cursor-pointer"
          >
            L
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span
                className="w-8 h-8 bg-[#5e6ad2] text-white font-extrabold text-lg flex items-center justify-center rounded-lg shadow-sm shrink-0"
                aria-hidden="true"
              >
                L
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-800 whitespace-nowrap">
                Labelly
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <Icon name="chevron-left" size={17} />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 flex flex-col gap-1.5 transition-all ${
          isCollapsed ? "p-2 items-center" : "p-3"
        }`}
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }: { isActive: boolean }) =>
              isCollapsed
                ? `w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#eef0fb] text-[#5e6ad2]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                : `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#eef0fb] text-[#5e6ad2] font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
            }
          >
            <Icon name={item.icon} size={isCollapsed ? 19 : 17} />
            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Toggle Bar */}
      {isCollapsed ? (
        <div className="p-2 border-t border-slate-200 bg-slate-50 flex items-center justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            aria-label="Expand sidebar"
          >
            <Icon name="chevron-right" size={17} />
          </button>
        </div>
      ) : (
        <div className="p-3.5 border-t border-slate-200 flex flex-col gap-2.5 bg-slate-50">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Legal Metrology
            </span>
            <span className="text-[11px] text-slate-500">
              Supervisor oversight · SIH 2026
            </span>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            title="Collapse sidebar"
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer w-full"
          >
            <Icon name="chevron-left" size={14} />
            <span>Collapse sidebar</span>
          </button>
        </div>
      )}
    </aside>
  );
}