import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HEADER_GLASS_COLOR } from "./ScreenContainer";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function MobileHeader({
  title,
  subtitle,
  onBack,
  right,
}: MobileHeaderProps) {
  return (
    <View
      className="flex-row items-center px-4 py-3.5"
      style={{
        backgroundColor: HEADER_GLASS_COLOR,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.08)",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
      }}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          className="w-9 h-9 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.12] active:bg-white/[0.18] transition-colors"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
      ) : (
        <View className="w-9" />
      )}
      <View className="flex-1 items-center px-2">
        <Text
          numberOfLines={1}
          className="text-white text-[15px] font-bold text-center tracking-wide"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            className="text-slate-400 text-[11px] font-medium mt-0.5 text-center tracking-wider"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="w-9 items-end justify-center">{right}</View>
    </View>
  );
}