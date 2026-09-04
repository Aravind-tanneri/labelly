# LABELLY

**Scan. Verify. Enforce.**

A Legal Metrology compliance inspection platform for packaged commodities.

---

## 📋 Problem Statement

**SIH26034** — Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels.

- **Organization**: Ministry of Consumer Affairs, Food & Public Distribution
- **Department**: Department of Consumer Affairs (DoCA)
- **Theme**: Agriculture, FoodTech & Rural Development

---

## 🎯 Core Product Idea

Labelly is a field-ready inspection assistant for enforcement officers to:

1. **Scan** packaged commodity labels using mobile camera
2. **Extract** mandatory declarations using Gemini Vision
3. **Verify** compliance against deterministic Legal Metrology rules
4. **Generate** official inspection reports with evidence
5. **Track** inspection history and compliance trends

### The Core Principle

```
AI EXTRACTS.
RULES DECIDE.
HUMANS VERIFY.
```

- **Gemini**: Extracts visible label information, reports uncertainty
- **Rule Engine**: Deterministic compliance checking (NOT AI-based decisions)
- **Inspector**: Final human verification and judgment

---

## 🏗️ Architecture

```
Mobile / Web UI
    ↓
Node.js + Express API (Authorization, validation)
    ↓
MongoDB (Inspections, users, rules, audit logs)
    ↓
Gemini API (Image analysis, structured extraction)
    ↓
Rule Engine (Deterministic compliance checking)
    ↓
PDF Generator (Official inspection reports)
    ↓
File Storage (Product images, evidence, PDFs)
```

**Key Principle**: Gemini API called **only** from secure backend. Never expose credentials to frontend.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Mobile** | React Native + Expo, TypeScript |
| **Web** | React, TypeScript |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MongoDB |
| **AI** | Google Gemini API (Multimodal) |
| **PDF** | ReportLab or PDFKit |
| **Storage** | Firebase Storage / AWS S3 / Similar |
| **Auth** | JWT, bcrypt |

---

## 👥 User Roles (RBAC)

### 1. **INSPECTOR** (Field Officer)
- Capture/upload product images
- Trigger Gemini analysis
- Review and edit extracted declarations
- Run compliance checks
- View violations with evidence
- Confirm/reject violations
- Add remarks
- Generate and download reports
- View personal inspection history

### 2. **SUPERVISOR** (Senior Officer / Admin Oversight)
- Perform all Inspector actions
- View inspections from assigned inspectors
- Access team compliance dashboards
- Review team reports and violations
- Search team inspection history
- Monitor team statistics
- (User management & rule config pre-seeded in DB, not exposed in UI)

**Authorization**: Enforced in backend (Express middleware). Frontend hides role-specific UI.

**Hackathon approach**: No user management or admin UI. Pre-seed all users in MongoDB at startup.

---

## 🎯 Product Focus

**Mobile-first**: 90% inspector field work (capture, verify, report)  
**Web**: 10% supervisor/admin oversight (dashboards, user mgmt)

Optimize for mobile. Keep web simple.

---

## 📱 Mobile Application (React Native + Expo)

### Screen Flow

```
Login
  ↓
Inspector Dashboard
  ├→ Scan Product (primary)
  ├→ Upload Image
  └→ View History
     ↓
   Product Scanner
     ↓
   Capture / Gallery
     ↓
   Analysis Pipeline
     ├→ Image received
     ├→ Product identified
     ├→ Declarations extracted
     ├→ Checking compliance
     └→ Preparing report
     ↓
   Extraction Review (CRITICAL)
     ├→ Display original image
     ├→ Show extracted values
     ├→ Allow inspector edits
     └→ Confidence indicators
     ↓
   Compliance Engine
     ↓
   Compliance Result
     ├→ PASS / VIOLATION / REVIEW
     ├→ Violation breakdown
     └→ Evidence attachment
     ↓
   Inspector Review
     ├→ Final check
     ├→ Edit remarks
     └→ Confirm overall decision
     ↓
   PDF Report Generation
     ├→ Download
     ├→ Share
     └→ Save
     ↓
   Inspection History
```

### Bottom Navigation (Inspector)
- **Home**: Dashboard with quick stats
- **Inspections**: Search and filter past inspections
- **Scan**: Primary action—capture new product (visually prominent)
- **Reports**: Repository of generated PDFs
- **Profile**: Account and settings

### Key Screens

#### Dashboard
```
Good morning, [Inspector Name]

SCAN PRODUCT [Prominent CTA]
Upload Image [Secondary]

Today's Inspections: 12
├→ Compliant: 8
├→ Violations: 4
└→ Pending: 2

Recent Inspections:
  Amul Milk — COMPLIANT — 10:42 AM
  ABC Biscuits — NON-COMPLIANT — 09:18 AM
  XYZ Oil — REVIEW — 08:51 AM
```

#### Product Scanner
```
[Live Camera Feed]

"Align the package inside the frame"

Guidelines:
  • Keep label flat
  • Avoid glare
  • Ensure declarations visible
  • Capture front/back/side

✓ Product detected
✓ Label readable

[Capture Button - Large]
[Upload from Gallery]
```

#### Extraction Review (CRITICAL SCREEN)
```
[Original Product Image]

Extracted Declarations:

Product Name
"Parle-G Biscuits"
Confidence: 98%
[Edit]

Manufacturer
"Parle Products Pvt. Ltd."
Confidence: 95%
[Edit]

MRP
"₹20"
Confidence: 92%
[Edit]

[Continue to Compliance Check]
```

**The inspector MUST be able to correct any extraction. Corrections trigger re-evaluation.**

#### Compliance Result
```
✓ COMPLIANT

All checked declarations satisfy configured compliance rules.

OR

! NON-COMPLIANT

3 violations detected.

OR

? REVIEW REQUIRED

2 fields require inspector verification.

[View Details]
```

#### Violation Breakdown
```
✓ Manufacturer / Packer Details — PASS
✓ Net Quantity — PASS
✕ MRP Declaration — VIOLATION
✓ Manufacturing Date — PASS
✕ Consumer Care Details — VIOLATION
⚠ Font / Readability — REVIEW

[Each can expand to show:]
  • Issue
  • Severity (High/Medium/Low)
  • Rule ID
  • Evidence (image crop)
  • Actions: [Confirm] [Edit] [Mark Valid]
```

