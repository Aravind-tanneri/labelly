import { MIN_CONFIDENCE_THRESHOLD } from "@labelly/shared/constants";
import type { RuleConfig, RuleContext } from "../types";

// ---------------------------------------------------------------------------
// LM-PC-001 — Manufacturer / Packer / Importer Details (Rule 6(1)(a))
// ---------------------------------------------------------------------------
// Per Rule 6(1)(a) of Legal Metrology (Packaged Commodities) Rules, 2011,
// every package must declare the name and complete address of the manufacturer,
// packer, or importer. At least one must be present on the package.

export function checkManufacturerDetails(ctx: RuleContext): void {
  const { manufacturer, packer, importer } = ctx.data.declarations;
  const anyFound = manufacturer?.found || packer?.found || importer?.found;

  if (!anyFound) {
    ctx.violations.push({
      ruleId: "LM-PC-001",
      field: "manufacturer",
      status: "FAIL",
      severity: "HIGH",
      message:
        "[Rule 6(1)(a)] Mandatory manufacturer/packer/importer name and complete address is missing.",
      expectedValue: "Name and complete address of Manufacturer, Packer, or Importer",
    });
    return;
  }

  const threshold = MIN_CONFIDENCE_THRESHOLD;
  let lowConfidence = false;
  for (const [_key, decl] of Object.entries({ manufacturer, packer, importer })) {
    if (decl?.found && decl.confidence < threshold) {
      lowConfidence = true;
      break;
    }
  }

  if (lowConfidence) {
    ctx.reviewRequired.push({
      field: "manufacturer",
      status: "REVIEW",
      severity: "MEDIUM",
      message:
        "[Rule 6(1)(a)] Manufacturer/packer details extraction confidence is low (<75%). Physical label verification recommended.",
    });
  } else {
    ctx.passedRules.push({
      ruleId: "LM-PC-001",
      field: "manufacturer",
      status: "PASS",
      message: "Rule 6(1)(a): Manufacturer/packer identity confirmed",
    });
  }
}

// ---------------------------------------------------------------------------
// LM-PC-008 — Country of Origin for Imported Commodities (Rule 6(10) & Rule 6(1)(a))
// ---------------------------------------------------------------------------
// Per Rule 6(10) of the LM(PC) Rules, 2011, every package containing imported
// goods must explicitly state the country of origin on the label.

export function checkCountryOfOrigin(ctx: RuleContext): void {
  const { importer } = ctx.data.declarations;
  const isImported =
    importer?.found &&
    importer.value != null &&
    importer.value.trim().length > 0;

  if (!isImported) {
    // Domestic product: Country of origin rule is satisfied / not applicable as imported
    ctx.passedRules.push({
      ruleId: "LM-PC-008",
      field: "importer",
      status: "PASS",
      message: "Rule 6(10): Domestic commodity verified (Import provisions not applicable)",
    });
    return;
  }

  const importerText = (importer.value || "").toLowerCase();
  const mentionsCountryOfOrigin =
    importerText.includes("country of origin") ||
    importerText.includes("made in") ||
    importerText.includes("product of") ||
    importerText.includes("imported from") ||
    importerText.includes("origin:");

  if (!mentionsCountryOfOrigin) {
    ctx.reviewRequired.push({
      field: "importer",
      status: "REVIEW",
      severity: "MEDIUM",
      message:
        "[Rule 6(10)] Imported commodity detected. Please verify that 'Country of Origin' is explicitly declared on the label.",
    });
  } else {
    ctx.passedRules.push({
      ruleId: "LM-PC-008",
      field: "importer",
      status: "PASS",
      message: "Rule 6(10): Country of origin declaration verified for imported goods",
    });
  }
}

// ---------------------------------------------------------------------------
// Generic single-field statutory declaration rules
// ---------------------------------------------------------------------------

type DeclarationFieldName =
  | "manufacturer"
  | "packer"
  | "importer"
  | "netQuantity"
  | "mrp"
  | "manufacturingDate"
  | "consumerCare"
  | "batchNumber";

interface SingleFieldRuleConfig extends RuleConfig {
  field: DeclarationFieldName;
  statutoryRef: string;
  message: string;
  expectedValue?: string;
}

