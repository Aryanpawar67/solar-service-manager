import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useListServices, useGetMe } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#6b7280", bg: "#f3f4f6",  label: "PENDING" },
  in_progress: { color: "#2563eb", bg: "#dbeafe",  label: "IN PROGRESS" },
  completed:   { color: "#00450d", bg: "#dcfce7",  label: "COMPLETED" },
  cancelled:   { color: "#ef4444", bg: "#fef2f2",  label: "CANCELLED" },
};

const TYPE_ICONS: Record<string, keyof typeof import("@expo/vector-icons").Ionicons.glyphMap> = {
  maintenance:  "construct-outline",
  installation: "flash-outline",
  diagnostic:   "pulse-outline",
  cleaning:     "sunny-outline",
  inspection:   "eye-outline",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTypeLabel(serviceType?: string | null): string {
  if (!serviceType) return "SERVICE";
  const lower = serviceType.toLowerCase();
  if (lower.includes("maintenance")) return "MAINTENANCE";
  if (lower.includes("install")) return "INSTALLATION";
  if (lower.includes("diagnos")) return "DIAGNOSTIC";
  if (lower.includes("clean")) return "MAINTENANCE";
  if (lower.includes("inspect")) return "INSPECTION";
  return "SERVICE";
}

function getTypeIcon(serviceType?: string | null): keyof typeof import("@expo/vector-icons").Ionicons.glyphMap {
  const lower = (serviceType ?? "").toLowerCase();
  if (lower.includes("install")) return "flash-outline";
  if (lower.includes("diagnos")) return "pulse-outline";
  return "construct-outline";
}

export default function ScheduleScreen() {
  const { data: meData, isLoading: meLoading, isError: meError } = useGetMe();
  const staffId = meData?.user?.staffId;

  const { data, isLoading, isError, refetch, isRefetching } = useListServices(
    staffId != null ? { staffId, limit: 50 } : {}
  );

  const todayStr = new Date().toISOString().split("T")[0]!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build week strip centred on today
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  if (meLoading || isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }

  if (meError || isError) return <ErrorState onRetry={refetch} />;

  const allServices = (data?.data ?? []).filter((s) => s.scheduledDate);

  // Group by date
  const grouped: Record<string, typeof allServices> = {};
  for (const s of allServices) {
    const d = s.scheduledDate!;
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(s);
  }

  // Items for selected day, sorted by serviceType (arbitrary)
  const dayItems = grouped[selectedDate] ?? [];
  const monthYear = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}><Ionicons name="flash" size={15} color="#00450d" /></View>
          <Text style={styles.headerBrand}>GreenVolt</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color="#374151" />
      </View>

      {/* Title + month */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Staff Schedule</Text>
        <Text style={styles.monthLabel}>{monthYear}</Text>
      </View>

      {/* Horizontal date strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {weekDays.map((d) => {
          const iso = d.toISOString().split("T")[0]!;
          const isActive = iso === selectedDate;
          const hasJobs = (grouped[iso]?.length ?? 0) > 0;
          return (
            <TouchableOpacity
              key={iso}
              style={[styles.dateCell, isActive && styles.dateCellActive]}
              onPress={() => setSelectedDate(iso)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dateDayName, isActive && styles.dateDayNameActive]}>
                {DAY_NAMES[d.getDay()]}
              </Text>
              <Text style={[styles.dateDayNum, isActive && styles.dateDayNumActive]}>
                {d.getDate()}
              </Text>
              {hasJobs && <View style={[styles.dateDot, isActive && styles.dateDotActive]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Day's jobs */}
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.listContent, dayItems.length === 0 && styles.listEmpty]}
        data={dayItems}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No jobs this day</Text>
            <Text style={styles.emptyText}>Select another date to see your schedule.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.cancelled;
          const typeLabel = getTypeLabel(item.serviceType);
          const typeIcon = getTypeIcon(item.serviceType);
          const isActive = item.status === "in_progress";
          const isCompleted = item.status === "completed";
          return (
            <View style={[styles.jobCard, isActive && styles.jobCardActive]}>
              <View style={styles.jobTop}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{typeLabel}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <Text style={[styles.jobTitle, isCompleted && styles.jobTitleDone]}>
                {item.customer?.name ?? "—"}
              </Text>
              <Text style={styles.jobService}>{item.serviceType ?? "Service Visit"}</Text>

              {item.customer?.address ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.customer.address}</Text>
                </View>
              ) : null}

              {isActive ? (
                <View style={styles.activeActions}>
                  <TouchableOpacity
                    style={styles.navigateBtn}
                    onPress={() => router.push(`/job/${item.id}`)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate-outline" size={15} color="#fff" />
                    <Text style={styles.navigateBtnText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.markDoneBtn}
                    onPress={() => router.push(`/job/${item.id}`)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" size={15} color="#00450d" />
                    <Text style={styles.markDoneBtnText}>Mark Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => router.push(`/job/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewBtnText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={14} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center" },
  headerBrand: { fontSize: 16, fontWeight: "800", color: "#00450d" },

  titleRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: "#fff" },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  monthLabel: { fontSize: 13, color: "#9ca3af", marginTop: 2 },

  dateStrip: { paddingHorizontal: 16, gap: 8, paddingVertical: 12, backgroundColor: "#fff" },
  dateCell: {
    width: 56, borderRadius: 14, paddingVertical: 10,
    alignItems: "center", gap: 3,
    borderWidth: 1.5, borderColor: "transparent",
  },
  dateCellActive: { backgroundColor: "#00450d", borderColor: "#00450d" },
  dateDayName: { fontSize: 11, fontWeight: "600", color: "#9ca3af" },
  dateDayNameActive: { color: "#a7f3d0" },
  dateDayNum: { fontSize: 18, fontWeight: "800", color: "#374151" },
  dateDayNumActive: { color: "#fff" },
  dateDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#00450d" },
  dateDotActive: { backgroundColor: "#bcf200" },

  list: { flex: 1 },
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  listEmpty: { flex: 1 },

  jobCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    gap: 8, borderWidth: 1, borderColor: "#f0f0f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  jobCardActive: { borderColor: "#bbf7d0", borderWidth: 1.5 },

  jobTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: {
    backgroundColor: "#f3f4f6", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 10, fontWeight: "700", color: "#6b7280", letterSpacing: 0.5 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  jobTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  jobTitleDone: { color: "#9ca3af", textDecorationLine: "line-through" },
  jobService: { fontSize: 13, color: "#6b7280" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#9ca3af", flex: 1 },

  activeActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  navigateBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#00450d", borderRadius: 10, paddingVertical: 11,
  },
  navigateBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  markDoneBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1.5, borderColor: "#00450d", borderRadius: 10, paddingVertical: 11,
  },
  markDoneBtnText: { color: "#00450d", fontWeight: "700", fontSize: 13 },

  viewBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0",
  },
  viewBtnText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
});
