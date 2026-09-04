import type { RuleContext } from "../types";

const STRING_FIELDS = [
  "manufacturer",
  "packer",
  "importer",
  "netQuantity",
  "mrp",
  "manufacturingDate",
  "consumerCare",
  "batchNumber",
] as const;

type FieldName = (typeof STRING_FIELDS)[number];

const VISUAL_CONCERN_KEYWORDS = [
  "glare",
  "blur",
  "small",
  "blurry",
  "shadow",
  "reflection",
  "obscured",
  "faded",
  "illegible",
];

// ---------------------------------------------------------------------------
// LM-PC-007 — Readability & Legibility on Principal Display Panel (Rule 7 & 9)
// ---------------------------------------------------------------------------
export function checkReadability(ctx: RuleContext): void {
  const observations =
    ctx.data.visualObservations?.map((o: string) => o.toLowerCase()) ?? [];

  const hasVisualConcerns = observations.some((obs: string) =>
    VISUAL_CONCERN_KEYWORDS.some((keyword) => obs.includes(keyword))
  );

  if (hasVisualConcerns) {
    ctx.reviewRequired.push({
      field: "readability",
      status: "REVIEW",
      severity: "MEDIUM",
      message:
        "[Rule 7 & 9] Optical label quality concerns detected (glare, blur, or small numerals). Physical on-site verification recommended.",
    });
    return;
  }

  ctx.passedRules.push({
    ruleId: "LM-PC-007",
    field: "readability",
    status: "PASS",
    message: "Rule 7 & 9: Principal Display Panel declarations are legible and conspicuous",
  });
}

// ---------------------------------------------------------------------------
// LM-PC-009 — Standard Units of Weight & Measure (Rule 11, Rule 12 & Second Schedule)
// ---------------------------------------------------------------------------
// Prohibits non-metric units and non-standard abbreviations like gms, kgs, ltr, ML, oz.

const PROHIBITED_UNIT_PATTERNS = [
  /\b\d+\s*gms?\b/i,
  /\b\d+\s*kgs?\b/i,
  /\b\d+\s*ltrs?\b/i,
  /\b\d+\s*ML\b/, // Capital ML is discouraged under metric standards
  /\b\d+\s*lbs?\b/i,
  /\b\d+\s*oz\b/i,
  /\b\d+\s*kilos?\b/i,
];

const VALID_METRIC_UNIT_REGEX =
  /\b\d+(\.\d+)?\s*(g|kg|mg|ml|l|m|cm|mm|n|u|units?|pieces?|tablets?|capsules?|litres?|liters?|grams?|kilograms?)\b/i;

export function checkStandardMetricUnits(ctx: RuleContext): void {
  const netQuantity = ctx.data.declarations.netQuantity;
  if (!netQuantity?.found || !netQuantity.value) {
    return;
  }

  const rawQty = netQuantity.value.trim();

  // Check for non-standard prohibited abbreviations (e.g., "500 gms" instead of "500 g")
  const hasProhibitedSymbol = PROHIBITED_UNIT_PATTERNS.some((pat) =>
    pat.test(rawQty)
  );

  if (hasProhibitedSymbol) {
    ctx.violations.push({
      ruleId: "LM-PC-009",
      field: "netQuantity",
      status: "FAIL",
      severity: "HIGH",
      message:
        "[Rule 11 & 12] Prohibited or non-standard metric abbreviation used. Quantities must use standard symbols (g, kg, ml, l, N).",
      actualValue: rawQty,
      expectedValue: "Standard legal metric units: g, kg, ml, l, N",
    });
    return;
  }

  const hasValidMetric = VALID_METRIC_UNIT_REGEX.test(rawQty);
  if (!hasValidMetric && !/\d/.test(rawQty)) {
    ctx.violations.push({
      ruleId: "LM-PC-009",
      field: "netQuantity",
      status: "FAIL",
      severity: "HIGH",
      message:
        "[Rule 11] Net quantity must contain a numeric quantity and legal metric unit of measurement.",
      actualValue: rawQty,
      expectedValue: "e.g., 500 g, 1 kg, 750 ml, 1 L, 10 N",
    });
  } else {
    ctx.passedRules.push({
      ruleId: "LM-PC-009",
      field: "netQuantity",
      status: "PASS",
      message: "Rule 11 & 12: Standard statutory metric unit of measurement confirmed",
    });
  }
}

// ---------------------------------------------------------------------------
// Format Validation Rules (MRP Syntax & Date Syntax)
// ---------------------------------------------------------------------------
export function checkValueFormat(ctx: RuleContext): void {
  for (const field of STRING_FIELDS) {
    const declaration = ctx.data.declarations[field];
    if (!declaration?.found || declaration.value == null) continue;

    if (field === "mrp") {
      checkMrpFormat(ctx, field, declaration.value);
    } else if (field === "manufacturingDate") {
      checkDateFormat(ctx, field, declaration.value);
    }
  }
}

function checkMrpFormat(
  ctx: RuleContext,
  field: FieldName,
  value: string
): void {
  if (!/\d/.test(value)) {
    ctx.violations.push({
      ruleId: "LM-PC-003",
      field,
      status: "FAIL",
      severity: "HIGH",
      message:
        "[Rule 6(1)(c) & Rule 2(m)] Maximum Retail Price declaration does not contain a numeric amount.",
      actualValue: value,
      expectedValue: "Valid MRP in Indian Rupees (e.g., Rs. 99.00 or ₹99 incl. of all taxes)",
    });
  }
}

function checkDateFormat(
  ctx: RuleContext,
  field: FieldName,
  value: string
): void {
  const hasDigit = /\d/.test(value);
  if (!hasDigit) {
    ctx.reviewRequired.push({
      field,
      status: "REVIEW",
      severity: "LOW",
      message:
        "[Rule 6(1)(d)] Manufacturing/packing date format is unclear. Verify MM/YYYY on package.",
    });
  }
}

export const formatRules: ((ctx: RuleContext) => void)[] = [
  checkReadability,
  checkStandardMetricUnits,
  checkValueFormat,
];

