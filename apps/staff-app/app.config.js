// Dynamic Expo config — extends app.json with runtime logic.
// Expo prefers app.config.js over app.json when both exist.
// eas init writes extra.eas.projectId into app.json; we read it back here
// so the OTA update URL is always correct without a manual edit.

const { existsSync } = require("fs");
const { resolve } = require("path");

const base = require("./app.json").expo;

// eas init sets this automatically in app.json → extra.eas.projectId
const projectId = base.extra?.eas?.projectId;

// Only include googleServicesFile when the file actually exists.
// This lets `expo start` and development builds work before Firebase is set up.
const googleServicesFile = existsSync(resolve(__dirname, "google-services.json"))
  ? "./google-services.json"
  : undefined;

/** @type {import('@expo/config').ExpoConfig} */
const config = {
  ...base,
  updates: projectId
    ? {
        url: `https://u.expo.dev/${projectId}`,
        enabled: true,
        checkAutomatically: "ON_LOAD",
        fallbackToCacheTimeout: 0,
      }
    : undefined,
  android: {
    ...base.android,
    googleServicesFile,
  },
};

module.exports = { expo: config };
