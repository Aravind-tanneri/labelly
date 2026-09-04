/**
 * navigationRef.ts
 * Runtime navigation ref and helper functions.
 * Imports ONLY from @react-navigation/native — no screen imports, no circular deps.
 */
import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./navigationTypes";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateRoot<K extends keyof RootStackParamList>(
  name: K,
  params?: RootStackParamList[K]
) {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(name, params);
  }
}

export function goBackRoot() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}