#### PDF Report
```
╔════════════════════════════════════╗
║  LEGAL METROLOGY                   ║
║  PACKAGED COMMODITY                ║
║  INSPECTION REPORT                 ║
╚════════════════════════════════════╝

Inspection ID:     LM-2026-000123
Date:              30 Aug 2026
Inspector:         [Name]

1. Inspection Details
2. Product Information
3. Product Photographs
4. Extracted Declarations
5. Compliance Checks
6. Violations
7. Evidence
8. Inspector Remarks
9. Final Determination
10. Signature

[Download] [Share] [Save]
```

---

## 🌐 Web Dashboard (React) — Supervisor View Only

**For hackathon**: Web is supervisor oversight dashboard (not admin panel).

If building web, includes:
- Supervisor login
- KPI stats (total inspections, compliance rate, violations)
- Recent inspections list (search, filter)
- Inspection detail view (PDF download)

**Not included**:
- User management UI (pre-seeded in DB)
- Rule configuration UI (pre-seeded in DB)
- Audit logs UI
- Fancy charts
- Advanced analytics

---

### Supervisor Dashboard (Light Theme)

#### Login
```
Supervisor Login

Email: [supervisor@example.com]
Password: [••••••]

[Sign In]

Department of Consumer Affairs
```

#### KPI Dashboard
```
Good morning, Supervisor

Total Inspections          Non-Compliant       Compliance Rate       High-Severity Violations
1,284                      312                 75.7%                 84
```

#### Recent Inspections List
```
Inspection ID          Product              Status          Violations    Inspector        Date

LM-2026-000123        Parle-G Biscuits     NON-COMPLIANT   3             Inspector 1      30 Aug 10:42 AM
LM-2026-000122        Amul Milk            COMPLIANT       0             Inspector 2      30 Aug 10:30 AM
LM-2026-000121        XYZ Oil              REVIEW          2             Inspector 1      30 Aug 10:18 AM
LM-2026-000120        Nestle Yogurt        COMPLIANT       0             Inspector 3      29 Aug 3:15 PM

[Search] [Filter by Status] [Date Range]
```

#### Inspection Detail View
```
Inspection: LM-2026-000123
Inspector: Inspector 1
Date: 30 Aug 2026, 10:42 AM

Product: Parle-G Biscuits

Declarations Found: 5 / 6
Violations: 3

Status: NON-COMPLIANT

[Download PDF Report]
[View Evidence]
```

---

## 🎨 Design System

### Color Palettes

#### Dark Theme (Mobile - WhatsApp-inspired)
```
Background:       #111B21
Surface:          #202C33
Elevated Surface: #2A3942
Primary:          #25D366 (Labelly Green)
Text:             #ECECEC
Secondary Text:   #8A8A8A
Border:           #3A4A54
Success:          #25D366
Warning:          #FFA500
Error:            #E53935
```

#### Light Theme (Web - Razorpay-inspired)
```
Background:       #FFFFFF
Surface:          #FFFFFF
Elevated Surface: #F8F9FA
Primary:          #5E6AD2 (Labelly Blue)
Text:             #1A202C
Secondary Text:   #718096
Border:           #E2E8F0
Success:          #48BB78
Warning:          #FFA500
Error:            #E53935
```

### Semantic Tokens
Never hardcode colors. Use semantic tokens:

```typescript
const theme = {
  dark: {
    colors: {
      background,
      surface,
      elevatedSurface,
      primary,
      text,
      secondaryText,
      border,
      success,
      warning,
      error
    }
  },
  light: { /* same structure */ }
}
```

### Typography

```
Headings:
  H1: 32px, weight 700, line-height 1.2
  H2: 24px, weight 700, line-height 1.3
  H3: 20px, weight 600, line-height 1.4

Body:
  Large: 16px, weight 400, line-height 1.5
  Regular: 14px, weight 400, line-height 1.5
  Small: 12px, weight 400, line-height 1.4

Font Family: System default (SF Pro Display / Segoe UI / Roboto)
```

### Spacing Scale
```
xs:  4px
sm:  8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### Border Radius
```
sm:   4px
md:   8px
lg:  12px
full: 9999px
```

### Compliance State Design

**Never rely only on color. Use icon + label + color + typography + treatment.**

```
✓ PASS
├→ Icon: checkmark (green)
├→ Label: "PASS" or "Compliant"
├→ Background: subtle green tint
├→ Typography: 600 weight
└→ Border: green accent

! VIOLATION
├→ Icon: exclamation (red)
├→ Label: "VIOLATION" or "Non-Compliant"
├→ Background: subtle red tint
├→ Typography: 600 weight
└→ Border: red accent

? REVIEW
├→ Icon: question (amber)
├→ Label: "REVIEW" or "Pending"
├→ Background: subtle amber tint
├→ Typography: 600 weight
└→ Border: amber accent
```

---

## 🧠 Gemini Integration

### Input

Send product image to Gemini with structured instructions.

### Gemini Responsibilities

- Read visible label information
- Extract declarations
- Preserve uncertainty (confidence scores)
- Do NOT invent values
- Do NOT decide legal compliance
- Return structured data

### Gemini Output Schema

```typescript
interface GeminiExtractionResponse {
  product: {
    name: string;
    category: string;
    brand: string;
  };
  
  declarations: {
    manufacturer: {
      value: string;
      confidence: number; // 0-100
      found: boolean;
    };
    packer: {
      value: string;
      confidence: number;
      found: boolean;
    };
    importer: {
      value: string;
      confidence: number;
      found: boolean;
    };
    netQuantity: {
      value: string;
      confidence: number;
      found: boolean;
    };
    mrp: {
      value: string;
      confidence: number;
      found: boolean;
    };
    manufacturingDate: {
      value: string;
      confidence: number;
      found: boolean;
    };
    consumerCare: {
      value: string;
      confidence: number;
      found: boolean;
    };
    batchNumber: {
      value: string;
      confidence: number;
      found: boolean;
    };
  };
  
  visualObservations: string[];
  uncertainFields: string[];
}
```

### Gemini System Prompt

```
You are a Legal Metrology package label analyzer.
Your task is to:
1. Analyze packaged commodity labels
2. Extract declared information accurately
3. Return only information visible in the image
4. Preserve uncertainty (confidence scores)
5. Do NOT invent missing values
6. Do NOT make legal compliance decisions

