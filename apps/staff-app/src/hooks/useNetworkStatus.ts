import { useState, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { API_BASE_URL } from "@/lib/constants";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  const checkConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await fetch(`${API_BASE_URL}/api/healthz`, {
        method: "HEAD",
        signal: controller.signal as any,
        cache: "no-store",
      });
      clearTimeout(timeout);
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
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
