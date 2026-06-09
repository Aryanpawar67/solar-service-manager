import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function TabIcon({
  icon,
  activeIcon,
  focused,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", height: 30 }}>
      <Ionicons name={focused ? activeIcon : icon} size={22} color={color} />
      {focused && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            width: 18,
            height: 3,
            backgroundColor: "#16a34a",
            borderRadius: 2,
          }}
        />
      )}
    </View>
  );
}

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        headerStyle: { backgroundColor: "#16a34a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      {/* ── Visible tabs (4) ─────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="home-outline" activeIcon="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="construct-outline" activeIcon="construct" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="card-outline" activeIcon="card" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="person-outline" activeIcon="person" color={color} focused={focused} />
          ),
        }}
      />

      {/* ── Hidden routes (no tab bar entry) ─────────────────────── */}
      <Tabs.Screen name="subscription" options={{ href: null }} />
      {/* book folder — entire nested Stack is hidden */}
      <Tabs.Screen name="book" options={{ href: null }} />
      <Tabs.Screen name="book/index" options={{ href: null }} />
      <Tabs.Screen name="book/review" options={{ href: null }} />
      <Tabs.Screen name="book/success" options={{ href: null }} />
      <Tabs.Screen name="book/[id]" options={{ href: null }} />
    </Tabs>
  );
}
