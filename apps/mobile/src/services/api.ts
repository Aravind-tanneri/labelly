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
logger.info("API", `EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || "(not set)"}`);
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