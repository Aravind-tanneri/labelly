import { Schema, model, type HydratedDocument } from "mongoose";
import type { UserRole } from "../types";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  passwordHash: string;
  altPasswordHash?: string;
  role: UserRole;
  department: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserDoc = HydratedDocument<IUser>;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    employeeId: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    altPasswordHash: { type: String, default: null },
    role: { type: String, enum: ["INSPECTOR", "SUPERVISOR"], default: "INSPECTOR" },
    department: { type: String, default: "" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);