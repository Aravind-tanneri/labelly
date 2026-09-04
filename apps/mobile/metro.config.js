const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

let config = getDefaultConfig(projectRoot);

// ─── Monorepo: watch the entire repo ────────────────────────────────────────
config.watchFolders = [monorepoRoot];

// Let Metro find packages both from the app dir and the monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Apply NativeWind configuration FIRST.
// This prevents nativewind from overriding our custom resolveRequest logic.
config = withNativeWind(config, { input: "./src/global.css" });

// ─── Singleton packages ──────────────────────────────────────────────────────
// These packages MUST resolve to exactly one copy across the whole bundle,
// including when imported from deep inside other node_modules.
// extraNodeModules only covers source-file→node_modules resolution, NOT
// node_modules→node_modules resolution.  Using resolveRequest intercepts ALL
// require() calls and guarantees one canonical copy for these packages.

const SINGLETONS = new Set([
  "react",
  "react-native",
  "@react-navigation/native",
  "@react-navigation/core",
  "@react-navigation/routers",
  "@react-navigation/elements",
  "@react-navigation/native-stack",
  "@react-navigation/bottom-tabs",
  "react-native-screens",
  "react-native-safe-area-context",
]);

// Pre-resolve singleton paths once at startup (fast – no runtime overhead).
const SINGLETON_PATHS = {};
for (const pkg of SINGLETONS) {
  try {
    SINGLETON_PATHS[pkg] = path.dirname(
      require.resolve(`${pkg}/package.json`, { paths: [monorepoRoot] })
    );
  } catch {
    // Package not installed – skip silently.
  }
}

// Preserve existing resolveRequest if any (e.g. from nativewind/expo)
const existingResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SINGLETON_PATHS[moduleName]) {
    // Re-resolve from the monorepo root so ALL callers (including those deep
    // in node_modules) get the same physical file path.
    return context.resolveRequest(
      {
        ...context,
        originModulePath: path.join(monorepoRoot, "package.json"),
      },
      moduleName,
      platform
    );
  }
  if (existingResolveRequest) {
    return existingResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Keep extraNodeModules as a secondary fallback for any edge cases.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...Object.fromEntries(Object.entries(SINGLETON_PATHS)),
};

module.exports = config;
