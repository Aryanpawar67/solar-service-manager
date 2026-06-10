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
import { useGetMe, useListServices } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { data, isLoading } = useGetMe();
  const user = data?.user;

  const { data: servicesData } = useListServices(
    user?.staffId != null ? { staffId: user.staffId, limit: 200 } : {}
  );
  const completedCount = (servicesData?.data ?? []).filter((s) => s.status === "completed").length;

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
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
  const techId = user?.staffId != null ? `GV-TECH-${String(user.staffId).padStart(4, "0")}` : "—";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.name}>{user?.name ?? "—"}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>TECHNICIAN</Text>
        </View>
        <View style={styles.techIdRow}>
          <Ionicons name="card-outline" size={13} color="#9ca3af" />
          <Text style={styles.techIdText}>ID: {techId}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>JOBS COMPLETED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingRow}>
              <Text style={styles.statValue}>—</Text>
              <Ionicons name="star-outline" size={16} color="#9ca3af" />
            </View>
            <Text style={styles.statLabel}>AVERAGE RATING</Text>
          </View>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Contact Info</Text>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color="#6b7280" />
          <View>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email ?? "—"}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color="#6b7280" />
          <View>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>—</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#6b7280" />
          <View>
            <Text style={styles.infoLabel}>Service Region</Text>
            <Text style={styles.infoValue}>—</Text>
          </View>
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.divider} />
        {[
          { icon: "person-outline" as const, label: "Personal Details", route: "/(staff)/personal-details" as const },
          { icon: "shield-outline" as const, label: "Security & Password", route: "/(staff)/security" as const },
          { icon: "notifications-outline" as const, label: "Notification Preferences", route: "/(staff)/notifications" as const },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.settingsRow} onPress={() => router.push(item.route)} activeOpacity={0.7}>
            <Ionicons name={item.icon} size={20} color="#374151" />
            <Text style={styles.settingsLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Help */}
      <View style={styles.sectionCard}>
        {[
          { icon: "help-circle-outline" as const, label: "Help & Support", route: "/(staff)/support" as const },
          { icon: "shield-checkmark-outline" as const, label: "Company Policies", route: "/(staff)/policies" as const },
        ].map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.settingsRow, idx === 0 && { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon} size={20} color="#374151" />
            <Text style={styles.settingsLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    gap: 6,
  },
  avatarWrap: { position: "relative", marginBottom: 6 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#374151" },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#bcf200", borderWidth: 2, borderColor: "#fff",
  },
  name: { fontSize: 22, fontWeight: "800", color: "#111827" },
  roleBadge: {
    backgroundColor: "#f3f4f6", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 5,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "700", color: "#6b7280", letterSpacing: 1 },
  techIdRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  techIdText: { fontSize: 13, color: "#9ca3af" },

  divider: { height: 1, backgroundColor: "#f0f0f0", alignSelf: "stretch", marginVertical: 8 },

  statsRow: { flexDirection: "row", alignSelf: "stretch" },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, backgroundColor: "#f0f0f0" },
  statValue: { fontSize: 32, fontWeight: "800", color: "#00450d" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    gap: 0,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 10,
  },
  infoLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500", marginTop: 2 },

  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  settingsLabel: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "500" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});
