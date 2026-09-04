import type { User, UserRole } from "../types/user";
import { USER_ROLES } from "../constants/roles";
import {
  isNonEmptyString,
  isValidEmail,
  isObject,
} from "../utils/validators";
import type { ValidationResult } from "./inspection";

export interface LoginInput {
  email?: string;
  password?: string;
}

export interface CreateUserInput {
  name?: string;
  email?: string;
  employeeId?: string;
  password?: string;
  role?: UserRole;
  department?: string;
}

export const userValidation = {
  login(input: LoginInput): ValidationResult {
    const errors: Record<string, string> = {};
    if (!isValidEmail(input.email ?? "")) {
      errors.email = "A valid email is required.";
    }
    if (!isNonEmptyString(input.password)) {
      errors.password = "Password is required.";
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },

  create(input: CreateUserInput): ValidationResult {
    const errors: Record<string, string> = {};
    if (!isNonEmptyString(input.name)) {
      errors.name = "Name is required.";
    }
    if (!isValidEmail(input.email ?? "")) {
      errors.email = "A valid email is required.";
    }
    if (!isNonEmptyString(input.password) || (input.password ?? "").length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    if (!isRole(input.role)) {
      errors.role = "Role must be INSPECTOR or SUPERVISOR.";
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },
};

export function isRole(value: unknown): value is UserRole {
  return (
    value === USER_ROLES.INSPECTOR ||
    value === USER_ROLES.SUPERVISOR
  );
}

export function toUserPublic(user: User) {
  if (!isObject(user)) return user;
  const { passwordHash: _passwordHash, ...publicUser } = user as User & {
    passwordHash?: string;
  };
  return publicUser;
}
