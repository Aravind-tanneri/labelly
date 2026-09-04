import { Types, type FilterQuery } from "mongoose";
import { Inspection as InspectionModel, type IInspection, type InspectionDoc } from "../models/Inspection";
import { User } from "../models/User";
import { ApiError } from "../middleware/errorHandler";
import {
  DECLARATION_FIELDS,
  emptyDeclarations,
  runCompliance,
  type StoredExtraction
} from "./complianceService";
import type {
  AuthUser,
  ComplianceResult,
  Declarations,
  Inspection,
  InspectionLifecycleStatus,
  InspectionListQuery,
  InspectionListItem,
  PaginatedInspections,
  UserRole
} from "../types";


// ── helpers ──────────────────────────────────────────────

const idOf = (v: unknown): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v instanceof Types.ObjectId) return v.toHexString();
  if (typeof v === "object") {
    if ("toHexString" in v && typeof (v as any).toHexString === "function") {
      return (v as any).toHexString();
    }
    if ("_id" in v && (v as any)._id && (v as any)._id !== v) {
      return idOf((v as any)._id);
    }
    if (typeof (v as any).toString === "function") {
      const s = (v as any).toString();
      if (s && s !== "[object Object]") return s;
    }
  }
  return "";
};

const isoOf = (v: unknown): string =>
  v
    ? typeof v === "string"
      ? v
      : (v as Date).toISOString?.() ?? new Date(0).toISOString()
    : new Date(0).toISOString();

const confMap = (v: unknown): Record<string, number> => {
  if (v instanceof Map) return Object.fromEntries(v.entries()) as Record<string, number>;
  return (v as Record<string, number>) ?? {};
};

const isObjectId = (value: string): boolean =>
  Types.ObjectId.isValid(value) && String(new Types.ObjectId(value)) === value;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── serializers ──────────────────────────────────────────

export function serializeInspection(raw: IInspection & { _id: Types.ObjectId }): Inspection {
  return {
    _id: idOf(raw._id),
    inspectionId: raw.inspectionId,
    inspectorId: idOf(raw.inspectorId),
    supervisorId: raw.supervisorId ? idOf(raw.supervisorId) : undefined,
    product: raw.product ?? { name: "", category: "", brand: "" },
    images: (raw.images ?? []).map((img) => ({
      originalUrl: img.originalUrl,
      thumbnailUrl: img.thumbnailUrl,
      uploadedAt: isoOf(img.uploadedAt)
    })),
    extractedData: raw.extractedData ?? emptyDeclarations(),
    extractionConfidence: confMap(raw.extractionConfidence),
    visualObservations: raw.visualObservations ?? [],
    uncertainFields: raw.uncertainFields ?? [],
    compliance: raw.compliance ?? null,
    inspectorEdits: (raw.inspectorEdits ?? []).map((edit) => ({
      field: edit.field,
      before: edit.before,
      after: edit.after,
      editedAt: isoOf(edit.editedAt)
    })),
    remarks: raw.remarks ?? "",
    reportUrl: raw.reportUrl,
    reportGeneratedAt: raw.reportGeneratedAt ? isoOf(raw.reportGeneratedAt) : undefined,
    status: raw.status ?? "DRAFT",
    createdAt: isoOf(raw.createdAt),
    updatedAt: isoOf(raw.updatedAt)
  };
}

type ListItemRaw = Record<string, unknown> & {
  _id?: unknown;
  inspectionId?: string;
  product?: { name?: string; category?: string; brand?: string };
  inspectorId?: { _id?: unknown; name?: string } | unknown;
  compliance?: { status?: string; violations?: unknown[] } | null;
  status?: string;
  createdAt?: unknown;
};

function toListItem(raw: ListItemRaw): InspectionListItem {
  const inspector = raw.inspectorId as { _id?: unknown; name?: string } | null | undefined;
  return {
    _id: idOf(raw._id),
    inspectionId: raw.inspectionId ?? "",
    product: {
      name: raw.product?.name ?? "",
      category: raw.product?.category ?? "",
      brand: raw.product?.brand ?? ""
    },
    status: (raw.status as InspectionListItem["status"]) ?? "DRAFT",
    complianceStatus: (raw.compliance?.status as InspectionListItem["complianceStatus"]) ?? "REVIEW_REQUIRED",
    violations: raw.compliance?.violations?.length ?? 0,
    inspectorName: inspector && typeof inspector === "object" ? inspector.name ?? "—" : "—",
    inspectorId: idOf(inspector && typeof inspector === "object" && inspector._id ? inspector._id : raw.inspectorId),
    createdAt: isoOf(raw.createdAt)
  };
}

// ── id / creation ────────────────────────────────────────

export async function generateInspectionId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LM-${year}-`;
  const docs = await InspectionModel.find(
    { inspectionId: new RegExp(`^${prefix}`) },
    { inspectionId: 1 }
  ).lean();

  let maxNum = 0;
  for (const d of docs) {
    if (d.inspectionId && d.inspectionId.startsWith(prefix)) {
      const numPart = d.inspectionId.slice(prefix.length);
      const n = parseInt(numPart, 10);
      if (!Number.isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}${String(nextNum).padStart(6, "0")}`;
  while (await InspectionModel.exists({ inspectionId: candidate })) {
    nextNum++;
    candidate = `${prefix}${String(nextNum).padStart(6, "0")}`;
  }
  return candidate;
}

