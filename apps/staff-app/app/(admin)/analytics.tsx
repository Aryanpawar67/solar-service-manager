import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";

export default function AdminAnalyticsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetDashboardAnalytics();

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const d = data as Record<string, number> | undefined;
  const revenue = d?.totalRevenue ?? 0;
  const monthly = d?.monthlyRevenue ?? 0;
  const monthlyPct = revenue > 0 ? ((monthly / revenue) * 100).toFixed(0) : "0";

  const serviceStats = [
    { label: "Completed",        value: d?.completedServices  ?? 0, icon: "checkmark-circle-outline" as const, color: "#00450d" },
    { label: "Pending",          value: d?.pendingServices    ?? 0, icon: "time-outline" as const,             color: "#9ca3af" },
    { label: "In Progress",      value: d?.inProgressServices ?? 0, icon: "sync-outline" as const,             color: "#9ca3af" },
    { label: "Unread Contacts",  value: d?.unreadContacts     ?? 0, icon: "mail-unread-outline" as const,      color: "#ef4444" },
  ];

  const peopleStats = [
    { label: "Total Customers",  value: d?.totalCustomers      ?? 0, dot: false, color: "#9ca3af" },
    { label: "Active Subs",      value: d?.activeSubscriptions ?? 0, dot: true,  color: "#bcf200" },
    { label: "Total Staff",      value: d?.totalStaff          ?? 0, dot: false, color: "#9ca3af" },
    { label: "Active Staff",     value: d?.activeStaff         ?? 0, dot: true,  color: "#00450d" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />}
    >
      {/* Revenue card */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueTop}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <View style={styles.exportBtn}>
            <Ionicons name="download-outline" size={16} color="#6b7280" />
          </View>
        </View>
        <Text style={styles.revenueValue}>₹{revenue.toLocaleString("en-IN")}</Text>
        <View style={styles.revenueTrend}>
          <Ionicons name="trending-up-outline" size={14} color="#00450d" />
          <View style={styles.revenuePctBadge}>
            <Text style={styles.revenuePctText}>+{monthlyPct}%</Text>
          </View>
          <Text style={styles.revenueTrendText}>this month</Text>
        </View>
      </View>

      {/* Service Status */}
      <Text style={styles.sectionTitle}>Service Status</Text>
      <View style={styles.grid}>
        {serviceStats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statCardLabel}>{s.label}</Text>
            <Text style={styles.statCardValue}>{s.value}</Text>
            <View style={styles.statCardIcon}>
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
          </View>
        ))}
      </View>

      {/* People Overview */}
      <Text style={styles.sectionTitle}>People Overview</Text>
      <View style={styles.grid}>
        {peopleStats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statCardLabel}>{s.label}</Text>
            <Text style={styles.statCardValue}>{s.value}</Text>
            {s.dot && (
              <View style={[styles.liveDot, { backgroundColor: s.color }]} />
            )}
            {!s.dot && (
              <View style={styles.statCardIconGray}>
                <Ionicons name="people-outline" size={20} color="#d1d5db" />
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  revenueCard: {
    backgroundColor: "#fff",
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#f0f0f0",
    gap: 6,
  },
  revenueTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  revenueLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  exportBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
  },
  revenueValue: { fontSize: 38, fontWeight: "800", color: "#111827", letterSpacing: -1 },
  revenueTrend: { flexDirection: "row", alignItems: "center", gap: 6 },
  revenuePctBadge: {
    backgroundColor: "#dcfce7", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  revenuePctText: { fontSize: 11, fontWeight: "700", color: "#00450d" },
  revenueTrendText: { fontSize: 12, color: "#9ca3af" },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 4 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#f0f0f0",
    gap: 4, position: "relative", overflow: "hidden",
  },
  statCardLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  statCardValue: { fontSize: 32, fontWeight: "800", color: "#111827", marginTop: 4 },
  statCardIcon: { position: "absolute", bottom: 12, right: 12 },
  statCardIconGray: { position: "absolute", bottom: 12, right: 12 },
  liveDot: {
    position: "absolute", bottom: 14, right: 14,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: "#fff",
  },
});
