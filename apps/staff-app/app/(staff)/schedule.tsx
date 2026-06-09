import {
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useListServices, useGetMe } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7" },
  in_progress: { color: "#2563eb", bg: "#dbeafe" },
  completed:   { color: "#16a34a", bg: "#dcfce7" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ScheduleScreen() {
  const { data: meData, isLoading: meLoading, isError: meError } = useGetMe();
  const staffId = meData?.user?.staffId;

  const { data, isLoading, isError, refetch } = useListServices(
    staffId != null ? { staffId, limit: 50 } : {}
  );

  if (meLoading || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (meError || isError) {
    return <ErrorState onRetry={refetch} />;
  }

  const grouped: Record<string, typeof services> = {};
  const services = (data?.data ?? []).filter(
    (s) => (s.status as string) !== "cancelled" && s.scheduledDate
  );

  for (const service of services) {
    const date = service.scheduledDate!;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(service);
  }

  const sortedDates = Object.keys(grouped).sort();
  const todayStr = new Date().toISOString().split("T")[0]!;

  if (sortedDates.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={52} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No upcoming jobs</Text>
        <Text style={styles.emptyText}>Your schedule is clear for now.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={sortedDates}
      keyExtractor={(d) => d}
      renderItem={({ item: date }) => {
        const d = new Date(date + "T00:00:00");
        const isToday = todayStr === date;
        const isPast = date < todayStr;
        return (
          <View style={styles.dayGroup}>
            {/* Date header */}
            <View style={[styles.dateHeader, isToday && styles.dateHeaderToday, isPast && styles.dateHeaderPast]}>
              <View style={[styles.dateBubble, isToday && styles.dateBubbleToday, isPast && styles.dateBubblePast]}>
                <Text style={[styles.dateDayNum, isToday && styles.dateDayNumToday]}>{d.getDate()}</Text>
                <Text style={[styles.dateDayName, isToday && styles.dateDayNameToday]}>{DAYS[d.getDay()]}</Text>
              </View>
              <View style={styles.dateInfo}>
                <Text style={[styles.dateMonthYear, isToday && styles.dateMonthYearToday]}>
                  {MONTHS[d.getMonth()]} {d.getFullYear()}
                </Text>
                <Text style={styles.dateJobCount}>
                  {grouped[date].length} job{grouped[date].length !== 1 ? "s" : ""}
                </Text>
              </View>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              )}
            </View>

            {/* Job cards */}
            <View style={styles.cardsBlock}>
              {grouped[date].map((service) => {
                const cfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.cancelled;
                return (
                  <Pressable
                    key={service.id}
                    android_ripple={{ color: "#16a34a18" }}
                    style={({ pressed }) => [
                      styles.card,
                      Platform.OS === "ios" && pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => router.push(`/job/${service.id}`)}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.customerName} numberOfLines={1}>{service.customer?.name ?? "—"}</Text>
                      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.badgeText, { color: cfg.color }]}>
                          {service.status.replace("_", " ")}
                        </Text>
                      </View>
                    </View>
                    {service.serviceType && (
                      <Text style={styles.serviceType}>{service.serviceType}</Text>
                    )}
                    {service.customer?.address ? (
                      <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={12} color="#9ca3af" />
                        <Text style={styles.addressText} numberOfLines={1}>{service.customer.address}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
  dayGroup: { gap: 10 },

  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dateHeaderToday: { borderBottomColor: "#bbf7d0" },
  dateHeaderPast: { opacity: 0.5 },

  dateBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  dateBubbleToday: { backgroundColor: "#16a34a" },
  dateBubblePast: { backgroundColor: "#f3f4f6" },

  dateDayNum: { fontSize: 18, fontWeight: "800", color: "#374151", lineHeight: 20 },
  dateDayNumToday: { color: "#fff" },
  dateDayName: { fontSize: 10, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" },
  dateDayNameToday: { color: "#bbf7d0" },

  dateInfo: { flex: 1 },
  dateMonthYear: { fontSize: 14, fontWeight: "700", color: "#374151" },
  dateMonthYearToday: { color: "#16a34a" },
  dateJobCount: { fontSize: 12, color: "#9ca3af", marginTop: 1 },

  todayBadge: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },

  cardsBlock: { gap: 8, paddingLeft: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 4,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  customerName: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  serviceType: { fontSize: 12, color: "#6b7280" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  addressText: { fontSize: 12, color: "#9ca3af", flex: 1 },
});