export async function createInspection(
  inspectorId: string,
  input: { productCategory: string; notes?: string }
): Promise<Inspection> {
  let attempts = 0;
  while (attempts < 5) {
    try {
      const inspectionId = await generateInspectionId();
      const doc = await InspectionModel.create({
        inspectionId,
        inspectorId: new Types.ObjectId(inspectorId),
        product: { name: "", category: input.productCategory || "", brand: "" },
        images: [],
        extractedData: emptyDeclarations(),
        extractionConfidence: new Map(),
        visualObservations: [],
        uncertainFields: [],
        compliance: null,
        inspectorEdits: [],
        remarks: input.notes || "",
        status: "DRAFT"
      });
      return serializeInspection(doc.toObject());
    } catch (err: any) {
      attempts++;
      if (err?.code === 11000 && attempts < 5) {
        continue;
      }
      throw err;
    }
  }
  throw new ApiError(500, "Failed to generate unique inspection ID");
}

export async function findInspection(id: string): Promise<InspectionDoc> {
  const filter = isObjectId(id)
    ? { _id: new Types.ObjectId(id) }
    : { inspectionId: id };
  const doc = await InspectionModel.findOne(filter);
  if (!doc) throw new ApiError(404, "Inspection not found");
  return doc as unknown as InspectionDoc;
}

// ── access control ───────────────────────────────────────

export function assertCanView(inspection: InspectionDoc, viewer: AuthUser): void {
  if (viewer.role !== "SUPERVISOR" && inspection.inspectorId.toString() !== viewer.id) {
    throw new ApiError(403, "Forbidden: cannot access this inspection");
  }
}

export function assertCanEdit(inspection: InspectionDoc, viewer: AuthUser): void {
  if (viewer.role !== "SUPERVISOR" && inspection.inspectorId.toString() !== viewer.id) {
    throw new ApiError(403, "Forbidden: cannot modify this inspection");
  }
}

export async function getInspection(id: string, viewer: AuthUser): Promise<Inspection> {
  const doc = await findInspection(id);
  assertCanView(doc, viewer);
  return serializeInspection(doc.toObject());
}

// ── listing ──────────────────────────────────────────────

