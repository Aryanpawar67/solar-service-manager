import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useGetMyProfile, useGetMySubscription, useGetMyServices } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

export default function CustomerHomeScreen() {
  const { data: profile, isLoading: profileLoading, refetch } = useGetMyProfile();
  const { data: subscription } = useGetMySubscription();
  const { data: services } = useGetMyServices({ limit: 5 });

  const isLoading = profileLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // Find next upcoming service
  const upcoming = (services?.data ?? []).find(
    (s) => s.status === "pending" || s.status === "in_progress"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#16a34a" />}
    >
      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.welcomeName}>{profile?.name ?? "—"}</Text>
        {profile?.solarCapacity && (
          <Text style={styles.welcomeSub}>{profile.solarCapacity} kW Solar System</Text>
        )}
      </View>

      {/* Subscription badge */}
      {subscription && (
        <TouchableOpacity style={styles.subCard} onPress={() => router.push("/(customer)/subscription")} activeOpacity={0.8}>
          <View style={styles.subRow}>
            <Text style={styles.subPlan}>{subscription.plan}</Text>
            <View style={[styles.badge, { backgroundColor: subscription.status === "active" ? "#dcfce7" : "#fee2e2" }]}>
              <Text style={[styles.badgeText, { color: subscription.status === "active" ? "#16a34a" : "#dc2626" }]}>
                {subscription.status.toUpperCase()}
              </Text>
            </View>
          </View>
          {daysLeft !== null && (
            <Text style={[styles.subExpiry, daysLeft <= 30 ? styles.subExpirySoon : undefined]}>
              {daysLeft > 0 ? `Expires in ${daysLeft} days` : "Subscription expired"}
            </Text>
          )}
          <Text style={styles.subVisits}>Visits/month: {subscription.visitsPerMonth}</Text>
        </TouchableOpacity>
      )}

      {/* Next appointment */}
      {upcoming ? (
        <TouchableOpacity style={styles.apptCard} onPress={() => router.push(`/(customer)/services/${upcoming.id}`)} activeOpacity={0.8}>
          <Text style={styles.apptTitle}>Next Appointment</Text>
          <View style={styles.apptRow}>
            <Text style={styles.apptDate}>
              {upcoming.scheduledDate
                ? new Date(upcoming.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
                : "Date TBD"}
            </Text>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[upcoming.status] ?? "#6b7280") + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[upcoming.status] ?? "#6b7280" }]}>
                {upcoming.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          {upcoming.staff && <Text style={styles.apptStaff}>Technician: {upcoming.staff.name}</Text>}
        </TouchableOpacity>
      ) : (
        <View style={styles.noApptCard}>
          <Text style={styles.noApptText}>No upcoming appointments</Text>
        </View>
      )}

      {/* Quick links */}
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(customer)/services")} activeOpacity={0.8}>
          <Text style={styles.quickIcon}>🔧</Text>
          <Text style={styles.quickLabel}>Service History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(customer)/payments")} activeOpacity={0.8}>
          <Text style={styles.quickIcon}>💳</Text>
          <Text style={styles.quickLabel}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(customer)/subscription")} activeOpacity={0.8}>
          <Text style={styles.quickIcon}>⭐</Text>
          <Text style={styles.quickLabel}>Subscription</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(customer)/profile")} activeOpacity={0.8}>
          <Text style={styles.quickIcon}>👤</Text>
          <Text style={styles.quickLabel}>My Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcomeCard: { backgroundColor: "#16a34a", borderRadius: 16, padding: 20, shadowColor: "#16a34a", shadowOpacity: 0.25, shadowRadius: 10, elevation: 3 },
  welcomeText: { fontSize: 14, color: "#dcfce7" },
  welcomeName: { fontSize: 24, fontWeight: "800", color: "#fff", marginVertical: 2 },
  welcomeSub: { fontSize: 13, color: "#bbf7d0" },
  subCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  subRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  subPlan: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subExpiry: { fontSize: 13, color: "#6b7280" },
  subExpirySoon: { color: "#f59e0b", fontWeight: "600" },
  subVisits: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  apptCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  apptTitle: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", marginBottom: 8 },
  apptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  apptDate: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  apptStaff: { fontSize: 13, color: "#3b82f6" },
  noApptCard: { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  noApptText: { color: "#9ca3af", fontSize: 14 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", width: "47%", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, gap: 6 },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 13, fontWeight: "600", color: "#374151", textAlign: "center" },
});
