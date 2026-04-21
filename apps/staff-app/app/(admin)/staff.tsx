import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Switch, Alert } from "react-native";
import { useListStaff, useUpdateStaff } from "@workspace/api-client-react";

export default function AdminStaffScreen() {
  const { data, isLoading, refetch, isRefetching } = useListStaff({});
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

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.data ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>No staff found.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role}</Text>
              {item.phone && <Text style={styles.phone}>{item.phone}</Text>}
            </View>
            <View style={styles.toggleBox}>
              <Text style={[styles.statusLabel, { color: item.isActive ? "#16a34a" : "#9ca3af" }]}>
                {item.isActive ? "Active" : "Inactive"}
              </Text>
              <Switch
                value={item.isActive ?? false}
                onValueChange={() => toggleActive(item.id, item.isActive ?? false)}
                trackColor={{ false: "#d1d5db", true: "#86efac" }}
                thumbColor={item.isActive ? "#16a34a" : "#9ca3af"}
              />
            </View>
          </View>
          {item.workArea && (
            <Text style={styles.workArea}>Area: {item.workArea}</Text>
          )}
        </View>
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
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#111827" },
  role: { fontSize: 13, color: "#6b7280" },
  phone: { fontSize: 12, color: "#9ca3af" },
  toggleBox: { alignItems: "center", gap: 2 },
  statusLabel: { fontSize: 11, fontWeight: "600" },
  workArea: { fontSize: 12, color: "#9ca3af", marginTop: 6, paddingLeft: 56 },
});