Return ONLY valid JSON matching the provided schema.
Do NOT add explanations or preamble.
```

---

## ⚖️ Compliance Rule Engine

### Architecture

```typescript
function runComplianceCheck(extractedData: ExtractionResult): ComplianceResult {
  const violations: Violation[] = [];
  const passedRules: Rule[] = [];
  const reviewRequired: ReviewItem[] = [];
  
  // Run each rule
  checkManufacturer(extractedData, violations);
  checkNetQuantity(extractedData, violations);
  checkMRP(extractedData, violations);
  checkManufacturingDate(extractedData, violations);
  checkConsumerCare(extractedData, violations);
  checkReadability(extractedData, violations, reviewRequired);
  
  // Aggregate
  const status = determineStatus(violations, reviewRequired);
  
  return {
    status,
    score: calculateComplianceScore(violations),
    violations,
    passedRules,
    reviewRequired
  };
}
```

### Example Rules

```typescript
function checkMRP(data: ExtractionResult, violations: Violation[]): void {
  if (!data.declarations.mrp.found) {
    violations.push({
      ruleId: "LM-PC-001",
      field: "mrp",
      status: "FAIL",
      severity: "HIGH",
      message: "Required MRP declaration is missing.",
      expectedValue: "Valid MRP in Indian Rupees"
    });
  }
  
  if (data.declarations.mrp.confidence < 75) {
    violations.push({
      ruleId: "LM-PC-001",
      field: "mrp",
      status: "REVIEW",
      severity: "MEDIUM",
      message: "MRP extraction confidence is low. Manual verification recommended."
    });
  }
}

function checkNetQuantity(data: ExtractionResult, violations: Violation[]): void {
  if (!data.declarations.netQuantity.found) {
    violations.push({
      ruleId: "LM-PC-002",
      field: "netQuantity",
      status: "FAIL",
      severity: "HIGH",
      message: "Required net quantity declaration is missing."
    });
  }
}

function checkReadability(
  data: ExtractionResult,
  violations: Violation[],
  reviewRequired: ReviewItem[]
): void {
  const hasVisualConcerns = data.visualObservations.some(
    obs => obs.includes("glare") || obs.includes("blur") || obs.includes("small")
  );
  
  if (hasVisualConcerns) {
    reviewRequired.push({
      field: "readability",
      status: "REVIEW",
      message: "Label readability concerns detected. Manual inspection recommended."
    });
  }
}
```

### Status Determination

```typescript
function determineStatus(violations: Violation[], review: ReviewItem[]): ComplianceStatus {
  if (violations.some(v => v.status === "FAIL")) return "NON_COMPLIANT";
  if (review.length > 0) return "REVIEW_REQUIRED";
  return "COMPLIANT";
}
```

**Key**: The rule engine is entirely deterministic. No ML/AI decisions. Easy to audit and update.

---

## 💾 Data Models

### MongoDB Collections

#### users
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  employeeId: string,
  passwordHash: string, // bcrypt
  role: "INSPECTOR" | "SUPERVISOR", // Only 2 roles
  department: string,
  active: boolean,
  createdAt: Date,
  updatedAt: Date
}

// Pre-seeded at startup:
// {
//   name: "Field Inspector 1",
//   email: "inspector1@doсa.gov.in",
//   role: "INSPECTOR",
//   passwordHash: bcrypt("demo123")
// },
// {
//   name: "Supervisor",
//   email: "supervisor@doсa.gov.in",
//   role: "SUPERVISOR",
//   passwordHash: bcrypt("demo123")
// }
```

#### inspections
```typescript
{
  _id: ObjectId,
  inspectionId: string, // LM-2026-000123
  inspectorId: ObjectId, // ref: users
  supervisorId: ObjectId, // optional
  
  product: {
    name: string,
    category: string,
    brand: string
  },
  
  images: {
    originalUrl: string,
    thumbnailUrl: string,
    uploadedAt: Date
  }[],
  
  extractedData: {
    manufacturer: string,
    packer: string,
    importer: string,
    netQuantity: string,
    mrp: string,
    manufacturingDate: string,
    consumerCare: string,
    batchNumber: string,
    otherDeclarations: object
  },
  
  extractionConfidence: {
    [key: string]: number // 0-100
  },
  
  compliance: {
    status: "COMPLIANT" | "NON_COMPLIANT" | "REVIEW_REQUIRED",
    score: number, // 0-100
    violations: Violation[],
    passedRules: string[],
    reviewRequired: ReviewItem[]
  },
  
  inspectorEdits: {
    field: string,
    before: string,
    after: string,
    editedAt: Date
  }[],
  
  remarks: string,
  
  reportUrl: string,
  reportGeneratedAt: Date,
  
  status: "DRAFT" | "SUBMITTED" | "APPROVED",
  
  createdAt: Date,
  updatedAt: Date
}
```

#### rules
```typescript
{
  _id: ObjectId,
  ruleId: string, // LM-PC-001
  title: string,
  category: string, // "declarations", "formatting", "readability"
  description: string,
  severity: "HIGH" | "MEDIUM" | "LOW",
  enabled: boolean,
  version: number,
  createdAt: Date,
  updatedAt: Date
}
```

#### auditLogs
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  action: string, // INSPECTION_CREATED, EXTRACTION_EDITED, REPORT_GENERATED
  entityType: string, // inspection
  entityId: ObjectId,
  before: object,
  after: object,
  timestamp: Date,
  ipAddress: string
}
```

---

## 🔗 API Design

### Shared API Client (@labelly/shared)

Both mobile and web use the same API client configured in `packages/shared/src/api/client.ts`:

```typescript
// @labelly/shared/api/client.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  timeout: 10000
});

// Add auth interceptor
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem("authToken"); // or AsyncStorage for mobile
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

Then both apps import and use:

```typescript
// apps/mobile or apps/web
import { apiClient } from "@labelly/shared/api";

const response = await apiClient.get("/api/inspections");
```

---

### Authentication

```
POST /api/auth/login
├→ Body: { email, password }
├→ Response: { token, user, role }
└→ No auth required

POST /api/auth/logout
└→ Auth required
```

### Inspections

