import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { getToken, decodeJwtPayload } from "@/lib/auth";
import { TabIcon } from "@/components/TabIcon";

export default function CustomerTabsLayout() {
  useEffect(() => {
    getToken().then((token) => {
      if (!token) { router.replace("/(auth)/login"); return; }
      const payload = decodeJwtPayload(token);
      if (!payload || payload.role !== "customer") router.replace("/(auth)/login");
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00450d",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          height: 64,
        },
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#00450d",
        headerTitleStyle: { fontWeight: "700", fontSize: 17, color: "#111827" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="grid-outline" activeIcon="grid" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="construct-outline" activeIcon="construct" label="Services" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="flash-outline" activeIcon="flash" label="Usage" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" activeIcon="person" label="Profile" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen name="subscription" options={{ href: null }} />
      <Tabs.Screen name="book" options={{ href: null }} />
      <Tabs.Screen name="book/index" options={{ href: null }} />
      <Tabs.Screen name="book/review" options={{ href: null }} />
      <Tabs.Screen name="book/success" options={{ href: null }} />
      <Tabs.Screen name="book/[id]" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="services/[id]" options={{ href: null }} />
    </Tabs>
  );
}
