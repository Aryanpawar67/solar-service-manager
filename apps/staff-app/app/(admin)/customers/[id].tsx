import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetCustomer, useListServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7",  label: "PENDING" },
  in_progress: { color: "#2563eb", bg: "#dbeafe",  label: "IN PROGRESS" },
  completed:   { color: "#00450d", bg: "#dcfce7",  label: "COMPLETED" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6",  label: "CANCELLED" },
};

const STATUS_FILTERS = ["All", "Pending", "In Progress", "Completed"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function filterKey(f: StatusFilter): string | null {
  if (f === "Pending") return "pending";
  if (f === "In Progress") return "in_progress";
  if (f === "Completed") return "completed";
  return null;
}

export default function AdminCustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const { data: customer, isLoading, isError, refetch } = useGetCustomer(customerId);
  const { data: services } = useListServices({ customerId, limit: 20 });

  if (isLoading || (!customer && !isError)) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError || !customer) return <ErrorState onRetry={refetch} />;

  const key = filterKey(statusFilter);
  const serviceList = (services?.data ?? []).filter((s) => !key || s.status === key);
  const customerId_ = `CUS-${String(customer.id).padStart(4, "0")}-X`;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Customer Detail",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#00450d",
          headerTitleStyle: { fontWeight: "700", color: "#111827" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#00450d" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 4, padding: 4 }} onPress={() => router.push({ pathname: "/(admin)/customers/edit", params: { id: String(customerId) } })}>
              <Ionicons name="pencil-outline" size={20} color="#374151" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerId}>ID: {customerId_}</Text>

          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.85}
            onPress={() => customer.phone && Linking.openURL(`tel:${customer.phone}`)}
          >
            <Ionicons name="mail-outline" size={16} color="#fff" />
            <Text style={styles.contactBtnText}>Contact</Text>
          </TouchableOpacity>

          {customer.address ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#9ca3af" />
              <Text style={styles.infoLabel}>Facility</Text>
              <Text style={styles.infoValue}>{customer.address}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color="#9ca3af" />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{customer.phone}</Text>
          </View>
          {customer.installationDate ? (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{customer.installationDate}</Text>
            </View>
          ) : null}
        </View>

        {/* Solar capacity stat */}
        {customer.solarCapacity ? (
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>SOLAR CAPACITY</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{customer.solarCapacity}</Text>
                <Text style={styles.statUnit}> kW</Text>
              </View>
            </View>
            <View style={styles.statIcon}>
              <Ionicons name="flash-outline" size={28} color="#d1d5db" />
            </View>
          </View>
        ) : null}

        {/* Service History */}
        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>Service History</Text>
            <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters((v) => !v)} activeOpacity={0.7}>
              <Ionicons name="options-outline" size={14} color={showFilters ? "#00450d" : "#6b7280"} />
              <Text style={[styles.filterText, showFilters && { color: "#00450d" }]}>
                {statusFilter === "All" ? "FILTER" : statusFilter.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {showFilters && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
                  onPress={() => setStatusFilter(f)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, statusFilter === f && styles.filterChipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {serviceList.length === 0 ? (
            <View style={styles.emptyServices}>
              <Ionicons name="construct-outline" size={36} color="#d1d5db" />
              <Text style={styles.emptyText}>
                {statusFilter === "All" ? "No services recorded yet." : `No ${statusFilter.toLowerCase()} services.`}
              </Text>
            </View>
          ) : (
            <View style={styles.table}>
              {/* Table header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.4 }]}>DATE</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>SERVICE TYPE</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2, textAlign: "right" }]}>STATUS</Text>
              </View>
              {serviceList.map((s, i) => {
                const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.cancelled;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.tableRow, i < serviceList.length - 1 && styles.tableRowBorder]}
                    onPress={() => router.push(`/job/${s.id}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tableCell, styles.tableCellText, { flex: 1.4 }]}>
                      {s.scheduledDate
                        ? new Date(s.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : "—"}
                    </Text>
                    <View style={[styles.tableCell, { flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }]}>
                      <Ionicons name="construct-outline" size={13} color="#9ca3af" />
                      <Text style={styles.tableCellText} numberOfLines={2}>
                        {s.serviceType ?? "Maintenance"}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, { flex: 1.2, alignItems: "flex-end" }]}>
                      <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.viewAllBtn} onPress={() => Alert.alert("Records", `Showing ${serviceList.length} most recent records.`)} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>VIEW ALL RECORDS</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  identityCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#f0f0f0",
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center", marginBottom: 4,
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#374151" },
  customerName: { fontSize: 22, fontWeight: "800", color: "#111827" },
  customerId: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },

  contactBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#00450d", borderRadius: 10,
    paddingHorizontal: 32, paddingVertical: 12,
    alignSelf: "stretch", justifyContent: "center",
    marginVertical: 4,
  },
  contactBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "stretch",
    paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#f4f4f5",
  },
  infoLabel: { fontSize: 13, color: "#9ca3af", flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#111827", flex: 2, textAlign: "right" },

  statCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#f0f0f0",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  statValueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  statValue: { fontSize: 38, fontWeight: "800", color: "#111827" },
  statUnit: { fontSize: 18, fontWeight: "700", color: "#9ca3af" },
  statIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
  },

  section: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 14,
  },
  sectionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  filterText: { fontSize: 11, fontWeight: "700", color: "#6b7280", letterSpacing: 0.3 },
  filterChipRow: { gap: 8, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#f3f4f6",
  },
  filterChipActive: { backgroundColor: "#00450d", borderColor: "#00450d" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  filterChipTextActive: { color: "#fff" },

  emptyServices: { alignItems: "center", padding: 20, gap: 8 },
  emptyText: { fontSize: 13, color: "#9ca3af" },

  table: { gap: 0 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
  tableHeader: { paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tableHeaderText: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.4 },
  tableCell: { paddingHorizontal: 2 },
  tableCellText: { fontSize: 12, color: "#374151" },
  statusPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusPillText: { fontSize: 10, fontWeight: "700" },

  viewAllBtn: {
    alignItems: "center", paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "#f4f4f5",
  },
  viewAllText: { fontSize: 12, fontWeight: "700", color: "#374151", letterSpacing: 0.5 },
});
