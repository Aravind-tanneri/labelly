import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireSupervisor } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";
import { AuditLog } from "../models/AuditLog";

const router = Router();

router.use(authenticate, requireSupervisor);

const idOf = (v: unknown): string =>
  v ? (typeof v === "string" ? v : (v as { toString(): string }).toString()) : "";

// GET /api/audit - recent audit trail entries (accountability for supervisors).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("userId", "name")
      .lean();

    res.json({
      logs: logs.map((log) => {
        const user = log.userId as { _id?: unknown; name?: string } | null | undefined;
        return {
          _id: idOf(log._id),
          userId: idOf(
            user && typeof user === "object" ? user._id ?? log.userId : log.userId
          ),
          userName: user && typeof user === "object" ? user.name ?? "—" : "—",
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId ? idOf(log.entityId) : undefined,
          before: log.before ?? undefined,
          after: log.after ?? undefined,
          timestamp: log.timestamp,
          ipAddress: log.ipAddress
        };
      })
    });
  })
);

export default router;