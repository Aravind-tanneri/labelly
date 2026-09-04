import "dotenv/config";
import mongoose from "mongoose";
import { User } from "./models/User";
import { Rule } from "./models/Rule";
import { Inspection } from "./models/Inspection";
import { hashPassword } from "./services/authService";
import { RULES } from "./rules/ruleEngine";
import { geminiToStored, runCompliance } from "./services/complianceService";
import { generateInspectionId } from "./services/inspectionService";
import type { GeminiExtractionResponse } from "./types";

/**
 * Pre-seed script (npm run seed) + idempotent startup defaults.
 * Creates demo users, compliance rules and sample inspections so the demo
 * needs zero manual setup. No user/rule management UI is required.
 */

const DEFAULT_USERS: Array<{
  name: string;
  email: string;
  employeeId: string;
  role: "INSPECTOR" | "SUPERVISOR";
  department: string;
  password: string;
}> = [
  { name: "Field Inspector (DoCA)", email: "inspector@doca.gov.in", employeeId: "INS-003", role: "INSPECTOR", department: "DoCA", password: "demo123" },
  { name: "Supervisor", email: "supervisor@example.com", employeeId: "SUP-001", role: "SUPERVISOR", department: "DoCA", password: "demo123" },
  { name: "Supervisor (DoCA)", email: "supervisor@doca.gov.in", employeeId: "SUP-002", role: "SUPERVISOR", department: "DoCA", password: "demo123" },
  // Demo Inspectors
  { name: "Srinidhi", email: "srinidhi@doca.gov.in", employeeId: "INS-038", role: "INSPECTOR", department: "DoCA", password: "Srinidhi38" },
  { name: "Charvitha", email: "charvitha@doca.gov.in", employeeId: "INS-077", role: "INSPECTOR", department: "DoCA", password: "Charvitha77" },
  { name: "Aravind", email: "aravind@doca.gov.in", employeeId: "INS-085", role: "INSPECTOR", department: "DoCA", password: "Aravind85" },
  { name: "Nikhil", email: "nikhil@doca.gov.in", employeeId: "INS-054", role: "INSPECTOR", department: "DoCA", password: "Nikhil54" },
  { name: "Srujan", email: "srujan@doca.gov.in", employeeId: "INS-073", role: "INSPECTOR", department: "DoCA", password: "Srujan73" },
  { name: "Saketh", email: "saketh@doca.gov.in", employeeId: "INS-071", role: "INSPECTOR", department: "DoCA", password: "Saketh71" },
];

async function seedUsers(): Promise<void> {
  // Migrate Charvita -> Charvitha if existing
  await User.updateOne(
    { email: "charvita@doca.gov.in" },
    { $set: { email: "charvitha@doca.gov.in", name: "Charvitha" } }
  );

  // Remove deprecated demo users: Field Inspector 1 & 2
  const removedUsers = await User.find({
    $or: [
      { email: { $in: ["inspector@example.com", "inspector2@example.com"] } },
      { name: { $in: ["Field Inspector 1", "Field Inspector 2"] } }
    ]
  });
  if (removedUsers.length > 0) {
    const removedIds = removedUsers.map((u) => u._id);
    await Inspection.deleteMany({ inspectorId: { $in: removedIds } });
    await User.deleteMany({ _id: { $in: removedIds } });
    console.log(`[seed] De-seeded ${removedUsers.length} users: Field Inspector 1 & 2`);
  }

  for (const u of DEFAULT_USERS) {
    const passwordHash = await hashPassword(u.password);
    const altPasswordHash =
      u.password.toLowerCase() !== u.password
        ? await hashPassword(u.password.toLowerCase())
        : null;

    await User.updateOne(
      { email: u.email },
      {
        $set: {
          name: u.name,
          employeeId: u.employeeId,
          role: u.role,
          department: u.department,
          passwordHash,
          altPasswordHash,
          active: true
        }
      },
      { upsert: true }
    );
    console.log(`[seed] Ensured user: ${u.email} (${u.name})`);
  }
}

async function seedRules(): Promise<void> {
  for (const rule of RULES) {
    await Rule.updateOne(
      { ruleId: rule.ruleId },
      {
        $setOnInsert: {
          ruleId: rule.ruleId,
          title: rule.title,
          category: rule.category,
          description: rule.description,
          severity: rule.severity,
          enabled: true,
          version: 1
        }
      },
      { upsert: true }
    );
  }
}

function decl(value: string | null, confidence: number): GeminiExtractionResponse["declarations"]["manufacturer"] {
  return { value, confidence, found: value !== null };
}

interface SampleSpec {
  name: string;
  brand: string;
  category: string;
  manufacturer: string | null;
  packer: string | null;
  importer: string | null;
  netQuantity: string | null;
  mrp: string | null;
  mrpConfidence?: number;
  manufacturingDate: string | null;
  consumerCare: string | null;
  batchNumber: string | null;
  visualObservations?: string[];
  remarks?: string;
}

