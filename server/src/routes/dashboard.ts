import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireSupervisor } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";
import { Inspection } from "../models/Inspection";
import { Rule } from "../models/Rule";
import { User } from "../models/User";
import type { DashboardStats } from "../types";

const router = Router();

// Only supervisors see team-wide dashboards.
router.use(authenticate, requireSupervisor);

interface GroupedStat {
  _id: string;
  total: number;
  compliant: number;
}

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const total = await Inspection.countDocuments();
    const [compliant, nonCompliant, highSeverity] = await Promise.all([
      Inspection.countDocuments({ "compliance.status": "COMPLIANT" }),
      Inspection.countDocuments({ "compliance.status": "NON_COMPLIANT" }),
      Inspection.countDocuments({ "compliance.violations.severity": "HIGH" })
    ]);

    const stats: DashboardStats = { totalInspections: total, compliant, nonCompliant, highSeverity };
    res.json(stats);
  })
);

router.get(
  "/violations",
  asyncHandler(async (_req, res) => {
    const grouped = (await Inspection.aggregate([
      { $unwind: "$compliance.violations" },
      { $group: { _id: "$compliance.violations.ruleId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])) as { _id: string; count: number }[];

    const rules = await Rule.find({ ruleId: { $in: grouped.map((g) => g._id) } })
      .select("ruleId title")
      .lean();
    const titleById = new Map(rules.map((r) => [r.ruleId, r.title]));

    res.json({
      violations: grouped.map((g) => ({
        title: titleById.get(g._id) ?? g._id,
        count: g.count
      }))
    });
  })
);

router.get(
  "/inspector-performance",
  asyncHandler(async (_req, res) => {
    const grouped = (await Inspection.aggregate([
      {
        $group: {
          _id: "$inspectorId",
          total: { $sum: 1 },
          compliant: {
            $sum: { $cond: [{ $eq: ["$compliance.status", "COMPLIANT"] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ])) as GroupedStat[];

    const users = await User.find({ _id: { $in: grouped.map((g) => g._id) } })
      .select("name")
      .lean();
    const nameById = new Map(users.map((u) => [String(u._id), u.name]));

    res.json({
      inspectors: grouped.map((g) => ({
        id: String(g._id),
        name: nameById.get(String(g._id)) ?? "—",
        inspectionCount: g.total,
        complianceRate: g.total > 0 ? Math.round((g.compliant / g.total) * 100) : 0
      }))
    });
  })
);

export default router;