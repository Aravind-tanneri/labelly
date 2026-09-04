import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComplianceStatus } from "@labelly/shared";
import { theme } from "@labelly/shared";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export interface ComplianceTint {
  icon: IconName;
  label: string;
  color: string;
  backgroundColor: string;
  badgeClass: string;
  textClass: string;
}

export function getComplianceTint(status: ComplianceStatus): ComplianceTint {
  const { colors } = theme.dark;
  switch (status) {
    case "NON_COMPLIANT":
      return {
        icon: "alert-circle",
        label: "Non-Compliant",
        color: colors.error,
        backgroundColor: "rgba(229, 57, 53, 0.14)",
        badgeClass: "bg-red-950/40 border-error",
        textClass: "text-error",
      };
    case "REVIEW_REQUIRED":
      return {
        icon: "help-circle",
        label: "Review Required",
        color: colors.warning,
        backgroundColor: "rgba(255, 165, 0, 0.14)",
        badgeClass: "bg-amber-950/40 border-warning",
        textClass: "text-warning",
      };
    default:
      return {
        icon: "checkmark-circle",
        label: "Compliant",
        color: colors.success,
        backgroundColor: "rgba(37, 211, 102, 0.14)",
        badgeClass: "bg-emerald-950/40 border-success",
        textClass: "text-success",
      };
  }
}

interface StatusBadgeProps {
  status: ComplianceStatus;
  label?: string;
  large?: boolean;
}

export function StatusBadge({ status, label, large }: StatusBadgeProps) {
  const tint = getComplianceTint(status);
  const iconSize = large ? 24 : 16;

  return (
    <View
      className={`flex-row items-center border rounded-full ${tint.badgeClass} ${
        large ? "py-3 px-5" : "py-1.5 px-2.5"
      }`}
    >
      <Ionicons name={tint.icon} size={iconSize} color={tint.color} />
      <Text
        className={`font-bold ml-1.5 ${tint.textClass} ${
          large ? "text-base" : "text-xs"
        }`}
      >
        {label ?? tint.label}
      </Text>
      <View className="w-1 h-1 rounded-full ml-1 bg-border" />
    </View>
  );
}