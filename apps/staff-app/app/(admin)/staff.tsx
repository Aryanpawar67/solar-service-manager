import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useListStaff, useUpdateStaff } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { useState } from "react";

export default function AdminStaffScreen() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useListStaff({});
  const update = useUpdateStaff();

  const toggleActive = (id: number, current: boolean) => {
    const action = current ? "deactivate" : "activate";
    Alert.alert("Confirm", `Are you sure you want to ${action} this staff member?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () =>
          update.mutate({ id, data: { isActive: !current } }, { onSuccess: () => refetch() }),
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const staffList = (data?.data ?? []).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.role ?? "").toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Staff Directory</Text>
        <Text style={styles.pageSub}>Manage field technicians and administrative personnel.</Text>
      </View>

      {/* Add Staff button */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
          <Ionicons name="person-add-outline" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
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

      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, staffList.length === 0 && styles.contentEmpty]}
        data={staffList}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="people-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No staff found</Text>
            <Text style={styles.emptyText}>Staff members will appear here once added.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const staffId = `GV-T${String(item.id).padStart(3, "0")}`;
          const isActive = item.isActive ?? false;
          const assignment = item.workArea ?? "Standby / Depot";

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={20} color="#9ca3af" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{item.name}</Text>
                  <Text style={styles.staffId}>ID: {staffId}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleActive(item.id, isActive)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statusBadge, { backgroundColor: isActive ? "#00450d" : "#f59e0b" }]}>
                    <Text style={styles.statusBadgeText}>
                      {isActive ? "ACTIVE" : "ON LEAVE"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.assignmentBox}>
                <View style={styles.assignmentRow}>
                  <Ionicons name="construct-outline" size={13} color="#6b7280" />
                  <View>
                    <Text style={styles.assignmentLabel}>Current Assignment</Text>
                    <Text style={styles.assignmentText}>{assignment}</Text>
                  </View>
                </View>
              </View>
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
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 3, lineHeight: 18 },

  actionRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#00450d", borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 11,
    alignSelf: "flex-start",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 10, marginTop: 6,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, height: 44, backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  staffName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  staffId: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },

  assignmentBox: {
    backgroundColor: "#f8fafb", borderRadius: 10,
    padding: 12,
  },
  assignmentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  assignmentLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.3 },
  assignmentText: { fontSize: 13, color: "#374151", marginTop: 2 },
});
