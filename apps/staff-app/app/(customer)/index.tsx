import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useGetMyProfile, useGetMySubscription, useGetMyServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { FadeInView } from "@/components/FadeInView";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7", label: "Pending" },
  in_progress: { color: "#2563eb", bg: "#dbeafe", label: "In Progress" },
  completed:   { color: "#16a34a", bg: "#dcfce7", label: "Completed" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6", label: "Cancelled" },
};

const QUICK_ACTIONS = [
  { icon: "construct-outline" as const, label: "Services",     color: "#3b82f6", bg: "#eff6ff", route: "/(customer)/services" },
  { icon: "card-outline" as const,      label: "Payments",     color: "#8b5cf6", bg: "#f5f3ff", route: "/(customer)/payments" },
  { icon: "star-outline" as const,      label: "Subscription", color: "#d97706", bg: "#fffbeb", route: "/(customer)/subscription" },
  { icon: "document-text-outline" as const, label: "Reports",  color: "#06b6d4", bg: "#ecfeff", route: null },
  { icon: "headset-outline" as const,   label: "Support",      color: "#ef4444", bg: "#fef2f2", route: null },
];

const MOCK_OFFERS = [
  {
    id: "offer1",
    badge: "LIMITED",
    title: "10% OFF Next Service",
    desc: "Valid on any cleaning or maintenance visit",
    code: "SOLAR10",
    accent: "#f59e0b",
    bg1: "#1c1917",
    bg2: "#292524",
  },
  {
    id: "loyalty",
    badge: "LOYALTY",
    title: "250 Points Earned",
    desc: "Redeem on your next bill — worth ₹250",
    code: null,
    accent: "#a78bfa",
    bg1: "#1e1b4b",
    bg2: "#2e1065",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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
  const recentServices = (services?.data ?? []).slice(0, 3);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const daysLeft = endDate
    ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 30;
  const initials = profile?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />
      }
    >

      {/* ── 1. COMPACT SOLAR BANNER ── */}
      <LinearGradient
        colors={["#064e3b", "#16a34a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerLeft}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="flash" size={18} color="#fbbf24" />
          </View>
          <View>
            <Text style={styles.bannerBrand}>GreenVolt</Text>
            <Text style={styles.bannerSub}>Service Provider: Sun House Solar</Text>
          </View>
        </View>
        <Ionicons name="sunny" size={52} color="rgba(251,191,36,0.18)" />
      </LinearGradient>

      {/* ── 2. WELCOME CARD ── */}
      <FadeInView delay={0} style={styles.ph}>
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeAvatar}>
            <Text style={styles.welcomeAvatarText}>{initials}</Text>
          </View>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
            <Text style={styles.welcomeName} numberOfLines={1}>{profile?.name ?? "—"}</Text>
            <View style={styles.welcomePills}>
              {profile?.solarCapacity ? (
                <View style={styles.welcomePill}>
                  <Ionicons name="flash-outline" size={10} color="#16a34a" />
                  <Text style={styles.welcomePillText}>{profile.solarCapacity} kW</Text>
                </View>
              ) : null}
              {profile?.city ? (
                <View style={[styles.welcomePill, styles.welcomePillGray]}>
                  <Ionicons name="location-outline" size={10} color="#6b7280" />
                  <Text style={[styles.welcomePillText, { color: "#6b7280" }]}>{profile.city}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.welcomeId}>
            <Text style={styles.welcomeIdLabel}>ID</Text>
            <Text style={styles.welcomeIdValue}>{profile?.id ? `#${profile.id}` : "—"}</Text>
          </View>
        </View>
      </FadeInView>

      {/* ── 3. NEXT SERVICE ── */}
      <FadeInView delay={80} style={styles.ph}>
        {upcoming ? (
          <TouchableOpacity
            style={styles.nextCard}
            onPress={() => router.push(`/(customer)/services/${upcoming.id}`)}
            activeOpacity={0.85}
          >
            <View style={styles.nextHeader}>
              <View style={styles.nextTitleRow}>
                <View style={styles.nextIconBox}>
                  <Ionicons name="calendar" size={14} color="#16a34a" />
                </View>
                <Text style={styles.nextTitle}>NEXT SERVICE</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: STATUS_CONFIG[upcoming.status]?.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_CONFIG[upcoming.status]?.color }]} />
                <Text style={[styles.statusPillText, { color: STATUS_CONFIG[upcoming.status]?.color }]}>
                  {upcoming.status.replace("_", " ")}
                </Text>
              </View>
            </View>
            <Text style={styles.nextDate}>
              {upcoming.scheduledDate
                ? new Date(upcoming.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })
                : "Date to be confirmed"}
            </Text>
            {upcoming.serviceType ? (
              <Text style={styles.nextType}>{upcoming.serviceType}</Text>
            ) : null}
            {upcoming.staff ? (
              <View style={styles.nextStaffRow}>
                <View style={styles.nextStaffAvatar}>
                  <Text style={styles.nextStaffInitial}>{upcoming.staff.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.nextStaffLabel}>Technician</Text>
                  <Text style={styles.nextStaffName}>{upcoming.staff.name}</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.nextFooter}>
              <Text style={styles.nextTap}>Tap to view details</Text>
              <Ionicons name="chevron-forward" size={14} color="#16a34a" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noNextCard}>
            <View style={styles.noNextIconBox}>
              <Ionicons name="calendar-outline" size={24} color="#9ca3af" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noNextTitle}>No Upcoming Service</Text>
              <Text style={styles.noNextSub}>We'll notify you when a visit is scheduled</Text>
            </View>
          </View>
        )}
      </FadeInView>

      {/* ── 4. QUICK ACTIONS ── */}
      <FadeInView delay={160}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
        >
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickItem}
              onPress={() => {
                if (a.route) router.push(a.route as any);
                else Alert.alert("Coming Soon", "This feature will be available soon.");
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIconBox, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </FadeInView>

      {/* ── 5. SYSTEM OVERVIEW ── */}
      <FadeInView delay={220} style={styles.ph}>
        <View style={styles.sysCard}>
          <View style={styles.sysCardHeader}>
            <Ionicons name="flash" size={13} color="#f59e0b" />
            <Text style={styles.sectionLabel}>SYSTEM OVERVIEW</Text>
          </View>
          <View style={styles.sysGrid}>
            <SysStat
              icon="sunny-outline" color="#f59e0b" label="Capacity"
              value={profile?.solarCapacity ? `${profile.solarCapacity} kW` : "—"}
            />
            <SysStat
              icon="calendar-outline" color="#3b82f6" label="Installed"
              value={profile?.installationDate
                ? new Date(profile.installationDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                : "—"}
            />
            <SysStat
              icon="star-outline" color="#8b5cf6" label="Active Plan"
              value={subscription?.plan ?? "No Plan"}
            />
            <SysStat
              icon="construct-outline" color="#16a34a" label="Last Service"
              value={recentServices[0]?.scheduledDate
                ? new Date(recentServices[0].scheduledDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : "—"}
            />
          </View>
        </View>
      </FadeInView>

      {/* ── 6. RECENT SERVICES ── */}
      {recentServices.length > 0 ? (
        <FadeInView delay={290} style={styles.ph}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionLabelRow}>
              <Ionicons name="time-outline" size={13} color="#16a34a" />
              <Text style={styles.sectionLabel}>RECENT SERVICES</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(customer)/services")} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={13} color="#16a34a" />
            </TouchableOpacity>
          </View>
          <View style={styles.recentList}>
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
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentType}>{s.serviceType ?? "Maintenance"}</Text>
                    {s.scheduledDate ? (
                      <Text style={styles.recentDate}>
                        {new Date(s.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.smallBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.smallBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={13} color="#d1d5db" />
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeInView>
      ) : null}

      {/* ── 7. ACTIVE SUBSCRIPTION ── */}
      {subscription ? (
        <FadeInView delay={350} style={styles.ph}>
          <View style={[styles.subCard, isExpiringSoon && styles.subCardWarn]}>
            <View style={styles.subLeft}>
              <View style={[styles.subIconBox, { backgroundColor: isExpiringSoon ? "#fef3c7" : "#f0fdf4" }]}>
                <Ionicons name="star" size={18} color={isExpiringSoon ? "#d97706" : "#16a34a"} />
              </View>
              <View>
                <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
                <Text style={styles.subPlan}>{subscription.plan}</Text>
                {daysLeft !== null ? (
                  <Text style={[styles.subExpiry, isExpiringSoon && styles.subExpiryWarn]}>
                    {daysLeft > 0 ? `Expires in ${daysLeft} days` : "Expired"}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.subBtn, isExpiringSoon && styles.subBtnWarn]}
              onPress={() => router.push("/(customer)/subscription")}
              activeOpacity={0.8}
            >
              <Text style={[styles.subBtnText, isExpiringSoon && styles.subBtnTextWarn]}>
                {isExpiringSoon ? "Renew Now" : "View Plan"}
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      ) : null}

      {/* ── 8. OFFERS & REWARDS ── */}
      <FadeInView delay={410}>
        <View style={[styles.sectionLabelRow, styles.offersLabelRow]}>
          <Ionicons name="gift-outline" size={13} color="#f59e0b" />
          <Text style={styles.sectionLabel}>OFFERS & REWARDS</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersScroll}
        >
          {MOCK_OFFERS.map((offer) => (
            <LinearGradient
              key={offer.id}
              colors={[offer.bg1, offer.bg2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.offerCard}
            >
              <View style={[styles.offerBadge, { backgroundColor: offer.accent + "28", borderColor: offer.accent + "55" }]}>
                <Text style={[styles.offerBadgeText, { color: offer.accent }]}>{offer.badge}</Text>
              </View>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDesc}>{offer.desc}</Text>
              {offer.code ? (
                <TouchableOpacity
                  style={[styles.offerCodeRow, { borderColor: offer.accent + "50" }]}
                  onPress={() => Alert.alert("Code Copied!", `Use ${offer.code} at checkout.`)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.offerCode, { color: offer.accent }]}>{offer.code}</Text>
                  <View style={[styles.offerCopyBtn, { backgroundColor: offer.accent }]}>
                    <Text style={styles.offerCopyText}>COPY</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={[styles.offerCodeRow, { borderColor: offer.accent + "50" }]}>
                  <Text style={[styles.offerCode, { color: offer.accent }]}>Redeem anytime</Text>
                </View>
              )}
            </LinearGradient>
          ))}
          <View style={styles.offerPlaceholder}>
            <Ionicons name="add-circle-outline" size={28} color="#6b7280" />
            <Text style={styles.offerPlaceholderText}>More offers{"\n"}coming soon</Text>
          </View>
        </ScrollView>
      </FadeInView>

      {/* ── 9. SUPPORT ── */}
      <FadeInView delay={470} style={styles.ph}>
        <View style={styles.sectionLabelRow}>
          <Ionicons name="headset-outline" size={13} color="#ef4444" />
          <Text style={styles.sectionLabel}>SUPPORT</Text>
        </View>
        <View style={styles.supportCard}>
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => Linking.openURL("tel:+918000000000")}
            activeOpacity={0.75}
          >
            <View style={[styles.supportIcon, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="call-outline" size={18} color="#16a34a" />
            </View>
            <View style={styles.supportInfo}>
              <Text style={styles.supportTitle}>Call Sun House Solar</Text>
              <Text style={styles.supportSub}>+91 80000 00000</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
          </TouchableOpacity>
          <View style={styles.supportDivider} />
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => router.push("/(customer)/services")}
            activeOpacity={0.75}
          >
            <View style={[styles.supportIcon, { backgroundColor: "#eff6ff" }]}>
              <Ionicons name="construct-outline" size={18} color="#3b82f6" />
            </View>
            <View style={styles.supportInfo}>
              <Text style={styles.supportTitle}>Raise Service Request</Text>
              <Text style={styles.supportSub}>Schedule a visit or report an issue</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
          </TouchableOpacity>
          <View style={styles.supportDivider} />
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => Linking.openURL("tel:+918000000000")}
            activeOpacity={0.75}
          >
            <View style={[styles.supportIcon, { backgroundColor: "#fef2f2" }]}>
              <Ionicons name="warning-outline" size={18} color="#ef4444" />
            </View>
            <View style={styles.supportInfo}>
              <Text style={styles.supportTitle}>Emergency Support</Text>
              <Text style={styles.supportSub}>24/7 helpline for urgent issues</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
          </TouchableOpacity>
        </View>
      </FadeInView>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="flash" size={12} color="#16a34a" />
        <Text style={styles.footerText}>
          Powered by GreenVolt™  ·  Service Provider: Sun House Solar
        </Text>
      </View>

    </ScrollView>
  );
}

function SysStat({
  icon, color, label, value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.sysStat}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.sysStatValue, { color }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.sysStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  ph: { paddingHorizontal: 16 },

  // ─── Banner ───
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 100,
    overflow: "hidden",
  },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(251,191,36,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerBrand: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 0.2 },
  bannerSub: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  // ─── Welcome ───
  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  welcomeAvatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  welcomeInfo: { flex: 1 },
  welcomeGreeting: { fontSize: 11, color: "#9ca3af" },
  welcomeName: { fontSize: 16, fontWeight: "800", color: "#111827" },
  welcomePills: { flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" },
  welcomePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0fdf4",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  welcomePillGray: { backgroundColor: "#f3f4f6" },
  welcomePillText: { fontSize: 10, fontWeight: "600", color: "#16a34a" },
  welcomeId: { alignItems: "center", gap: 2 },
  welcomeIdLabel: { fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },
  welcomeIdValue: { fontSize: 12, fontWeight: "700", color: "#374151" },

  // ─── Next Service ───
  nextCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
    shadowColor: "#16a34a",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    gap: 8,
  },
  nextHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  nextIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  nextTitle: { fontSize: 11, fontWeight: "800", color: "#16a34a", letterSpacing: 0.8 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  nextDate: { fontSize: 17, fontWeight: "800", color: "#111827" },
  nextType: { fontSize: 13, color: "#6b7280" },
  nextStaffRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 2 },
  nextStaffAvatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  nextStaffInitial: { fontSize: 13, fontWeight: "800", color: "#16a34a" },
  nextStaffLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "600" },
  nextStaffName: { fontSize: 13, fontWeight: "700", color: "#111827" },
  nextFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0fdf4",
  },
  nextTap: { fontSize: 11, color: "#16a34a", fontStyle: "italic" },
  noNextCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  noNextIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
  noNextTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  noNextSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  // ─── Section label ───
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.8,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  offersLabelRow: { marginBottom: 10 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  viewAllText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },

  // ─── Quick Actions ───
  quickScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  quickItem: { alignItems: "center", gap: 7, width: 68 },
  quickIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },

  // ─── System Overview ───
  sysCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    gap: 12,
  },
  sysCardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sysGrid: { flexDirection: "row", flexWrap: "wrap" },
  sysStat: {
    width: "50%",
    paddingVertical: 10,
    paddingRight: 8,
    gap: 4,
  },
  sysStatValue: { fontSize: 14, fontWeight: "800" },
  sysStatLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "500" },

  // ─── Recent Services ───
  recentList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  recentRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  recentBorder: { borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  recentDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  recentInfo: { flex: 1 },
  recentType: { fontSize: 14, fontWeight: "600", color: "#111827" },
  recentDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  smallBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  smallBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },

  // ─── Subscription ───
  subCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: "#dcfce7",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  subCardWarn: { borderColor: "#fcd34d" },
  subLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  subIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  subPlan: { fontSize: 15, fontWeight: "800", color: "#111827" },
  subExpiry: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  subExpiryWarn: { color: "#d97706", fontWeight: "700" },
  subBtn: {
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  subBtnWarn: { backgroundColor: "#fef3c7", borderColor: "#fcd34d" },
  subBtnText: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  subBtnTextWarn: { color: "#d97706" },

  // ─── Offers ───
  offersScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  offerCard: {
    width: SCREEN_WIDTH * 0.72,
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  offerBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  offerBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  offerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  offerDesc: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 17 },
  offerCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  offerCode: { fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  offerCopyBtn: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  offerCopyText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  offerPlaceholder: {
    width: SCREEN_WIDTH * 0.35,
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  offerPlaceholderText: { fontSize: 12, color: "#9ca3af", textAlign: "center", fontWeight: "600" },

  // ─── Support ───
  supportCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  supportRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  supportIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  supportInfo: { flex: 1 },
  supportTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  supportSub: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  supportDivider: { height: 1, backgroundColor: "#f9fafb", marginLeft: 70 },

  // ─── Footer ───
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 28,
  },
  footerText: { fontSize: 11, color: "#9ca3af" },
});