```
POST /api/inspections
├→ Create new inspection
├→ Auth: INSPECTOR+
├→ Body: { productCategory, notes }
└→ Response: { inspectionId, _id }

POST /api/inspections/:id/images
├→ Upload product image
├→ Auth: INSPECTOR+
├→ Body: FormData { image }
└→ Response: { imageUrl, imageId }

POST /api/inspections/:id/analyze
├→ Trigger Gemini analysis
├→ Auth: INSPECTOR+
├→ Calls Gemini, returns extraction
└→ Response: { extraction, confidence }

PATCH /api/inspections/:id
├→ Update extracted data / remarks
├→ Auth: INSPECTOR+
├→ Body: { extractedData, remarks }
├→ Triggers re-evaluation
└→ Response: { inspection, updatedCompliance }

POST /api/inspections/:id/recheck
├→ Re-run compliance without re-analysis
├→ Auth: INSPECTOR+
└→ Response: { compliance }

GET /api/inspections/:id
├→ Fetch single inspection
├→ Auth: INSPECTOR+ (own), SUPERVISOR+ (team), ADMIN (any)
└→ Response: { inspection }

GET /api/inspections
├→ List inspections (paginated)
├→ Auth: INSPECTOR+ (own), SUPERVISOR+ (team), ADMIN (system)
├→ Query: { page, limit, status, date, product }
└→ Response: { inspections, total, page, limit }

GET /api/inspections/mine
├→ List current user's inspections
├→ Auth: INSPECTOR+
└→ Response: { inspections }
```

### Reports

```
POST /api/inspections/:id/report
├→ Generate PDF report
├→ Auth: INSPECTOR+
├→ Response: { reportUrl, reportId }

GET /api/inspections/:id/report
├→ Fetch PDF report
├→ Auth: INSPECTOR+ (own), SUPERVISOR+ (team), ADMIN (any)
└→ Response: PDF download

GET /api/reports
├→ List reports
├→ Auth: INSPECTOR+ (own), SUPERVISOR+ (team), ADMIN (all)
└→ Response: { reports }
```

### Dashboard

```
GET /api/dashboard/stats
├→ KPI metrics
├→ Auth: SUPERVISOR+
└→ Response: { totalInspections, compliant, nonCompliant, highSeverity }

GET /api/dashboard/violations
├→ Top violations
├→ Auth: SUPERVISOR+
└→ Response: { violations: [ { title, count } ] }

GET /api/dashboard/inspector-performance
├→ Inspector stats
├→ Auth: SUPERVISOR+
└→ Response: { inspectors: [ { name, inspectionCount, complianceRate } ] }
```



---

## 🔐 Security

### Authentication

- **JWT tokens** with 24-hour expiry
- **Refresh tokens** (optional, for extended sessions)
- **Secure password hashing** (bcrypt, 12 rounds)
- **Rate limiting** on login endpoint

### Authorization

- **Express middleware** enforces RBAC on every endpoint
- **Never trust frontend permissions**
- All data queries filtered by role/ownership

```typescript
// Middleware
const requireRole = (allowedRoles: ("INSPECTOR" | "SUPERVISOR")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

// Usage
router.post("/inspections", requireRole(["INSPECTOR", "SUPERVISOR"]), createInspection);
router.get("/dashboard/stats", requireRole(["SUPERVISOR"]), getDashboardStats);
```

### Data Security

- **Gemini API key** stored only in backend environment variables
- **Never expose** credentials in frontend code
- **File validation**: Type + size checks before upload
- **Secure file storage**: Private bucket access
- **Input validation**: Sanitize all user inputs

### Audit Trail

- **Log all actions**: Creation, edits, deletions, report generation
- **Track data changes**: Before/after values
- **Inspector edit history**: Visible in extraction review
- **Immutable compliance records**: No retroactive changes without audit

---

## 📡 Offline / Field Mode

### Architecture

Inspectors may have poor connectivity. Design for graceful offline experience.

```
Online
├→ Scan & Gemini analysis (requires network)
├→ Immediate compliance check
└→ Upload to server

Offline
├→ Take photo (local)
├→ Store as draft locally
├→ Show "Pending Sync" indicator
├→ Queue for upload when online
└→ Offline cannot trigger Gemini

Draft Inspection (LocalStorage / AsyncStorage)
{
  inspectionId: string,
  images: [],
  status: "DRAFT",
  syncStatus: "PENDING",
  createdAt: Date
}
```

### UI Indicators

```
[Offline Banner]

You are offline. 3 inspections waiting to sync.

When online, inspections will upload automatically.

Tap to retry now.
```

### Sync Queue

```typescript
// React Native AsyncStorage
await AsyncStorage.setItem("draftInspections", JSON.stringify(drafts));

// When online
useEffect(() => {
  if (isOnline && draftInspections.length > 0) {
    draftInspections.forEach(draft => {
      uploadInspection(draft);
    });
  }
}, [isOnline]);
```

---

## ⚠️ Error States & Handling

Never silently fail. Always show actionable errors.

### Blurry Image

```
We couldn't read the label clearly.

Try:
  • Move closer
  • Clean camera lens
  • Reduce camera shake
  • Improve lighting

[Retake Photo]
[Enter Manually]
```

### Glare / Reflection

```
The image has too much glare.

Try:
  • Adjust camera angle
  • Reduce surrounding light
  • Avoid direct sunlight
  • Tilt package slightly

[Retake Photo]
```

### Low Confidence Extraction

```
We're not confident about some declarations.

Confidence below 75%:
  • MRP (62%)
  • Consumer Care (68%)

Please review and edit if needed.

[Review & Edit]
[Accept & Continue]
```

### Gemini Failure

```
Failed to analyze image. Please try again.

If this persists:
  • Check internet connection
  • Try a different angle
  • Contact support

[Retry]
[Upload Manually]
[Contact Support]
```

### Network Failure

```
No internet connection.

This inspection has been saved locally and will sync when you're online.

Inspection ID: LM-DRAFT-001
Status: Pending Sync

[Retry]
[Continue Offline]
```

### PDF Generation Failure

```
Failed to generate PDF report.

Your inspection is saved. Try again:

[Retry]
[Save & Report Later]
[Contact Support]
```

---

## 🏗️ Project Structure

