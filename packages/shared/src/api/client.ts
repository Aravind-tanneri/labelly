import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  createApiConfig,
  attachAuthHeader,
  normalizeAxiosError,
  memoryTokenStore,
  type TokenStore,
} from "./interceptors";
import type { ApiError } from "../types/api";

export interface ApiClientOptions {
  /** Token store to use for reading/writing the Bearer token. */
  store?: TokenStore;
  /** Override the base URL (default: REACT_APP_API_URL / EXPO_PUBLIC_API_URL / localhost:5000). */
  baseURL?: string;
  /**
   * Called automatically when the server returns HTTP 401.
   * Useful for triggering a logout / re-login flow.
   */
  onUnauthorized?: () => void;
}

/**
 * Shared axios instance used by both mobile and web clients.
 * - Sets base URL + 10 s timeout
 * - Attaches Bearer token from the configured store on every request
 * - Normalizes network/HTTP errors to a structured `ApiError` object
 *
 * @example — Web (localStorage)
 * ```ts
 * import { createApiClient } from "@labelly/shared/api";
 * import type { TokenStore } from "@labelly/shared/api";
 *
 * const webTokenStore: TokenStore = {
 *   getToken: () => localStorage.getItem("authToken"),
 *   setToken: (t) => t
 *     ? localStorage.setItem("authToken", t)
 *     : localStorage.removeItem("authToken"),
 *   clear: () => localStorage.removeItem("authToken"),
 * };
 *
 * export const api = createApiClient({ store: webTokenStore });
 * ```
 *
 * @example — Mobile (in-memory, hydrate from AsyncStorage on app start)
 * ```ts
 * import { createApiClient, memoryTokenStore } from "@labelly/shared/api";
 * import AsyncStorage from "@react-native-async-storage/async-storage";
 *
 * // On app startup, restore persisted token into the in-memory store:
 * AsyncStorage.getItem("authToken").then((t) => memoryTokenStore.setToken(t));
 *
 * export const api = createApiClient(); // uses memoryTokenStore by default
 * ```
 */
export function createApiClient(
  options: ApiClientOptions = {}
): AxiosInstance {
  const store = options.store || memoryTokenStore;
  const client = axios.create(
    createApiConfig(store, options.baseURL)
  );

  client.interceptors.request.use((config) =>
    attachAuthHeader(config, store) as InternalAxiosRequestConfig
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const apiError: ApiError = normalizeAxiosError(error);
      if (apiError.status === 401 && options.onUnauthorized) {
        options.onUnauthorized();
      }
      return Promise.reject(apiError);
    }
  );

  return client;
}

/**
 * Default apiClient with in-memory token storage.
 * For production web, pass `store: localStorageTokenStore`.
 * For production mobile, hydrate `memoryTokenStore` from AsyncStorage on startup.
 */
export const apiClient: AxiosInstance = createApiClient();

export function setAuthToken(token: string | null): void {
  memoryTokenStore.setToken(token);
}

export function clearAuthToken(): void {
  memoryTokenStore.clear();
}

export type { AxiosRequestConfig, AxiosInstance, ApiError };
export { normalizeAxiosError, memoryTokenStore };
export type { TokenStore };
