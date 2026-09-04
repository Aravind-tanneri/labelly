import { type Request, type NextFunction, type Response } from "express";
import { ApiError } from "./errorHandler";
import type { AuthenticatedRequest, UserRole } from "../types";

/**
 * RBAC middleware factory. Enforces role membership on the authenticated user.
 * Authorization is always enforced server-side - never trust the frontend.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || !allowedRoles.includes(authReq.user.role)) {
      next(new ApiError(403, "Forbidden: insufficient permissions"));
      return;
    }
    next();
  };
};

/** INSPECTOR and SUPERVISOR can perform field actions. */
export const requireInspector = requireRole("INSPECTOR", "SUPERVISOR");

/** Only SUPERVISOR can access team dashboards and admin functions. */
export const requireSupervisor = requireRole("SUPERVISOR");
