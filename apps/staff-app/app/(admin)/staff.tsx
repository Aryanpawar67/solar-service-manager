import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
} from "react-native";
import { useListStaff, useUpdateStaff } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";

export default function AdminStaffScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useListStaff({});
  const update = useUpdateStaff();

  const toggleActive = (id: number, current: boolean) => {
    const action = current ? "deactivate" : "activate";
    Alert.alert(
      "Confirm",
      `Are you sure you want to ${action} this staff member?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            update.mutate({ id, data: { isActive: !current } }, { onSuccess: () => refetch() }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  const staffList = data?.data ?? [];

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.content, staffList.length === 0 && styles.contentEmpty]}
      data={staffList}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />
      }
      ListHeaderComponent={
        staffList.length > 0 ? (
          <Text style={styles.listMeta}>{staffList.length} member{staffList.length !== 1 ? "s" : ""}</Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="people-outline" size={52} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No staff found</Text>
          <Text style={styles.emptyText}>Staff members will appear here once added.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { borderLeftColor: item.isActive ? "#16a34a" : "#d1d5db" }]}>
          <View style={styles.cardRow}>
            <View style={[styles.avatar, { backgroundColor: item.isActive ? "#16a34a" : "#9ca3af" }]}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.roleRow}>
                <Ionicons name="id-card-outline" size={12} color="#9ca3af" />
                <Text style={styles.role}>{item.role}</Text>
              </View>
              {item.phone ? (
                <View style={styles.roleRow}>
                  <Ionicons name="call-outline" size={12} color="#9ca3af" />
                  <Text style={styles.phone}>{item.phone}</Text>
                </View>
              ) : null}
              {item.workArea ? (
                <View style={styles.roleRow}>
                  <Ionicons name="map-outline" size={12} color="#9ca3af" />
                  <Text style={styles.phone}>{item.workArea}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.toggleBox}>
              <View style={[styles.statusPill, { backgroundColor: item.isActive ? "#dcfce7" : "#f3f4f6" }]}>
                <View style={[styles.statusDot, { backgroundColor: item.isActive ? "#16a34a" : "#9ca3af" }]} />
                <Text style={[styles.statusLabel, { color: item.isActive ? "#16a34a" : "#9ca3af" }]}>
                  {item.isActive ? "Active" : "Off"}
                </Text>
              </View>
              <Switch
                value={item.isActive ?? false}
                onValueChange={() => toggleActive(item.id, item.isActive ?? false)}
                trackColor={{ false: "#d1d5db", true: "#86efac" }}
                thumbColor={item.isActive ? "#16a34a" : "#f3f4f6"}
              />
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 10, paddingBottom: 24 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  listMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "700", color: "#111827" },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  role: { fontSize: 13, color: "#6b7280", textTransform: "capitalize" },
  phone: { fontSize: 12, color: "#9ca3af" },
  toggleBox: { alignItems: "center", gap: 6 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: "700" },
});
