import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { useListPayments } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  paid:     { color: "#00450d", bg: "#dcfce7", label: "PAID" },
  pending:  { color: "#d97706", bg: "#fef3c7", label: "PENDING" },
  failed:   { color: "#ef4444", bg: "#fee2e2", label: "FAILED" },
  refunded: { color: "#6b7280", bg: "#f3f4f6", label: "REFUNDED" },
};

const FILTERS = ["All", "Paid", "Pending", "Failed", "Refunded"] as const;
type Filter = (typeof FILTERS)[number];

function filterKey(f: Filter): string | null {
  if (f === "All") return null;
  return f.toLowerCase();
}

export default function AdminPaymentsScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useListPayments({ limit: 200 });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const allPayments = data?.data ?? [];
  const key = filterKey(activeFilter);
  const filtered = (key ? allPayments.filter((p) => p.status === key) : allPayments).filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.customer?.name ?? "").toLowerCase().includes(q) ||
      (p.transactionId ?? "").toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    );
  });

  const totalCollected = allPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = allPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Payments</Text>
        <Text style={styles.pageSub}>Fleet-wide view of customer transactions and dues.</Text>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL COLLECTED</Text>
          <Text style={styles.summaryValue}>₹{totalCollected.toLocaleString("en-IN")}</Text>
        </View>
        <View style={[styles.summaryCard, totalPending > 0 && styles.summaryCardPending]}>
          <Text style={styles.summaryLabel}>PENDING DUES</Text>
          <Text style={[styles.summaryValue, totalPending > 0 && { color: "#ef4444" }]}>
            ₹{totalPending.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer, transaction ID..."
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

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
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
      </ScrollView>

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
            <Ionicons name="card-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No payments found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => Alert.alert(
                item.customer?.name ?? "Payment",
                [
                  `Amount: ₹${Number(item.amount).toLocaleString("en-IN")}`,
                  `Status: ${cfg.label}`,
                  `Method: ${item.paymentMethod ?? "—"}`,
                  `Transaction ID: ${item.transactionId ?? "—"}`,
                  item.description ? `Description: ${item.description}` : null,
                  `Date: ${new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
                ].filter(Boolean).join("\n")
              )}
            >
              <View style={styles.cardTop}>
                <Text style={styles.customerName} numberOfLines={1}>{item.customer?.name ?? `Customer #${item.customerId}`}</Text>
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <View style={styles.metaBlock}>
                <View style={styles.metaRow}>
                  <Ionicons name="cash-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>₹{Number(item.amount).toLocaleString("en-IN")}</Text>
                  {item.paymentMethod ? <Text style={styles.metaDot}>·</Text> : null}
                  {item.paymentMethod ? <Text style={styles.metaText}>{item.paymentMethod}</Text> : null}
                </View>
                {item.transactionId ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="receipt-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText} numberOfLines={1}>{item.transactionId}</Text>
                  </View>
                ) : null}
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  list: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 3, lineHeight: 18 },

  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  summaryCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 4,
  },
  summaryCardPending: { borderColor: "#fecaca" },
  summaryLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.4 },
  summaryValue: { fontSize: 20, fontWeight: "800", color: "#111827" },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, height: 44, backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  filterScroll: { flexGrow: 0 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12, alignItems: "center" },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb",
    height: 36, justifyContent: "center",
  },
  filterChipActive: { backgroundColor: "#00450d", borderColor: "#00450d" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  filterTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    gap: 8, borderWidth: 1, borderColor: "#f0f0f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  customerName: { fontSize: 16, fontWeight: "800", color: "#111827", flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },

  metaBlock: { gap: 5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: "#6b7280" },
  metaDot: { fontSize: 12, color: "#d1d5db" },
});
