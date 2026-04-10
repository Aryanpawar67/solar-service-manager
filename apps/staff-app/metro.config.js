const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ── pnpm monorepo support ────────────────────────────────────────────────────
// 1. Watch the entire monorepo so Metro picks up changes in workspace packages
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from the workspace root first, then the project
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Disable hierarchical lookup so pnpm symlinks resolve correctly
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
