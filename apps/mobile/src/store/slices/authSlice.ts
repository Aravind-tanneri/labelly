import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { API_ENDPOINTS, type AuthUser, type LoginResponse } from "@labelly/shared";
import { apiClient } from "../../services/api";
import {
  clearStoredAuth,
  hydrateAuth,
  persistAuth,
} from "../../services/storage";

export interface MobileAuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: MobileAuthState = {
  token: null,
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

function toErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const msg = (error as { message?: unknown })?.message;
    if (typeof msg === "string") return msg;
  }
  return "Login failed. Please try again.";
}

export const hydrateAuthThunk = createAsyncThunk<
  { token: string | null; user: AuthUser | null },
  void
>("auth/hydrate", async () => {
  return await hydrateAuth();
});

export const loginThunk = createAsyncThunk<
  { token: string; user: AuthUser },
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.login,
      { email, password }
    );
    const data = response.data;
    await persistAuth(data.token, data.user);
    return { token: data.token, user: data.user };
  } catch (err) {
    const message = toErrorMessage(err);
    return rejectWithValue(message);
  }
});

export const logoutThunk = createAsyncThunk<void, void>(
  "auth/logout",
  async () => {
    try {
      await apiClient.post(API_ENDPOINTS.logout);
    } catch {
      // Ignore logout endpoint failures; local session is cleared regardless.
    }
    await clearStoredAuth();
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Hydrate
    builder
      .addCase(hydrateAuthThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(hydrateAuthThunk.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.token;
        state.loading = false;
      })
      .addCase(hydrateAuthThunk.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });

    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed.";
      });

    // Logout
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
