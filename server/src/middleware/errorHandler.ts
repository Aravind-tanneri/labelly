import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * API error with an HTTP status code. Thrown by services/controllers and
 * serialized by the central error handler. Error messages never leak system info.
 */
export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/** Wraps an async handler so rejected promises reach the error middleware. */
export const asyncHandler = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/** 404 handler for unknown routes. */
export const notFound: RequestHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/** Central error handler. Protects internal details in production. */
export const errorHandler = (
  err: Error & { code?: string | number; name?: string; message: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      ...(err.details !== undefined ? { details: err.details } : {})
    });
    return;
  }

  if ("status" in err && typeof (err as any).status === "number") {
    res.status((err as any).status).json({ message: err.message });
    return;
  }

  if (err.name === "ValidationError" && (err as { errors?: Record<string, { message?: string }> }).errors) {
    const errors = (err as { errors?: Record<string, { message?: string }> }).errors ?? {};
    const details: Record<string, string> = {};
    for (const key of Object.keys(errors)) {
      details[key] = errors[key]?.message ?? "Invalid value";
    }
    res.status(400).json({ message: "Validation error", details });
    return;
  }

  if (err.name === "CastError") {
    res.status(400).json({ message: "Invalid identifier format" });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({ message: "Duplicate value provided" });
    return;
  }

  if (err.name === "MulterError") {
    res.status(400).json({ message: err.message });
    return;
  }

  console.error("[Error]", err);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    message: isDev ? err.message : "Internal server error",
    ...(isDev && err.stack ? { stack: err.stack } : {})
  });
};