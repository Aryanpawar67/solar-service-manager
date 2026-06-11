import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useGetMyPayments } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { getToken } from "@/lib/auth";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// Lazily import Razorpay so the app doesn't crash in Expo Go
let RazorpayCheckout: typeof import("react-native-razorpay").default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RazorpayCheckout = require("react-native-razorpay").default;
} catch {}

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  paid:     { color: "#00450d", bg: "#dcfce7", dot: "#00450d", label: "SUCCESS" },
  pending:  { color: "#d97706", bg: "#fef3c7", dot: "#d97706", label: "PENDING" },
  failed:   { color: "#ef4444", bg: "#fee2e2", dot: "#ef4444", label: "FAILED" },
  refunded: { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af", label: "REFUNDED" },
};

const METHOD_LABEL: Record<string, string> = {
  upi: "UPI", card: "Card", netbanking: "NetBnkg", wallet: "Wallet", cash: "Cash",
};

function getServiceIcon(description?: string | null): keyof typeof Ionicons.glyphMap {
  const d = (description ?? "").toLowerCase();
  if (d.includes("clean")) return "flash-outline";
  if (d.includes("invert")) return "settings-outline";
  if (d.includes("grid") || d.includes("usage")) return "flash-outline";
  return "construct-outline";
}

export default function CustomerPaymentsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyPayments({ limit: 50 });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const payments = data?.data ?? [];
  const totalPaid = payments
    .filter((p) => (p.status as string) === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingAmount = payments
    .filter((p) => (p.status as string) === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.content, payments.length === 0 && styles.contentEmpty]}
      data={payments}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />
      }
      ListHeaderComponent={
        <>
          {/* Page title */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Payments & Billing</Text>
            <Text style={styles.pageSub}>Manage your recent transactions and pending dues.</Text>
          </View>

          {/* Total paid */}
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL PAID</Text>
              <View style={styles.totalIcon}>
                <Ionicons name="wallet-outline" size={18} color="#9ca3af" />
              </View>
            </View>
            <Text style={styles.totalValue}>₹{totalPaid.toLocaleString("en-IN")}</Text>
            <View style={styles.trendRow}>
              <Ionicons name="trending-up-outline" size={13} color="#00450d" />
              <Text style={styles.trendText}>+12.5% vs last month</Text>
            </View>
          </View>

          {/* Pending dues */}
          {pendingAmount > 0 && (
            <View style={styles.pendingCard}>
              <View style={styles.totalRow}>
                <Text style={styles.pendingLabel}>PENDING DUES</Text>
                <Ionicons name="receipt-outline" size={18} color="#ef4444" />
              </View>
              <View style={styles.pendingBottom}>
                <View>
                  <Text style={styles.pendingValue}>₹{pendingAmount.toLocaleString("en-IN")}</Text>
                  <Text style={styles.pendingDue}>Due soon</Text>
                </View>
                <TouchableOpacity style={styles.payNowBtn} onPress={async () => {
                  if (!RazorpayCheckout) {
                    Alert.alert("Pay Now", "Online payments require a dev build. Please use the Subscription section to submit a renewal request, or contact GreenVolt support.");
                    return;
                  }
                  try {
                    const token = await getToken();
                    if (!token) { Alert.alert("Not logged in", "Please log in again."); return; }

                    // Create a Razorpay order for the pending amount
                    const orderRes = await fetch(`${API_URL}/api/me/razorpay/create-order`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ amount: pendingAmount }),
                    });
                    if (!orderRes.ok) {
                      const err = await orderRes.json().catch(() => ({})) as { error?: string };
                      Alert.alert("Payment Error", err.error ?? "Could not initiate payment. Please try again.");
                      return;
                    }
                    const { razorpayOrderId, amount, currency, paymentId, keyId } =
                      await orderRes.json() as {
                        razorpayOrderId: string; amount: number; currency: string;
                        paymentId: number; keyId: string;
                      };

                    const paymentData = await RazorpayCheckout.open({
                      description: "GreenVolt – Pending Dues",
                      currency,
                      key: keyId,
                      amount,
                      order_id: razorpayOrderId,
                      name: "GreenVolt",
                      theme: { color: "#00450d" },
                      retry: { enabled: false },
                    }) as { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };

                    // Verify payment
                    const verifyRes = await fetch(`${API_URL}/api/me/razorpay/verify`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        razorpayPaymentId: paymentData.razorpay_payment_id,
                        razorpayOrderId: paymentData.razorpay_order_id,
                        razorpaySignature: paymentData.razorpay_signature,
                        paymentId,
                        serviceType: "Pending Dues Payment",
                        scheduledDate: new Date().toISOString().slice(0, 10),
                        finalAmount: pendingAmount,
                      }),
                    });
                    if (verifyRes.ok) {
                      Alert.alert("Payment Successful", "Your payment has been processed successfully.", [
                        { text: "OK", onPress: () => refetch() },
                      ]);
                    } else {
                      const err = await verifyRes.json().catch(() => ({})) as { error?: string };
                      Alert.alert("Verification Failed", err.error ?? "Payment could not be verified. Contact support.");
                    }
                  } catch (e: unknown) {
                    const msg = e && typeof e === "object" && "description" in e
                      ? String((e as { description: string }).description)
                      : "Payment was cancelled or failed.";
                    Alert.alert("Payment Failed", msg);
                  }
                }} activeOpacity={0.85}>
                  <Text style={styles.payNowText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {payments.length > 0 && (
            <Text style={styles.sectionTitle}>Transaction History</Text>
          )}
        </>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="card-outline" size={52} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No payment history</Text>
          <Text style={styles.emptyText}>Your payments will appear here once processed.</Text>
        </View>
      }
      ListFooterComponent={
        payments.length >= 10 ? (
          <TouchableOpacity style={styles.loadMore} onPress={() => Alert.alert("Load More", "Showing all recent transactions. Older records can be viewed on the web portal.")} activeOpacity={0.7}>
            <Text style={styles.loadMoreText}>Load More Transactions</Text>
          </TouchableOpacity>
        ) : null
      }
      renderItem={({ item }) => {
        const cfg = STATUS_CONFIG[item.status as string] ?? STATUS_CONFIG.pending;
        const methodLabel = item.paymentMethod ? (METHOD_LABEL[item.paymentMethod.toLowerCase()] ?? item.paymentMethod) : "—";
        const icon = getServiceIcon(item.description);
        return (
          <View style={styles.txCard}>
            <View style={styles.txTop}>
              <View style={styles.txIcon}>
                <Ionicons name={icon} size={20} color="#6b7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txName} numberOfLines={1}>
                  {item.description ?? "Payment"}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })} · {new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
            <View style={styles.txRow}>
              <Text style={styles.txRowLabel}>Amount</Text>
              <Text style={styles.txAmount}>₹{Number(item.amount).toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.txRow}>
              <Text style={styles.txRowLabel}>Method</Text>
              <View style={styles.methodTag}>
                <Text style={styles.methodText}>{methodLabel}</Text>
              </View>
            </View>
            <View style={styles.txRow}>
              <Text style={styles.txRowLabel}>Status</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                <Text style={[styles.statusText, { color: cfg.dot }]}>{cfg.label}</Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  pageHeader: { marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 3, lineHeight: 18 },

  totalCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 6,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  totalIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center",
  },
  totalValue: { fontSize: 36, fontWeight: "800", color: "#111827", letterSpacing: -0.5 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  trendText: { fontSize: 12, color: "#6b7280" },

  pendingCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#fecaca", gap: 10,
  },
  pendingLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  pendingBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  pendingValue: { fontSize: 32, fontWeight: "800", color: "#111827" },
  pendingDue: { fontSize: 12, color: "#ef4444", marginTop: 2 },
  payNowBtn: {
    backgroundColor: "#00450d", borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 11,
  },
  payNowText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 4 },

  txCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 10,
  },
  txTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  txIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center",
  },
  txName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  txDate: { fontSize: 11, color: "#9ca3af", marginTop: 3 },

  txRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f4f4f5",
  },
  txRowLabel: { fontSize: 13, color: "#6b7280" },
  txAmount: { fontSize: 15, fontWeight: "700", color: "#111827" },
  methodTag: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  methodText: { fontSize: 11, fontWeight: "600", color: "#374151" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },

  loadMore: { alignItems: "center", paddingVertical: 16 },
  loadMoreText: { fontSize: 13, color: "#00450d", fontWeight: "600" },
});
