import {
  AxiosHeaders,
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import type { ApiError } from "../types/api";

export const DEFAULT_BASE_URL = "http://localhost:5000";

/**
 * Base URL resolution — platform-aware:
 * - Web (Create React App):  REACT_APP_API_URL
 * - Mobile (Expo):           EXPO_PUBLIC_API_URL
 * - Fallback:                http://localhost:5000
 */
export const API_URL: string =
  (process.env?.REACT_APP_API_URL as string | undefined) ||
  (process.env?.EXPO_PUBLIC_API_URL as string | undefined) ||
  DEFAULT_BASE_URL;

export interface TokenStore {
  getToken: () => string | null;
  setToken: (token: string | null) => void;
  clear: () => void;
}

/**
 * Platform-aware token persistence.
 * Pass a store backed by AsyncStorage (mobile) or localStorage (web).
 * Falls back to an in-memory store when none is provided.
 *
 * @example — Mobile (Expo / React Native)
 * ```ts
 * import AsyncStorage from "@react-native-async-storage/async-storage";
 * const asyncTokenStore: TokenStore = {
 *   getToken: () => null, // synchronous — use in-memory after hydration
 *   setToken: (t) => { AsyncStorage.setItem("authToken", t ?? ""); },
 *   clear:    () => { AsyncStorage.removeItem("authToken"); },
 * };
 * export const apiClient = createApiClient({ store: asyncTokenStore });
 * ```
 *
 * @example — Web (browser localStorage)
 * ```ts
 * const localStorageTokenStore: TokenStore = {
 *   getToken: () => localStorage.getItem("authToken"),
 *   setToken: (t) => t ? localStorage.setItem("authToken", t)
 *                      : localStorage.removeItem("authToken"),
 *   clear:    () => localStorage.removeItem("authToken"),
 * };
 * export const apiClient = createApiClient({ store: localStorageTokenStore });
 * ```
 */
interface MemoryTokenStore extends TokenStore {
  _token: string | null;
}

export const memoryTokenStore: MemoryTokenStore = {
  getToken: () => memoryTokenStore._token,
  setToken: (token) => {
    memoryTokenStore._token = token;
  },
  clear: () => {
    memoryTokenStore._token = null;
  },
  _token: null,
};

function mergeHeaders(
  existing: unknown,
  extra: Record<string, string>
): AxiosHeaders {
  const headers = new AxiosHeaders();
  if (existing && typeof existing === "object") {
    if (typeof (existing as { forEach?: unknown }).forEach === "function") {
      (existing as { forEach: (cb: (val: string, key: string) => void) => void }).forEach(
        (value: string, key: string) => {
          headers.set(key, value);
        }
      );
    } else {
      for (const [key, value] of Object.entries(existing)) {
        if (value !== undefined && value !== null) {
          headers.set(key, String(value));
        }
      }
    }
  }
  for (const [key, value] of Object.entries(extra)) {
    headers.set(key, value);
  }
  return headers;
}

export function createApiConfig(
  store: TokenStore = memoryTokenStore,
  baseURL = API_URL
): AxiosRequestConfig {
  return {
    baseURL,
    timeout: 10000,
    headers: new AxiosHeaders({
      "Content-Type": "application/json",
    }),
  };
}

export function attachAuthHeader(
  config: AxiosRequestConfig,
  store: TokenStore
): AxiosRequestConfig {
  const token = store.getToken();
  if (token) {
    if (config.headers && typeof (config.headers as { set?: unknown }).set === "function") {
      (config.headers as { set: (k: string, v: string) => void }).set(
        "Authorization",
        `Bearer ${token}`
      );
    } else {
      config.headers = mergeHeaders(config.headers, {
        Authorization: `Bearer ${token}`,
      });
    }
  }
  return config;
}

/**
 * Normalizes an Axios error into a structured `ApiError` object.
 * Consumers receive `{ message, status?, details? }` rather than a bare string,
 * allowing UI code to distinguish HTTP status codes from network failures.
 */
export function normalizeAxiosError(error: AxiosError): ApiError {
  if (error.response) {
    const data = error.response.data as
      | { message?: string; error?: string }
      | undefined;
    return {
      message: data?.message || data?.error || "Request failed.",
      status: error.response.status,
      details: data,
    };
  }
  if (error.request) {
    return {
      message: "Unable to connect to the server. Please check your network and server address.",
    };
  }
  return {
    message: error.message || "An unexpected error occurred.",
  };
}

export type { AxiosResponse, AxiosError, ApiError };
