import { useCallback } from "react";
import type { AuthUser } from "@labelly/shared";
import { useAppDispatch, useAppSelector } from "../store";
import {
  hydrateAuthThunk,
  loginThunk,
  logoutThunk,
} from "../store/slices/authSlice";

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const dispatch = useAppDispatch();
  const { token, user, loading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const result = await dispatch(
        loginThunk({ email, password })
      ).unwrap();
      return result.user;
    },
    [dispatch]
  );

  const logout = useCallback(async (): Promise<void> => {
    await dispatch(logoutThunk()).unwrap();
  }, [dispatch]);

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
  };
}

export { hydrateAuthThunk };