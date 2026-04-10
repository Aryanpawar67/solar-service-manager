import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { isAuthenticated } from "@/lib/auth";

export default function Index() {
  const [status, setStatus] = useState<"loading" | "auth" | "no-auth">("loading");

  useEffect(() => {
    isAuthenticated().then((ok) => setStatus(ok ? "auth" : "no-auth"));
  }, []);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0fdf4" }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return <Redirect href={status === "auth" ? "/(tabs)/jobs" : "/(auth)/login"} />;
}
