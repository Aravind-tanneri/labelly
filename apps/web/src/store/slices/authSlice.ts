import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { USER_ROLES, type AuthUser } from "@labelly/shared";
import {
  apiLogin,
  apiLogout,
  clearSession,
  readStoredUser,
  saveSession,
  toErrorMessage,
  type LoginCredentials,
} from "../../services/api";

export interface AuthSliceState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isSupervisor: boolean;
}

const initialUser = readStoredUser();

const initialState: AuthSliceState = {
  user: initialUser,
  loading: false,
  error: null,
  isSupervisor: initialUser?.role === USER_ROLES.SUPERVISOR,
};

export const loginThunk = createAsyncThunk<
  AuthUser,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await apiLogin(credentials);

    if (response.user.role !== USER_ROLES.SUPERVISOR) {
      throw new Error(
        "This dashboard is restricted to supervisor accounts. Please sign in with a supervisor account."
      );
    }

    saveSession(response.token, response.user);
    return response.user;
  } catch (err) {
    return rejectWithValue(toErrorMessage(err, "Login failed. Please check credentials."));
  }
});

export const logoutThunk = createAsyncThunk<void, void>(
  "auth/logout",
  async () => {
    try {
      await apiLogout();
    } finally {
      clearSession();
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    syncSession: (state) => {
      const stored = readStoredUser();
      state.user = stored;
      state.isSupervisor = stored?.role === USER_ROLES.SUPERVISOR;
      state.error = null;
    },
    sessionExpired: (state) => {
      clearSession();
      state.user = null;
      state.isSupervisor = false;
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false;
        state.user = action.payload;
        state.isSupervisor = action.payload.role === USER_ROLES.SUPERVISOR;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      });

    // Logout
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isSupervisor = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isSupervisor = false;
        state.error = null;
      });
  },
});

export const { syncSession, sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
