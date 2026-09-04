import { existsSync, readFileSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import multer from "multer";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

// Multer storage config - keep in memory for validation and then manual save
const storage = multer.memoryStorage();
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed."));
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per file, up to 10 files
  fileFilter
}).any();

// Ensure upload directory exists
mkdir(path.join(UPLOAD_DIR, "images"), { recursive: true }).catch(console.error);
mkdir(path.join(UPLOAD_DIR, "reports"), { recursive: true }).catch(console.error);

export function publicUrlForProduct(filename: string): string {
  const base = process.env.PUBLIC_BASE_URL && !process.env.PUBLIC_BASE_URL.includes("localhost")
    ? process.env.PUBLIC_BASE_URL.replace(/\/$/, "")
    : "";
  return `${base}/images/${filename}`;
}

export function readFileAsBase64(imageUrl: string): { data: string; mimeType: string } {
  const filename = path.basename(imageUrl);
  const absolutePath = path.join(UPLOAD_DIR, "images", filename);
  
  if (!existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const buffer = readFileSync(absolutePath);
  const mimeType = imageUrl.endsWith(".png") ? "image/png" : imageUrl.endsWith(".webp") ? "image/webp" : "image/jpeg";
  
  return {
    data: buffer.toString("base64"),
    mimeType
  };
}

export async function writeReportFile(inspectionId: string, buffer: Buffer): Promise<{ reportUrl: string; reportId: string }> {
  const reportId = `${inspectionId}-${Date.now()}.pdf`;
  const reportDir = path.join(UPLOAD_DIR, "reports");
  const reportPath = path.join(reportDir, reportId);
  
  await writeFile(reportPath, buffer);
  
  const base = process.env.PUBLIC_BASE_URL && !process.env.PUBLIC_BASE_URL.includes("localhost")
    ? process.env.PUBLIC_BASE_URL.replace(/\/$/, "")
    : "";
  const reportUrl = `${base}/reports/${reportId}`;
  
  return { reportUrl, reportId };
}


export function filePathFromPublicUrl(url: string): string {
  const filename = path.basename(url);
  return path.join(UPLOAD_DIR, "reports", filename);
}

// Added this to handle manual file saving from controller
export async function saveImageFile(file: Express.Multer.File): Promise<string> {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${randomSuffix}-${sanitized}`;
  const absolutePath = path.join(UPLOAD_DIR, "images", filename);
  await writeFile(absolutePath, file.buffer);
  return filename;
}
