import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useGetMyProfile, useGetMySubscription, useGetMyServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7" },
  in_progress: { color: "#2563eb", bg: "#dbeafe" },
  completed:   { color: "#16a34a", bg: "#dcfce7" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6" },
};

const SERVICES = [
  { icon: "sunny-outline" as const,       label: "Solar Installation",   color: "#f59e0b", bg: "#fffbeb" },
  { icon: "construct-outline" as const,   label: "Maintenance",          color: "#3b82f6", bg: "#eff6ff" },
  { icon: "water-outline" as const,       label: "Panel Cleaning",       color: "#06b6d4", bg: "#ecfeff" },
  { icon: "hardware-chip-outline" as const, label: "Solar Accessories",  color: "#8b5cf6", bg: "#f5f3ff" },
  { icon: "repeat-outline" as const,      label: "AMC / Plans",          color: "#16a34a", bg: "#f0fdf4" },
  { icon: "search-outline" as const,      label: "Inspection",           color: "#ef4444", bg: "#fef2f2" },
];

const CLEANING_STATS = [
  { value: "+30%",  label: "Energy Efficiency",     icon: "flash-outline" as const,     color: "#f59e0b" },
  { value: "2×",    label: "Longer Panel Life",      icon: "leaf-outline" as const,      color: "#16a34a" },
  { value: "₹8K",   label: "Annual Bill Savings",    icon: "cash-outline" as const,      color: "#8b5cf6" },
];

const SOLAR_BENEFITS = [
  { icon: "globe-outline" as const,  title: "Eco-Friendly",          desc: "Zero carbon emissions. Protect the planet for future generations.", color: "#16a34a", bg: "#f0fdf4" },
  { icon: "cash-outline" as const,   title: "Lower Bills",           desc: "Cut electricity costs by up to 80% with solar energy.",            color: "#f59e0b", bg: "#fffbeb" },
  { icon: "battery-charging-outline" as const, title: "Energy Independence", desc: "Generate your own power and reduce grid dependency.",       color: "#3b82f6", bg: "#eff6ff" },
  { icon: "trending-up-outline" as const, title: "Property Value",   desc: "Solar installations increase property value by 3–5%.",             color: "#8b5cf6", bg: "#f5f3ff" },
];

