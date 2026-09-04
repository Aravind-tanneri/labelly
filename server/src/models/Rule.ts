import { Schema, model } from "mongoose";

export interface IRule {
  ruleId: string;
  title: string;
  category: "declarations" | "formatting" | "readability";
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  enabled: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ruleSchema = new Schema(
  {
    ruleId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["declarations", "formatting", "readability"],
      required: true
    },
    description: { type: String, default: "" },
    severity: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], required: true },
    enabled: { type: Boolean, default: true },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const Rule = model<IRule>("Rule", ruleSchema);