import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useListServices, useGetMe } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#6b7280", bg: "#f3f4f6", label: "PENDING" },
  in_progress: { color: "#2563eb", bg: "#dbeafe", label: "IN PROGRESS" },
  completed:   { color: "#00450d", bg: "#dcfce7", label: "COMPLETED" },
  cancelled:   { color: "#ef4444", bg: "#fef2f2", label: "CANCELLED" },
};

const FILTERS = ["All", "Pending", "In Progress", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

function filterKey(f: Filter): string | null {
  if (f === "Pending") return "pending";
  if (f === "In Progress") return "in_progress";
  if (f === "Completed") return "completed";
  return null;
}

export default function JobsScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const { data: meData, isLoading: meLoading, isError: meError } = useGetMe();
  const staffId = meData?.user?.staffId;

  const { data, isLoading, isError, refetch, isRefetching } = useListServices(
    staffId != null ? { staffId } : {}
  );

  if (meLoading || (isLoading && meData != null)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00450d" />
      </View>
    );
  }

  if (meError || isError) return <ErrorState onRetry={refetch} />;

  if (staffId == null) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-remove-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyTitle}>Account not linked</Text>
        <Text style={styles.emptyText}>Ask an admin to link your account to a staff profile.</Text>
      </View>
    );
  }

  const allJobs = data?.data ?? [];
  const key = filterKey(activeFilter);
  const jobs = key ? allJobs.filter((j) => j.status === key) : allJobs;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Ionicons name="flash" size={15} color="#00450d" />
          </View>
          <Text style={styles.headerBrand}>GreenVolt</Text>
        </View>
        <Ionicons name="person-outline" size={22} color="#374151" />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, jobs.length === 0 && styles.contentEmpty]}
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="briefcase-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptyText}>No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""} jobs at the moment.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.cancelled;
          const isPending = item.status === "pending";
          const isInProgress = item.status === "in_progress";
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.customerName} numberOfLines={1}>{item.customer?.name ?? "—"}</Text>
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                  <View style={[styles.badgeDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              {item.serviceType ? (
                <Text style={styles.serviceType}>{item.serviceType}</Text>
              ) : null}

              {item.customer?.address ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.customer.address}</Text>
                </View>
              ) : null}

              {item.scheduledDate ? (
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>
                    {new Date(item.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short",
                    })}
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.push(`/job/${item.id}`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {isInProgress ? "View Details" : isPending ? "Start Job" : "View Details"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => router.push(`/job/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate-outline" size={18} color="#00450d" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  list: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151", textAlign: "center" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#d1fae5",
    justifyContent: "center", alignItems: "center",
  },
  headerBrand: { fontSize: 16, fontWeight: "800", color: "#00450d" },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#fff",
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#00450d",
    borderColor: "#00450d",
  },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  filterTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  customerName: { fontSize: 17, fontWeight: "700", color: "#111827", flex: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexShrink: 0,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
  serviceType: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#6b7280", flex: 1 },

  cardActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#00450d",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  navBtn: {
    width: 46, height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
