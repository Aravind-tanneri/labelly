import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireInspector } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";
import { listReportsHandler } from "../controllers/reportController";

const router = Router();

router.use(authenticate, requireInspector);

// GET /api/reports - list inspections that have a generated report
router.get("/", asyncHandler(listReportsHandler));

export default router;