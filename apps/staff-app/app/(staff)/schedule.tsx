import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useListServices, useGetMe } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ScheduleScreen() {
  const { data: meData, isLoading: meLoading } = useGetMe();
  const staffId = meData?.user?.staffId;

  const { data, isLoading } = useListServices(
    staffId != null ? { staffId, limit: 50 } : {}
  );

  if (meLoading || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // Group jobs by date
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

  if (sortedDates.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No upcoming jobs on your schedule.</Text>
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
        const isToday = new Date().toISOString().split("T")[0] === date;
        return (
          <View style={styles.dayGroup}>
            <View style={[styles.dateHeader, isToday && styles.dateHeaderToday]}>
              <Text style={[styles.dateDay, isToday && styles.dateDayToday]}>
                {DAYS[d.getDay()]}
              </Text>
              <Text style={[styles.dateNum, isToday && styles.dateNumToday]}>
                {d.getDate()} {MONTHS[d.getMonth()]}
              </Text>
              {isToday && <Text style={styles.todayBadge}>Today</Text>}
            </View>
            {grouped[date].map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.card}
                onPress={() => router.push(`/job/${service.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.customerName}>{service.customer?.name ?? "—"}</Text>
                  <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[service.status] ?? "#6b7280") + "22" }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLOR[service.status] ?? "#6b7280" }]}>
                      {service.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>
                <Text style={styles.address}>{service.customer?.address ?? "No address"}</Text>
                {service.serviceType && (
                  <Text style={styles.type}>{service.serviceType}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15, textAlign: "center" },
  dayGroup: { gap: 8 },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#d1d5db",
  },
  dateHeaderToday: { borderLeftColor: "#16a34a" },
  dateDay: { fontSize: 12, fontWeight: "600", color: "#6b7280", width: 32 },
  dateDayToday: { color: "#16a34a" },
  dateNum: { fontSize: 14, fontWeight: "700", color: "#374151" },
  dateNumToday: { color: "#16a34a" },
  todayBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  customerName: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  address: { fontSize: 13, color: "#6b7280", marginBottom: 2 },
  type: { fontSize: 12, color: "#9ca3af" },
});
