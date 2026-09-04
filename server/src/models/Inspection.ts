import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import type { InspectionLifecycleStatus, Declarations, ProductImage, InspectorEdit, ProductInfo } from "../types";
import type { ComplianceResult } from "../types/compliance";

export interface IInspection {
  inspectionId: string;
  inspectorId: Types.ObjectId;
  supervisorId?: Types.ObjectId;
  product: ProductInfo;
  images: ProductImage[];
  extractedData: Declarations;
  extractionConfidence: Map<string, number>;
  visualObservations: string[];
  uncertainFields: string[];
  compliance: ComplianceResult | null;
  inspectorEdits: InspectorEdit[];
  remarks?: string;
  reportUrl?: string;
  reportGeneratedAt?: Date;
  status: InspectionLifecycleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type InspectionDoc = HydratedDocument<IInspection>;

const productSchema = new Schema(
  {
    name: { type: String, default: "" },
    category: { type: String, default: "" },
    brand: { type: String, default: "" }
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    originalUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const extractedDataSchema = new Schema(
  {
    manufacturer: { type: String, default: null },
    packer: { type: String, default: null },
    importer: { type: String, default: null },
    netQuantity: { type: String, default: null },
    mrp: { type: String, default: null },
    manufacturingDate: { type: String, default: null },
    consumerCare: { type: String, default: null },
    batchNumber: { type: String, default: null },
    otherDeclarations: { type: Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const inspectorEditSchema = new Schema(
  {
    field: { type: String, required: true },
    before: { type: String, default: "" },
    after: { type: String, default: "" },
    editedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const violationSchema = new Schema(
  {
    ruleId: { type: String, required: true },
    field: { type: String, required: true },
    status: { type: String, enum: ["FAIL"], required: true },
    severity: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], required: true },
    message: { type: String, required: true },
    expectedValue: { type: String },
    actualValue: { type: String }
  },
  { _id: false }
);

const reviewItemSchema = new Schema(
  {
    ruleId: { type: String },
    field: { type: String, required: true },
    status: { type: String, enum: ["REVIEW"], required: true },
    severity: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], required: true },
    message: { type: String, required: true }
  },
  { _id: false }
);

const passedRuleSchema = new Schema(
  {
    ruleId: { type: String, required: true },
    field: { type: String, required: true },
    status: { type: String, enum: ["PASS"], required: true },
    message: { type: String }
  },
  { _id: false }
);

const complianceSchema = new Schema(
  {
    status: { type: String, enum: ["COMPLIANT", "NON_COMPLIANT", "REVIEW_REQUIRED"], required: true },
    score: { type: Number, required: true },
    violations: { type: [violationSchema], default: [] },
    passedRules: { type: [passedRuleSchema], default: [] },
    reviewRequired: { type: [reviewItemSchema], default: [] }
  },
  { _id: false }
);

const inspectionSchema = new Schema<IInspection>(
  {
    inspectionId: { type: String, required: true, unique: true },
    inspectorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: "User" },
    product: { type: productSchema, required: true },
    images: { type: [imageSchema], default: [] },
    extractedData: { type: extractedDataSchema, required: true },
    extractionConfidence: { type: Map, of: Number, default: () => new Map() },
    visualObservations: { type: [String], default: [] },
    uncertainFields: { type: [String], default: [] },
    compliance: { type: complianceSchema, default: null },
    inspectorEdits: { type: [inspectorEditSchema], default: [] },
    remarks: { type: String, default: "" },
    reportUrl: { type: String },
    reportGeneratedAt: { type: Date },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "APPROVED",
        "REJECTED",
        "ACTION_REQUIRED",
        "REINSPECTION_REQUESTED"
      ],
      default: "DRAFT",
      required: true
    }
  },
  { timestamps: true }
);

export const Inspection = model<IInspection>("Inspection", inspectionSchema);
