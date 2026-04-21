import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Linking, Alert } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetMyService } from "@workspace/api-client-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#16a34a",
  cancelled: "#6b7280",
};

export default function CustomerServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = Number(id);
  const { data: service, isLoading } = useGetMyService(serviceId);

  if (isLoading || !service) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const downloadReport = () => {
    const url = `/api/services/${serviceId}/report`;
    Alert.alert("Download Report", "This will open the PDF report in your browser.", [
      { text: "Cancel", style: "cancel" },
      { text: "Open", onPress: () => Linking.openURL(url) },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Service Detail",
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
        {/* Status */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.serviceType}>{service.serviceType ?? "Maintenance"}</Text>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[service.status] ?? "#6b7280") + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[service.status] ?? "#6b7280" }]}>
                {service.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          <Row label="Date" value={service.scheduledDate
            ? new Date(service.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
            : "—"} />
          {service.completedAt && (
            <Row label="Completed" value={new Date(service.completedAt).toLocaleDateString("en-IN")} />
          )}
          {service.staff && <Row label="Technician" value={service.staff.name} />}
          {service.notes && <Row label="Notes" value={service.notes} />}
          {service.remarks && <Row label="Remarks" value={service.remarks} />}
        </View>

        {/* Photos */}
        {(service.preServiceImage || service.postServiceImage) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Photos</Text>
            {service.preServiceImage && (
              <View style={styles.photoBlock}>
                <Text style={styles.photoLabel}>Before Service</Text>
                <Image source={{ uri: service.preServiceImage }} style={styles.photo} resizeMode="cover" />
              </View>
            )}
            {service.postServiceImage && (
              <View style={styles.photoBlock}>
                <Text style={styles.photoLabel}>After Service</Text>
                <Image source={{ uri: service.postServiceImage }} style={styles.photo} resizeMode="cover" />
              </View>
            )}
          </View>
        )}

        {/* PDF Report */}
        {service.status === "completed" && (
          <TouchableOpacity style={styles.reportBtn} onPress={downloadReport}>
            <Text style={styles.reportBtnText}>Download PDF Report</Text>
          </TouchableOpacity>
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
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  serviceType: { fontSize: 17, fontWeight: "700", color: "#111827" },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 100 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 },
  photoBlock: { marginBottom: 12 },
  photoLabel: { fontSize: 13, color: "#6b7280", marginBottom: 6 },
  photo: { width: "100%", height: 180, borderRadius: 10 },
  reportBtn: { backgroundColor: "#16a34a", borderRadius: 12, padding: 16, alignItems: "center" },
  reportBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
