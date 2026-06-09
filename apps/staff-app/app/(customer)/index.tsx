import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useGetMyProfile, useGetMySubscription, useGetMyServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7" },
  in_progress: { color: "#2563eb", bg: "#dbeafe" },
  completed:   { color: "#16a34a", bg: "#dcfce7" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6" },
};

export default function CustomerHomeScreen() {
  const { data: profile, isLoading: profileLoading, refetch } = useGetMyProfile();
  const { data: subscription } = useGetMySubscription();
  const { data: services } = useGetMyServices({ limit: 5 });

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const upcoming = (services?.data ?? []).find(
    (s) => s.status === "pending" || s.status === "in_progress"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />}
    >
      {/* Welcome hero */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTop}>
          <View style={styles.welcomeAvatar}>
            <Text style={styles.welcomeAvatarText}>{profile?.name?.charAt(0).toUpperCase() ?? "?"}</Text>
          </View>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeGreeting}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{profile?.name ?? "—"}</Text>
          </View>
          {profile?.solarCapacity ? (
            <View style={styles.capacityBadge}>
              <Ionicons name="sunny-outline" size={12} color="#fff" />
              <Text style={styles.capacityText}>{profile.solarCapacity} kW</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Subscription card */}
      {subscription ? (
        <TouchableOpacity
          style={[styles.subCard, daysLeft !== null && daysLeft <= 30 && styles.subCardWarn]}
          onPress={() => router.push("/(customer)/subscription")}
          activeOpacity={0.8}
        >
          <View style={styles.subRow}>
            <View style={styles.subPlanRow}>
              <Ionicons name="star" size={14} color={daysLeft !== null && daysLeft <= 30 ? "#b45309" : "#16a34a"} />
              <Text style={[styles.subPlan, daysLeft !== null && daysLeft <= 30 && styles.subPlanWarn]}>
                {subscription.plan}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: subscription.status === "active" ? "#dcfce7" : "#fee2e2" }]}>
              <Text style={[styles.badgeText, { color: subscription.status === "active" ? "#16a34a" : "#dc2626" }]}>
                {subscription.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.subMeta}>
            {daysLeft !== null && (
              <View style={styles.subMetaRow}>
                <Ionicons name="time-outline" size={12} color={daysLeft <= 30 ? "#b45309" : "#9ca3af"} />
                <Text style={[styles.subExpiry, daysLeft <= 30 && styles.subExpirySoon]}>
                  {daysLeft > 0 ? `Expires in ${daysLeft} days` : "Subscription expired"}
                </Text>
              </View>
            )}
            <View style={styles.subMetaRow}>
              <Ionicons name="refresh-outline" size={12} color="#9ca3af" />
              <Text style={styles.subVisits}>{subscription.visitsPerMonth} visits/month</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Next appointment */}
      {upcoming ? (
        <TouchableOpacity
          style={styles.apptCard}
          onPress={() => router.push(`/(customer)/services/${upcoming.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.apptHeader}>
            <View style={styles.apptHeaderLeft}>
              <Ionicons name="calendar-outline" size={14} color="#16a34a" />
              <Text style={styles.apptTitle}>Next Appointment</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: STATUS_CONFIG[upcoming.status]?.bg ?? "#f3f4f6" }]}>
              <Text style={[styles.badgeText, { color: STATUS_CONFIG[upcoming.status]?.color ?? "#6b7280" }]}>
                {upcoming.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          <Text style={styles.apptDate}>
            {upcoming.scheduledDate
              ? new Date(upcoming.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long",
                })
              : "Date TBD"}
          </Text>
          {upcoming.staff ? (
            <View style={styles.apptStaffRow}>
              <Ionicons name="person-outline" size={12} color="#3b82f6" />
              <Text style={styles.apptStaff}>{upcoming.staff.name}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.noApptCard}>
          <Ionicons name="calendar-outline" size={24} color="#d1d5db" />
          <Text style={styles.noApptText}>No upcoming appointments</Text>
        </View>
      )}

      {/* Quick links grid */}
      <View style={styles.quickGrid}>
        <QuickCard
          icon="construct-outline"
          label="Service History"
          color="#3b82f6"
          bg="#eff6ff"
          onPress={() => router.push("/(customer)/services")}
        />
        <QuickCard
          icon="card-outline"
          label="Payments"
          color="#8b5cf6"
          bg="#f5f3ff"
          onPress={() => router.push("/(customer)/payments")}
        />
        <QuickCard
          icon="star-outline"
          label="Subscription"
          color="#d97706"
          bg="#fffbeb"
          onPress={() => router.push("/(customer)/subscription")}
        />
        <QuickCard
          icon="person-outline"
          label="My Profile"
          color="#16a34a"
          bg="#f0fdf4"
          onPress={() => router.push("/(customer)/profile")}
        />
      </View>
    </ScrollView>
  );
}

function QuickCard({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  welcomeCard: {
    backgroundColor: "#16a34a",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#16a34a",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  welcomeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeAvatarText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  welcomeInfo: { flex: 1 },
  welcomeGreeting: { fontSize: 13, color: "#dcfce7" },
  welcomeName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  capacityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  capacityText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  subCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    gap: 8,
  },
  subCardWarn: { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fcd34d" },
  subRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subPlanRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  subPlan: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subPlanWarn: { color: "#92400e" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  subMeta: { gap: 4 },
  subMetaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  subExpiry: { fontSize: 12, color: "#9ca3af" },
  subExpirySoon: { color: "#b45309", fontWeight: "600" },
  subVisits: { fontSize: 12, color: "#9ca3af" },

  apptCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    gap: 8,
  },
  apptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  apptHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  apptTitle: { fontSize: 12, fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.4 },
  apptDate: { fontSize: 16, fontWeight: "700", color: "#111827" },
  apptStaffRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  apptStaff: { fontSize: 13, color: "#3b82f6", fontWeight: "600" },
  noApptCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  noApptText: { color: "#9ca3af", fontSize: 14 },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "47%",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { fontSize: 13, fontWeight: "600", color: "#374151", textAlign: "center" },
});
