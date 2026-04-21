import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { isAuthenticated, getToken, decodeJwtPayload } from "@/lib/auth";

type RouteState = "loading" | "no-auth" | "staff" | "admin" | "customer";

function roleToRoute(role: string): RouteState {
  if (role === "admin") return "admin";
  if (role === "customer") return "customer";
  return "staff";
}

export default function Index() {
  const [status, setStatus] = useState<RouteState>("loading");

  useEffect(() => {
    (async () => {
      const ok = await isAuthenticated();
      if (!ok) {
        setStatus("no-auth");
        return;
      }
      const token = await getToken();
      const payload = token ? decodeJwtPayload(token) : null;
      const role = typeof payload?.role === "string" ? payload.role : "staff";
      setStatus(roleToRoute(role));
    })();
  }, []);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0fdf4" }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (status === "no-auth") return <Redirect href="/(auth)/login" />;
  if (status === "admin") return <Redirect href="/(admin)/jobs" />;
  if (status === "customer") return <Redirect href="/(customer)" />;
  return <Redirect href="/(staff)/jobs" />;
}
