import fs from "fs";
import type { Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { ApiError } from "../middleware/errorHandler";
import {
  assertCanEdit,
  assertCanView,
  findInspection,
  listReports,
  markReportGenerated,
  recheckInspection,
  serializeInspection
} from "../services/inspectionService";
import { generateReport as generateReportPdf, getReportFilePath } from "../services/reportService";
import type { AuthenticatedRequest } from "../types";

export async function generateReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const doc = await findInspection(req.params.id);
  assertCanEdit(doc, req.user);

  // A report needs a compliance result - re-run deterministically if missing.
  if (!doc.compliance) {
    await recheckInspection(doc);
  }

  const inspection = serializeInspection(doc.toObject());
  const { reportUrl, reportId } = await generateReportPdf(inspection);
  await markReportGenerated(doc, reportUrl, req.user);

  await AuditLog.create({
    userId: req.user.id,
    action: "REPORT_GENERATED",
    entityType: "inspection",
    entityId: doc._id,
    after: { reportUrl },
    ipAddress: req.ip
  });

  res.status(201).json({ reportUrl, reportId });
}

export async function fetchReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const doc = await findInspection(req.params.id);
  assertCanView(doc, req.user);

  if (!doc.reportUrl) {
    throw new ApiError(404, "Report has not been generated");
  }

  const filePath = getReportFilePath(doc.reportUrl);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Report file not found");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${doc.inspectionId}.pdf"`);
  res.sendFile(filePath);
}

export async function listReportsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const reports = await listReports(req.user, limit);
  res.json({ reports });
}