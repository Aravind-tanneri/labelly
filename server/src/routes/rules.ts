import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { Rule } from "../models/Rule";

const router = Router();

router.use(authenticate);

// GET /api/rules - read-only list of enabled rules (config is pre-seeded, no UI).
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rules = await Rule.find({ enabled: true }).sort({ ruleId: 1 }).lean();
    res.json({ rules });
  })
);

export default router;