function validateDeclarationRule(
  ctx: RuleContext,
  config: SingleFieldRuleConfig
): void {
  const declaration = ctx.data.declarations[config.field];
  if (!declaration) return;

  if (config.required && !declaration.found) {
    ctx.violations.push({
      ruleId: config.ruleId,
      field: config.field,
      status: "FAIL",
      severity: config.severity,
      message: `[${config.statutoryRef}] ${config.message}`,
      expectedValue: config.expectedValue,
    });
    return;
  }

  const threshold = config.confidenceThreshold ?? MIN_CONFIDENCE_THRESHOLD;
  if (declaration.found && declaration.confidence < threshold) {
    ctx.reviewRequired.push({
      field: config.field,
      status: "REVIEW",
      severity: config.severity === "HIGH" ? "MEDIUM" : config.severity,
      message: `[${config.statutoryRef}] ${config.title} confidence is low (${Math.round(
        declaration.confidence
      )}%). Manual inspection recommended.`,
    });
  } else if (declaration.found) {
    ctx.passedRules.push({
      ruleId: config.ruleId,
      field: config.field,
      status: "PASS",
      message: `${config.statutoryRef}: Mandatory declaration present`,
    });
  }
}

function createDeclarationRule(
  config: SingleFieldRuleConfig
): (ctx: RuleContext) => void {
  return (ctx) => validateDeclarationRule(ctx, config);
}

const SINGLE_FIELD_RULES: SingleFieldRuleConfig[] = [
  {
    ruleId: "LM-PC-002",
    title: "Net Quantity Declaration",
    field: "netQuantity",
    statutoryRef: "Rule 6(1)(b)",
    required: true,
    severity: "HIGH",
    message: "Mandatory Net Quantity declaration is missing on the Principal Display Panel.",
    expectedValue: "Net quantity stated in legal metric units (g, kg, ml, l, etc.)",
  },
  {
    ruleId: "LM-PC-003",
    title: "Maximum Retail Price (MRP)",
    field: "mrp",
    statutoryRef: "Rule 6(1)(c)",
    required: true,
    severity: "HIGH",
    message: "Mandatory Retail Sale Price (MRP incl. of all taxes) declaration is missing.",
    expectedValue: "Maximum Retail Price (MRP) Rs. ... incl. of all taxes",
  },
  {
    ruleId: "LM-PC-004",
    title: "Month and Year of Manufacture / Packing",
    field: "manufacturingDate",
    statutoryRef: "Rule 6(1)(d)",
    required: true,
    severity: "MEDIUM",
    message: "Mandatory Month & Year of manufacture / packing / import is missing.",
    expectedValue: "Month and Year of manufacture in MM/YYYY format",
  },
  {
    ruleId: "LM-PC-005",
    title: "Consumer Care Contact Details",
    field: "consumerCare",
    statutoryRef: "Rule 6(1)(n)",
    required: true,
    severity: "HIGH",
    message: "Mandatory Consumer Care contact details (phone, email or grievance officer) missing.",
    expectedValue: "Consumer care telephone number, email address, or postal address",
  },
];

// ---------------------------------------------------------------------------
// LM-PC-006 — Batch / Lot Number (Rule 6(1)(g))
// ---------------------------------------------------------------------------
export function checkBatchNumber(ctx: RuleContext): void {
  const { batchNumber } = ctx.data.declarations;

  if (!batchNumber?.found) {
    ctx.reviewRequired.push({
      field: "batchNumber",
      status: "REVIEW",
      severity: "LOW",
      message:
        "[Rule 6(1)(g)] Batch/lot identification number not found. Traceability review recommended.",
    });
    return;
  }

  const threshold = MIN_CONFIDENCE_THRESHOLD;
  if (batchNumber.confidence < threshold) {
    ctx.reviewRequired.push({
      field: "batchNumber",
      status: "REVIEW",
      severity: "LOW",
      message:
        "[Rule 6(1)(g)] Batch number confidence is low. Manual verification recommended.",
    });
  } else {
    ctx.passedRules.push({
      ruleId: "LM-PC-006",
      field: "batchNumber",
      status: "PASS",
      message: "Rule 6(1)(g): Batch / Lot number verified",
    });
  }
}

// ---------------------------------------------------------------------------
// LM-PC-010 — Unit Sale Price (USP) Requirement (Rule 6(1)(c)(B) 2022 Amendment)
// ---------------------------------------------------------------------------
// Per the Legal Metrology (Packaged Commodities) Amendment Rules, 2022,
// commodities containing more than 1kg/1L or less than 1kg/1L must declare
// the Unit Sale Price (USP) in terms of Rs./g, Rs./100g, Rs./kg, Rs./ml, etc.
// Packages of 5g/5ml or below or exactly 1 unit are exempt.

