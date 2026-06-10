import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetCustomer, useListServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { FadeInView } from "@/components/FadeInView";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7" },
  in_progress: { color: "#2563eb", bg: "#dbeafe" },
  completed:   { color: "#00450d", bg: "#dcfce7" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6" },
};

export default function AdminCustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);

  const { data: customer, isLoading, isError, refetch } = useGetCustomer(customerId);
  const { data: services } = useListServices({ customerId, limit: 20 });

  if (isLoading || (!customer && !isError)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00450d" />
      </View>
    );
  }

  if (isError || !customer) {
    return <ErrorState onRetry={refetch} />;
  }

  const serviceList = services?.data ?? [];
  const completedCount = serviceList.filter((s) => s.status === "completed").length;

  return (
    <>
      <Stack.Screen
        options={{
          title: customer.name,
          headerStyle: { backgroundColor: "#00450d" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Customer header */}
        <FadeInView delay={0}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{customer.name}</Text>
            <Text style={styles.profilePhone}>{customer.phone}</Text>
          </View>
          {customer.solarCapacity ? (
            <View style={styles.capacityBadge}>
              <Ionicons name="sunny-outline" size={12} color="#00450d" />
              <Text style={styles.capacityText}>{customer.solarCapacity} kW</Text>
            </View>
          ) : null}
        </View>
        </FadeInView>

        {/* Stats row */}
        <FadeInView delay={80}>
        <View style={styles.statsRow}>
          <StatCard icon="construct-outline" label="Total Services" value={String(serviceList.length)} color="#3b82f6" />
          <StatCard icon="checkmark-circle-outline" label="Completed" value={String(completedCount)} color="#00450d" />
          <StatCard icon="flash-outline" label="Capacity" value={customer.solarCapacity ? `${customer.solarCapacity} kW` : "—"} color="#d97706" />
        </View>
        </FadeInView>

        {/* Details */}
        <FadeInView delay={160}>
        <View style={styles.card}>
          <SectionHeader icon="person-outline" title="Customer Details" />
          <InfoRow icon="call-outline" label="Phone" value={customer.phone} />
          <InfoRow icon="location-outline" label="Address" value={customer.address} />
          {customer.city && <InfoRow icon="map-outline" label="City" value={customer.city} />}
          {customer.installationDate && (
            <InfoRow icon="calendar-outline" label="Installed" value={customer.installationDate} />
          )}
          {customer.notes && <InfoRow icon="document-text-outline" label="Notes" value={customer.notes} last />}
        </View>
        </FadeInView>

        {/* Service history */}
        <FadeInView delay={240}>
        <View style={styles.sectionHeaderRow}>
          <SectionHeader icon="construct-outline" title="Service History" />
          <Text style={styles.sectionCount}>{serviceList.length}</Text>
        </View>

        {serviceList.length === 0 ? (
          <View style={styles.emptyServices}>
            <Ionicons name="construct-outline" size={32} color="#d1d5db" />
            <Text style={styles.emptyText}>No services recorded yet.</Text>
          </View>
        ) : (
          serviceList.map((s, idx) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.cancelled;
            return (
              <FadeInView key={s.id} delay={300 + Math.min(idx * 70, 420)}>
              <Pressable
                android_ripple={{ color: "#00450d18" }}
                style={({ pressed }) => [
                  styles.serviceCard,
                  Platform.OS === "ios" && pressed && { opacity: 0.75 },
                ]}
                onPress={() => router.push(`/job/${s.id}`)}
              >
                <View style={styles.serviceTop}>
                  <View style={styles.serviceLeft}>
                    <Text style={styles.serviceType}>{s.serviceType ?? "Maintenance"}</Text>
                    {s.scheduledDate && (
                      <View style={styles.serviceDateRow}>
                        <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                        <Text style={styles.serviceDate}>
                          {new Date(s.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </Text>
                      </View>
                    )}
                    {s.staff && (
                      <View style={styles.serviceDateRow}>
                        <Ionicons name="person-outline" size={12} color="#9ca3af" />
                        <Text style={styles.serviceDate}>{s.staff.name}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.serviceRight}>
                    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.badgeText, { color: cfg.color }]}>
                        {s.status.replace("_", " ")}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
                  </View>
                </View>
              </Pressable>
              </FadeInView>
            );
          })
        )}
        </FadeInView>
      </ScrollView>
    </>
  );
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeaderInner}>
      <Ionicons name={icon} size={15} color="#00450d" />
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
        <Ionicons name={icon} size={14} color="#00450d" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#00450d",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "800", color: "#111827" },
  profilePhone: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  capacityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  capacityText: { fontSize: 13, fontWeight: "700", color: "#00450d" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#9ca3af", textAlign: "center", fontWeight: "500" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeaderInner: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionCount: { fontSize: 12, fontWeight: "700", color: "#9ca3af", backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },

  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  infoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#f0fdf4", justifyContent: "center", alignItems: "center" },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500", marginTop: 1 },

  emptyServices: { alignItems: "center", padding: 24, gap: 8, backgroundColor: "#fff", borderRadius: 14 },
  emptyText: { fontSize: 13, color: "#9ca3af" },

  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  serviceLeft: { flex: 1, gap: 4 },
  serviceType: { fontSize: 14, fontWeight: "700", color: "#111827" },
  serviceDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  serviceDate: { fontSize: 12, color: "#9ca3af" },
  serviceRight: { alignItems: "flex-end", gap: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