export default function CustomerHomeScreen() {
  const { data: profile, isLoading: profileLoading, refetch } = useGetMyProfile();
  const { data: subscription } = useGetMySubscription();
  const { data: services } = useGetMyServices({ limit: 5 });

  // Animations
  const heroFade    = useRef(new Animated.Value(0)).current;
  const heroSlide   = useRef(new Animated.Value(30)).current;
  const statsFade   = useRef(new Animated.Value(0)).current;
  const statsSlide  = useRef(new Animated.Value(40)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(statsFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(statsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

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
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />}
    >

      {/* ─── SECTION 1: HERO ─── */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80" }}
          style={styles.heroBg}
          contentFit="cover"
          placeholder={{ blurhash: "L9A3:Raf00WB~qayM{j[00az_3j[" }}
          transition={400}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.82)"]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.heroContent, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
          <View style={styles.heroBrandRow}>
            <View style={styles.heroBrandIcon}>
              <Ionicons name="sunny" size={16} color="#f59e0b" />
            </View>
            <Text style={styles.heroBrandName}>Sun House Solar</Text>
          </View>
          <Text style={styles.heroTagline}>India's Trusted Solar Service Partner</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroWelcome}>Welcome back,</Text>
          <Text style={styles.heroName}>{profile?.name ?? "—"}</Text>
          <View style={styles.heroMeta}>
            {profile?.solarCapacity ? (
              <View style={styles.heroPill}>
                <Ionicons name="flash-outline" size={11} color="#f59e0b" />
                <Text style={styles.heroPillText}>{profile.solarCapacity} kW System</Text>
              </View>
            ) : null}
            {profile?.city ? (
              <View style={styles.heroPill}>
                <Ionicons name="location-outline" size={11} color="#fff" />
                <Text style={styles.heroPillText}>{profile.city}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.heroPowered}>Powered by GreenVolt™</Text>
        </Animated.View>
      </View>

      {/* ─── SECTION 2: YOUR SYSTEM STATS ─── */}
      <Animated.View style={[styles.statsRow, { opacity: statsFade, transform: [{ translateY: statsSlide }] }]}>
        <StatMini icon="flash-outline"    color="#f59e0b" label="Capacity"    value={profile?.solarCapacity ? `${profile.solarCapacity} kW` : "—"} />
        <StatMini icon="calendar-outline" color="#3b82f6" label="Installed"   value={profile?.installationDate ? new Date(profile.installationDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"} />
        <StatMini icon="star-outline"     color="#16a34a" label="Plan"        value={subscription?.plan ?? "No Plan"} />
      </Animated.View>

      <Animated.View style={{ opacity: contentFade }}>

        {/* ─── SECTION 3: UPCOMING SERVICE ─── */}
        {upcoming ? (
          <TouchableOpacity
            style={styles.apptCard}
            onPress={() => router.push(`/(customer)/services/${upcoming.id}`)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#f0fdf4", "#dcfce7"]} style={styles.apptGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.apptHeader}>
                <View style={styles.apptHeaderLeft}>
                  <View style={styles.apptIconBox}>
                    <Ionicons name="calendar" size={15} color="#16a34a" />
                  </View>
                  <Text style={styles.apptTitle}>Next Service Visit</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_CONFIG[upcoming.status]?.bg ?? "#f3f4f6" }]}>
                  <Text style={[styles.badgeText, { color: STATUS_CONFIG[upcoming.status]?.color ?? "#6b7280" }]}>
                    {upcoming.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
              <Text style={styles.apptDate}>
                {upcoming.scheduledDate
                  ? new Date(upcoming.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
                  : "Date to be confirmed"}
              </Text>
              {upcoming.staff ? (
                <View style={styles.apptStaffRow}>
                  <Ionicons name="person-circle-outline" size={15} color="#16a34a" />
                  <Text style={styles.apptStaff}>Technician: {upcoming.staff.name}</Text>
                </View>
              ) : null}
              <View style={styles.apptFooter}>
                <Text style={styles.apptTap}>Tap to view details</Text>
                <Ionicons name="chevron-forward" size={14} color="#16a34a" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.noApptCard}>
            <Ionicons name="calendar-outline" size={28} color="#d1d5db" />
            <View>
              <Text style={styles.noApptTitle}>No Upcoming Visits</Text>
              <Text style={styles.noApptSub}>We'll notify you when a service is scheduled</Text>
            </View>
          </View>
        )}

        {/* ─── SECTION 4: QUICK ACTIONS ─── */}
        <SectionHeader icon="apps-outline" title="Quick Actions" />
        <View style={styles.quickGrid}>
          <QuickCard icon="construct-outline" label="Service History" color="#3b82f6" bg="#eff6ff" onPress={() => router.push("/(customer)/services")} />
          <QuickCard icon="card-outline"      label="Payments"        color="#8b5cf6" bg="#f5f3ff" onPress={() => router.push("/(customer)/payments")} />
          <QuickCard icon="star-outline"      label="My Plan"         color="#d97706" bg="#fffbeb" onPress={() => router.push("/(customer)/subscription")} />
          <QuickCard icon="person-outline"    label="My Profile"      color="#16a34a" bg="#f0fdf4" onPress={() => router.push("/(customer)/profile")} />
        </View>

        {/* ─── SECTION 5: OUR SERVICES ─── */}
        <SectionHeader icon="grid-outline" title="Our Services" subtitle="Sun House Solar offers" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesScroll}>
          {SERVICES.map((s) => (
            <View key={s.label} style={styles.serviceCard}>
              <View style={[styles.serviceIconBox, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={24} color={s.color} />
              </View>
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ─── SECTION 6: WHY CLEAN PANELS? ─── */}
        <SectionHeader icon="water-outline" title="Why Clean Solar Panels?" />
        <View style={styles.cleaningBanner}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=75" }}
            style={styles.cleaningBannerImg}
            contentFit="cover"
            placeholder={{ blurhash: "L8Bq1b9F00M{~qIo%LRj00xu_3j[" }}
            transition={400}
          />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.72)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.cleaningBannerText}>
            <Text style={styles.cleaningBannerTitle}>Dirty panels lose up to 30% efficiency</Text>
            <Text style={styles.cleaningBannerSub}>Regular cleaning keeps your investment performing at peak</Text>
          </View>
        </View>
        <View style={styles.cleaningStats}>
          {CLEANING_STATS.map((s) => (
            <View key={s.label} style={styles.cleaningStat}>
              <View style={[styles.cleaningStatIcon, { backgroundColor: s.color + "18" }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.cleaningStatValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.cleaningStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── SECTION 7: SOLAR BENEFITS ─── */}
        <SectionHeader icon="leaf-outline" title="Benefits of Solar Energy" />
        <View style={styles.benefitsGrid}>
          {SOLAR_BENEFITS.map((b) => (
            <View key={b.title} style={[styles.benefitCard, { borderTopColor: b.color, borderTopWidth: 3 }]}>
              <View style={[styles.benefitIcon, { backgroundColor: b.bg }]}>
                <Ionicons name={b.icon} size={20} color={b.color} />
              </View>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>

        {/* ─── SECTION 8: ABOUT SUN HOUSE SOLAR ─── */}
        <SectionHeader icon="business-outline" title="About Sun House Solar" />
        <View style={styles.aboutCard}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=75" }}
            style={styles.aboutImg}
            contentFit="cover"
            placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R*0Ko#DgR*" }}
            transition={400}
          />
          <View style={styles.aboutContent}>
            <View style={styles.aboutBrandRow}>
              <Ionicons name="sunny" size={18} color="#f59e0b" />
              <Text style={styles.aboutBrand}>Sun House Solar</Text>
            </View>
            <Text style={styles.aboutDesc}>
              Sun House Solar is a leading solar energy company providing end-to-end solar solutions for residential and commercial properties across India.
            </Text>
            <View style={styles.aboutServices}>
              {[
                "Solar Panel Sales & Installation",
                "Customized Solar Solutions",
                "Solar Accessories & Equipment",
                "Maintenance & Cleaning Services",
                "AMC Subscription Plans",
                "Inspection & Support",
              ].map((item) => (
                <View key={item} style={styles.aboutServiceRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  <Text style={styles.aboutServiceText}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.aboutFooter}>
              <Text style={styles.aboutPowered}>Powered by GreenVolt™</Text>
              <Text style={styles.aboutProvider}>Service Provider: Sun House Solar</Text>
            </View>
          </View>
        </View>

        {/* ─── SECTION 9: RECENT SERVICES ─── */}
        {recentServices.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader icon="time-outline" title="Recent Services" />
              <TouchableOpacity onPress={() => router.push("/(customer)/services")} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={13} color="#16a34a" />
              </TouchableOpacity>
            </View>
            {recentServices.map((s) => {
              const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.cancelled;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.recentCard}
                  onPress={() => router.push(`/(customer)/services/${s.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.recentDot, { backgroundColor: cfg.color }]} />
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentType}>{s.serviceType ?? "Maintenance"}</Text>
                    {s.scheduledDate ? (
                      <Text style={styles.recentDate}>
                        {new Date(s.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.badgeText, { color: cfg.color }]}>{s.status.replace("_", " ")}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}

        {/* ─── SECTION 10: CONTACT & SUPPORT ─── */}
        <SectionHeader icon="headset-outline" title="Contact & Support" />
        <View style={styles.contactCard}>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL("tel:+918000000000")} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="call-outline" size={18} color="#16a34a" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Call Us</Text>
              <Text style={styles.contactValue}>+91 80000 00000</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
          </TouchableOpacity>
          <View style={styles.contactDivider} />
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL("https://wa.me/918000000000")} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactValue}>Chat with our team</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
          </TouchableOpacity>
          <View style={styles.contactDivider} />
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL("mailto:support@sunhousesolar.in")} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: "#eff6ff" }]}>
              <Ionicons name="mail-outline" size={18} color="#3b82f6" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>support@sunhousesolar.in</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="sunny" size={16} color="#f59e0b" />
          <Text style={styles.footerText}>Powered by GreenVolt™</Text>
          <Text style={styles.footerSub}>Service Provider: Sun House Solar</Text>
        </View>

      </Animated.View>
    </ScrollView>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color="#16a34a" />
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function StatMini({ icon, color, label, value }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string }) {
  return (
    <View style={styles.statMini}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.statMiniValue, { color }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

function QuickCard({ icon, label, color, bg, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bg: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
      <Animated.View style={[styles.quickCard, { transform: [{ scale }] }]}>
        <View style={[styles.quickIconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.quickLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Hero
  heroContainer: { width: "100%", height: 300, position: "relative" },
  heroBg: { width: "100%", height: "100%" },
  heroContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 },
  heroBrandRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 },
  heroBrandIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(245,158,11,0.25)", justifyContent: "center", alignItems: "center" },
  heroBrandName: { fontSize: 14, fontWeight: "700", color: "#fbbf24", letterSpacing: 0.3 },
  heroTagline: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 10 },
  heroDivider: { width: 32, height: 2, backgroundColor: "#f59e0b", borderRadius: 1, marginBottom: 10 },
  heroWelcome: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  heroName: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 8 },
  heroMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  heroPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroPillText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  heroPowered: { fontSize: 10, color: "rgba(255,255,255,0.45)", fontStyle: "italic" },

  // Stats row
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14 },
  statMini: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center", gap: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  statMiniValue: { fontSize: 13, fontWeight: "800" },
  statMiniLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "500" },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionSubtitle: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  viewAllText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },

  // Appointment card
  apptCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, overflow: "hidden", shadowColor: "#16a34a", shadowOpacity: 0.12, shadowRadius: 10, elevation: 2 },
  apptGradient: { padding: 16, gap: 8 },
  apptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  apptHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  apptIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  apptTitle: { fontSize: 12, fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.5 },
  apptDate: { fontSize: 17, fontWeight: "800", color: "#111827" },
  apptStaffRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  apptStaff: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  apptFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(22,163,74,0.15)", marginTop: 2 },
  apptTap: { fontSize: 11, color: "#16a34a", fontStyle: "italic" },
  noApptCard: { marginHorizontal: 16, marginTop: 14, backgroundColor: "#fff", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  noApptTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  noApptSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  // Quick actions
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  quickCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, alignItems: "center", width: (SCREEN_WIDTH - 56) / 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1, gap: 10 },
  quickIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  quickLabel: { fontSize: 13, fontWeight: "600", color: "#374151", textAlign: "center" },

  // Services scroll
  servicesScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  serviceCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, alignItems: "center", gap: 10, width: 100, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  serviceIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  serviceLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },

  // Cleaning banner
  cleaningBanner: { marginHorizontal: 16, height: 160, borderRadius: 18, overflow: "hidden", position: "relative" },
  cleaningBannerImg: { width: "100%", height: "100%" },
  cleaningBannerText: { position: "absolute", bottom: 14, left: 16, right: 16 },
  cleaningBannerTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  cleaningBannerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 3 },
  cleaningStats: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 10 },
  cleaningStat: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center", gap: 5, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cleaningStatIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  cleaningStatValue: { fontSize: 20, fontWeight: "800" },
  cleaningStatLabel: { fontSize: 10, color: "#6b7280", textAlign: "center", fontWeight: "500" },

  // Benefits
  benefitsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  benefitCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, width: (SCREEN_WIDTH - 56) / 2, gap: 8, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  benefitIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  benefitTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  benefitDesc: { fontSize: 11, color: "#6b7280", lineHeight: 16 },

  // About
  aboutCard: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  aboutImg: { width: "100%", height: 160 },
  aboutContent: { padding: 16, gap: 10 },
  aboutBrandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  aboutBrand: { fontSize: 17, fontWeight: "800", color: "#111827" },
  aboutDesc: { fontSize: 13, color: "#6b7280", lineHeight: 20 },
  aboutServices: { gap: 6 },
  aboutServiceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  aboutServiceText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  aboutFooter: { paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6", gap: 2 },
  aboutPowered: { fontSize: 11, color: "#16a34a", fontWeight: "700" },
  aboutProvider: { fontSize: 11, color: "#9ca3af" },

  // Recent services
  recentCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fff", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  recentDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  recentInfo: { flex: 1 },
  recentType: { fontSize: 14, fontWeight: "600", color: "#111827" },
  recentDate: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  // Contact
  contactCard: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  contactIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  contactValue: { fontSize: 14, color: "#111827", fontWeight: "600", marginTop: 1 },
  contactDivider: { height: 1, backgroundColor: "#f9fafb", marginLeft: 68 },

  // Footer
  footer: { alignItems: "center", paddingVertical: 28, gap: 4 },
  footerText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  footerSub: { fontSize: 11, color: "#9ca3af" },

  // Badge
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
