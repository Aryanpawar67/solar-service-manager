import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function TabIcon({
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
