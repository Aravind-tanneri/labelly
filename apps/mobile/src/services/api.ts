import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createApiClient } from "@labelly/shared";
import { tokenStore } from "./storage";
import { logger } from "./logger";

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

function resolveDefaultApiUrl(): string {
  // 1. Explicit EXPO_PUBLIC_API_URL has highest priority
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl && envApiUrl.trim().length > 0 && !envApiUrl.includes("localhost") && !envApiUrl.includes("127.0.0.1")) {
    return envApiUrl.trim();
  }

  // 2. Only use hostUri if it is a literal numeric IPv4 address (e.g. 192.168.x.x, 10.x.x.x)
  // NEVER use tunnel domains like *.exp.direct or ngrok with port :5000
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ||
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const rawHost = hostUri.split(":")[0];
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(rawHost);
    if (isIPv4 && rawHost !== "127.0.0.1") {
      return `http://${rawHost}:5000`;
    }
  }

  // 3. Fall back to envApiUrl (even if localhost) or default
  if (envApiUrl && envApiUrl.trim().length > 0) {
    return envApiUrl.trim();
  }
  return "http://localhost:5000";
}

export const API_BASE_URL = resolveDefaultApiUrl();
export const API_URL_STORAGE_KEY = "labelly.customApiUrl";

logger.info("API", `EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || "(not set)"}`);
logger.info("API", `Resolved Base URL: ${API_BASE_URL}`);

export const apiClient = createApiClient({
  store: tokenStore,
  baseURL: API_BASE_URL,
});

// Hydrate custom API URL if user saved one previously
AsyncStorage.getItem(API_URL_STORAGE_KEY).then((saved) => {
  if (saved && saved.trim()) {
    apiClient.defaults.baseURL = saved.trim();
    logger.info("API", `Restored custom Base URL: ${saved.trim()}`);
  }
}).catch(() => {});

export function getActiveApiBaseUrl(): string {
  return (apiClient.defaults.baseURL as string) || API_BASE_URL;
}

export function resolveMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  const activeBase = getActiveApiBaseUrl().replace(/\/$/, "");
  if (!rawUrl.startsWith("http")) {
    return `${activeBase}/${rawUrl.replace(/^\//, "")}`;
  }
  // Replace localhost or stale local LAN IPs with active base URL
  return rawUrl.replace(/^https?:\/\/[^\/]+/, activeBase);
}

export async function getEffectiveApiBaseUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return getActiveApiBaseUrl();
}

import axios from "axios";

export async function setCustomApiBaseUrl(rawUrl: string): Promise<string> {
  let cleaned = rawUrl.trim();
  // If user entered raw IP with https, downgrade to http since IP lacks SSL cert
  if (cleaned.startsWith("https://") && /^https:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(cleaned)) {
    cleaned = cleaned.replace("https://", "http://");
  }
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = `http://${cleaned}`;
  }
  if (cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  await AsyncStorage.setItem(API_URL_STORAGE_KEY, cleaned);
  apiClient.defaults.baseURL = cleaned;
  logger.info("API", `Updated Base URL to: ${cleaned}`);
  return cleaned;
}

export async function testServerConnection(url: string): Promise<{ success: boolean; message: string }> {
  let target = url.trim();
  if (target.startsWith("https://") && /^https:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(target)) {
    target = target.replace("https://", "http://");
  }
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    target = `http://${target}`;
  }
  if (target.endsWith("/")) {
    target = target.slice(0, -1);
  }
  try {
    const res = await axios.get(`${target}/health`, { timeout: 6000 });
    if (res.status === 200 && res.data?.status === "ok") {
      return { success: true, message: "Connected! Server is online and ready." };
    }
    return { success: true, message: `Server responded with HTTP ${res.status}` };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to reach server. Check IP and ensure http:// (not https://) is used.",
    };
  }
}

apiClient.interceptors.request.use((config) => {
  if (apiClient.defaults.baseURL) {
    config.baseURL = apiClient.defaults.baseURL;
  }
  (config as any)._startTime = Date.now();
  const isMultipart = config.data instanceof FormData;
  if (isMultipart) {
    config.headers.delete("Content-Type");
  }
  logger.info(
    "API",
    `-> ${config.method?.toUpperCase()} ${config.baseURL}${config.url} ${isMultipart ? "[Multipart FormData]" : ""}`
  );
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const start = (response.config as any)._startTime;
    const duration = start ? `${Date.now() - start}ms` : "";
    logger.success(
      "API",
      `<- ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration})`
    );
    return response;
  },
  (error) => {
    const config = error.config;
    const start = config?._startTime;
    const duration = start ? `${Date.now() - start}ms` : "";
    logger.error(
      "API",
      `FAIL ${config?.method?.toUpperCase()} ${config?.url || "request"} (${duration}): ${error.message}`,
      error
    );
    return Promise.reject(error);
  }
);