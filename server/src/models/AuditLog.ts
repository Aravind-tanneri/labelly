import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export interface IAuditLog {
  userId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
}

export type AuditLogDoc = HydratedDocument<IAuditLog>;

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: false },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "127.0.0.1" }
  },
  { timestamps: false }
);

// Add indexes for better query performance
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
