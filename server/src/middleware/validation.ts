import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ApiError } from "./errorHandler";

export type Validator = (value: unknown, field: string) => string | null;

const fail = (field: string, msg: string): string => msg;

export const required = (msg?: string): Validator => (value, field) =>
  value === undefined || value === null || value === "" ? fail(field, msg ?? `${field} is required`) : null;

export const isString = (msg?: string): Validator => (value, field) =>
  value !== undefined && typeof value !== "string" ? fail(field, msg ?? `${field} must be a string`) : null;

export const maxLength = (max: number, msg?: string): Validator => (value, field) =>
  typeof value === "string" && value.length > max ? fail(field, msg ?? `${field} must be at most ${max} characters`) : null;

export const minLength = (min: number, msg?: string): Validator => (value, field) =>
  typeof value === "string" && value.length < min ? fail(field, msg ?? `${field} must be at least ${min} characters`) : null;

export const isEmail = (msg?: string): Validator => (value, field) => {
  if (typeof value !== "string") return fail(field, msg ?? `${field} must be a valid email`);
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return ok ? null : fail(field, msg ?? `${field} must be a valid email`);
};

export const isEnum = (values: readonly string[], msg?: string): Validator => (value, field) => {
  if (value === undefined || value === null) return null;
  return typeof value === "string" && values.includes(value)
    ? null
    : fail(field, msg ?? `${field} must be one of: ${values.join(", ")}`);
};

export const isObject = (msg?: string): Validator => (value, field) =>
  value !== undefined && value !== null && (typeof value !== "object" || Array.isArray(value))
    ? fail(field, msg ?? `${field} must be an object`)
    : null;

export const isBoolean = (msg?: string): Validator => (value, field) =>
  value !== undefined && value !== null && typeof value !== "boolean"
    ? fail(field, msg ?? `${field} must be a boolean`)
    : null;

/**
 * Validates the request body against a field → validators schema.
 * Uses ApiError(400, VALIDATION_ERROR, details) so the client gets per-field messages.
 */
export const validateBody = (schema: Record<string, Validator[]>): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const body: Record<string, unknown> = (req.body ?? {}) as Record<string, unknown>;
    const details: Record<string, string> = {};

    for (const [field, validators] of Object.entries(schema)) {
      const value = body[field];
      for (const validator of validators) {
        const error = validator(value, field);
        if (error) {
          details[field] = error;
          break;
        }
      }
    }

    if (Object.keys(details).length > 0) {
      next(new ApiError(400, "Validation failed", "VALIDATION_ERROR", details));
      return;
    }
    next();
  };
};