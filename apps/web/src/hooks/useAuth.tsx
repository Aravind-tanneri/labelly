import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import type { AuthUser } from "@labelly/shared";
import { useAppDispatch, useAppSelector } from "../store";
import {
  loginThunk,
  logoutThunk,
  sessionExpired,
  syncSession,
} from "../store/slices/authSlice";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isSupervisor: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initial sync
    dispatch(syncSession());

    const handleUnauthorized = () => {
      dispatch(sessionExpired());
    };

    window.addEventListener("labelly:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("labelly:unauthorized", handleUnauthorized);
    };
  }, [dispatch]);

  return <>{children}</>;
}

export function useAuth(): AuthContextValue {
  const dispatch = useAppDispatch();
  const { user, loading, isSupervisor, error } = useAppSelector(
    (state) => state.auth
  );

  const login = useCallback(
    async (email: string, password: string) => {
      await dispatch(loginThunk({ email, password })).unwrap();
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutThunk()).unwrap();
  }, [dispatch]);

  return useMemo(
    () => ({
      user,
      loading,
      isSupervisor,
      error,
      login,
      logout,
    }),
    [user, loading, isSupervisor, error, login, logout]
  );
}
