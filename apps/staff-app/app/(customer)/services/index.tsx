import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useGetMyServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";

const ACTIVE_STATUSES = new Set(["pending", "in_progress"]);

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#6b7280", bg: "#f3f4f6",  label: "SCHEDULED" },
  in_progress: { color: "#2563eb", bg: "#dbeafe",  label: "IN PROGRESS" },
  completed:   { color: "#00450d", bg: "#dcfce7",  label: "COMPLETED" },
  cancelled:   { color: "#ef4444", bg: "#fef2f2",  label: "CANCELLED" },
};

export default function CustomerServicesScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyServices({ limit: 50 });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const all = data?.data ?? [];
  const active = all.filter((s) => ACTIVE_STATUSES.has(s.status));
  const past   = all.filter((s) => !ACTIVE_STATUSES.has(s.status));

  // Flatten into sections for FlatList
  type SectionItem =
    | { type: "header"; label: string }
    | { type: "service"; data: (typeof all)[0] };

  const items: SectionItem[] = [];
  if (active.length > 0) {
    items.push({ type: "header", label: "Active" });
    active.forEach((s) => items.push({ type: "service", data: s }));
  }
  if (past.length > 0) {
    items.push({ type: "header", label: "Past" });
    past.forEach((s) => items.push({ type: "service", data: s }));
  }

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>My Services</Text>
          <Text style={styles.pageSub}>Track and manage your scheduled solar maintenance and past jobs.</Text>
        </View>
      </View>

      {/* Request Service button */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.requestBtn}
          onPress={() => router.push("/(customer)/book")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.requestBtnText}>Request Service</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, items.length === 0 && styles.contentEmpty]}
        data={items}
        keyExtractor={(item, idx) =>
          item.type === "header" ? `hdr-${item.label}` : String(item.data.id)
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="construct-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No service history</Text>
            <Text style={styles.emptyText}>Your scheduled and completed services will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return <Text style={styles.sectionHeader}>{item.label}</Text>;
          }

          const s = item.data;
          const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.cancelled;
          const isActiveService = ACTIVE_STATUSES.has(s.status);

          return (
            <TouchableOpacity
              style={[styles.card, isActiveService && styles.cardActive]}
              onPress={() => router.push(`/(customer)/services/${s.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                {/* Tech avatar */}
                <View style={styles.techAvatar}>
                  {s.staff ? (
                    <Text style={styles.techAvatarText}>{s.staff.name.charAt(0)}</Text>
                  ) : (
                    <Ionicons name="person-outline" size={16} color="#9ca3af" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.techName}>
                    {s.staff ? s.staff.name : "Pending Assignment"}
                  </Text>
                  <Text style={styles.techRole}>
                    {s.staff ? "Lead Technician" : "Technician"}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <Text style={styles.serviceName}>{s.serviceType ?? "Service Visit"}</Text>

              {s.scheduledDate ? (
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>
                    {new Date(s.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {isActiveService ? " · 10:00 AM" : ""}
                  </Text>
                </View>
              ) : null}

              {!isActiveService && s.notes ? (
                <Text style={styles.notesText} numberOfLines={2}>{s.notes}</Text>
              ) : null}

              {!isActiveService && s.staff ? (
                <View style={styles.pastTechRow}>
                  <View style={styles.pastTechAvatar}>
                    <Text style={styles.pastTechInitial}>{s.staff.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.pastTechName}>{s.staff.name}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  list: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 3, lineHeight: 18 },

  actionRow: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  requestBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#00450d", borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 11,
    alignSelf: "flex-start",
  },
  requestBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  sectionHeader: {
    fontSize: 15, fontWeight: "700", color: "#111827",
    marginTop: 8, marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    gap: 8, borderWidth: 1, borderColor: "#f0f0f0",
    marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardActive: { borderColor: "#bbf7d0" },

  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  techAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  techAvatarText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  techName: { fontSize: 13, fontWeight: "600", color: "#374151" },
  techRole: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  serviceName: { fontSize: 16, fontWeight: "800", color: "#111827" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#6b7280" },

  notesText: { fontSize: 12, color: "#9ca3af", lineHeight: 17 },

  pastTechRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pastTechAvatar: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
  },
  pastTechInitial: { fontSize: 10, fontWeight: "700", color: "#6b7280" },
  pastTechName: { fontSize: 12, color: "#6b7280" },
});
