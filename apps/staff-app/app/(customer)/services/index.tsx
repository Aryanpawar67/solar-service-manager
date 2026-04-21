import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useGetMyServices } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

export default function CustomerServicesScreen() {
  const { data, isLoading, refetch, isRefetching } = useGetMyServices({ limit: 50 });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>No service history yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/(customer)/services/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardRow}>
            <Text style={styles.serviceType}>{item.serviceType ?? "Maintenance"}</Text>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#6b7280") + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? "#6b7280" }]}>
                {item.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          {item.scheduledDate && (
            <Text style={styles.date}>
              {new Date(item.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          )}
          {item.staff && <Text style={styles.staff}>Technician: {item.staff.name}</Text>}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  serviceType: { fontSize: 15, fontWeight: "600", color: "#111827" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  date: { fontSize: 13, color: "#6b7280" },
  staff: { fontSize: 12, color: "#3b82f6", marginTop: 2 },
});
