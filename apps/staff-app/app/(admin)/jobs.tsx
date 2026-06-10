import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useListServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#6b7280", bg: "#f3f4f6",  label: "PENDING" },
  in_progress: { color: "#2563eb", bg: "#dbeafe",  label: "IN PROGRESS" },
  completed:   { color: "#00450d", bg: "#dcfce7",  label: "COMPLETED" },
  cancelled:   { color: "#ef4444", bg: "#fef2f2",  label: "CANCELLED" },
};

const FILTERS = ["All Jobs", "Pending", "In Progress", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

function filterKey(f: Filter): string | null {
  if (f === "Pending") return "pending";
  if (f === "In Progress") return "in_progress";
  if (f === "Completed") return "completed";
  return null;
}

export default function AdminJobsScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All Jobs");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useListServices({ limit: 200 });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const allJobs = data?.data ?? [];
  const key = filterKey(activeFilter);
  const filtered = (key ? allJobs.filter((j) => j.status === key) : allJobs).filter((j) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (j.customer?.name ?? "").toLowerCase().includes(q) ||
      (j.staff?.name ?? "").toLowerCase().includes(q) ||
      (j.serviceType ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Admin Jobs List</Text>
        <Text style={styles.pageSub}>Master view of all fleet assignments and service records.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, customers, techs..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
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
      </ScrollView>

      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, filtered.length === 0 && styles.contentEmpty]}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="briefcase-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.cancelled;
          const jobNum = `JOB-${String(item.id).padStart(4, "0")}`;
          const isPending = item.status === "pending";
          const isCompleted = item.status === "completed";
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.jobNum}>{jobNum}</Text>
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <Text style={styles.customerName} numberOfLines={1}>{item.customer?.name ?? "—"}</Text>

              <View style={styles.metaBlock}>
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>{item.staff?.name ?? "Unassigned"}</Text>
                </View>
                {item.serviceType ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="construct-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.serviceType}</Text>
                  </View>
                ) : null}
                {item.customer?.address ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText} numberOfLines={1}>{item.customer.address}</Text>
                  </View>
                ) : null}
                {item.scheduledDate ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>
                      Scheduled: {new Date(item.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, isPending && styles.actionBtnOutline]}
                onPress={() => router.push(`/job/${item.id}`)}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionBtnText, isPending && styles.actionBtnTextOutline]}>
                  {isPending ? "Assign Technician" : isCompleted ? "View Report" : "View Details"}
                </Text>
              </TouchableOpacity>
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
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 3, lineHeight: 18 },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, height: 44, backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  filterChipActive: { backgroundColor: "#00450d", borderColor: "#00450d" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  filterTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    gap: 8, borderWidth: 1, borderColor: "#f0f0f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  jobNum: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
  customerName: { fontSize: 18, fontWeight: "800", color: "#111827" },

  metaBlock: { gap: 5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: "#6b7280", flex: 1 },

  actionBtn: {
    backgroundColor: "#00450d", borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  actionBtnOutline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#00450d" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  actionBtnTextOutline: { color: "#00450d" },
});
