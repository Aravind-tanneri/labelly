import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuditLog } from "../models/AuditLog";
import { login } from "../services/authService";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { isString, minLength, required, validateBody } from "../middleware/validation";
import type { AuthenticatedRequest } from "../types";

const router = Router();

/**
 * Security: rate-limit the login endpoint to slow brute-force attempts.
 * Passwords are checked with bcrypt (12 rounds) - never log them.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ message: "Too many login attempts. Try again later." });
  }
});

router.post(
  "/login",
  loginLimiter,
  validateBody({
    email: [required(), isString()],
    password: [required(), minLength(6)]
  }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await login(email, password);

    await AuditLog.create({
      userId: result.user.id,
      action: "LOGIN",
      entityType: "user",
      entityId: result.user.id,
      after: { email: result.user.email },
      ipAddress: req.ip || "127.0.0.1"
    });

    res.json(result);
  })
);

router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    // Stateless JWT auth: the client discards the token.
    await AuditLog.create({
      userId: authReq.user.id,
      action: "LOGOUT",
      entityType: "user",
      entityId: authReq.user.id,
      ipAddress: req.ip || "127.0.0.1"
    });
    res.json({ message: "Logged out" });
  })
);

export default router;
