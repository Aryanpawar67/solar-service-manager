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
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";

export default function AdminProfileScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetMe();
  const user = data?.user;

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          queryClient.clear();
          await clearToken();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "A";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Page title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Admin Profile</Text>
        <Text style={styles.pageSub}>Manage your personal settings and administrative controls.</Text>
      </View>

      {/* Identity card */}
      <View style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? "—"}</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>SYSTEM ADMIN</Text>
        </View>
        <Text style={styles.email}>{user?.email ?? "—"}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push("/(admin)/edit-profile")} activeOpacity={0.8}>
          <Ionicons name="pencil-outline" size={14} color="#374151" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Section cards */}
      <TouchableOpacity
        style={styles.sectionCard}
        onPress={() => router.push("/(admin)/staff")}
        activeOpacity={0.85}
      >
        <View style={styles.sectionCardLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons name="people-outline" size={22} color="#00450d" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionCardTitle}>Manage Staff</Text>
            <Text style={styles.sectionCardSub}>Add, remove, or modify staff accounts and assign regional access.</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.sectionCard} onPress={() => Alert.alert("System Settings", "System configuration is managed via the admin web dashboard at greenvolt.in/admin")} activeOpacity={0.85}>
        <View style={styles.sectionCardLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons name="settings-outline" size={22} color="#00450d" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionCardTitle}>System Settings</Text>
            <Text style={styles.sectionCardSub}>Configure global platform thresholds, alerts, and API integrations.</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.sectionCard} onPress={() => Alert.alert("Role Permissions", "Role-based access is automatically enforced by the system:\n\n• Admin: Full access\n• Staff: Assigned jobs only\n• Customer: Own data only")} activeOpacity={0.85}>
        <View style={styles.sectionCardLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons name="shield-outline" size={22} color="#00450d" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionCardTitle}>Role Permissions</Text>
            <Text style={styles.sectionCardSub}>Define custom roles and adjust feature access levels for user groups.</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </TouchableOpacity>

      {/* Logout card */}
      <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.85}>
        <View style={styles.sectionCardLeft}>
          <View style={[styles.sectionIcon, styles.logoutIcon]}>
            <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.logoutSub}>Securely end your current administrative session.</Text>
          </View>
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  pageHeader: { paddingVertical: 8 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 4, lineHeight: 18 },

  identityCard: {
    backgroundColor: "#fff",
    borderRadius: 16, padding: 24,
    alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#f0f0f0",
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#374151" },
  name: { fontSize: 20, fontWeight: "800", color: "#111827" },
  adminBadge: {
    backgroundColor: "#bcf200",
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  adminBadgeText: { fontSize: 11, fontWeight: "800", color: "#1a3a00", letterSpacing: 0.5 },
  email: { fontSize: 13, color: "#9ca3af" },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: "#e5e7eb",
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
    marginTop: 4,
  },
  editBtnText: { fontSize: 13, fontWeight: "600", color: "#374151" },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#f0f0f0",
    gap: 12,
  },
  sectionCardLeft: { flexDirection: "row", alignItems: "flex-start", gap: 14, flex: 1 },
  sectionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#f0fdf4",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  sectionCardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 3 },
  sectionCardSub: { fontSize: 12, color: "#9ca3af", lineHeight: 17 },

  logoutCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#fecaca",
  },
  logoutIcon: { backgroundColor: "#fef2f2" },
  logoutTitle: { fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 3 },
  logoutSub: { fontSize: 12, color: "#f87171", lineHeight: 17 },
});
