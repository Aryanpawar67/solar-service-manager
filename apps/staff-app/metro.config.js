const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ── pnpm monorepo support ────────────────────────────────────────────────────
// 1. Watch the entire monorepo so Metro picks up changes in workspace packages
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from the project first, then the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Enable package exports resolution for pnpm symlinks (required for expo-router)
config.resolver.unstable_enablePackageExports = true;

// 4. Explicitly map workspace packages so Metro can find them from any origin
//    (needed because pnpm only symlinks packages in apps/staff-app/node_modules,
//    but Metro resolves bundle entry imports relative to the workspace root)
const pkgs = [
  "expo",
  "expo-router",
  "@expo/metro-runtime",
  "react",
  "react-native",
  "react-native-safe-area-context",
  "react-native-screens",
];
config.resolver.extraNodeModules = Object.fromEntries(
  pkgs.map((pkg) => [pkg, path.resolve(projectRoot, "node_modules", pkg)])
);

module.exports = config;
