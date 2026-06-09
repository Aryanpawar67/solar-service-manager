import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useGetMyPayments } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { FadeInView } from "@/components/FadeInView";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  paid:     { color: "#16a34a", bg: "#dcfce7", icon: "checkmark-circle-outline" },
  pending:  { color: "#d97706", bg: "#fef3c7", icon: "time-outline" },
  failed:   { color: "#ef4444", bg: "#fee2e2", icon: "close-circle-outline" },
  refunded: { color: "#6b7280", bg: "#f3f4f6", icon: "return-down-back-outline" },
};

export default function CustomerPaymentsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyPayments({ limit: 50 });

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

  const payments = data?.data ?? [];
  const totalPaid = payments
    .filter((p) => (p.status as string) === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.content, payments.length === 0 && styles.contentEmpty]}
      data={payments}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />
      }
      ListHeaderComponent={
        payments.length > 0 ? (
          <View style={styles.totalCard}>
            <View style={styles.totalIconBox}>
              <Ionicons name="cash-outline" size={22} color="#16a34a" />
            </View>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{totalPaid.toLocaleString("en-IN")}</Text>
            <Text style={styles.totalCount}>{payments.length} transaction{payments.length !== 1 ? "s" : ""}</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="card-outline" size={52} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No payment history</Text>
          <Text style={styles.emptyText}>Your payments will appear here once processed.</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const cfg = STATUS_CONFIG[item.status as string] ?? STATUS_CONFIG.pending;
        return (
          <FadeInView delay={Math.min(index * 80, 560)}>
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.paymentIconBox, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={20} color={cfg.color} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.amount}>₹{Number(item.amount).toLocaleString("en-IN")}</Text>
                {item.description ? (
                  <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                ) : null}
              </View>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>
                  {(item.status as string).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              {item.paymentMethod ? (
                <View style={styles.metaRow}>
                  <Ionicons name="card-outline" size={12} color="#9ca3af" />
                  <Text style={styles.metaText}>{item.paymentMethod}</Text>
                </View>
              ) : null}
              {item.transactionId ? (
                <View style={styles.metaRow}>
                  <Ionicons name="pricetag-outline" size={12} color="#9ca3af" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.transactionId}</Text>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                <Text style={styles.metaText}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </View>
          </FadeInView>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 10, paddingBottom: 24 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  totalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0fdf4",
  },
  totalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  totalLabel: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  totalValue: { fontSize: 32, fontWeight: "800", color: "#111827" },
  totalCount: { fontSize: 12, color: "#9ca3af" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  paymentIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  paymentInfo: { flex: 1 },
  amount: { fontSize: 17, fontWeight: "700", color: "#111827" },
  description: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardMeta: { gap: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: "#f9fafb" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#9ca3af", flex: 1 },
});
