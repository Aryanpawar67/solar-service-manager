import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetCustomer, useListServices } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

export default function AdminCustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);

  const { data: customer, isLoading } = useGetCustomer(customerId);
  const { data: services } = useListServices({ customerId, limit: 20 });

  if (isLoading || !customer) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: customer.name,
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4 }}>
              <Text style={{ color: "#fff", fontSize: 16 }}>‹ Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <Row label="Phone" value={customer.phone} />
          <Row label="Address" value={customer.address} />
          {customer.city && <Row label="City" value={customer.city} />}
          {customer.solarCapacity && <Row label="Capacity" value={`${customer.solarCapacity} kW`} />}
          {customer.installationDate && <Row label="Installed" value={customer.installationDate} />}
          {customer.notes && <Row label="Notes" value={customer.notes} />}
        </View>

        {/* Service History */}
        <Text style={styles.sectionHeader}>Service History</Text>
        {(services?.data ?? []).length === 0 ? (
          <Text style={styles.empty}>No services recorded.</Text>
        ) : (
          (services?.data ?? []).map((s) => (
            <TouchableOpacity key={s.id} style={styles.serviceCard} onPress={() => router.push(`/job/${s.id}`)} activeOpacity={0.7}>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceType}>{s.serviceType ?? "Maintenance"}</Text>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[s.status] ?? "#6b7280") + "22" }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[s.status] ?? "#6b7280" }]}>
                    {s.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
              {s.scheduledDate && (
                <Text style={styles.serviceDate}>
                  {new Date(s.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
              )}
              {s.staff && <Text style={styles.serviceStaff}>Technician: {s.staff.name}</Text>}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </>
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
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#374151", marginBottom: 12 },
  sectionHeader: { fontSize: 15, fontWeight: "700", color: "#374151", marginTop: 4 },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 110 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  empty: { color: "#9ca3af", fontSize: 14, textAlign: "center", marginTop: 8 },
  serviceCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  serviceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  serviceType: { fontSize: 14, fontWeight: "600", color: "#111827" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  serviceDate: { fontSize: 13, color: "#6b7280" },
  serviceStaff: { fontSize: 12, color: "#3b82f6", marginTop: 2 },
});
