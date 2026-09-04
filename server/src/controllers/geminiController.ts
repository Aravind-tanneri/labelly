import type { Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { ApiError } from "../middleware/errorHandler";
import { analyzeImages } from "../services/geminiService";
import { geminiToStored } from "../services/complianceService";
import { assertCanEdit, findInspection, storeExtraction } from "../services/inspectionService";
import type { AuthenticatedRequest } from "../types";

/**
 * Triggers Gemini analysis for an inspection with product images.
 * Gemini results are converted to storage shape and persisted WITH the deterministic
 * compliance result in one step - the "AI EXTRACTS, RULES DECIDE" handoff.
 */
export async function analyze(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const doc = await findInspection(req.params.id);
  assertCanEdit(doc, req.user);

  if (doc.images.length === 0) {
    throw new ApiError(400, "Upload a product image before analysis");
  }

  const imageUrls = doc.images.map((img) => img.originalUrl);
  const extraction = await analyzeImages(imageUrls, doc.inspectionId);
  const stored = geminiToStored(extraction);
  await storeExtraction(doc, stored);

  await AuditLog.create({
    userId: req.user.id,
    action: "INSPECTION_ANALYZED",
    entityType: "inspection",
    entityId: doc._id,
    after: { product: stored.product, confidence: stored.extractionConfidence },
    ipAddress: req.ip
  });

  res.json({ extraction, confidence: stored.extractionConfidence });
}