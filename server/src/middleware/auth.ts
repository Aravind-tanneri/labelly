import { type Request, type NextFunction, type Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { ApiError } from "./errorHandler";
import type { AuthUser, AuthenticatedRequest, JwtPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "labelly-dev-secret";

export interface SignOptions {
  expiresIn?: string | number;
}

/** Creates a signed JWT for an authenticated user. */
export const signToken = (user: AuthUser, options: SignOptions = {}): string => {
  const expiresIn = options.expiresIn ?? process.env.JWT_EXPIRES_IN ?? "24h";
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET as jwt.Secret,
    { expiresIn } as jwt.SignOptions
  );
};

/**
 * Verifies the Bearer token, loads the user from the DB and attaches it to
 * the request. Rejects inactive users. Used before any protected endpoint.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = header.slice("Bearer ".length);
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      throw new ApiError(401, "Invalid or expired token");
    }

    const user = await User.findById(payload.id).lean();
    if (!user || !user.active) {
      throw new ApiError(401, "Invalid or expired token");
    }

    (req as AuthenticatedRequest).user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    next(error);
  }
};
