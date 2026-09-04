import type { Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { assertCanEdit, findInspection, recheckInspection } from "../services/inspectionService";
import type { AuthenticatedRequest } from "../types";

/**
 * Re-runs the deterministic rule engine on already-extracted data.
 * No AI call - pure re-evaluation after inspector edits.
 */
export async function recheck(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const doc = await findInspection(req.params.id);
  assertCanEdit(doc, req.user);

  const compliance = await recheckInspection(doc);

  await AuditLog.create({
    userId: req.user.id,
    action: "COMPLIANCE_RECHECKED",
    entityType: "inspection",
    entityId: doc._id,
    after: { status: compliance.status, score: compliance.score },
    ipAddress: req.ip
  });

  res.json({ compliance });
}