function buildExtraction(spec: SampleSpec): { extraction: GeminiExtractionResponse; remarks: string } {
  return {
    extraction: {
      product: { name: spec.name, category: spec.category, brand: spec.brand },
      declarations: {
        manufacturer: decl(spec.manufacturer, 95),
        packer: decl(spec.packer, 90),
        importer: decl(spec.importer, 88),
        netQuantity: decl(spec.netQuantity, 92),
        mrp: decl(spec.mrp, spec.mrpConfidence ?? 94),
        manufacturingDate: decl(spec.manufacturingDate, 90),
        consumerCare: decl(spec.consumerCare, 91),
        batchNumber: decl(spec.batchNumber, 85)
      },
      visualObservations: spec.visualObservations ?? [],
      uncertainFields: []
    },
    remarks: spec.remarks ?? ""
  };
}

const SAMPLE_INSPECTIONS: SampleSpec[] = [
  {
    name: "Parle-G Biscuits",
    brand: "Parle",
    category: "Food",
    manufacturer: "Parle Products Pvt. Ltd., Vile Parle (East), Mumbai - 400057",
    packer: "Parle Products Pvt. Ltd.",
    importer: null,
    netQuantity: "79.5 g",
    mrp: "Rs. 20",
    manufacturingDate: "08/2026",
    consumerCare: "1800-22-1953, consumer@parleproducts.com",
    batchNumber: "PG-2608-4512",
    remarks: "Label clearly readable."
  },
  {
    name: "Amul Taaza Milk",
    brand: "Amul",
    category: "Dairy",
    manufacturer: "Gujarat Co-operative Milk Marketing Federation Ltd., Anand - 388001",
    packer: "GCMMF Ltd.",
    importer: null,
    netQuantity: "500 ml",
    mrp: "Rs. 28",
    manufacturingDate: "27/08/2026",
    consumerCare: null,
    batchNumber: "ML-2608-122",
    remarks: "Consumer care contact missing on label."
  },
  {
    name: "Sunflower Cooking Oil",
    brand: "Fortune",
    category: "Edible Oil",
    manufacturer: "Adani Wilmar Ltd., Ahmedabad - 380015",
    packer: null,
    importer: null,
    netQuantity: "1 L",
    mrp: "Rs. 162",
    mrpConfidence: 62,
    manufacturingDate: "07/2026",
    consumerCare: "1800-419-8898, care@adaniwilmar.com",
    batchNumber: "OIL-2607-889",
    visualObservations: ["glare on price panel", "small print on mrp"],
    remarks: "MRP partially visible due to glare."
  },
  {
    name: "Nestl\u00e9 Yogurt",
    brand: "Nestl\u00e9",
    category: "Dairy",
    manufacturer: "Nestl\u00e9 India Ltd., Gurugram - 122002",
    packer: "Nestl\u00e9 India Ltd.",
    importer: null,
    netQuantity: "90 g",
    mrp: "Rs. 35",
    manufacturingDate: "29/08/2026",
    consumerCare: "cares@nestle.in",
    batchNumber: "YG-2608-77",
    remarks: "All required declarations verified."
  },
  {
    name: "Detergent Powder",
    brand: "Surf Excel",
    category: "Household",
    manufacturer: "Hindustan Unilever Ltd., Mumbai - 400093",
    packer: "HUL",
    importer: null,
    netQuantity: "500 g",
    mrp: "Rs. 125",
    manufacturingDate: null,
    consumerCare: "1800-22-0808, consumer.care@unilever.com",
    batchNumber: "DP-2607-412",
    remarks: "Manufacturing date could not be located on pack."
  }
];

async function seedSampleInspections(): Promise<void> {
  const inspectors = await User.find({ role: "INSPECTOR" });
  if (inspectors.length === 0) throw new Error("Inspector users missing - run seed users first");

  for (const inspector of inspectors) {
    const existingForUser = await Inspection.countDocuments({ inspectorId: inspector._id });
    if (existingForUser > 0) {
      console.log(`[seed] ${existingForUser} inspections already present for ${inspector.email} - skipping`);
      continue;
    }

    for (const spec of SAMPLE_INSPECTIONS) {
      const { extraction, remarks } = buildExtraction(spec);
      const stored = geminiToStored(extraction);
      const inspectionId = await generateInspectionId();

      const doc = await Inspection.create({
        inspectionId,
        inspectorId: inspector._id,
        product: stored.product,
        images: [],
        extractedData: stored.extractedData,
        extractionConfidence: new Map(Object.entries(stored.extractionConfidence)),
        visualObservations: stored.visualObservations,
        uncertainFields: stored.uncertainFields,
        compliance: runCompliance(stored),
        inspectorEdits: [],
        remarks,
        status: "SUBMITTED"
      });
      console.log(`[seed] Created inspection for ${inspector.email}: ${doc.inspectionId} (${stored.product.name})`);
    }
  }
}

/** Idempotent startup seeding: users + rules. */
export async function seedDefaults(): Promise<void> {
  await seedUsers();
  await seedRules();
}

/** Full demo seeding: users + rules + sample inspections. */
export async function seedAll(): Promise<void> {
  await seedDefaults();
  await seedSampleInspections();
}

if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/labelly";
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      console.log("[seed] Connected to MongoDB");
      await seedAll();
      console.log("[seed] Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[seed] Failed", error);
      process.exit(1);
    });
}