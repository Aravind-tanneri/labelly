import type { ReactNode } from "react";
import type {
  ComplianceStatus,
  RuleCheckStatus,
  Severity,
} from "@labelly/shared";
import { Icon, type IconName } from "./Icon";

export type BadgeTone =
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "primary";

interface BadgeProps {
  tone?: BadgeTone;
  icon?: IconName;
  children: ReactNode;
  title?: string;
}

const DEFAULT_ICON: Record<BadgeTone, IconName> = {
  success: "check",
  warning: "question",
  error: "alert",
  neutral: "info",
  primary: "shield",
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  primary: "bg-[#eef0fb] text-[#5e6ad2] border-[#d2d7f6]",
};

/**
 * Icon + label + color + tint + border — compliance state is never conveyed
 * with color alone.
 */
export function Badge({ tone = "neutral", icon, children, title }: BadgeProps) {
  const iconName = icon ?? DEFAULT_ICON[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border leading-tight ${TONE_CLASSES[tone]}`}
      title={title}
    >
      <Icon name={iconName} size={13} />
      <span>{children}</span>
    </span>
  );
}

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  switch (status) {
    case "COMPLIANT":
      return (
        <Badge tone="success" icon="check">
          Compliant
        </Badge>
      );
    case "NON_COMPLIANT":
      return (
        <Badge tone="error" icon="alert">
          Non-Compliant
        </Badge>
      );
    case "REVIEW_REQUIRED":
      return (
        <Badge tone="warning" icon="question">
          Review
        </Badge>
      );
  }
}

export function CheckBadge({ status }: { status: RuleCheckStatus }) {
  switch (status) {
    case "PASS":
      return (
        <Badge tone="success" icon="check">
          Pass
        </Badge>
      );
    case "FAIL":
      return (
        <Badge tone="error" icon="alert">
          Violation
        </Badge>
      );
    case "REVIEW":
      return (
        <Badge tone="warning" icon="question">
          Review
        </Badge>
      );
  }
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone: BadgeTone =
    severity === "HIGH"
      ? "error"
      : severity === "MEDIUM"
        ? "warning"
        : "neutral";
  return <Badge tone={tone}>{severity}</Badge>;
}

export function LifecycleBadge({
  status,
}: {
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ACTION_REQUIRED" | "REINSPECTION_REQUESTED";
}) {
  let tone: BadgeTone = "neutral";
  let label = status as string;
  if (status === "APPROVED") {
    tone = "success";
    label = "APPROVED";
  } else if (status === "ACTION_REQUIRED") {
    tone = "error";
    label = "NOTICE ISSUED";
  } else if (status === "REJECTED") {
    tone = "error";
    label = "REJECTED";
  } else if (status === "REINSPECTION_REQUESTED") {
    tone = "warning";
    label = "RE-INSPECTION";
  } else if (status === "SUBMITTED") {
    tone = "primary";
    label = "SUBMITTED";
  }
  return <Badge tone={tone}>{label}</Badge>;
}