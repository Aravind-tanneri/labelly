/**
 * navigationTypes.ts
 * Pure type definitions — no runtime code, no circular deps.
 */
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

export type TabsParamList = {
  Home: undefined;
  History: undefined;
  Scan: { fromLibrary?: boolean } | undefined;
  Reports: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Tabs: undefined;
  ExtractionReview: { inspectionId: string };
  ComplianceResult: { inspectionId: string; readOnly?: boolean };
  ViolationDetails: { inspectionId: string; field: string };
  ReportView: { inspectionId: string };
};

export type MainTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