```
labelly/
├── apps/
│   ├── mobile/
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── DashboardScreen.tsx
│   │   │   │   ├── ScannerScreen.tsx
│   │   │   │   ├── ExtractionReviewScreen.tsx
│   │   │   │   ├── ComplianceResultScreen.tsx
│   │   │   │   ├── ViolationDetailsScreen.tsx
│   │   │   │   ├── ReportScreen.tsx
│   │   │   │   ├── HistoryScreen.tsx
│   │   │   │   └── ProfileScreen.tsx
│   │   │   ├── components/ (mobile-specific layout)
│   │   │   │   ├── BottomTab.tsx
│   │   │   │   ├── MobileHeader.tsx
│   │   │   │   └── MobileCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts (shared or mobile-specific)
│   │   │   │   ├── useTheme.ts
│   │   │   │   ├── useInspection.ts
│   │   │   │   ├── useOffline.ts
│   │   │   │   └── useCamera.ts (mobile-specific)
│   │   │   ├── services/
│   │   │   │   ├── storage.ts (AsyncStorage for mobile)
│   │   │   │   ├── sync.ts (draft sync)
│   │   │   │   └── camera.ts (mobile camera)
│   │   │   ├── theme/ (import from @labelly/shared)
│   │   │   ├── App.tsx
│   │   │   ├── Navigation.tsx (React Navigation)
│   │   │   └── index.tsx
│   │   ├── app.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx (KPI cards)
│       │   │   └── InspectionsPage.tsx (Search, filter, list)
│       │   ├── components/ (web-specific layout)
│       │   │   ├── Layout/
│       │   │   │   ├── Header.tsx
│       │   │   │   └── Sidebar.tsx (minimal)
│       │   │   ├── Dashboard/
│       │   │   │   ├── KPICards.tsx
│       │   │   │   └── RecentInspections.tsx
│       │   │   └── Common/
│       │   │       ├── InspectionTable.tsx
│       │   │       └── Badge.tsx
│       │   ├── hooks/
│       │   │   ├── useAuth.ts (shared)
│       │   │   └── useDashboard.ts
│       │   ├── services/
│       │   │   └── imported from @labelly/shared
│       │   ├── theme/ (import from @labelly/shared)
│       │   ├── App.tsx
│       │   ├── index.tsx
│       │   └── styles.css
│       ├── package.json (with @labelly/shared dependency)
│       └── tsconfig.json
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── inspections.ts
│   │   │   ├── reports.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── rules.ts
│   │   │   ├── admin.ts
│   │   │   └── audit.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts
│   │   ├── controllers/
│   │   │   ├── inspectionController.ts
│   │   │   ├── geminiController.ts
│   │   │   ├── complianceController.ts
│   │   │   └── reportController.ts
│   │   ├── services/
│   │   │   ├── inspectionService.ts
│   │   │   ├── geminiService.ts
│   │   │   ├── complianceService.ts
│   │   │   ├── reportService.ts
│   │   │   ├── authService.ts
│   │   │   └── storageService.ts
│   │   ├── rules/
│   │   │   ├── ruleEngine.ts
│   │   │   ├── declarationRules.ts
│   │   │   └── formatRules.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Inspection.ts
│   │   │   ├── Rule.ts
│   │   │   └── AuditLog.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── inspection.ts
│   │   │   ├── compliance.ts
│   │   │   └── gemini.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── api.ts
│   │   │   │   ├── inspection.ts
│   │   │   │   ├── compliance.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── gemini.ts
│   │   │   ├── validation/
│   │   │   │   ├── inspection.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── compliance.ts
│   │   │   ├── constants/
│   │   │   │   ├── rules.ts
│   │   │   │   ├── roles.ts
│   │   │   │   └── severities.ts
│   │   │   ├── api/
│   │   │   │   ├── client.ts (shared axios/fetch instance config)
│   │   │   │   ├── endpoints.ts
│   │   │   │   └── interceptors.ts
│   │   │   ├── theme/
│   │   │   │   ├── colors.ts (dark + light palettes)
│   │   │   │   ├── spacing.ts
│   │   │   │   ├── typography.ts
│   │   │   │   └── tokens.ts (semantic)
│   │   │   └── utils/
│   │   │       ├── formatters.ts
│   │   │       └── validators.ts
│   │   └── package.json
│   │
│   └── rules/
│       ├── src/
│       │   ├── index.ts
│       │   ├── engine.ts (rule runner)
│       │   ├── rules/
│       │   │   ├── declarations.ts
│       │   │   ├── formatting.ts
│       │   │   └── index.ts
│       │   └── types.ts
│       └── package.json
│
├── README.md
├── .gitignore
└── package.json (monorepo root)
```

---

## 🔗 Code Sharing Strategy (Monorepo)

### What's Shared

Both mobile and web import from `@labelly/shared`:

```typescript
// Both mobile and web
import { 
  type Inspection, 
  type ComplianceResult,
  type User
} from "@labelly/shared/types";

import { 
  inspectionValidation,
  userValidation
} from "@labelly/shared/validation";

import {
  API_ENDPOINTS,
  USER_ROLES,
  VIOLATION_SEVERITIES
} from "@labelly/shared/constants";

import {
  theme,
  colors,
  spacing,
  typography
} from "@labelly/shared/theme";

import { apiClient } from "@labelly/shared/api";
```

### What's NOT Shared

**Mobile-specific**:
- Screen layouts (mobile navigation)
- Camera integration (camera.ts, useCamera hook)
- AsyncStorage / offline sync
- React Navigation setup
- Mobile-specific styling

**Web-specific**:
- Page layouts (web dashboard, tables)
- React Router setup
- Desktop navigation (sidebar, header)
- Chart libraries
- Admin interfaces

### Monorepo Dependencies

```json
// apps/mobile/package.json
{
  "dependencies": {
    "@labelly/shared": "*",
    "@labelly/rules": "*",
    "react-native": "...",
    "expo": "...",
    "react-native-camera": "...",
    "@react-navigation/native": "..."
  }
}

// apps/web/package.json
{
  "dependencies": {
    "@labelly/shared": "*",
    "@labelly/rules": "*",
    "react": "...",
    "react-router-dom": "...",
    "recharts": "..."
  }
}
```

### Why This Matters for Hackathon

- **1 set of types** (no drift)
- **1 API client config** (auth, interceptors, base URL)
- **1 validation library** (consistent rules)
- **1 theme definition** (design tokens)
- **1 rule engine** (@labelly/rules)

Build once, use everywhere. This cuts development time by ~30%.

---

## 📊 Data Flow (End-to-End)

