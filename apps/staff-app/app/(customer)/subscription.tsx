import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useGetMySubscription, useRequestRenewal, useGetMyPayments } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";

const FEATURES = [
  { title: "Real-time Telemetry",  sub: "1-second update intervals" },
  { title: "Advanced Exports",     sub: "CSV, JSON, and API access" },
  { title: "Priority Support",     sub: "24/7 technical assistance" },
  { title: "Unlimited Users",      sub: "Invite your whole team" },
];

export default function CustomerSubscriptionScreen() {
  const { data: subscription, isLoading, refetch, isRefetching } = useGetMySubscription();
  const { data: paymentsData } = useGetMyPayments({ limit: 5 });
  const renewal = useRequestRenewal();

  const handleRenewal = () => {
    Alert.alert("Request Renewal", "Submit a renewal request to our team?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: () =>
          renewal.mutate(undefined, {
            onSuccess: () => Alert.alert("Submitted", "Our team will contact you shortly."),
            onError: () => Alert.alert("Error", "Failed to submit request. Try again."),
          }),
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }

  if (!subscription) {
    return (
      <View style={styles.center}>
        <Ionicons name="star-outline" size={52} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No active subscription</Text>
        <Text style={styles.emptyText}>Contact us to get started with a solar maintenance plan.</Text>
      </View>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 30;
  const isActive = subscription.status === "active";

  const billingHistory = paymentsData?.data ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />}
    >
      {/* Page title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Subscription Details</Text>
        <Text style={styles.pageSub}>Manage your industrial telemetry access and billing.</Text>
      </View>

      {/* Current Plan card */}
      <View style={[styles.planCard, isExpiringSoon && styles.planCardWarn]}>
        <View style={styles.planTop}>
          <Text style={styles.planTopLabel}>CURRENT PLAN</Text>
          <View style={[styles.activeBadge, { backgroundColor: isActive ? "#dcfce7" : "#fee2e2" }]}>
            <Text style={[styles.activeBadgeText, { color: isActive ? "#00450d" : "#dc2626" }]}>
              {subscription.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.planName}>{subscription.plan}</Text>

        <View style={styles.planMeta}>
          <View style={styles.planMetaCol}>
            <Text style={styles.planMetaLabel}>Billing Cycle</Text>
            <Text style={styles.planMetaValue}>
              ₹{Number(subscription.amount).toLocaleString("en-IN")} / month
            </Text>
          </View>
          {subscription.endDate ? (
            <View style={styles.planMetaCol}>
              <Text style={styles.planMetaLabel}>Next Renewal</Text>
              <Text style={styles.planMetaValue}>
                {new Date(subscription.endDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </Text>
            </View>
          ) : null}
        </View>

        {isExpiringSoon && daysLeft !== null && (
          <View style={styles.expiryWarning}>
            <Ionicons name="time-outline" size={13} color="#b45309" />
            <Text style={styles.expiryWarningText}>
              {daysLeft > 0 ? `Expires in ${daysLeft} days` : "Subscription has expired"}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.renewBtn, renewal.isPending && styles.renewBtnDisabled]}
          onPress={handleRenewal}
          disabled={renewal.isPending}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-circle-outline" size={18} color="#fff" />
          <Text style={styles.renewBtnText}>
            {renewal.isPending ? "Submitting…" : "Renew Now"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.changePlanBtn} onPress={() => Alert.alert("Change Plan", "To change your subscription plan, please contact GreenVolt support:\n\nEmail: support@greenvolt.in\nPhone: +91 98765 43210\n\nOr use the Support section in your profile.")} activeOpacity={0.8}>
          <Text style={styles.changePlanText}>Change Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Included Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Included Features</Text>
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={f.title} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#00450d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Billing History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Billing History</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2 }]}>DATE</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>DESCRIPTION</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>AMOUNT</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>STATUS</Text>
          </View>
          {billingHistory.length === 0 ? (
            <View style={styles.tableEmpty}>
              <Text style={styles.tableEmptyText}>No billing history</Text>
            </View>
          ) : (
            billingHistory.map((p, i) => (
              <View
                key={String(p.id)}
                style={[styles.tableRow, i < billingHistory.length - 1 && styles.tableRowBorder]}
              >
                <Text style={[styles.tableCell, styles.tableCellText, { flex: 1.2 }]}>
                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellText, { flex: 2 }]} numberOfLines={2}>
                  {p.description ?? `${subscription.plan} - Monthly`}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellText, { flex: 1, textAlign: "right" }]}>
                  ₹{Number(p.amount).toLocaleString("en-IN")}
                </Text>
                <View style={[styles.tableCell, { flex: 1, alignItems: "flex-end" }]}>
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: (p.status as string) === "paid" ? "#dcfce7" : "#fef3c7" },
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      { color: (p.status as string) === "paid" ? "#00450d" : "#d97706" },
                    ]}>
                      {String(p.status).charAt(0).toUpperCase() + String(p.status).slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  pageHeader: { paddingTop: 4, paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 3, lineHeight: 18 },

  planCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#e5e7eb", gap: 12,
  },
  planCardWarn: { borderColor: "#fcd34d" },
  planTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planTopLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  activeBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  activeBadgeText: { fontSize: 11, fontWeight: "700" },
  planName: { fontSize: 28, fontWeight: "800", color: "#111827" },
  planMeta: { flexDirection: "row", gap: 24 },
  planMetaCol: { gap: 2 },
  planMetaLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  planMetaValue: { fontSize: 14, fontWeight: "700", color: "#111827" },

  expiryWarning: { flexDirection: "row", alignItems: "center", gap: 5 },
  expiryWarningText: { fontSize: 12, color: "#b45309", fontWeight: "600" },

  renewBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    backgroundColor: "#00450d", borderRadius: 10, paddingVertical: 14,
  },
  renewBtnDisabled: { opacity: 0.6 },
  renewBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  changePlanBtn: {
    borderRadius: 10, paddingVertical: 13,
    borderWidth: 1.5, borderColor: "#d1d5db", alignItems: "center",
  },
  changePlanText: { fontWeight: "700", fontSize: 14, color: "#374151" },

  section: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },

  featureList: { gap: 0 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 11 },
  featureRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center",
    flexShrink: 0, marginTop: 1,
  },
  featureTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  featureSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  table: { gap: 0 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
  tableHeader: { paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tableHeaderText: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.4 },
  tableCell: { paddingHorizontal: 2 },
  tableCellText: { fontSize: 12, color: "#374151" },
  tableEmpty: { paddingVertical: 20, alignItems: "center" },
  tableEmptyText: { fontSize: 13, color: "#9ca3af" },
  statusPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
});
