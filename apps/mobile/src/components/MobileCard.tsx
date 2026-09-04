import type { ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface MobileCardProps {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export function MobileCard({
  title,
  subtitle,
  right,
  onPress,
  children,
  style,
  className,
}: MobileCardProps) {
  const body = (
    <>
      {title || subtitle || right ? (
        <View className="flex-row items-center mb-3">
          <View className="flex-1 pr-2">
            {title ? (
              <Text numberOfLines={1} className="text-text text-base font-semibold">
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text numberOfLines={1} className="text-secondaryText text-sm mt-1">
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? <View className="items-end">{right}</View> : null}
        </View>
      ) : null}
      {children}
    </>
  );

  return (
    <View
      className={`border border-border bg-surface rounded-xl mb-4 overflow-hidden ${className || ""}`}
      style={style}
    >
      {onPress ? (
        <Pressable onPress={onPress} className="p-5">
          {body}
        </Pressable>
      ) : (
        <View className="p-5">{body}</View>
      )}
    </View>
  );
}