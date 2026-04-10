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
import { useListServices, useGetMe } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

export default function JobsScreen() {
  const { data: meData, isLoading: meLoading } = useGetMe();
  const staffId = meData?.user?.staffId;

  const { data, isLoading, refetch, isRefetching } = useListServices(
    staffId != null ? { staffId } : {}
  );

  if (meLoading || (isLoading && meData != null)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (staffId == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Your account is not linked to a staff profile.</Text>
        <Text style={[styles.empty, { fontSize: 12, marginTop: 6 }]}>Ask an admin to link your account.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#16a34a"
        />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>No jobs assigned to you.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/job/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.customerName}>{item.customer?.name ?? "—"}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: (STATUS_COLOR[item.status] ?? "#6b7280") + "22" },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: STATUS_COLOR[item.status] ?? "#6b7280" },
                ]}
              >
                {item.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          <Text style={styles.address}>{item.customer?.address ?? "No address"}</Text>
          {item.scheduledDate && (
            <Text style={styles.date}>
              {new Date(item.scheduledDate).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  customerName: { fontSize: 16, fontWeight: "600", color: "#111827", flex: 1 },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  address: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  date: { fontSize: 12, color: "#9ca3af" },
});
