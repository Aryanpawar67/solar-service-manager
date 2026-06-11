import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { getToken, decodeJwtPayload } from "@/lib/auth";
import { TabIcon } from "@/components/TabIcon";

export default function AdminTabsLayout() {
  useEffect(() => {
    getToken().then((token) => {
      if (!token) { router.replace("/(auth)/login"); return; }
      const payload = decodeJwtPayload(token);
      if (!payload || payload.role !== "admin") router.replace("/(auth)/login");
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
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="briefcase-outline" activeIcon="briefcase" label="Jobs" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="people-outline" activeIcon="people" label="Customers" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Overview",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="bar-chart-outline" activeIcon="bar-chart" label="Overview" focused={focused} />
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

      <Tabs.Screen name="staff" options={{ href: null }} />
      <Tabs.Screen name="customers/[id]" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="create-job" options={{ href: null }} />
    </Tabs>
  );
}
