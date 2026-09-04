import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const HEADER_GLASS_COLOR = "rgba(10, 15, 20, 0.88)";

interface ScreenContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  edges?: ("top" | "right" | "bottom" | "left")[];
  topBarColor?: string;
}

export function ScreenContainer({
  children,
  style,
  className,
  edges = ["top", "bottom"],
  topBarColor = HEADER_GLASS_COLOR,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const applyTop = edges.includes("top");
  const applyBottom = edges.includes("bottom");

  return (
    <View className={`flex-1 bg-background ${className || ""}`} style={style}>
      {applyTop && insets.top > 0 && (
        <View
          style={{
            height: insets.top,
            backgroundColor: topBarColor,
          }}
        />
      )}
      <View
        className="flex-1"
        style={{
          paddingBottom: applyBottom ? insets.bottom : 0,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default ScreenContainer;