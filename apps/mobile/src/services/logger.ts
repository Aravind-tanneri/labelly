/**
 * logger.ts
 * High-visibility structured logging for the Labelly mobile app.
 * Outputs categorized, timed console logs visible in Metro / Expo CLI.
 */

type LogCategory = "SCANNER" | "API" | "UPLOAD" | "NAV" | "AUTH" | "OFFLINE";

const COLORS = {
  SCANNER: "[SCANNER]",
  API: "[API]",
  UPLOAD: "[UPLOAD]",
  NAV: "[NAV]",
  AUTH: "[AUTH]",
  OFFLINE: "[OFFLINE]",
};

class MobileLogger {
  private formatPrefix(category: LogCategory, level: "INFO" | "WARN" | "ERROR" | "SUCCESS") {
    const time = new Date().toLocaleTimeString();
    const tag = COLORS[category] || `[${category}]`;
    return `${time} ${tag} [${level}]`;
  }

  info(category: LogCategory, message: string, data?: unknown) {
    if (data !== undefined) {
      console.log(`${this.formatPrefix(category, "INFO")} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`${this.formatPrefix(category, "INFO")} ${message}`);
    }
  }

  success(category: LogCategory, message: string, data?: unknown) {
    if (data !== undefined) {
      console.log(`[SUCCESS] ${this.formatPrefix(category, "SUCCESS")} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`[SUCCESS] ${this.formatPrefix(category, "SUCCESS")} ${message}`);
    }
  }

  warn(category: LogCategory, message: string, data?: unknown) {
    if (data !== undefined) {
      console.warn(`[WARN] ${this.formatPrefix(category, "WARN")} ${message}`, data);
    } else {
      console.warn(`[WARN] ${this.formatPrefix(category, "WARN")} ${message}`);
    }
  }

  error(category: LogCategory, message: string, error?: unknown) {
    console.error(`[ERROR] ${this.formatPrefix(category, "ERROR")} ${message}`);
    if (error) {
      if (typeof error === "object" && error !== null) {
        const errObj: Record<string, unknown> = {};
        if ("message" in error) errObj.message = (error as any).message;
        if ("code" in error) errObj.code = (error as any).code;
        if ("status" in error) errObj.status = (error as any).status;
        if ("response" in error && (error as any).response) {
          errObj.responseStatus = (error as any).response.status;
          errObj.responseData = (error as any).response.data;
        }
        if ("config" in error && (error as any).config) {
          errObj.url = (error as any).config.url;
          errObj.baseURL = (error as any).config.baseURL;
          errObj.method = (error as any).config.method;
          errObj.timeout = (error as any).config.timeout;
        }
        console.error("   Details:", JSON.stringify(errObj, null, 2));
      } else {
        console.error("   Details:", error);
      }
    }
  }

  time() {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      return `${duration}ms`;
    };
  }
}

export const logger = new MobileLogger();
