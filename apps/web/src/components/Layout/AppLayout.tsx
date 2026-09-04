import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";

function AppLayoutContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <Sidebar />
      <Header />
      <main
        className={`flex-1 mt-16 p-7 min-h-[calc(100vh-4rem)] transition-all duration-200 ease-in-out ${
          isCollapsed ? "ml-16" : "ml-60"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppLayoutContent />
    </SidebarProvider>
  );
}