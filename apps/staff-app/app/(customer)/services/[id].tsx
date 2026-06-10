import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetMyService } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/lib/constants";
import { getToken } from "@/lib/auth";
import { ErrorState } from "@/components/ErrorState";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7" },
  in_progress: { color: "#2563eb", bg: "#dbeafe" },
  completed:   { color: "#00450d", bg: "#dcfce7" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6" },
};

export default function CustomerServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = Number(id);
  const { data: service, isLoading, isError, refetch } = useGetMyService(serviceId);

  const downloadReport = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }
    const url = `${API_BASE_URL}/api/services/${serviceId}/report?token=${encodeURIComponent(token)}`;
    Alert.alert("Download Report", "This will open the PDF report in your browser.", [
      { text: "Cancel", style: "cancel" },
      { text: "Open", onPress: () => Linking.openURL(url) },
    ]);
  };

  if (isLoading || (!service && !isError)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00450d" />
      </View>
    );
  }

  if (isError || !service) {
    return <ErrorState onRetry={refetch} />;
  }

  const cfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.cancelled;

  return (
    <>
      <Stack.Screen
        options={{
          title: service.serviceType ?? "Service Detail",
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
        {/* Status header */}
        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <Text style={styles.serviceType}>{service.serviceType ?? "Maintenance"}</Text>
            <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>
                {service.status.replace("_", " ")}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <SectionHeader icon="information-circle-outline" title="Service Details" />
          <InfoRow
            icon="calendar-outline"
            label="Scheduled"
            value={service.scheduledDate
              ? new Date(service.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })
              : "—"}
          />
          {service.completedAt ? (
            <InfoRow
              icon="checkmark-circle-outline"
              label="Completed"
              value={new Date(service.completedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            />
          ) : null}
          {service.staff ? (
            <InfoRow icon="person-outline" label="Technician" value={service.staff.name} />
          ) : null}
          {service.notes ? (
            <InfoRow icon="document-text-outline" label="Notes" value={service.notes} />
          ) : null}
          {service.remarks ? (
            <InfoRow icon="chatbubble-outline" label="Remarks" value={service.remarks} last />
          ) : null}
        </View>

        {/* Photos */}
        {(service.preServiceImage || service.postServiceImage) ? (
          <View style={styles.card}>
            <SectionHeader icon="images-outline" title="Photos" />
            {service.preServiceImage ? (
              <View style={styles.photoBlock}>
                <Text style={styles.photoLabel}>Before Service</Text>
                <Image source={{ uri: service.preServiceImage }} style={styles.photo} resizeMode="cover" />
              </View>
            ) : null}
            {service.postServiceImage ? (
              <View style={[styles.photoBlock, { marginBottom: 0 }]}>
                <Text style={styles.photoLabel}>After Service</Text>
                <Image source={{ uri: service.postServiceImage }} style={styles.photo} resizeMode="cover" />
              </View>
            ) : null}
          </View>
        ) : null}

        {/* PDF Report */}
        {service.status === "completed" ? (
          <TouchableOpacity style={styles.reportBtn} onPress={downloadReport} activeOpacity={0.8}>
            <Ionicons name="document-outline" size={18} color="#fff" />
            <Text style={styles.reportBtnText}>Download PDF Report</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </>
  );
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  statusTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  serviceType: { fontSize: 18, fontWeight: "800", color: "#111827", flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },

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
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500", marginTop: 1 },

  photoBlock: { marginBottom: 12 },
  photoLabel: { fontSize: 12, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 },
  photo: { width: "100%", height: 200, borderRadius: 12 },

  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00450d",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#00450d",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  reportBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
