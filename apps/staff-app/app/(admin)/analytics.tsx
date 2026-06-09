import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Animated } from "react-native";
import { useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { FadeInView } from "@/components/FadeInView";
import { useRef, useEffect, useState } from "react";

function AnimatedNumber({ value, color, style }: { value: number; color: string; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    anim.addListener(({ value: v }) => setDisplay(Math.floor(v)));
    Animated.timing(anim, { toValue: value, duration: 1000, delay: 400, useNativeDriver: false }).start();
    return () => anim.removeAllListeners();
  }, [value]);
  return <Text style={[style, { color }]}>{display}</Text>;
}

export default function AdminAnalyticsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetDashboardAnalytics();

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

  const d = data as Record<string, number> | undefined;
  const revenue = d?.totalRevenue ?? 0;
  const monthly = d?.monthlyRevenue ?? 0;

  const serviceMetrics = [
    { label: "Completed",   value: d?.completedServices  ?? 0, color: "#16a34a", bg: "#f0fdf4", icon: "checkmark-circle-outline" as const },
    { label: "Pending",     value: d?.pendingServices    ?? 0, color: "#d97706", bg: "#fffbeb", icon: "time-outline" as const },
    { label: "In Progress", value: d?.inProgressServices ?? 0, color: "#2563eb", bg: "#eff6ff", icon: "construct-outline" as const },
    { label: "Unread",      value: d?.unreadContacts     ?? 0, color: "#ef4444", bg: "#fef2f2", icon: "mail-unread-outline" as const },
  ];

  const peopleMetrics = [
    { label: "Customers",     value: d?.totalCustomers       ?? 0, color: "#8b5cf6", bg: "#f5f3ff", icon: "people-outline" as const },
    { label: "Subscriptions", value: d?.activeSubscriptions  ?? 0, color: "#06b6d4", bg: "#ecfeff", icon: "card-outline" as const },
    { label: "Total Staff",   value: d?.totalStaff           ?? 0, color: "#374151", bg: "#f9fafb", icon: "id-card-outline" as const },
    { label: "Active Staff",  value: d?.activeStaff          ?? 0, color: "#16a34a", bg: "#f0fdf4", icon: "person-outline" as const },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />}
    >
      {/* Revenue hero card */}
      <FadeInView delay={0}>
        <View style={styles.revenueCard}>
          <View style={styles.revenueIconBox}>
            <Ionicons name="cash-outline" size={22} color="#16a34a" />
          </View>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>₹{revenue.toLocaleString("en-IN")}</Text>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueMonthlyRow}>
            <Ionicons name="trending-up-outline" size={14} color="#bbf7d0" />
            <Text style={styles.revenueMonthly}>This month: ₹{monthly.toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </FadeInView>

      {/* Services section */}
      <FadeInView delay={100}>
        <SectionHeader icon="construct-outline" title="Services" />
      </FadeInView>
      <View style={styles.grid}>
        {serviceMetrics.map((m, i) => (
          <FadeInView key={m.label} delay={150 + i * 80}>
            <MetricCard {...m} animated />
          </FadeInView>
        ))}
      </View>

      {/* People section */}
      <FadeInView delay={500}>
        <SectionHeader icon="people-outline" title="People" />
      </FadeInView>
      <View style={styles.grid}>
        {peopleMetrics.map((m, i) => (
          <FadeInView key={m.label} delay={550 + i * 80}>
            <MetricCard {...m} animated />
          </FadeInView>
        ))}
      </View>
    </ScrollView>
  );
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color="#16a34a" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  color,
  bg,
  icon,
  animated: useAnim,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
  animated?: boolean;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      {useAnim
        ? <AnimatedNumber value={value} color={color} style={styles.metricValue} />
        : <Text style={[styles.metricValue, { color }]}>{value}</Text>
      }
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  revenueCard: {
    backgroundColor: "#16a34a",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
    gap: 4,
    marginBottom: 4,
  },
  revenueIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  revenueLabel: { fontSize: 13, color: "#dcfce7", fontWeight: "600" },
  revenueValue: { fontSize: 40, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  revenueDivider: { width: 40, height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: 8 },
  revenueMonthlyRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  revenueMonthly: { fontSize: 13, color: "#bbf7d0" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "47%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 6,
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  metricValue: { fontSize: 28, fontWeight: "800" },
  metricLabel: { fontSize: 12, color: "#6b7280", textAlign: "center", fontWeight: "500" },
});
