import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useGetMySubscription, useRequestRenewal } from "@workspace/api-client-react";

export default function CustomerSubscriptionScreen() {
  const { data: subscription, isLoading, refetch, isRefetching } = useGetMySubscription();
  const renewal = useRequestRenewal();

  const handleRenewal = () => {
    Alert.alert(
      "Request Renewal",
      "Submit a renewal request to our team?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () =>
            renewal.mutate(undefined, {
              onSuccess: () => Alert.alert("Submitted", "Our team will contact you shortly."),
              onError: () => Alert.alert("Error", "Failed to submit request. Try again."),
            }),
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

  if (!subscription) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No active subscription found.</Text>
        <Text style={styles.sub}>Contact us to get started with a solar maintenance plan.</Text>
      </View>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 30;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
    >
      {/* Plan card */}
      <View style={[styles.planCard, isExpiringSoon && styles.planCardWarn]}>
        <Text style={styles.planName}>{subscription.plan}</Text>
        <View style={[styles.badge, { backgroundColor: subscription.status === "active" ? "#dcfce7" : "#fee2e2" }]}>
          <Text style={[styles.badgeText, { color: subscription.status === "active" ? "#16a34a" : "#dc2626" }]}>
            {subscription.status.toUpperCase()}
          </Text>
        </View>
        {daysLeft !== null && (
          <Text style={[styles.expiry, isExpiringSoon && styles.expirySoon]}>
            {daysLeft > 0 ? `Expires in ${daysLeft} days` : "Subscription has expired"}
          </Text>
        )}
      </View>

      {/* Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Plan Details</Text>
        <Row label="Plan" value={subscription.plan} />
        <Row label="Visits / Month" value={String(subscription.visitsPerMonth)} />
        <Row label="Amount" value={`₹${subscription.amount}`} />
        {subscription.startDate && <Row label="Start Date" value={new Date(subscription.startDate).toLocaleDateString("en-IN")} />}
        {subscription.endDate && <Row label="End Date" value={new Date(subscription.endDate).toLocaleDateString("en-IN")} />}
        <Row label="Status" value={subscription.status} />
      </View>

      {/* Renewal */}
      <TouchableOpacity
        style={[styles.renewBtn, renewal.isPending && styles.renewBtnDisabled]}
        onPress={handleRenewal}
        disabled={renewal.isPending}
      >
        <Text style={styles.renewBtnText}>
          {renewal.isPending ? "Submitting…" : "Request Renewal"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 8 },
  empty: { fontSize: 16, fontWeight: "600", color: "#374151", textAlign: "center" },
  sub: { fontSize: 13, color: "#6b7280", textAlign: "center" },
  planCard: { backgroundColor: "#16a34a", borderRadius: 16, padding: 24, alignItems: "center", gap: 8, shadowColor: "#16a34a", shadowOpacity: 0.3, shadowRadius: 10, elevation: 3 },
  planCardWarn: { backgroundColor: "#f59e0b" },
  planName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  expiry: { fontSize: 13, color: "#dcfce7" },
  expirySoon: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 10 },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 120 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1, textTransform: "capitalize" },
  renewBtn: { backgroundColor: "#16a34a", borderRadius: 12, padding: 16, alignItems: "center" },
  renewBtnDisabled: { opacity: 0.6 },
  renewBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
