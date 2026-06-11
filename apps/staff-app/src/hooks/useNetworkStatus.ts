import { useState, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { API_BASE_URL } from "@/lib/constants";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);
  const failCount = useRef(0);

  const checkConnectivity = async () => {
    try {
      const controller = new AbortController();
      // 15s timeout — Render free tier cold-starts can take 30–60s
      const timeout = setTimeout(() => controller.abort(), 15000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await fetch(`${API_BASE_URL}/api/healthz`, {
        method: "HEAD",
        signal: controller.signal as any,
        cache: "no-store",
      });
      clearTimeout(timeout);
      if (res.ok) {
        failCount.current = 0;
        setIsOnline(true);
      } else {
        failCount.current += 1;
        if (failCount.current >= 2) setIsOnline(false);
      }
    } catch {
      failCount.current += 1;
      // Only show offline banner after 2 consecutive failures to avoid
      // false positives from Render cold-start timeouts
      if (failCount.current >= 2) setIsOnline(false);
    }
  };

  useEffect(() => {
    // Web has native online/offline events
    if (Platform.OS === "web") {
      type EventTarget = { addEventListener: (e: string, cb: () => void) => void; removeEventListener: (e: string, cb: () => void) => void };
      const g = globalThis as unknown as EventTarget;
      const onOnline = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      g.addEventListener("online", onOnline);
      g.addEventListener("offline", onOffline);
      return () => {
        g.removeEventListener("online", onOnline);
        g.removeEventListener("offline", onOffline);
      };
    }

    // Native: poll the healthz endpoint every 30 s when app is in foreground
    checkConnectivity();
    intervalRef.current = setInterval(checkConnectivity, 30_000);

    const sub = AppState.addEventListener("change", (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        checkConnectivity();
      }
      appState.current = next;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isOnline;
}
