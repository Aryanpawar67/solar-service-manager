import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useGetDashboardAnalytics } from "@workspace/api-client-react";

export default function AdminAnalyticsScreen() {
  const { data, isLoading, refetch, isRefetching } = useGetDashboardAnalytics();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const d = data as Record<string, number> | undefined;

  const metrics = [
    { label: "Total Customers", value: d?.totalCustomers ?? 0, color: "#16a34a" },
    { label: "Active Subscriptions", value: d?.activeSubscriptions ?? 0, color: "#3b82f6" },
    { label: "Total Staff", value: d?.totalStaff ?? 0, color: "#8b5cf6" },
    { label: "Active Staff", value: d?.activeStaff ?? 0, color: "#06b6d4" },
    { label: "Completed Services", value: d?.completedServices ?? 0, color: "#16a34a" },
    { label: "Pending Services", value: d?.pendingServices ?? 0, color: "#f59e0b" },
    { label: "In-Progress Services", value: d?.inProgressServices ?? 0, color: "#3b82f6" },
    { label: "Unread Contacts", value: d?.unreadContacts ?? 0, color: "#ef4444" },
  ];

  const revenue = d?.totalRevenue ?? 0;
  const monthly = d?.monthlyRevenue ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
    >
      {/* Revenue */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>Total Revenue</Text>
        <Text style={styles.revenueValue}>₹{revenue.toLocaleString("en-IN")}</Text>
        <Text style={styles.revenueMonthly}>This month: ₹{monthly.toLocaleString("en-IN")}</Text>
      </View>

      {/* Metrics grid */}
      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  revenueCard: {
    backgroundColor: "#16a34a",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  revenueLabel: { fontSize: 13, color: "#dcfce7", fontWeight: "600", marginBottom: 8 },
  revenueValue: { fontSize: 36, fontWeight: "800", color: "#fff" },
  revenueMonthly: { fontSize: 13, color: "#bbf7d0", marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    width: "47%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  metricValue: { fontSize: 30, fontWeight: "800", marginBottom: 4 },
  metricLabel: { fontSize: 12, color: "#6b7280", textAlign: "center" },
});
