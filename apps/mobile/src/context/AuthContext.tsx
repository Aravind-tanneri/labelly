import type { ReactNode } from "react";
import { useAuth, type AuthState } from "../hooks/useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAppAuth(): AuthState {
  return useAuth();
}

export type { AuthState };