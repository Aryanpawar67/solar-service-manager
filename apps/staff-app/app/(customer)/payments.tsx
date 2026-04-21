import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useGetMyPayments } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  paid: "#16a34a",
  pending: "#f59e0b",
  failed: "#ef4444",
  refunded: "#6b7280",
};

export default function CustomerPaymentsScreen() {
  const { data, isLoading, refetch, isRefetching } = useGetMyPayments({ limit: 50 });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const payments = data?.data ?? [];
  const totalPaid = payments
    .filter((p) => (p.status as string) === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={payments}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      ListHeaderComponent={
        payments.length > 0 ? (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{totalPaid.toLocaleString("en-IN")}</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>No payment history yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.amount}>₹{Number(item.amount).toLocaleString("en-IN")}</Text>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#6b7280") + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? "#6b7280" }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          {item.description && <Text style={styles.description}>{item.description}</Text>}
          {item.paymentMethod && <Text style={styles.method}>{item.paymentMethod}</Text>}
          {item.transactionId && <Text style={styles.txn}>Txn: {item.transactionId}</Text>}
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
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
  totalCard: { backgroundColor: "#16a34a", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12, shadowColor: "#16a34a", shadowOpacity: 0.25, shadowRadius: 8, elevation: 2 },
  totalLabel: { fontSize: 13, color: "#dcfce7", fontWeight: "600" },
  totalValue: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  amount: { fontSize: 18, fontWeight: "700", color: "#111827" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  description: { fontSize: 13, color: "#374151", marginTop: 2 },
  method: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  txn: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  date: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
});
