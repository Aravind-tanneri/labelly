import toast from "react-hot-toast";
import { ROLE_LABELS } from "@labelly/shared";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../context/SidebarContext";
import { timeGreeting } from "../../utils";
import { Icon } from "../Common/Icon";

export function Header() {
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const firstName = user?.name?.split(" ")[0] || "Supervisor";

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully.");
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  return (
    <header
      className={`h-16 fixed top-0 right-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 transition-all duration-200 ease-in-out ${
        isCollapsed ? "left-16" : "left-60"
      }`}
    >
      <div className="flex items-center gap-3">
        {isCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Expand sidebar"
          >
            <Icon name="menu" size={18} />
          </button>
        )}
        <div>
          <span className="text-[1.05rem] font-bold text-slate-800 block">
            {timeGreeting()}, {firstName}
          </span>
          <span className="text-xs text-slate-500 block">
            Supervisor oversight dashboard
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full">
          <span className="w-7 h-7 rounded-full bg-[#5e6ad2] text-white flex items-center justify-center shrink-0">
            <Icon name="user" size={15} />
          </span>
          <span className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name}
            </span>
            <span className="text-[0.68rem] text-slate-500 uppercase tracking-wide font-medium">
              {user ? ROLE_LABELS[user.role] : ""}
            </span>
          </span>
        </span>
        <button
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          onClick={handleLogout}
          title="Sign out"
        >
          <Icon name="logout" size={15} />
          Sign out
        </button>
      </div>
    </header>
  );
}