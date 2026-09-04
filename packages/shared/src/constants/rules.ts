import type { Severity } from "../types/compliance";

export interface RuleDefinition {
  ruleId: string;
  title: string;
  field: string;
  category: "declarations" | "formatting" | "readability";
  statutoryRef: string;
  description: string;
  severity: Severity;
  required: boolean;
  conditional?: boolean;
  requiresHumanReview?: boolean;
}

/**
 * Pre-seeded compliance rules per the Legal Metrology (Packaged Commodities)
 * Rules, 2011 and latest Ministry of Consumer Affairs (DoCA) amendments.
 * The engine is deterministic: it purely evaluates extracted declarations
 * against statutory schedule criteria with zero guesswork.
 */
export const COMPLIANCE_RULES: RuleDefinition[] = [
  {
    ruleId: "LM-PC-001",
    title: "Manufacturer / Packer / Importer Details",
    field: "manufacturer",
    category: "declarations",
    statutoryRef: "Rule 6(1)(a) of Legal Metrology (Packaged Commodities) Rules, 2011",
    description:
      "Name and complete address of the manufacturer, or where manufacturer is not the packer, the name and address of manufacturer and packer; for imported goods, the name and complete address of importer.",
    severity: "HIGH",
    required: true,
  },
  {
    ruleId: "LM-PC-002",
    title: "Net Quantity Declaration",
    field: "netQuantity",
    category: "declarations",
    statutoryRef: "Rule 6(1)(b) & Second Schedule of LM(PC) Rules, 2011",
    description:
      "Net quantity in terms of standard unit of weight, measure or number must be stated on the principal display panel.",
    severity: "HIGH",
    required: true,
  },
  {
    ruleId: "LM-PC-003",
    title: "Maximum Retail Price (MRP)",
    field: "mrp",
    category: "declarations",
    statutoryRef: "Rule 6(1)(c) & Rule 2(m) of LM(PC) Rules, 2011",
    description:
      "Maximum Retail Price (MRP) inclusive of all taxes must be declared clearly in Indian currency (₹ / Rs.).",
    severity: "HIGH",
    required: true,
  },
  {
    ruleId: "LM-PC-004",
    title: "Month and Year of Manufacture / Packing / Import",
    field: "manufacturingDate",
    category: "declarations",
    statutoryRef: "Rule 6(1)(d) & Rule 6(1)(da) of LM(PC) Rules, 2011",
    description:
      "Month and year in which the commodity is manufactured or pre-packed or imported must be declared in standard format (MM/YYYY).",
    severity: "MEDIUM",
    required: true,
  },
  {
    ruleId: "LM-PC-005",
    title: "Consumer Care Contact Details",
    field: "consumerCare",
    category: "declarations",
    statutoryRef: "Rule 6(1)(n) of LM(PC) Rules, 2011",
    description:
      "Name, address, telephone number and email ID of the person/office to be contacted in case of consumer complaints.",
    severity: "HIGH",
    required: true,
  },
  {
    ruleId: "LM-PC-006",
    title: "Batch / Lot / Lot Identification Number",
    field: "batchNumber",
    category: "formatting",
    statutoryRef: "Rule 6(1)(g) of LM(PC) Rules, 2011",
    description:
      "Lot or batch identification number for quality tracking and statutory product traceability.",
    severity: "LOW",
    required: false,
  },
  {
    ruleId: "LM-PC-007",
    title: "Principal Display Panel (PDP) Readability & Legibility",
    field: "readability",
    category: "readability",
    statutoryRef: "Rule 7 & Rule 9 of LM(PC) Rules, 2011",
    description:
      "Declarations must be conspicuous, legible, and unshadowed on the Principal Display Panel. Visual optical concerns trigger human review.",
    severity: "MEDIUM",
    required: false,
    requiresHumanReview: true,
  },
  {
    ruleId: "LM-PC-008",
    title: "Country of Origin for Imported Goods",
    field: "importer",
    category: "declarations",
    statutoryRef: "Rule 6(10) & Rule 6(1)(a) of LM(PC) Rules, 2011",
    description:
      "For imported pre-packaged commodities, the country of origin must be explicitly stated on the packaging label.",
    severity: "HIGH",
    required: false,
    conditional: true,
  },
  {
    ruleId: "LM-PC-009",
    title: "Standard Metric Units & Prohibited Symbols",
    field: "netQuantity",
    category: "formatting",
    statutoryRef: "Rule 11, Rule 12 & Rule 13 of LM(PC) Rules, 2011",
    description:
      "Net quantity must be declared using standard metric symbols (g, kg, ml, l, m, cm, mm, N, U). Non-metric or non-standard abbreviations (gms, kgs, ltr, ML, lbs) are prohibited.",
    severity: "HIGH",
    required: true,
  },
  {
    ruleId: "LM-PC-010",
    title: "Unit Sale Price (USP) Declaration",
    field: "mrp",
    category: "declarations",
    statutoryRef: "Rule 6(1)(c)(B) of LM(PC) Rules, 2011 (2022 Amendment)",
    description:
      "Unit Sale Price (Rs./g, Rs./100g, Rs./kg, Rs./ml, Rs./100ml, Rs./L, Rs./number) is mandatory for packages containing >1kg/1L or <1kg/1L.",
    severity: "MEDIUM",
    required: false,
    conditional: true,
    requiresHumanReview: true,
  },
  {
    ruleId: "LM-PC-011",
    title: "Expiry / Best-Before / Use-By Date",
    field: "manufacturingDate",
    category: "declarations",
    statutoryRef: "Rule 6(1)(d) Proviso of LM(PC) Rules, 2011",
    description:
      "Commodities that may become unfit for consumption must clearly declare the 'Best Before' or 'Use By' date, month, and year.",
    severity: "HIGH",
    required: false,
    conditional: true,
  },
  {
    ruleId: "LM-PC-012",
    title: "Common / Generic Commodity Identity",
    field: "manufacturer",
    category: "declarations",
    statutoryRef: "Rule 6(1)(e) of LM(PC) Rules, 2011",
    description:
      "Common or generic name of the commodity contained in the package must be prominently declared on the principal display panel.",
    severity: "MEDIUM",
    required: true,
  },
];

export const REQUIRED_RULE_IDS = COMPLIANCE_RULES.filter(
  (r) => r.required
).map((r) => r.ruleId);

export const RULES_BY_ID: Record<string, RuleDefinition> =
  COMPLIANCE_RULES.reduce(
    (acc, rule) => {
      acc[rule.ruleId] = rule;
      return acc;
    },
    {} as Record<string, RuleDefinition>
  );