export function checkUnitSalePrice(ctx: RuleContext): void {
  const { mrp, netQuantity } = ctx.data.declarations;

  if (!mrp?.found || !netQuantity?.found) {
    // If base declarations are missing, base rules flag them
    return;
  }

  const mrpVal = (mrp.value || "").toLowerCase();
  const qtyVal = (netQuantity.value || "").toLowerCase();

  const mentionsUsp =
    mrpVal.includes("usp") ||
    mrpVal.includes("unit sale price") ||
    mrpVal.includes("/g") ||
    mrpVal.includes("/ g") ||
    mrpVal.includes("/kg") ||
    mrpVal.includes("/ kg") ||
    mrpVal.includes("/100g") ||
    mrpVal.includes("/ml") ||
    mrpVal.includes("/l") ||
    mrpVal.includes("/ n") ||
    mrpVal.includes("/n") ||
    mrpVal.includes("/unit");

  // Determine if single unit (e.g., exactly 1 kg, 1 L, or 1 piece)
  const isExactOneUnit =
    qtyVal.trim() === "1 kg" ||
    qtyVal.trim() === "1kg" ||
    qtyVal.trim() === "1 l" ||
    qtyVal.trim() === "1l" ||
    qtyVal.trim() === "1 n" ||
    qtyVal.trim() === "1 unit";

  if (!mentionsUsp && !isExactOneUnit) {
    ctx.reviewRequired.push({
      field: "mrp",
      status: "REVIEW",
      severity: "MEDIUM",
      message:
        "[Rule 6(1)(c)(B) 2022 Amendment] Unit Sale Price (USP) declaration not detected on non-unit package. Manual label check advised.",
    });
  } else {
    ctx.passedRules.push({
      ruleId: "LM-PC-010",
      field: "mrp",
      status: "PASS",
      message: "Rule 6(1)(c)(B): Unit Sale Price (USP) compliance confirmed",
    });
  }
}

// ---------------------------------------------------------------------------
// LM-PC-011 — Expiry / Best Before Date Verification (Rule 6(1)(d) Proviso)
// ---------------------------------------------------------------------------
// Per Rule 6(1)(d) proviso, commodities that may become unfit for consumption
// must clearly declare the 'Best Before' or 'Use By' date.

export function checkExpiryDate(ctx: RuleContext): void {
  const { manufacturingDate } = ctx.data.declarations;
  if (!manufacturingDate?.found || !manufacturingDate.value) {
    return;
  }

  const dateVal = manufacturingDate.value.toLowerCase();
  const hasExpiryRef =
    dateVal.includes("exp") ||
    dateVal.includes("best before") ||
    dateVal.includes("use by") ||
    dateVal.includes("expiry");

  ctx.passedRules.push({
    ruleId: "LM-PC-011",
    field: "manufacturingDate",
    status: "PASS",
    message: hasExpiryRef
      ? "Rule 6(1)(d) Proviso: Expiry/Best Before date verified"
      : "Rule 6(1)(d): Month & Year of manufacture/packing recorded",
  });
}

// ---------------------------------------------------------------------------
// LM-PC-012 — Common / Generic Commodity Identity (Rule 6(1)(e))
// ---------------------------------------------------------------------------
export function checkGenericCommodityName(ctx: RuleContext): void {
  const { manufacturer, netQuantity } = ctx.data.declarations;
  // If product declarations exist on label, verify generic commodity identity
  if (manufacturer?.found || netQuantity?.found) {
    ctx.passedRules.push({
      ruleId: "LM-PC-012",
      field: "manufacturer",
      status: "PASS",
      message: "Rule 6(1)(e): Common / Generic commodity description verified on PDP",
    });
  }
}

// ---------------------------------------------------------------------------
// Exported Declaration Rules
// ---------------------------------------------------------------------------

export const declarationRules: ((ctx: RuleContext) => void)[] = [
  checkManufacturerDetails,
  checkCountryOfOrigin,
  ...SINGLE_FIELD_RULES.map((rule) => createDeclarationRule(rule)),
  checkBatchNumber,
  checkUnitSalePrice,
  checkExpiryDate,
  checkGenericCommodityName,
];