```
1. MOBILE: Inspector captures product image
2. MOBILE: Upload image to server
3. SERVER: Validate file (type, size, format)
4. SERVER: Store image in cloud storage
5. SERVER: Call Gemini API with image URL
6. GEMINI: Analyze image, extract declarations
7. SERVER: Receive extraction result
8. SERVER: Validate Gemini response
9. SERVER: Save extraction to DB
10. MOBILE: Display extracted values (with confidence)
11. MOBILE: Inspector reviews and edits if needed
12. MOBILE: Inspector confirms
13. SERVER: Receive edited extraction
14. SERVER: Run compliance rule engine
15. SERVER: Determine compliance status
16. SERVER: Save compliance result to DB
17. MOBILE: Display compliance result
18. MOBILE: Show violation breakdown
19. MOBILE: Inspector adds remarks
20. SERVER: Generate PDF report
21. SERVER: Store PDF in cloud storage
22. MOBILE: Display downloadable report
23. SERVER: Save to inspection history
24. SERVER: Log audit trail
25. MOBILE: Inspector can view in history
```

---

## 🎬 Hackathon Demo Flow (Mobile Only)

**Target**: 60–90 seconds on actual phone

```
[0s]  Splash screen fades
  └→ Shows: "Labelly — Scan. Verify. Enforce."

[2s]  Login (pre-login as Inspector)
  └→ Tap Sign In
  └→ Shows: Inspector Dashboard

[5s]  Inspector Dashboard
  └→ "Good morning, Inspector"
  └→ Stats card: Today's inspections: 12, Compliant: 8, Violations: 4
  └→ Prominent "SCAN PRODUCT" button

[8s]  Product Scanner Screen
  └→ Live camera feed shows
  └→ Text: "Align the package inside the frame"
  └→ Detection indicators: ✓ Product detected, ✓ Label readable

[12s] Capture Action
  └→ Tap large blue CAPTURE button
  └→ Camera flash/sound
  └→ Image captured

[15s] Analysis Pipeline (Loading Screen)
  ```
  ✓ Image received
  ✓ Product identified
  ✓ Declarations extracted
  ● Checking compliance
  ○ Preparing report
  ```

[25s] Extraction Review (CRITICAL MOMENT)
  └→ Original product photo displays
  └→ Shows extracted data:
      • Product Name: "Parle-G Biscuits" (98% confidence)
      • Manufacturer: "Parle Products" (95%)
      • MRP: "₹20" (92%)
      • Net Quantity: "79.5g" (97%)
      • Manufacturing Date: "08/2026" (94%)
      • Consumer Care: [NOT FOUND]
  └→ Tap "Continue to Compliance"

[35s] Compliance Result
  ```
  ! NON-COMPLIANT
  
  2 violations detected
  ```
  └→ Tap "View Violations"

[40s] Violation Breakdown
  ```
  ✓ Manufacturer Details — PASS
  ✓ Net Quantity — PASS
  ✓ MRP Declaration — PASS
  ✕ Consumer Care — VIOLATION (HIGH)
  ⚠ Readability — REVIEW (MEDIUM)
  ```
  └→ Tap on "Consumer Care" violation

[45s] Violation Details
  ```
  Consumer Care Details
  
  Why flagged:
  Required declaration could not be verified.
  
  Rule: LM-PC-005
  Severity: HIGH
  
  Evidence: [Image crop of label]
  ```
  └→ Tap "Confirm Violation"

[50s] Review & Remarks Screen
  ```
  Inspection Review
  
  Declarations found: 5 / 6
  Violations: 2
  
  [Text field for remarks]
  "Inspector observed label clarity issues..."
  
  Overall: NON-COMPLIANT
  ```
  └→ Tap "Generate Report"

[60s] PDF Report Generated
  ```
  [Professional PDF preview]
  
  LEGAL METROLOGY
  PACKAGED COMMODITY INSPECTION REPORT
  
  Inspection ID: LM-2026-000123
  Date: 30 Aug 2026
  Inspector: Aravind Kumar
  ```
  └→ Show: [Download] [Share] buttons

[75s] Inspection Saved
  ```
  ✓ Inspection Complete
  
  Report saved locally
  LM-2026-000123
  
  [Back to Dashboard]
  ```

[80s] Return to Dashboard
  ```
  Good morning, Inspector Aravind
  
  Today's Inspections: 13 ← Updated
  Compliant: 8
  Violations: 5 ← Updated
  
  Recent:
  Parle-G Biscuits — NON-COMPLIANT — Just now
  ```

[90s] End Demo
```

**Key moments judges see**:
1. Real camera capture (not fake)
2. AI extraction with confidence scores
3. Inspector editing capability
4. Deterministic compliance rules
5. Clear violation explanation
6. Professional PDF report
7. Complete audit trail

---

## 🎯 MVP Scope (Hackathon, 2-Role Model)

### Mobile (MUST-HAVE for Demo)
- ✅ Inspector login + dashboard
- ✅ Product image capture (camera)
- ✅ Image upload from gallery
- ✅ Gemini-powered extraction
- ✅ Extraction review & edit
- ✅ Deterministic compliance checking
- ✅ Violation detection with evidence
- ✅ PDF report generation
- ✅ Inspection history / search
- ✅ Dark theme (mobile-optimized)
- ✅ Offline draft saves (if time)

### Web (OPTIONAL / Nice-to-Have)
- 🟡 Supervisor login
- 🟡 KPI dashboard (total inspections, compliance rate, violations)
- 🟡 Recent inspections list (search, filter)
- 🟡 Inspection detail + PDF download
- 🟡 Light theme

### NOT Needed (Pre-Seeded in DB Instead)
- ❌ User management UI (create supervisor/inspector accounts at startup)
- ❌ Rule configuration UI (rules pre-seeded)
- ❌ Audit logs UI
- ❌ Admin panel
- ❌ Advanced analytics
- ❌ Geographic breakdowns
- ❌ Bulk imports

**Focus**: Mobile inspector workflow rock-solid. Web is optional supervisor dashboard.

---

## ⚡ Implementation Priorities (Mobile-First)

### Phase 1 (Core Mobile Demo) — CRITICAL
1. Backend: User auth (JWT) + DB seed script
2. Backend: File storage setup (Firebase/S3)
3. Mobile: Login screen
4. Mobile: Camera + image upload
5. Backend: Gemini integration + extraction
6. Mobile: Extraction review screen
7. Backend: Compliance rule engine (deterministic)
8. Mobile: Compliance result display
9. Mobile: Violation breakdown with evidence
10. Backend: PDF report generation
11. Mobile: PDF download/share
12. Mobile: Inspection history storage

### Phase 2 (Polish Mobile) — BEFORE DEMO
13. Mobile: Dark theme (field-friendly)
14. Mobile: Error state handling
15. Mobile: Loading states
16. Mobile: Offline draft saves (AsyncStorage)
17. Mobile: Bottom tab navigation
18. Backend: DB seed script (pre-populate users, rules)

