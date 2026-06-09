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
import { useGetMySubscription, useRequestRenewal } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />}
    >
      {/* Plan hero card */}
      <View style={[styles.planCard, isExpiringSoon && styles.planCardWarn]}>
        <View style={styles.planIconBox}>
          <Ionicons name="star" size={22} color={isExpiringSoon ? "#b45309" : "#16a34a"} />
        </View>
        <Text style={styles.planName}>{subscription.plan}</Text>
        <View style={[styles.badge, { backgroundColor: isActive ? "#dcfce7" : "#fee2e2" }]}>
          <Text style={[styles.badgeText, { color: isActive ? "#16a34a" : "#dc2626" }]}>
            {subscription.status.toUpperCase()}
          </Text>
        </View>
        {daysLeft !== null ? (
          <View style={styles.expiryRow}>
            <Ionicons name="time-outline" size={14} color={isExpiringSoon ? "#b45309" : "#6b7280"} />
            <Text style={[styles.expiry, isExpiringSoon && styles.expirySoon]}>
              {daysLeft > 0 ? `Expires in ${daysLeft} days` : "Subscription has expired"}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Plan details */}
      <View style={styles.card}>
        <SectionHeader icon="document-text-outline" title="Plan Details" />
        <InfoRow icon="star-outline" label="Plan" value={subscription.plan} />
        <InfoRow icon="refresh-outline" label="Visits / Month" value={String(subscription.visitsPerMonth)} />
        <InfoRow icon="cash-outline" label="Amount" value={`₹${Number(subscription.amount).toLocaleString("en-IN")}`} />
        {subscription.startDate ? (
          <InfoRow
            icon="calendar-outline"
            label="Start Date"
            value={new Date(subscription.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          />
        ) : null}
        {subscription.endDate ? (
          <InfoRow
            icon="calendar-outline"
            label="End Date"
            value={new Date(subscription.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          />
        ) : null}
        <InfoRow icon="checkmark-circle-outline" label="Status" value={subscription.status} last />
      </View>

      {/* Renewal button */}
      <TouchableOpacity
        style={[styles.renewBtn, renewal.isPending && styles.renewBtnDisabled]}
        onPress={handleRenewal}
        disabled={renewal.isPending}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh-circle-outline" size={20} color="#fff" />
        <Text style={styles.renewBtnText}>
          {renewal.isPending ? "Submitting…" : "Request Renewal"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color="#16a34a" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={14} color="#16a34a" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  planCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#dcfce7",
  },
  planCardWarn: { borderColor: "#fcd34d", backgroundColor: "#fffbeb" },
  planIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  planName: { fontSize: 24, fontWeight: "800", color: "#111827" },
  badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  expiryRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  expiry: { fontSize: 13, color: "#6b7280" },
  expirySoon: { color: "#b45309", fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500", marginTop: 1, textTransform: "capitalize" },

  renewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#16a34a",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  renewBtnDisabled: { opacity: 0.6 },
  renewBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
