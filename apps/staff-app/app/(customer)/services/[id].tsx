import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetMyService } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/lib/constants";
import { getToken } from "@/lib/auth";
import { ErrorState } from "@/components/ErrorState";
import { File as FSFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#6b7280", bg: "#f3f4f6",  label: "SCHEDULED" },
  in_progress: { color: "#2563eb", bg: "#dbeafe",  label: "IN PROGRESS" },
  completed:   { color: "#00450d", bg: "#dcfce7",  label: "COMPLETED" },
  cancelled:   { color: "#ef4444", bg: "#fee2e2",  label: "CANCELLED" },
};

const STEPS = ["Scheduled", "Assigned", "In Progress", "Completed"] as const;

function getVisualStep(status: string): number {
  if (status === "completed") return 4;
  if (status === "in_progress") return 2;
  if (status === "pending") return 1;
  return 0;
}

export default function CustomerServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = Number(id);
  const { data: service, isLoading, isError, refetch } = useGetMyService(serviceId);

  const downloadReport = async () => {
    const token = await getToken();
    if (!token) { Alert.alert("Not logged in", "Please log in again."); return; }

    const url = `${API_BASE_URL}/api/services/${serviceId}/report`;
    const destFile = new FSFile(Paths.cache, `service-report-${serviceId}.pdf`);

    try {
      const downloaded = await FSFile.downloadFileAsync(url, destFile, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloaded.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Service Report #${serviceId}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Downloaded", `Report saved to ${downloaded.uri}`);
      }
    } catch {
      Alert.alert("Error", "Could not download the report. Check your connection.");
    }
  };

  if (isLoading || (!service && !isError)) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError || !service) return <ErrorState onRetry={refetch} />;

  const cfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.cancelled;
  const step = getVisualStep(service.status);

  return (
    <>
      <Stack.Screen
        options={{
          title: service.serviceType ?? "Service Detail",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#00450d",
          headerTitleStyle: { fontWeight: "700", color: "#111827" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#00450d" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <Text style={styles.serviceType}>{service.serviceType ?? "Maintenance"}</Text>
            <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Step progress */}
          <View style={styles.stepper}>
            {STEPS.map((label, i) => {
              const filled = (i + 1) * (4 / STEPS.length) <= step;
              const isLast = i === STEPS.length - 1;
              return (
                <View key={label} style={styles.stepItem}>
                  <View style={[styles.stepDot, filled && styles.stepDotFilled]}>
                    {filled && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                  {!isLast && (
                    <View style={[styles.stepLine, filled && styles.stepLineFilled]} />
                  )}
                  <Text style={[styles.stepLabel, filled && styles.stepLabelFilled]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Technician */}
        {service.staff ? (
          <View style={styles.techCard}>
            <View style={styles.techAvatar}>
              <Text style={styles.techAvatarText}>{service.staff.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.techName}>{service.staff.name}</Text>
              <Text style={styles.techRole}>Lead Technician</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "#dcfce7" }]}>
              <Text style={[styles.badgeText, { color: "#00450d" }]}>ASSIGNED</Text>
            </View>
          </View>
        ) : (
          <View style={styles.techCard}>
            <View style={[styles.techAvatar, { backgroundColor: "#f3f4f6" }]}>
              <Ionicons name="person-outline" size={18} color="#9ca3af" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.techName}>Pending Assignment</Text>
              <Text style={styles.techRole}>Technician will be assigned shortly</Text>
            </View>
          </View>
        )}

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          {service.scheduledDate ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="calendar-outline" size={14} color="#00450d" /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Scheduled Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(service.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          ) : null}
          {service.completedAt ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="checkmark-circle-outline" size={14} color="#00450d" /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Completed</Text>
                <Text style={styles.infoValue}>
                  {new Date(service.completedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          ) : null}
          {service.notes ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="document-text-outline" size={14} color="#00450d" /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{service.notes}</Text>
              </View>
            </View>
          ) : null}
          {service.remarks ? (
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={styles.infoIcon}><Ionicons name="chatbubble-outline" size={14} color="#00450d" /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Technician Remarks</Text>
                <Text style={styles.infoValue}>{service.remarks}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Photos */}
        {(service.preServiceImage || service.postServiceImage) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Site Documentation</Text>
            <View style={styles.photoRow}>
              {service.preServiceImage ? (
                <View style={styles.photoBlock}>
                  <Text style={styles.photoLabel}>BEFORE</Text>
                  <Image source={{ uri: service.preServiceImage }} style={styles.photo} resizeMode="cover" />
                </View>
              ) : null}
              {service.postServiceImage ? (
                <View style={styles.photoBlock}>
                  <Text style={styles.photoLabel}>AFTER</Text>
                  <Image source={{ uri: service.postServiceImage }} style={styles.photo} resizeMode="cover" />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* PDF Report */}
        {service.status === "completed" ? (
          <TouchableOpacity style={styles.reportBtn} onPress={downloadReport} activeOpacity={0.85}>
            <Ionicons name="document-outline" size={18} color="#fff" />
            <Text style={styles.reportBtnText}>Download PDF Report</Text>
          </TouchableOpacity>
        ) : null}

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  statusCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 16,
  },
  statusTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  serviceType: { fontSize: 18, fontWeight: "800", color: "#111827", flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },

  stepper: { flexDirection: "row", alignItems: "flex-start" },
  stepItem: { flex: 1, alignItems: "center", gap: 5 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center",
  },
  stepDotFilled: { backgroundColor: "#00450d", borderColor: "#00450d" },
  stepLine: { position: "absolute", top: 10, left: "50%", right: "-50%", height: 2, backgroundColor: "#e5e7eb" },
  stepLineFilled: { backgroundColor: "#00450d" },
  stepLabel: { fontSize: 9, color: "#9ca3af", fontWeight: "600", textAlign: "center" },
  stepLabelFilled: { color: "#00450d" },

  techCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "#f0f0f0",
  },
  techAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#00450d",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  techAvatarText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  techName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  techRole: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  section: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 0,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 12 },

  infoRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f4f4f5",
  },
  infoRowLast: {},
  infoIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#f0fdf4", justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  infoContent: { flex: 1, paddingTop: 1 },
  infoLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500", marginTop: 2 },

  photoRow: { flexDirection: "row", gap: 10 },
  photoBlock: { flex: 1, gap: 6 },
  photoLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  photo: { width: "100%", height: 160, borderRadius: 10 },

  reportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  reportBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
