import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useGetMe } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { FadeInView } from "@/components/FadeInView";

export default function ProfileScreen() {
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

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <FadeInView delay={0} fromY={-20}>
      <View style={styles.header}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.name ?? "—"}</Text>
        <Text style={styles.email}>{user?.email ?? "—"}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#16a34a" />
          <Text style={styles.roleBadgeText}>{(user?.role ?? "staff").toUpperCase()}</Text>
        </View>
      </View>
      </FadeInView>

      {/* Info card */}
      <FadeInView delay={120}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <InfoRow icon="mail-outline" label="Email" value={user?.email ?? "—"} />
        <InfoRow icon="shield-outline" label="Role" value={user?.role ?? "—"} />
        <InfoRow
          icon="id-card-outline"
          label="Staff ID"
          value={user?.staffId != null ? `#${user.staffId}` : "Not linked"}
          last
        />
      </View>
      </FadeInView>

      {/* Logout */}
      <FadeInView delay={240}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      </FadeInView>

      <Text style={styles.version}>GreenVolt Staff App · v1.0.0</Text>
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
        <Ionicons name={icon} size={16} color="#16a34a" />
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
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#fff" },
  name: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  email: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 12 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 1 },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "600", marginTop: 1 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
  version: { textAlign: "center", fontSize: 11, color: "#d1d5db", marginTop: 24 },
});
