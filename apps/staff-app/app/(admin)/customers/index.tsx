import {
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useListCustomers } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { FadeInView } from "@/components/FadeInView";
import { useState } from "react";

export default function AdminCustomersScreen() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useListCustomers({
    search: search || undefined,
    limit: 50,
  });

  const customers = data?.data ?? [];

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, city…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00450d" />
        </View>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          contentContainerStyle={[styles.content, customers.length === 0 && styles.contentEmpty]}
          data={customers}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />
          }
          ListHeaderComponent={
            customers.length > 0 && !search ? (
              <Text style={styles.listMeta}>{customers.length} customer{customers.length !== 1 ? "s" : ""}</Text>
            ) : null
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
          renderItem={({ item, index }) => (
            <FadeInView delay={Math.min(index * 70, 490)}>
            <Pressable
              android_ripple={{ color: "#00450d18" }}
              style={({ pressed }) => [
                styles.card,
                Platform.OS === "ios" && pressed && { opacity: 0.75 },
              ]}
              onPress={() => router.push(`/(admin)/customers/${item.id}`)}
            >
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="call-outline" size={12} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.phone}</Text>
                  </View>
                  {item.city ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={12} color="#9ca3af" />
                      <Text style={styles.metaText}>{item.city}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.rightCol}>
                  {item.solarCapacity ? (
                    <View style={styles.capacityBadge}>
                      <Text style={styles.capacityText}>{item.solarCapacity} kW</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </View>
              </View>
            </Pressable>
            </FadeInView>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  searchWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  content: { padding: 16, gap: 10, paddingBottom: 24 },
  contentEmpty: { flex: 1 },
  listMeta: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#00450d",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "700", color: "#111827" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#9ca3af" },
  rightCol: { alignItems: "flex-end", gap: 6 },
  capacityBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  capacityText: { fontSize: 12, fontWeight: "700", color: "#00450d" },
});
