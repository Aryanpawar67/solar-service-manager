import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { useGetMe } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";

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

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? "A"}</Text>
      </View>
      <Text style={styles.name}>{user?.name ?? "—"}</Text>
      <Text style={styles.email}>{user?.email ?? "—"}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>ADMIN</Text>
      </View>

      <View style={styles.card}>
        <Row label="Email" value={user?.email ?? "—"} />
        <Row label="Role" value={user?.role ?? "—"} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", alignItems: "center", padding: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginTop: 32, marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: "700", color: "#fff" },
  name: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  email: { fontSize: 14, color: "#6b7280", marginBottom: 12 },
  badge: { backgroundColor: "#dcfce7", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 28 },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1, marginBottom: 24 },
  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 90 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  logoutBtn: { width: "100%", backgroundColor: "#fee2e2", borderRadius: 12, padding: 16, alignItems: "center" },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});
