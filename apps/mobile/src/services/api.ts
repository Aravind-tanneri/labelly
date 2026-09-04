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
  // In Expo Go, auto-discover host laptop IP from Metro hostUri so phone connects over LAN dynamically
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ||
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:5000`;
    }
  }

  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const extraApiUrl = (
    Constants.expoConfig?.extra as { apiUrl?: string } | undefined
  )?.apiUrl;

  if (envApiUrl) return envApiUrl;
  if (extraApiUrl) return extraApiUrl;

  return "http://localhost:5000";
}

export const API_BASE_URL = resolveDefaultApiUrl();
logger.info("API", `Resolved Base URL: ${API_BASE_URL}`);

export const apiClient = createApiClient({
  store: tokenStore,
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
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