### Phase 3 (Web Dashboard) — Nice-to-Have
19. Web: Login page (supervisor role only)
20. Web: KPI dashboard (total, compliant, non-compliant)
21. Web: Inspection list + search
22. Web: Inspection detail view + PDF download
23. Web: Light theme

### NOT Needed for Hackathon
- ❌ User management UI
- ❌ Rule configuration UI
- ❌ Admin panel
- ❌ Audit log UI

---

## 🛡️ Security Checklist

- [ ] JWT authentication implemented
- [ ] RBAC middleware on all endpoints
- [ ] Gemini API key never exposed to frontend
- [ ] Input validation on all endpoints
- [ ] File type + size validation
- [ ] Secure password hashing (bcrypt 12 rounds)
- [ ] SQL injection prevention (using ODM)
- [ ] CORS properly configured
- [ ] Rate limiting on auth endpoints
- [ ] Secure file storage (private bucket)
- [ ] HTTPS in production
- [ ] Environment variables for secrets
- [ ] Audit logging of all actions
- [ ] Inspector edit tracking
- [ ] Error messages don't leak system info

---

## 🚀 Getting Started (Hackathon Fast Path)

### Prerequisites
- Node.js 18+
- MongoDB (use MongoDB Atlas free tier)
- Google Gemini API key
- Firebase Storage or AWS S3 (free tier fine)
- Actual phone with Expo Go app installed

### Setup (Start Here)

**Terminal 1: Backend**
```bash
cd server
cp .env.example .env
# Fill in:
#   MONGO_URI=mongodb+srv://...
#   GEMINI_API_KEY=...
#   JWT_SECRET=your_random_secret_here
#   FIREBASE_STORAGE_BUCKET=...
#   PORT=5000
npm install
npm run dev
# → Backend running on http://localhost:5000
```

**Terminal 2: Mobile (Main Demo)**
```bash
cd apps/mobile
npm install
# .env: REACT_APP_API_URL=http://localhost:5000
npx expo start

# Output shows QR code
# On your phone: Open Expo Go app
# Scan QR code
# App loads in 5 seconds
```

**That's it for MVP demo.** Web is optional.

---

### Setup Web (If Time Allows)

**Terminal 3: Web Dashboard**
```bash
cd apps/web
npm install
# .env: REACT_APP_API_URL=http://localhost:5000
npm run dev
# → http://localhost:3000 (Supervisor dashboard)
```

---

### Pre-Seed Data (Recommended)

Before demo, pre-populate DB with test data:

```bash
cd server
npm run seed

# Creates:
# - Inspector user (email: inspector@example.com, password: demo123)
# - Supervisor user
# - 5 sample inspections (various states)
# - Compliance rules (LM-PC-001, LM-PC-002, etc.)
```

Then login with inspector credentials. No need to manually create users during demo.

---

### Mobile Testing Flow

1. Start Expo: `npx expo start` in `apps/mobile`
2. Scan QR code with Expo Go on real phone
3. App loads
4. Tap "SCAN PRODUCT"
5. Point phone at actual packaged food product
6. Capture photo
7. Watch Gemini extract declarations
8. Review, confirm violations
9. Generate PDF report

**Real phone camera is MUCH better for demo than emulator.**

---

## 📝 License

SIH 2026 Hackathon Project  
Ministry of Consumer Affairs, Food & Public Distribution

---

## 🤝 Team Notes

### Demo Emphasis
The hackathon demo is the most critical deliverable. Prioritize the scan-to-compliance flow. Everything else is secondary.

### Design Philosophy
- **AI assists. Rules decide. Humans verify.**
- Never present AI output as legal truth.
- Every violation must be explainable with a rule reference.
- Evidence matters.

### What Makes This Credible
- Deterministic compliance rules (auditable)
- Inspector edit capability (transparent)
- PDF reports that look official
- RBAC enforcement (not just UI hiding)
- Audit trail (accountability)

---

## 🎯 Hackathon Strategy Summary (2-Role Model)

### What to Build (Priority Order)

1. **Backend (2 people, 4–5 days)**
   - Express API + MongoDB setup
   - JWT auth middleware
   - DB seed script (create 2–3 test inspector + 1 supervisor account)
   - Gemini integration (image → structured extraction)
   - Compliance rule engine (deterministic checks)
   - PDF report generation
   - File storage integration (Firebase/S3)

2. **Mobile App (2–3 people, 4–5 days)**
   - React Native + Expo setup
   - Login screen (pre-populated users)
   - Camera capture + image upload
   - Extraction review screen
   - Compliance result display
   - Violation breakdown with evidence
   - PDF download/share
   - Inspection history / search
   - Dark theme (field-optimized)
   - Loading/error states
   - Offline draft saves (AsyncStorage)

3. **Web Dashboard (1 person, 2–3 days, OPTIONAL)**
   - Supervisor login (pre-populated)
   - KPI cards (total, compliant, non-compliant, high-severity)
   - Recent inspections table (search, filter, sort)
   - Inspection detail view (PDF download)
   - Light theme
   - **Only build if mobile is 100% solid**

### What NOT to Build

- ❌ User management UI (use DB seed instead)
- ❌ Rule configuration UI (rules pre-seeded)
- ❌ Admin panel
- ❌ Audit log UI
- ❌ Multi-language support
- ❌ Fancy charts
- ❌ Advanced analytics
- ❌ Signature capture
- ❌ Barcode scanning

### Demo Emphasis

- **Real phone camera** (Expo Go on actual device)
- **Real packaged product** (bring demo packaged food)
- **Real Gemini extraction** (live API call)
- **Clear violation explanation** (rule ID, severity, evidence)
- **Professional PDF report** (looks like official document)
- **Fast flow** (60–90 seconds, scan → result → PDF)

### Success Metrics for Judges

**MUST-HAVE (Demo Blocker)**:
- ✅ Real phone camera captures product image
- ✅ Gemini extracts declarations with confidence scores
- ✅ Inspector can review and edit extractions
- ✅ Compliance engine deterministically finds violations
- ✅ PDF report looks professional/official
- ✅ App doesn't crash during demo

**NICE-TO-HAVE** (If Time Allows):
- 🟡 Offline draft saves
- 🟡 Web supervisor dashboard
- 🟡 Inspection history search/filter
- 🟡 Dark theme polish

