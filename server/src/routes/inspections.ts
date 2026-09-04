import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireInspector } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";
import { isEnum, isObject, isString, maxLength, required, validateBody } from "../middleware/validation";
import { uploadImage } from "../services/storageService";
import {
  createInspection,
  deleteInspectionHandler,
  getInspection,
  listInspectionsHandler,
  listMine,
  updateInspection,
  uploadImage as uploadImageController
} from "../controllers/inspectionController";
import { analyze } from "../controllers/geminiController";
import { recheck } from "../controllers/complianceController";
import { fetchReport, generateReport } from "../controllers/reportController";

const router = Router();

// Every inspection route requires an authenticated INSPECTOR or SUPERVISOR.
router.use(authenticate, requireInspector);

// Create new inspection
router.post(
  "/",
  validateBody({
    productCategory: [required(), isString(), maxLength(120)],
    notes: [isString(), maxLength(2000)]
  }),
  asyncHandler(createInspection)
);

// Own inspections (must be registered before /:id)
router.get("/mine", asyncHandler(listMine));

// List inspections (paginated, role-scoped)
router.get("/", asyncHandler(listInspectionsHandler));

// Single inspection
router.get("/:id", asyncHandler(getInspection));

// Delete inspection
router.delete("/:id", asyncHandler(deleteInspectionHandler));

// Update extracted data / remarks / status -> triggers re-evaluation
router.patch(
  "/:id",
  validateBody({
    extractedData: [isObject()],
    remarks: [isString(), maxLength(2000)],
    product: [isObject()],
    status: [
      isEnum([
        "DRAFT",
        "SUBMITTED",
        "APPROVED",
        "REJECTED",
        "ACTION_REQUIRED",
        "REINSPECTION_REQUESTED"
      ])
    ]
  }),
  asyncHandler(updateInspection)
);

// Upload product image (multipart field: "image")
router.post("/:id/images", uploadImage, asyncHandler(uploadImageController));

// Trigger Gemini analysis
router.post("/:id/analyze", asyncHandler(analyze));

// Re-run compliance without re-analysis
router.post("/:id/recheck", asyncHandler(recheck));

// Generate PDF report
router.post("/:id/report", asyncHandler(generateReport));

// Fetch PDF report
router.get("/:id/report", asyncHandler(fetchReport));

export default router;