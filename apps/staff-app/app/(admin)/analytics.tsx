import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useGetDashboardAnalytics } from "@workspace/api-client-react";
import type { DashboardAnalytics, Service } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function AdminAnalyticsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetDashboardAnalytics();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00450d" />
      </View>
    );
  }

  const d = data as DashboardAnalytics | undefined;
  const totalRevenue = d?.totalRevenue ?? 0;
  const monthlyRevenue = d?.monthlyRevenue ?? 0;
  const serviceRevenue = d?.serviceRevenue ?? 0;
  const subscriptionRevenue = d?.subscriptionRevenue ?? 0;
  const recentServices: Service[] = d?.recentServices ?? [];

  const customerCards: { label: string; value: number; icon: IconName; accent?: string }[] = [
    { label: "Total Customers", value: d?.totalCustomers ?? 0, icon: "people-outline" },
    { label: "New This Month", value: d?.newCustomers ?? 0, icon: "person-add-outline", accent: "#00450d" },
    { label: "Active Subscriptions", value: d?.activeSubscriptions ?? 0, icon: "card-outline", accent: "#00450d" },
    { label: "Expiring Soon", value: d?.expiringSubscriptions ?? 0, icon: "time-outline", accent: "#f59e0b" },
  ];

  const serviceCards: { label: string; value: number; icon: IconName; accent?: string }[] = [
    { label: "Total Services", value: d?.totalServices ?? 0, icon: "construct-outline" },
    { label: "Upcoming", value: d?.upcomingServices ?? 0, icon: "calendar-outline", accent: "#6366f1" },
    { label: "Completed", value: d?.completedServices ?? 0, icon: "checkmark-circle-outline", accent: "#00450d" },
    { label: "In Progress", value: d?.inProgressServices ?? 0, icon: "sync-outline", accent: "#f59e0b" },
    { label: "Pending", value: d?.pendingServices ?? 0, icon: "hourglass-outline" },
    { label: "Unread Contacts", value: d?.newContactsUnread ?? 0, icon: "mail-unread-outline", accent: "#ef4444" },
  ];

  const staffCards: { label: string; value: number; icon: IconName; accent?: string }[] = [
    { label: "Total Staff", value: d?.totalStaff ?? 0, icon: "people-outline" },
    { label: "Active Staff", value: d?.activeStaff ?? 0, icon: "checkmark-circle-outline", accent: "#00450d" },
    { label: "Available", value: d?.availableStaff ?? 0, icon: "radio-button-on-outline", accent: "#6366f1" },
    { label: "Assigned", value: d?.assignedStaff ?? 0, icon: "briefcase-outline", accent: "#f59e0b" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#00450d"
          colors={["#00450d"]}
        />
      }
    >
      {isError && (
        <TouchableOpacity style={styles.errorBanner} onPress={() => refetch()} activeOpacity={0.8}>
          <Ionicons name="warning-outline" size={14} color="#92400e" />
          <Text style={styles.errorBannerText}>Couldn't reach the server — showing cached data. Tap to retry.</Text>
        </TouchableOpacity>
      )}

      {/* Revenue Card */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
        <Text style={styles.revenueValue}>₹{totalRevenue.toLocaleString("en-IN")}</Text>
        <View style={styles.revenueDivider} />
        <View style={styles.revenueRow}>
          <View style={styles.revenueCol}>
            <Text style={styles.revenueSubLabel}>This Month</Text>
            <Text style={styles.revenueSubValue}>₹{monthlyRevenue.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.revenueColDivider} />
          <View style={styles.revenueCol}>
            <Text style={styles.revenueSubLabel}>Services</Text>
            <Text style={styles.revenueSubValue}>₹{serviceRevenue.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.revenueColDivider} />
          <View style={styles.revenueCol}>
            <Text style={styles.revenueSubLabel}>Subscriptions</Text>
            <Text style={styles.revenueSubValue}>₹{subscriptionRevenue.toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </View>

      {/* Customers & Subscriptions */}
      <Text style={styles.sectionTitle}>Customers & Subscriptions</Text>
      <View style={styles.grid}>
        {customerCards.map((c) => (
          <MetricCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} />
        ))}
      </View>

      {/* Services */}
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.grid}>
        {serviceCards.map((c) => (
          <MetricCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} />
        ))}
      </View>

      {/* Team */}
      <Text style={styles.sectionTitle}>Team</Text>
      <View style={styles.grid}>
        {staffCards.map((c) => (
          <MetricCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} />
        ))}
      </View>

      {/* Recent Services */}
      <Text style={styles.sectionTitle}>Recent Services</Text>
      <View style={styles.listCard}>
        {recentServices.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="construct-outline" size={28} color="#d1d5db" />
            <Text style={styles.emptyText}>No services yet</Text>
          </View>
        ) : (
          recentServices.map((s, idx) => (
            <ServiceRow key={s.id} service={s} border={idx > 0} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent = "#9ca3af",
}: {
  label: string;
  value: number;
  icon: IconName;
  accent?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value.toLocaleString("en-IN")}</Text>
      <View style={[styles.metricIconBg, { backgroundColor: accent + "18" }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
    </View>
  );
}

const STATUS_COLOR: Record<string, string> = {
  completed: "#00450d",
  pending: "#9ca3af",
  in_progress: "#f59e0b",
  cancelled: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Done",
  pending: "Pending",
  in_progress: "In Progress",
  cancelled: "Cancelled",
};

function ServiceRow({ service, border }: { service: Service; border: boolean }) {
  const color = STATUS_COLOR[service.status] ?? "#9ca3af";
  const label = STATUS_LABEL[service.status] ?? service.status;
  const type = service.serviceType ?? "Service";
  const date = service.scheduledDate
    ? new Date(service.scheduledDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "—";

  return (
    <View style={[styles.serviceRow, border && styles.serviceRowBorder]}>
      <View style={[styles.serviceIconBg, { backgroundColor: color + "18" }]}>
        <Ionicons name="construct-outline" size={16} color={color} />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceType} numberOfLines={1}>{type}</Text>
        <Text style={styles.serviceDate}>{date} · #{service.id}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: color + "18" }]}>
        <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef3c7", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "#fde68a",
  },
  errorBannerText: { fontSize: 12, color: "#92400e", flex: 1, lineHeight: 17 },

  revenueCard: {
    backgroundColor: "#00450d",
    borderRadius: 16, padding: 20, gap: 4,
  },
  revenueLabel: {
    fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.8,
  },
  revenueValue: { fontSize: 40, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  revenueDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 12 },
  revenueRow: { flexDirection: "row", gap: 8 },
  revenueCol: { flex: 1, gap: 2 },
  revenueColDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  revenueSubLabel: { fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "600" },
  revenueSubValue: { fontSize: 15, fontWeight: "700", color: "#fff" },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 4 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  metricCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#f0f0f0",
    gap: 2,
  },
  metricLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  metricValue: { fontSize: 30, fontWeight: "800", color: "#111827", marginTop: 4 },
  metricIconBg: {
    position: "absolute", bottom: 10, right: 10,
    width: 32, height: 32, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },

  listCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1, borderColor: "#f0f0f0",
    overflow: "hidden",
  },
  emptyRow: {
    padding: 24,
    alignItems: "center", gap: 8,
  },
  emptyText: { fontSize: 13, color: "#d1d5db" },

  serviceRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  serviceRowBorder: { borderTopWidth: 1, borderTopColor: "#f4f4f5" },
  serviceIconBg: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  serviceInfo: { flex: 1, gap: 2 },
  serviceType: { fontSize: 14, fontWeight: "600", color: "#111827" },
  serviceDate: { fontSize: 11, color: "#9ca3af" },
  statusBadge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    flexShrink: 0,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
});
