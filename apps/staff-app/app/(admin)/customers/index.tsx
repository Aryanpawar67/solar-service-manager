import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useListCustomers } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { useState } from "react";

const FILTERS = ["All Customers", "Active Solar", "Pending Install"] as const;
type Filter = (typeof FILTERS)[number];

export default function AdminCustomersScreen() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("All Customers");

  const { data, isLoading, isError, refetch, isRefetching } = useListCustomers({
    search: search || undefined,
    limit: 50,
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const allCustomers = data?.data ?? [];
  const filtered = allCustomers.filter((c) => {
    if (activeFilter === "Active Solar") return !!c.solarCapacity;
    if (activeFilter === "Pending Install") return !c.solarCapacity;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Customers</Text>
        <Text style={styles.pageSub}>Manage and view all enrolled accounts.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
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
            <Ionicons name="people-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>{search ? "No results found" : "No customers yet"}</Text>
            <Text style={styles.emptyText}>
              {search ? `No customers matching "${search}"` : "Customers will appear here once added."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = !!item.solarCapacity;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(admin)/customers/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  {item.city ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color="#9ca3af" />
                      <Text style={styles.locationText}>{item.city}</Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>SERVICES</Text>
                  <View style={styles.metaValueRow}>
                    <Ionicons name="sunny-outline" size={13} color="#6b7280" />
                    <Text style={styles.metaValue}>
                      {(item as typeof item & { serviceCount?: number }).serviceCount ?? "—"}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>STATUS</Text>
                  <View style={[styles.statusBadge, { backgroundColor: isActive ? "#dcfce7" : "#fef3c7" }]}>
                    <Text style={[styles.statusText, { color: isActive ? "#00450d" : "#d97706" }]}>
                      {isActive ? "Active" : "Pending"}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#00450d" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  list: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 80 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 3, lineHeight: 18 },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 10, marginTop: 8,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 24,
    paddingHorizontal: 14, height: 44, backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  filterChipActive: { backgroundColor: "#bcf200", borderColor: "#bcf200" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  filterTextActive: { color: "#00450d" },

  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  avatarText: { fontSize: 17, fontWeight: "700", color: "#374151" },
  customerName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { fontSize: 12, color: "#9ca3af" },

  cardMeta: {
    flexDirection: "row", gap: 32,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f4f4f5",
  },
  metaCol: { gap: 4 },
  metaLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  metaValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaValue: { fontSize: 15, fontWeight: "700", color: "#111827" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: "700" },

  fab: {
    position: "absolute", bottom: 24, right: 20,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "#bcf200",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
});
