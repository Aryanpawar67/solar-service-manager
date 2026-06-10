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

export default function CustomerTabsLayout() {
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
    </Tabs>
  );
}
