import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { useGetMyProfile, useGetMySubscription, useGetMyServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7", label: "PENDING" },
  in_progress: { color: "#2563eb", bg: "#dbeafe", label: "IN PROGRESS" },
  completed:   { color: "#00450d", bg: "#dcfce7", label: "COMPLETED" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6", label: "CANCELLED" },
};

const QUICK_ACTIONS = [
  { icon: "construct-outline" as const, label: "Services",     route: "/(customer)/services" },
  { icon: "flash-outline" as const,     label: "Payments",     route: "/(customer)/payments" },
  { icon: "star-outline" as const,      label: "Subscription", route: "/(customer)/subscription" },
  { icon: "calendar-outline" as const,  label: "Book Now",     route: "/(customer)/book" },
  { icon: "headset-outline" as const,   label: "Support",      route: "/(customer)/support" },
];

export default function CustomerHomeScreen() {
  const { data: profile, isLoading, refetch, isRefetching } = useGetMyProfile();
  const { data: subscription } = useGetMySubscription();
  const { data: services } = useGetMyServices({ limit: 5 });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00450d" />
      </View>
    );
  }

  const upcoming = (services?.data ?? []).find(
    (s) => s.status === "pending" || s.status === "in_progress"
  );
  const recentServices = (services?.data ?? []).slice(0, 3);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const daysLeft = endDate
    ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 30;
  const initial = profile?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.topLogo}>
            <Ionicons name="flash" size={16} color="#00450d" />
          </View>
          <Text style={styles.topBrand}>GreenVolt</Text>
        </View>
        <TouchableOpacity
          style={styles.topAvatar}
          onPress={() => router.push("/(customer)/profile")}
          activeOpacity={0.8}
        >
          <Text style={styles.topAvatarText}>{initial}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />
        }
      >
        {/* Greeting */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greetHello}>Hello, {profile?.name?.split(" ")[0] ?? "there"}!</Text>
            {profile?.city ? (
              <View style={styles.greetLocation}>
                <Ionicons name="location-outline" size={13} color="#6b7280" />
                <Text style={styles.greetLocationText}>{profile.city}</Text>
              </View>
            ) : null}
          </View>
          {profile?.solarCapacity ? (
            <View style={styles.capacityChip}>
              <Ionicons name="flash" size={11} color="#00450d" />
              <Text style={styles.capacityText}>{profile.solarCapacity} kW Capacity</Text>
            </View>
          ) : null}
        </View>

        {/* Next Service */}
        {upcoming ? (
          <TouchableOpacity
            style={styles.nextCard}
            onPress={() => router.push(`/(customer)/services/${upcoming.id}`)}
            activeOpacity={0.88}
          >
            <View style={styles.nextTopRow}>
              <View style={styles.nextLabel}>
                <Ionicons name="calendar" size={13} color="#a7f3d0" />
                <Text style={styles.nextLabelText}>Next Service</Text>
              </View>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedText}>
                  {upcoming.status === "in_progress" ? "IN PROGRESS" : "CONFIRMED"}
                </Text>
              </View>
            </View>
            <Text style={styles.nextServiceName}>{upcoming.serviceType ?? "Maintenance Visit"}</Text>
            <Text style={styles.nextDate}>
              {upcoming.scheduledDate
                ? new Date(upcoming.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                : "Date to be confirmed"}
            </Text>
            {upcoming.staff ? (
              <View style={styles.nextTechRow}>
                <Ionicons name="person-circle-outline" size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.nextTechText}>Technician: {upcoming.staff.name}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.noNextCard}
            onPress={() => router.push("/(customer)/book")}
            activeOpacity={0.85}
          >
            <View style={styles.noNextIcon}>
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noNextTitle}>No Upcoming Service</Text>
              <Text style={styles.noNextSub}>Tap to book a visit</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsScroll}
        >
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionItem}
              onPress={() => a.route ? router.push(a.route as any) : null}
              activeOpacity={0.75}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name={a.icon} size={22} color="#374151" />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* System Overview */}
        <Text style={styles.sectionHeader}>System Overview</Text>
        <View style={styles.sysGrid}>
          <SysCard label="Capacity" value={profile?.solarCapacity ? `${profile.solarCapacity} kW` : "—"} />
          <SysCard
            label="Installation"
            value={profile?.installationDate
              ? new Date(profile.installationDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
              : "—"}
          />
          <SysCard label="Active Plan" value={subscription?.plan ?? "No Plan"} />
          <SysCard
            label="Last Service"
            value={recentServices[0]?.scheduledDate
              ? new Date(recentServices[0].scheduledDate + "T00:00:00").toLocaleDateString("en-IN", { month: "short", year: "numeric" })
              : "—"}
          />
        </View>

        {/* Subscription card */}
        {subscription && (
          <View style={styles.subCard}>
            <View style={styles.subTop}>
              <View style={styles.subTitleRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#00450d" />
                <Text style={styles.subPlan}>{subscription.plan} Plan</Text>
              </View>
              {daysLeft !== null && (
                <View style={[styles.subExpChip, isExpiringSoon && styles.subExpChipWarn]}>
                  <Text style={[styles.subExpText, isExpiringSoon && styles.subExpTextWarn]}>
                    Expires in {daysLeft} days
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.subDesc}>Premium monitoring and priority support.</Text>
            <TouchableOpacity
              style={styles.subBtn}
              onPress={() => router.push("/(customer)/subscription")}
              activeOpacity={0.85}
            >
              <Text style={styles.subBtnText}>Renew Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Services */}
        {recentServices.length > 0 && (
          <View>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionHeader}>Recent Services</Text>
              <TouchableOpacity onPress={() => router.push("/(customer)/services")} activeOpacity={0.7}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentCard}>
              {recentServices.map((s, idx) => {
                const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.cancelled;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.recentRow, idx < recentServices.length - 1 && styles.recentBorder]}
                    onPress={() => router.push(`/(customer)/services/${s.id}`)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.recentDot, { backgroundColor: cfg.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentName}>{s.serviceType ?? "Maintenance"}</Text>
                      {s.scheduledDate ? (
                        <Text style={styles.recentDate}>
                          {new Date(s.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </Text>
                      ) : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SysCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sysCard}>
      <Text style={styles.sysLabel}>{label}</Text>
      <Text style={styles.sysValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafb" },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  topLogo: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: "#d1fae5",
    justifyContent: "center", alignItems: "center",
  },
  topBrand: { fontSize: 16, fontWeight: "800", color: "#00450d" },
  topAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#00450d",
    justifyContent: "center", alignItems: "center",
  },
  topAvatarText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  greetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  greetHello: { fontSize: 26, fontWeight: "800", color: "#111827" },
  greetLocation: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  greetLocationText: { fontSize: 13, color: "#6b7280" },
  capacityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#d1fae5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    marginTop: 4,
  },
  capacityText: { fontSize: 11, fontWeight: "700", color: "#00450d" },

  nextCard: {
    backgroundColor: "#00450d",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 6,
  },
  nextTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  nextLabelText: { fontSize: 11, fontWeight: "700", color: "#a7f3d0", letterSpacing: 0.5 },
  confirmedBadge: {
    backgroundColor: "#bcf200",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confirmedText: { fontSize: 10, fontWeight: "800", color: "#1a3a00" },
  nextServiceName: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 2 },
  nextDate: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  nextTechRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" },
  nextTechText: { fontSize: 13, color: "rgba(255,255,255,0.85)" },

  noNextCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  noNextIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: "#f9fafb",
    justifyContent: "center", alignItems: "center",
  },
  noNextTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  noNextSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  viewAll: { fontSize: 13, color: "#00450d", fontWeight: "600" },

  actionsScroll: { paddingHorizontal: 20, gap: 14, paddingBottom: 4 },
  actionItem: { alignItems: "center", gap: 7, width: 64 },
  actionIconBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center",
  },
  actionLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },

  sysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginHorizontal: 20,
  },
  sysCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 4,
  },
  sysLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  sysValue: { fontSize: 18, fontWeight: "800", color: "#111827" },

  subCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  subTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  subPlan: { fontSize: 16, fontWeight: "800", color: "#111827" },
  subDesc: { fontSize: 13, color: "#6b7280" },
  subExpChip: {
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subExpChipWarn: { backgroundColor: "#fef3c7" },
  subExpText: { fontSize: 11, fontWeight: "700", color: "#00450d" },
  subExpTextWarn: { color: "#d97706" },
  subBtn: {
    backgroundColor: "#00450d",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  subBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  recentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  recentRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  recentBorder: { borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
  recentDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  recentName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  recentDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
});
