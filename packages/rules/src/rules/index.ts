import { declarationRules } from "./declarations";
import { formatRules } from "./formatting";

export const allRules = [...declarationRules, ...formatRules];

export * from "./declarations";
export * from "./formatting";
