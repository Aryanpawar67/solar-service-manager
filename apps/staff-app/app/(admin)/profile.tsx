import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useGetMe } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { FadeInView } from "@/components/FadeInView";

export default function AdminProfileScreen() {
  const { data, isLoading } = useGetMe();
  const user = data?.user;

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearToken();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? "A";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Green header with avatar */}
      <FadeInView delay={0} fromY={-20}>
      <View style={styles.header}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.name ?? "—"}</Text>
        <Text style={styles.email}>{user?.email ?? "—"}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark-outline" size={12} color="#16a34a" />
          <Text style={styles.roleBadgeText}>Administrator</Text>
        </View>
      </View>
      </FadeInView>

      {/* Info card */}
      <FadeInView delay={120}>
      <View style={styles.card}>
        <InfoRow icon="mail-outline" label="Email" value={user?.email ?? "—"} />
        <InfoRow icon="shield-outline" label="Role" value={user?.role ?? "—"} last />
      </View>
      </FadeInView>

      {/* Logout */}
      <FadeInView delay={240}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      </FadeInView>

      <Text style={styles.version}>GreenVolt Admin · v1.0.0</Text>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={14} color="#16a34a" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#16a34a",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 36,
    gap: 6,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 34, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: "#fff" },
  email: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500", marginTop: 1 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 16,
  },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },

  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#d1d5db",
    marginTop: 24,
  },
});
