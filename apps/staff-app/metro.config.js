const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ── pnpm monorepo support ────────────────────────────────────────────────────
// 1. Watch the entire monorepo + pnpm virtual store
config.watchFolders = [
  workspaceRoot,
  path.resolve(workspaceRoot, "node_modules/.pnpm"),
];

// 2. Resolve modules: project → workspace → pnpm virtual store
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules/.pnpm/node_modules"),
];

// 3. Follow pnpm symlinks so Metro can reach the actual package files
config.resolver.unstable_enableSymlinks = true;

// 4. Enable package exports resolution (required for expo-router)
config.resolver.unstable_enablePackageExports = true;

// 5. Explicitly map core packages so Metro finds the single copy from any origin
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
