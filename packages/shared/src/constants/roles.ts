import type { UserRole } from "../types/user";

export const USER_ROLES: {
  INSPECTOR: UserRole;
  SUPERVISOR: UserRole;
} = {
  INSPECTOR: "INSPECTOR",
  SUPERVISOR: "SUPERVISOR",
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  INSPECTOR: "Inspector",
  SUPERVISOR: "Supervisor",
};

export const ALL_ROLES: UserRole[] = ["INSPECTOR", "SUPERVISOR"];

export const INSPECTOR_ROLES: UserRole[] = ["INSPECTOR", "SUPERVISOR"];
export const SUPERVISOR_ROLES: UserRole[] = ["SUPERVISOR"];
