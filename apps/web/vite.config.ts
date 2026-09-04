import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

/**
 * Labelly web — supervisor oversight dashboard.
 *
 * - Consumes `@labelly/shared` from source (packages/shared) so both apps
 *   always use the same types/client without a separate build step.
 * - Supports both `VITE_` and `REACT_APP_` prefixed env vars so the shared
 *   client's `process.env.REACT_APP_API_URL` resolution keeps working.
 * - Dev server runs on port 3000 to match the README.
 */
export default defineConfig(({ mode }) => {
  const env = {
    NODE_ENV: mode,
    ...loadEnv(mode, process.cwd(), ["REACT_APP_", "VITE_"]),
  };

  const sharedEntry = fileURLToPath(
    new URL("../../packages/shared/src/index.ts", import.meta.url)
  );
  const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env": JSON.stringify(env),
    },
    resolve: {
      alias: {
        "@labelly/shared": sharedEntry,
      },
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      watch: {
        usePolling: true,
      },
      fs: {
        allow: [workspaceRoot],
      },
    },
  };
});