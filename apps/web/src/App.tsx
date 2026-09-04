import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { AppLayout } from "./components/Layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { InspectionsPage } from "./pages/InspectionsPage";
import { LoginPage } from "./pages/LoginPage";
import { DesktopOnlyNotice } from "./components/Common/DesktopOnlyNotice";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isSupervisor, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500 bg-slate-50">
        <div className="w-9 h-9 border-3 border-slate-200 border-t-[#5e6ad2] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Verifying supervisor credentials...</p>
      </div>
    );
  }

  if (!user || !isSupervisor) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function App() {
  return (
    <>
      <DesktopOnlyNotice />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="inspections" element={<InspectionsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
