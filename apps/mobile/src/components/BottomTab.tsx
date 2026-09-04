import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "../hooks/useTheme";
import { HEADER_GLASS_COLOR } from "./ScreenContainer";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface TabMeta {
  active: IconName;
  inactive: IconName;
  label: string;
}

const ROUTE_META: Record<string, TabMeta> = {
  Home: { active: "home", inactive: "home-outline", label: "Home" },
  History: { active: "time", inactive: "time-outline", label: "Inspections" },
  Scan: { active: "camera", inactive: "camera-outline", label: "Scan" },
  Reports: {
    active: "document-text",
    inactive: "document-text-outline",
    label: "Reports",
  },
  Profile: { active: "person", inactive: "person-outline", label: "Profile" },
};

/** Custom bottom tab bar — uses StyleSheet (NOT nativewind className) intentionally.
 *  nativewind's render-component wraps components that use className and tries to
 *  JSON.stringify their props when printing upgrade warnings. BottomTab receives
 *  navigation/state/descriptors props which contain React Navigation context objects
 *  with throwing getters — serialising them crashes the app.  Using StyleSheet avoids
 *  nativewind wrapping this component entirely. */
export function BottomTab({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();

  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if ((focusedOptions.tabBarStyle as any)?.display === "none") {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: HEADER_GLASS_COLOR, borderTopColor: colors.border },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta: TabMeta = ROUTE_META[route.name] ?? {
          active: "ellipse",
          inactive: "ellipse-outline",
          label: route.name,
        };
        const isScan = route.name === "Scan";
        const color = focused ? colors.primary : colors.secondaryText;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params as object | undefined);
          }
        };

        if (isScan) {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.scanButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="camera" size={30} color={colors.background} />
              </View>
              <Text style={[styles.label, { color }]}>{meta.label}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={focused ? meta.active : meta.inactive}
              size={24}
              color={color}
            />
            <Text style={[styles.label, { color }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
});