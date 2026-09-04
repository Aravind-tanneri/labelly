import path from "path";
import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/errorHandler";
import { UPLOAD_DIR } from "./services/storageService";
import authRoutes from "./routes/auth";
import inspectionRoutes from "./routes/inspections";
import reportRoutes from "./routes/reports";
import dashboardRoutes from "./routes/dashboard";
import ruleRoutes from "./routes/rules";
import adminRoutes from "./routes/admin";
import auditRoutes from "./routes/audit";

const app = express();

app.set("trust proxy", 1);

// CORS for mobile (Expo) + web dashboard during the hackathon.
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(",").map((o) => o.trim()),
    credentials: true
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product images and generated PDF reports.
const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
app.use("/uploads", express.static(uploadRoot));
app.use("/images", express.static(path.join(uploadRoot, "images")));
app.use("/reports", express.static(path.join(uploadRoot, "reports")));


app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit", auditRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;