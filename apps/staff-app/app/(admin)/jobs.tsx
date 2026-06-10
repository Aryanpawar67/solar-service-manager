import {
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useListServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { FadeInView } from "@/components/FadeInView";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7", label: "Pending" },
  in_progress: { color: "#2563eb", bg: "#dbeafe", label: "In Progress" },
  completed:   { color: "#00450d", bg: "#dcfce7", label: "Completed" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6", label: "Cancelled" },
};

const STATUS_BORDER: Record<string, string> = {
  pending:     "#f59e0b",
  in_progress: "#3b82f6",
  completed:   "#00450d",
  cancelled:   "#d1d5db",
};

const FILTERS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
];

export default function AdminJobsScreen() {
  const [filter, setFilter] = useState("all");
  const { data, isLoading, isError, refetch, isRefetching } = useListServices({ limit: 100 });

  const allJobs = data?.data ?? [];
  const filtered = filter === "all" ? allJobs : allJobs.filter((j) => j.status === filter);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00450d" />
      </View>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <View style={styles.root}>
      {/* Filter tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((f) => {
            const count = f.key === "all" ? allJobs.length : allJobs.filter((j) => j.status === f.key).length;
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{f.label}</Text>
                <View style={[styles.filterCount, active && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
            <Text style={styles.emptyText}>
              {filter === "all" ? "No jobs have been created yet." : `No ${filter.replace("_", " ")} jobs.`}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.cancelled;
          const borderColor = STATUS_BORDER[item.status] ?? "#d1d5db";
          return (
            <FadeInView delay={Math.min(index * 70, 560)}>
            <Pressable
              android_ripple={{ color: "#00450d18" }}
              style={({ pressed }) => [
                styles.card,
                { borderLeftColor: borderColor },
                Platform.OS === "ios" && pressed && { opacity: 0.75 },
              ]}
              onPress={() => router.push(`/job/${item.id}`)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.customerName} numberOfLines={1}>{item.customer?.name ?? "—"}</Text>
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              {item.serviceType && (
                <Text style={styles.serviceType}>{item.serviceType}</Text>
              )}

              <View style={styles.staffRow}>
                <Ionicons name="person-outline" size={13} color="#9ca3af" />
                <Text style={styles.staffText}>{item.staff?.name ?? "Unassigned"}</Text>
              </View>

              <View style={styles.cardMeta}>
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
                      {new Date(item.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "short", day: "numeric", month: "short",
                      })}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.tapHint}>Tap to manage</Text>
                <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
              </View>
            </Pressable>
            </FadeInView>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  list: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  filterBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 10,
  },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: { backgroundColor: "#f0fdf4", borderColor: "#00450d" },
  filterLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  filterLabelActive: { color: "#00450d" },
  filterCount: { backgroundColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filterCountActive: { backgroundColor: "#dcfce7" },
  filterCountText: { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  filterCountTextActive: { color: "#00450d" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    overflow: "hidden",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 5,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  customerName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  serviceType: { fontSize: 13, color: "#6b7280" },
  staffRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  staffText: { fontSize: 13, color: "#3b82f6", fontWeight: "600" },
  cardMeta: { gap: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#9ca3af", flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f9fafb" },
  tapHint: { fontSize: 11, color: "#d1d5db", fontStyle: "italic" },
});
