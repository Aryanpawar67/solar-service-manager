import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { router } from "expo-router";
import { useListCustomers } from "@workspace/api-client-react";
import { useState } from "react";

export default function AdminCustomersScreen() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch, isRefetching } = useListCustomers({ search: search || undefined, limit: 50 });

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={data?.data ?? []}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No customers found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/(admin)/customers/${item.id}`)} activeOpacity={0.7}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.phone}>{item.phone}</Text>
                  {item.city && <Text style={styles.city}>{item.city}</Text>}
                </View>
                {item.solarCapacity && (
                  <Text style={styles.capacity}>{item.solarCapacity} kW</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  searchBox: { padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  searchInput: { backgroundColor: "#f3f4f6", borderRadius: 10, padding: 10, fontSize: 14, color: "#111827" },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  empty: { color: "#6b7280", fontSize: 15, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#111827" },
  phone: { fontSize: 13, color: "#6b7280" },
  city: { fontSize: 12, color: "#9ca3af" },
  capacity: { fontSize: 13, fontWeight: "600", color: "#16a34a" },
});
