/**
 * Navigation.tsx
 *
 * Sets up the NavigationContainer and all navigators.
 * navigationRef is imported from navigationRef.ts (not defined here)
 * so screens can import from navigationRef.ts without creating a cycle.
 */
import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { View, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { navigationRef } from "./navigationRef";
import type { RootStackParamList, TabsParamList } from "./navigationTypes";
import { useAppAuth } from "./context/AuthContext";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./context/AuthContext";
import { BottomTab } from "./components/BottomTab";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { ScannerScreen } from "./screens/ScannerScreen";
import { ExtractionReviewScreen } from "./screens/ExtractionReviewScreen";
import { ComplianceResultScreen } from "./screens/ComplianceResultScreen";
import { ViolationDetailsScreen } from "./screens/ViolationDetailsScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { ReportsScreen } from "./screens/ReportsScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

// ─── Navigators ───────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#020203", alignItems: "center", justifyContent: "center" }}>
      <Image
        source={require("./assets/splash.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </View>
  );
}

function TabsNavigator() {
  return (
    <Tabs.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTab {...props} />}
    >
      <Tabs.Screen name="Home" component={DashboardScreen} />
      <Tabs.Screen name="History" component={HistoryScreen} />
      <Tabs.Screen
        name="Scan"
        component={ScannerScreen}
        options={{ tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen name="Reports" component={ReportsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, loading } = useAppAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {loading ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : isAuthenticated ? (
        <>
          <Stack.Screen name="Tabs" component={TabsNavigator} />
          <Stack.Screen name="ExtractionReview" component={ExtractionReviewScreen} />
          <Stack.Screen name="ComplianceResult" component={ComplianceResultScreen} />
          <Stack.Screen name="ViolationDetails" component={ViolationDetailsScreen} />
          <Stack.Screen name="ReportView" component={ReportScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

// ─── AppNavigator ─────────────────────────────────────────────────────────────

export function AppNavigator() {
  const { colors } = useTheme();

  const navTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </AuthProvider>
    </NavigationContainer>
  );
}