import {
  allRules,
  calculateComplianceScore,
  declarationRules,
  determineStatus,
  formatRules,
  recheck,
  runComplianceCheck,
  type EngineOptions,
  type EngineResult,
  type ExtractionInput,
} from "@labelly/rules";

/**
 * Server-side rule catalog used to seed the `rules` collection.
 * `category` matches the Legal Metrology rule groups in the engine.
 */
export type RuleCategory = "declarations" | "formatting" | "readability";

export interface RuleSeed {
  ruleId: string;
  title: string;
  category: RuleCategory;
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export const RULES: RuleSeed[] = [
  {
    ruleId: "LM-PC-001",
    title: "Manufacturer / Packer Details",
    category: "declarations",
    description:
      "The label must identify the manufacturer or packer of the packaged commodity.",
    severity: "HIGH",
  },
  {
    ruleId: "LM-PC-002",
    title: "Net Quantity",
    category: "declarations",
    description:
      "The label must declare the net quantity in standard units of mass or volume.",
    severity: "HIGH",
  },
  {
    ruleId: "LM-PC-003",
    title: "MRP Declaration",
    category: "declarations",
    description:
      "The maximum retail price must be printed on the label in Indian Rupees.",
    severity: "HIGH",
  },
  {
    ruleId: "LM-PC-004",
    title: "Manufacturing Date",
    category: "declarations",
    description: "The label must state the month and year of manufacture.",
    severity: "MEDIUM",
  },
  {
    ruleId: "LM-PC-005",
    title: "Consumer Care Details",
    category: "declarations",
    description:
      "The name, address and contact details of the consumer grievance cell must be declared.",
    severity: "HIGH",
  },
  {
    ruleId: "LM-PC-006",
    title: "Batch / Lot Number",
    category: "declarations",
    description:
      "Batch or lot number aids traceability and should be printed on the label.",
    severity: "LOW",
  },
  {
    ruleId: "LM-PC-007",
    title: "Label Readability",
    category: "readability",
    description:
      "Declarations must be clearly readable without glare, blur or obstruction.",
    severity: "MEDIUM",
  },
];

export {
  allRules,
  calculateComplianceScore,
  declarationRules,
  determineStatus,
  formatRules,
  recheck,
  runComplianceCheck,
};

export type { EngineOptions, EngineResult, ExtractionInput };