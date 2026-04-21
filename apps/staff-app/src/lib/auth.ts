import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";

// expo-secure-store doesn't work on web — fall back to localStorage
async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

export async function getToken(): Promise<string | null> {
  return storageGet(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  return storageSet(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return storageDelete(TOKEN_KEY);
}

/** Decode the JWT payload without verifying signature (verification happens on the server). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Returns true if the token exists and has not expired. */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 > Date.now();
}