function buildListFilter(viewer: AuthUser, query: InspectionListQuery): FilterQuery<IInspection> {
  const filter: FilterQuery<IInspection> = {};
  if (viewer.role !== "SUPERVISOR") {
    filter.inspectorId = new Types.ObjectId(viewer.id);
  }
  if (query.status) filter.status = query.status;
  if (query.complianceStatus) filter["compliance.status"] = query.complianceStatus;
  if (query.product) {
    filter["product.name"] = new RegExp(escapeRegExp(query.product), "i");
  }
  if (query.startDate || query.endDate) {
    const createdAtFilter: Record<string, Date> = {};
    if (query.startDate) {
      const start = new Date(`${query.startDate}T00:00:00`);
      if (!Number.isNaN(start.getTime())) {
        createdAtFilter.$gte = start;
      }
    }
    if (query.endDate) {
      const end = new Date(`${query.endDate}T23:59:59.999`);
      if (!Number.isNaN(end.getTime())) {
        createdAtFilter.$lte = end;
      }
    }
    if (Object.keys(createdAtFilter).length > 0) {
      filter.createdAt = createdAtFilter;
    }
  } else if (query.date) {
    const start = new Date(`${query.date}T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }
  }
  return filter;
}

export async function listInspections(
  viewer: AuthUser,
  query: InspectionListQuery
): Promise<PaginatedInspections> {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit) || 20)));
  const filter = buildListFilter(viewer, query);

  const [items, total] = await Promise.all([
    InspectionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("inspectorId", "name")
      .lean(),
    InspectionModel.countDocuments(filter)
  ]);

  const inspections = items.map((item) => toListItem(item as unknown as ListItemRaw));
  const inspectorIds = [
    ...new Set(
      items
        .map((item) => idOf(item.inspectorId))
        .filter((id) => Boolean(id) && isObjectId(id))
    )
  ];

  if (inspectorIds.length > 0) {
    const names = await User.find({
      _id: { $in: inspectorIds.map((id) => new Types.ObjectId(id)) }
    })
      .select("name")
      .lean();
    const nameById = new Map(names.map((u) => [idOf(u._id), u.name]));

    for (const item of inspections) {
      if (item.inspectorId && nameById.has(item.inspectorId)) {
        item.inspectorName = nameById.get(item.inspectorId) ?? item.inspectorName ?? "—";
      }
    }
  }

  return { inspections, total, page, limit };
}

export async function listReports(viewer: AuthUser, limit = 50): Promise<Inspection[]> {
  const filter: FilterQuery<IInspection> = { reportUrl: { $exists: true, $ne: "" } };
  if (viewer.role !== "SUPERVISOR") filter.inspectorId = new Types.ObjectId(viewer.id);

  const docs = await InspectionModel.find(filter)
    .sort({ reportGeneratedAt: -1 })
    .limit(limit);
  return docs.map((doc) => serializeInspection(doc.toObject()));
}

// ── mutations ────────────────────────────────────────────

function storedFromInspection(raw: InspectionDoc): StoredExtraction {
  const confRaw = raw.extractionConfidence ?? {};
  const conf = confRaw instanceof Map ? confRaw : new Map(Object.entries(confRaw as Record<string, number>));
  
  return {
    product: raw.product ?? { name: "", category: "", brand: "" },
    extractedData: raw.extractedData ?? emptyDeclarations(),
    extractionConfidence: Object.fromEntries(conf.entries()) as Record<string, number>,
    visualObservations: raw.visualObservations ?? [],
    uncertainFields: raw.uncertainFields ?? []
  };
}

/** Persists AI extraction + deterministic compliance into the inspection. */
export async function storeExtraction(
  inspection: InspectionDoc,
  stored: StoredExtraction
): Promise<{ inspection: Inspection; compliance: ComplianceResult }> {
  const compliance = runCompliance(stored);

  inspection.product = stored.product;
  inspection.extractedData = stored.extractedData;
  inspection.extractionConfidence = new Map(Object.entries(stored.extractionConfidence));
  inspection.visualObservations = stored.visualObservations;
  inspection.uncertainFields = stored.uncertainFields;
  inspection.compliance = compliance;

  await inspection.save();
  return { inspection: serializeInspection(inspection.toObject()), compliance };
}

/** Applies inspector edits to extracted data and re-evaluates compliance. */
export async function updateInspection(
  inspection: InspectionDoc,
  patch: {
    extractedData?: Partial<Declarations>;
    remarks?: string;
    status?: InspectionLifecycleStatus;
    product?: { name?: string; category?: string; brand?: string };
  },
  user: AuthUser
): Promise<{ inspection: Inspection; updatedCompliance: ComplianceResult }> {

  const edits = [...inspection.inspectorEdits];
  const confidence =
    inspection.extractionConfidence instanceof Map
      ? new Map(inspection.extractionConfidence)
      : new Map(Object.entries(inspection.extractionConfidence ?? {}));

  if (patch.extractedData) {
    for (const field of DECLARATION_FIELDS) {
      if (!(field in patch.extractedData)) continue;
      const next = patch.extractedData[field] as string | null | undefined;
      const prev = (inspection.extractedData[field] as string | null) ?? "";
      const after = next ?? null;
      if (after !== prev) {
        edits.push({ field, before: prev, after: after ?? "", editedAt: new Date() });
        inspection.extractedData[field] = after as Declarations[typeof field];
        if (after) confidence.set(field, 100);
        else confidence.delete(field);
      }
    }
    inspection.markModified("extractedData");
  }

  if (patch.product) {
    inspection.product = {
      name: patch.product.name ?? inspection.product.name,
      category: patch.product.category ?? inspection.product.category,
      brand: patch.product.brand ?? inspection.product.brand
    };
  }

  if (patch.remarks !== undefined) inspection.remarks = patch.remarks ?? "";
  if (patch.status !== undefined) {
    inspection.status = patch.status as InspectionLifecycleStatus;
  }
  if (user.role === "SUPERVISOR" && !inspection.supervisorId) {
    inspection.supervisorId = new Types.ObjectId(user.id);
  }


  inspection.inspectorEdits = edits;
  inspection.extractionConfidence = confidence as Map<string, number>;
  const updatedCompliance = runCompliance(storedFromInspection(inspection));
  inspection.compliance = updatedCompliance;

  await inspection.save();
  return { inspection: serializeInspection(inspection.toObject()), updatedCompliance };
}

/** Re-runs compliance without re-analysis. */
export async function recheckInspection(inspection: InspectionDoc): Promise<ComplianceResult> {
  const compliance = runCompliance(storedFromInspection(inspection));
  inspection.compliance = compliance;
  await inspection.save();
  return compliance;
}

export async function addImage(
  inspection: InspectionDoc,
  image: { originalUrl: string; thumbnailUrl: string }
): Promise<Inspection> {
  inspection.images.push({ ...image, uploadedAt: new Date() });
  await inspection.save();
  return serializeInspection(inspection.toObject());
}

export async function addImages(
  inspection: InspectionDoc,
  images: Array<{ originalUrl: string; thumbnailUrl: string }>
): Promise<Inspection> {
  const now = new Date();
  for (const img of images) {
    inspection.images.push({ ...img, uploadedAt: now });
  }
  await inspection.save();
  return serializeInspection(inspection.toObject());
}

export async function markReportGenerated(
  inspection: InspectionDoc,
  reportUrl: string,
  user: AuthUser
): Promise<Inspection> {
  inspection.reportUrl = reportUrl;
  inspection.reportGeneratedAt = new Date();
  inspection.status = "SUBMITTED";
  if (user.role === "SUPERVISOR" && !inspection.supervisorId) {
    inspection.supervisorId = new Types.ObjectId(user.id);
  }
  await inspection.save();
  return serializeInspection(inspection.toObject());
}
