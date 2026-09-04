import type { Response } from "express";
import { AuditLog } from "../models/AuditLog";
import { ApiError } from "../middleware/errorHandler";
import {
  addImage,
  addImages,
  assertCanEdit,
  createInspection as createInspectionService,
  findInspection,
  getInspection as getInspectionService,
  listInspections,
  updateInspection as updateInspectionService
} from "../services/inspectionService";
import { publicUrlForProduct, saveImageFile } from "../services/storageService";
import type { AuthenticatedRequest, InspectionListQuery } from "../types";

export async function createInspection(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { productCategory, notes } = req.body as { productCategory: string; notes?: string };
  const inspection = await createInspectionService(req.user.id, { productCategory, notes });

  await AuditLog.create({
    userId: req.user.id,
    action: "INSPECTION_CREATED",
    entityType: "inspection",
    entityId: inspection._id,
    after: { inspectionId: inspection.inspectionId, productCategory },
    ipAddress: req.ip
  });

  res.status(201).json({ inspectionId: inspection.inspectionId, _id: inspection._id });
}

export async function listInspectionsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const query = req.query as unknown as InspectionListQuery;
  const result = await listInspections(req.user, query);
  res.json(result);
}

export async function listMine(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const query = req.query as unknown as InspectionListQuery;
  const result = await listInspections(
    { id: req.user.id, name: req.user.name, email: req.user.email, role: "INSPECTOR" },
    query
  );
  res.json(result);
}

export async function getInspection(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const inspection = await getInspectionService(req.params.id, req.user);
  res.json({ inspection });
}

export async function updateInspection(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const doc = await findInspection(req.params.id);
  assertCanEdit(doc, req.user);

  const body = (req.body ?? {}) as {
    extractedData?: unknown;
    remarks?: string;
    product?: unknown;
    status?: string;
  };

  let extractedData: Record<string, string | null> | undefined;
  if (body.extractedData !== undefined) {
    if (typeof body.extractedData !== "object" || Array.isArray(body.extractedData)) {
      throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", { extractedData: "extractedData must be an object" });
    }
    extractedData = body.extractedData as Record<string, string | null>;
  }

  const { inspection, updatedCompliance } = await updateInspectionService(
    doc,
    {
      extractedData,
      remarks: body.remarks,
      status: body.status as any,
      product: body.product as { name?: string; category?: string; brand?: string } | undefined
    },
    req.user
  );


  await AuditLog.create({
    userId: req.user.id,
    action: "EXTRACTION_EDITED",
    entityType: "inspection",
    entityId: doc._id,
    after: { edits: inspection.inspectorEdits },
    ipAddress: req.ip
  });

  res.json({ inspection, updatedCompliance });
}

export async function uploadImage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const doc = await findInspection(req.params.id);
  assertCanEdit(doc, req.user);

  const files: Express.Multer.File[] = [];
  if (req.file) {
    files.push(req.file);
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (typeof req.files === "object") {
      for (const key of Object.keys(req.files)) {
        const item = (req.files as Record<string, Express.Multer.File[]>)[key];
        if (Array.isArray(item)) files.push(...item);
      }
    }
  }

  if (files.length === 0) throw new ApiError(400, "No image uploaded");

  const savedImages: Array<{ originalUrl: string; thumbnailUrl: string; filename: string }> = [];
  for (const file of files) {
    const filename = await saveImageFile(file);
    const originalUrl = publicUrlForProduct(filename);
    savedImages.push({ originalUrl, thumbnailUrl: originalUrl, filename });
  }

  const inspection = await addImages(
    doc,
    savedImages.map((img) => ({ originalUrl: img.originalUrl, thumbnailUrl: img.thumbnailUrl }))
  );

  await AuditLog.create({
    userId: req.user.id,
    action: "IMAGE_UPLOADED",
    entityType: "inspection",
    entityId: doc._id,
    after: {
      imageUrls: savedImages.map((s) => s.originalUrl),
      count: savedImages.length
    },
    ipAddress: req.ip
  });

  res.status(201).json({
    imageUrl: savedImages[0]?.originalUrl,
    imageId: savedImages[0]?.filename,
    images: savedImages.map((s) => ({ imageUrl: s.originalUrl, imageId: s.filename })),
    inspection
  });
}


export async function deleteInspectionHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const doc = await findInspection(req.params.id);
  assertCanEdit(doc, req.user);

  await doc.deleteOne();

  await AuditLog.create({
    userId: req.user.id,
    action: "INSPECTION_DELETED",
    entityType: "inspection",
    entityId: doc._id,
    ipAddress: req.ip
  });

  res.json({ message: "Inspection deleted successfully", id: doc._id });
}