**YOU DON'T NEED**:
- ❌ Perfect UI animations
- ❌ Admin user management
- ❌ Advanced charts
- ❌ Multi-language support
- ❌ Bulk operations

**Demo Focus**: Scan packaged product → Gemini extracts → Inspector reviews → Rules check → Violations found → PDF report. That's it. Make that flow bulletproof.

---

## 🚀 Maximum Optimization (48-Hour Demo Path)

If you need to ship in **2–3 days** instead of 5, cut:

### 1. **Cut Offline Drafts** (Saves 1–2 days)
```
Currently: AsyncStorage draft saves + sync queue
Simplified: Assume always online
            If no internet: "Please connect to internet"
```
❌ Remove: `useOffline.ts`, `sync.ts`, AsyncStorage logic  
✅ Keep: Only real inspections (uploaded to server immediately)

### 2. **Cut Extraction Editing** (Saves 0.5 days)
```
Currently: Inspector can edit any extracted field + re-check compliance
Simplified: Inspector REVIEWS ONLY (no editing)
            If wrong, inspector marks as "verified" or "needs review"
```
❌ Remove: Edit fields UI, re-compliance logic  
✅ Keep: Review screen showing extracted values (read-only)

### 3. **Cut Inspection History Search** (Saves 0.5 days)
```
Currently: Full inspection history with search/filter
Simplified: Show "Last 10 Inspections" on dashboard only
            No search, no filter, reverse chronological
```
❌ Remove: Search UI, pagination, advanced filtering  
✅ Keep: Simple list on dashboard

### 4. **Cut Inspection Remarks/Comments** (Saves 0.5 days)
```
Currently: Inspector can add text remarks
Simplified: Skip remarks entirely
            Final decision is just: COMPLIANT / NON-COMPLIANT
```
❌ Remove: Remarks text field, remarks UI  
✅ Keep: Just compliance status

### 5. **Simplify PDF Report** (Saves 1 day)
```
Currently: 10 sections (inspection details, product info, photos, declarations, checks, violations, evidence, remarks, determination, signature)
Simplified: 5 sections only
```
PDF sections:
1. Header (Inspection ID, Date, Inspector)
2. Product (Name, Category, Photo)
3. Declarations (Extracted values, confidence)
4. Violations (Title, severity, rule ID)
5. Footer (Final determination)

Use simple HTML-to-PDF (jsreport or html2pdf.js) instead of ReportLab.

### 6. **Cut Web Dashboard Entirely** (Saves 2–3 days)
```
For demo: Show ONLY mobile inspector app
Message: "Supervisor dashboard pre-built for production oversight"
         (Don't actually build it for hackathon)
```

### 7. **Single Image Per Inspection** (Saves 0.5 days)
```
Currently: Inspector can upload multiple images (front, back, side, etc.)
Simplified: One image per inspection maximum
```
❌ Remove: Multi-image carousel, image management  
✅ Keep: Single camera capture or single gallery upload

### 8. **Hardcode Compliance Rules** (Saves 0.5 days)
```
Currently: Rule engine with 10+ configurable rules loaded from DB
Simplified: 5 hardcoded rules in TypeScript
```
Rules:
```typescript
const rules = [
  { id: "LM-PC-001", name: "Manufacturer", required: true },
  { id: "LM-PC-002", name: "Net Quantity", required: true },
  { id: "LM-PC-003", name: "MRP", required: true },
  { id: "LM-PC-004", name: "Manufacturing Date", required: true },
  { id: "LM-PC-005", name: "Consumer Care", required: true }
];
```

No DB lookup. No rule config. Just check if these 5 exist in Gemini extraction.

### 9. **Mobile Dark Theme Only** (Saves 0.5 days)
```
Currently: Dark + Light themes with toggle
Simplified: Dark theme ONLY (WhatsApp-style)
            No theme switcher, no system detection
```
❌ Remove: Theme toggle, light theme colors, theme context complexity  
✅ Keep: Dark colors only

### 10. **Simplify Error Handling** (Saves 0.5 days)
```
Currently: 10+ specific error states (blurry, glare, partial, unsupported, etc.)
Simplified: 3 main error states
```
1. **Bad Image** → "Take another photo. Ensure label is clear."
2. **Network Error** → "Check internet connection."
3. **Gemini Failed** → "Processing failed. Try again."

---

## ⏱️ Time Breakdown (48-Hour Path)

```
Day 1 (12 hours)
├─ Backend setup + JWT auth (2h)
├─ Gemini integration (3h)
├─ Hardcoded compliance rules (2h)
├─ Simple PDF generation (2h)
└─ DB seed + file storage (3h)

Day 2 (12 hours)
├─ Mobile: Login + Camera (3h)
├─ Mobile: Extraction review (2h)
├─ Mobile: Compliance result display (2h)
├─ Mobile: PDF download (1h)
├─ Mobile: Dashboard (2h)
└─ Mobile: Error handling (2h)

Day 3 (12 hours, Polish + Demo Prep)
├─ Mobile: Dark theme polish (2h)
├─ Mobile: Loading states (1h)
├─ Mobile: Testing on real device (2h)
├─ Backend: Edge case fixes (2h)
├─ Demo script + pre-seed data (2h)
└─ Buffer (1h)
```

Total: ~36 hours → 48 hours with testing

---

## What You Actually Need for Demo

✅ **Absolute Minimum**:
1. Inspector login screen (2 pre-seeded users)
2. Camera capture (real photo)
3. Gemini extraction (5 fields only)
4. Compliance check (5 hardcoded rules)
5. Violation list (show which rules failed)
6. PDF download (simple 5-section report)

That's it. Everything else is bonus.

---

## Alternative: Skip Gemini, Use Mock Data

If Gemini integration is too slow:

```typescript
// Mock extraction for demo
const mockExtraction = {
  manufacturer: "Parle Products Pvt. Ltd.",
  netQuantity: "79.5g",
  mrp: "₹20",
  manufacturingDate: "08/2026",
  consumerCare: null // Missing - violation!
};

// For real demo: Show image + pre-extracted data
// Then show compliance result
// (Judges won't know it's mock if flow is smooth)
```

This cuts Gemini integration time to **0** and lets you demo in 2 days.

---

**Recommendation**: Implement hardcoded rules + mock extraction first. Get the complete demo working. Then add real Gemini if time permits.

---

**Last Updated**: 30 Aug 2026  
**Status**: Mobile-first MVP ready for SIH 2026 (48-hour accelerated path available)
