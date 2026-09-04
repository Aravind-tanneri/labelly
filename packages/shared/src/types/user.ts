export type UserRole = "INSPECTOR" | "SUPERVISOR";

export interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  role: UserRole;
  department: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  role: UserRole;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}
