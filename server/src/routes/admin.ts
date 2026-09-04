import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireSupervisor } from "../middleware/rbac";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { isBoolean, isEnum, validateBody } from "../middleware/validation";
import { User } from "../models/User";
import { serializeUser } from "../services/authService";
import type { UserRole } from "../types";

const router = Router();

// Minimal admin surface - user + role management is pre-seeded, not exposed in UI.
router.use(authenticate, requireSupervisor);

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: 1 }).lean();
    res.json({ users: users.map((u) => serializeUser(u)) });
  })
);

router.patch(
  "/users/:id",
  validateBody({
    active: [isBoolean()],
    role: [isEnum(["INSPECTOR", "SUPERVISOR"])]
  }),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    const { active, role } = req.body as { active?: boolean; role?: UserRole };
    if (active !== undefined) user.active = active;
    if (role !== undefined) user.role = role;
    await user.save();

    res.json({ user: serializeUser(user.toObject()) });
  })
);

export default router;