import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function TabIcon({
  icon,
  activeIcon,
  label,
  focused,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
}) {
  if (focused) {
    return (
      <View style={{ alignItems: "center", gap: 3, marginTop: 4 }}>
        <View style={{
          backgroundColor: "#bcf200",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 5,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}>
          <Ionicons name={activeIcon} size={18} color="#00450d" />
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#00450d" }}>{label}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={{ alignItems: "center", gap: 3, marginTop: 4 }}>
      <Ionicons name={icon} size={22} color="#9ca3af" />
    </View>
  );
}

export default function StaffTabsLayout() {
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
          title: "My Jobs",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="briefcase-outline" activeIcon="briefcase" label="Jobs" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar-outline" activeIcon="calendar" label="Schedule" focused={focused} />
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
      <Tabs.Screen name="personal-details" options={{ href: null }} />
      <Tabs.Screen name="security" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="policies" options={{ href: null }} />
    </Tabs>
  );
}
