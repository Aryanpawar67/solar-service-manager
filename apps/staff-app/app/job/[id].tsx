import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetService, useUpdateService, useListStaff, useGetMe } from "@workspace/api-client-react";
import { uploadFile } from "@workspace/api-client-react";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../../src/lib/auth";
import { API_BASE_URL } from "../../src/lib/constants";
import { ErrorState } from "../../src/components/ErrorState";
import { useState } from "react";

const STATUS_SEQUENCE = ["pending", "in_progress", "completed"] as const;
type Status = (typeof STATUS_SEQUENCE)[number];

const STEP_CONFIG = [
  { key: "pending",     label: "Pending",     short: "Pending" },
  { key: "in_progress", label: "In Progress", short: "In Prog." },
  { key: "completed",   label: "Completed",   short: "Done" },
];

const STATUS_COLOR: Record<string, string> = {
  pending:     "#d97706",
  in_progress: "#2563eb",
  completed:   "#16a34a",
  cancelled:   "#6b7280",
};

const STATUS_BG: Record<string, string> = {
  pending:     "#fef3c7",
  in_progress: "#dbeafe",
  completed:   "#dcfce7",
  cancelled:   "#f3f4f6",
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Number(id);

  const { data: job, isLoading, isError, refetch } = useGetService(jobId);
  const update = useUpdateService();
  const { data: meData } = useGetMe();
  const isAdmin = meData?.user?.role === "admin";
  const { data: staffList } = useListStaff({ available: true });

  const [remarksText, setRemarksText] = useState<string | null>(null);
  const [savingRemarks, setSavingRemarks] = useState(false);

  const currentRemarks = remarksText ?? job?.remarks ?? "";

  const advanceStatus = () => {
    if (!job) return;
    const current = job.status as Status;
    const idx = STATUS_SEQUENCE.indexOf(current);
    if (idx === -1 || idx === STATUS_SEQUENCE.length - 1) return;
    const next = STATUS_SEQUENCE[idx + 1];
    const labels: Record<string, string> = {
      in_progress: "Start Job",
      completed: "Mark as Completed",
    };
    Alert.alert(
      labels[next] ?? "Update Status",
      `Are you sure you want to mark this job as "${next.replace("_", " ")}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            update.mutate(
              { id: jobId, data: { status: next } },
              { onSuccess: () => refetch() }
            ),
        },
      ]
    );
  };

  const pickAndUpload = async (field: "preServiceImage" | "postServiceImage") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission required", "Please enable camera access in Settings to upload photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const file = {
      uri: asset.uri,
      name: asset.fileName ?? "photo.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as unknown as File;
    try {
      const { url } = await uploadFile(file);
      await update.mutateAsync({ id: jobId, data: { [field]: url } });
      refetch();
    } catch {
      Alert.alert("Upload failed", "Please try again.");
    }
  };

  const saveRemarks = async () => {
    if (remarksText === null) return;
    setSavingRemarks(true);
    try {
      await update.mutateAsync({ id: jobId, data: { remarks: remarksText } });
      refetch();
    } catch {
      Alert.alert("Save failed", "Could not save remarks. Please try again.");
    } finally {
      setSavingRemarks(false);
    }
  };

  const openReport = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }
    const url = `${API_BASE_URL}/api/services/${jobId}/report?token=${encodeURIComponent(token)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Cannot open report", "No app available to open PDF files.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (isError || !job) {
    return <ErrorState onRetry={refetch} />;
  }

  const canAdvance = job.status === "pending" || job.status === "in_progress";
  const currentIdx = STATUS_SEQUENCE.indexOf(job.status as Status);

  return (
    <>
      <Stack.Screen
        options={{
          title: job.customer?.name ?? "Job Detail",
          headerStyle: { backgroundColor: "#16a34a" },
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

        {/* Step Progress */}
        <View style={styles.stepperCard}>
          <View style={styles.stepper}>
            {STEP_CONFIG.map((step, idx) => {
              const isDone = idx < currentIdx;
              const isActive = idx === currentIdx;
              return (
                <View key={step.key} style={styles.stepperItem}>
                  <View style={styles.stepperRow}>
                    {idx > 0 && (
                      <View style={[styles.stepLine, isDone && styles.stepLineDone, isActive && styles.stepLineActive]} />
                    )}
                    <View style={[
                      styles.stepCircle,
                      isDone && styles.stepCircleDone,
                      isActive && styles.stepCircleActive,
                    ]}>
                      {isDone
                        ? <Ionicons name="checkmark" size={13} color="#fff" />
                        : <View style={[styles.stepDot, isActive && styles.stepDotActive]} />
                      }
                    </View>
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    isDone && styles.stepLabelDone,
                    isActive && styles.stepLabelActive,
                  ]}>{step.short}</Text>
                </View>
              );
            })}
          </View>
          <View style={[styles.statusPill, { backgroundColor: STATUS_BG[job.status] ?? "#f3f4f6" }]}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[job.status] ?? "#6b7280" }]} />
            <Text style={[styles.statusPillText, { color: STATUS_COLOR[job.status] ?? "#6b7280" }]}>
              {job.status.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Job Info */}
        <View style={styles.card}>
          <SectionHeader icon="information-circle-outline" title="Job Details" />
          <InfoRow label="Customer" value={job.customer?.name ?? "—"} />
          <InfoRow label="Address" value={job.customer?.address ?? "—"} />
          <InfoRow
            label="Scheduled"
            value={
              job.scheduledDate
                ? new Date(job.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })
                : "—"
            }
          />
          {job.serviceType && <InfoRow label="Type" value={job.serviceType} />}
          {job.notes && <InfoRow label="Notes" value={job.notes} last />}
        </View>

        {/* Photos */}
        <View style={styles.card}>
          <SectionHeader icon="camera-outline" title="Service Photos" />
          <PhotoSlot
            label="Before Service"
            uri={job.preServiceImage ?? null}
            onCapture={() => pickAndUpload("preServiceImage")}
          />
          <PhotoSlot
            label="After Service"
            uri={job.postServiceImage ?? null}
            onCapture={() => pickAndUpload("postServiceImage")}
          />
        </View>

        {/* Remarks */}
        <View style={styles.card}>
          <SectionHeader icon="create-outline" title="Post-Service Remarks" />
          <TextInput
            style={styles.remarksInput}
            placeholder="Add remarks about the service…"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={currentRemarks}
            onChangeText={setRemarksText}
            textAlignVertical="top"
          />
          {remarksText !== null && remarksText !== (job.remarks ?? "") && (
            <TouchableOpacity
              style={[styles.saveRemarksBtn, savingRemarks && styles.btnDisabled]}
              onPress={saveRemarks}
              disabled={savingRemarks}
            >
              {savingRemarks ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={styles.saveRemarksBtnText}>Save Remarks</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* PDF Report */}
        <TouchableOpacity style={styles.reportButton} onPress={openReport} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={20} color="#16a34a" />
          <Text style={styles.reportButtonText}>Download Service Report (PDF)</Text>
        </TouchableOpacity>

        {/* Admin: Reassign */}
        {isAdmin && (
          <View style={styles.card}>
            <SectionHeader icon="people-outline" title="Reassign Technician" />
            <Text style={styles.currentStaff}>
              Current: {job.staff?.name ?? "Unassigned"}
            </Text>
            <View style={{ gap: 8, marginTop: 10 }}>
              {(staffList?.data ?? []).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.reassignBtn, job.staffId === s.id && styles.reassignBtnActive]}
                  onPress={() => {
                    if (job.staffId === s.id) return;
                    Alert.alert("Reassign", `Assign this job to ${s.name}?`, [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Assign",
                        onPress: () =>
                          update.mutate({ id: jobId, data: { staffId: s.id } }, { onSuccess: () => refetch() }),
                      },
                    ]);
                  }}
                >
                  <View style={styles.reassignRow}>
                    <Text style={[styles.reassignName, job.staffId === s.id && styles.reassignNameActive]}>
                      {s.name}
                    </Text>
                    {job.staffId === s.id && <Ionicons name="checkmark-circle" size={16} color="#16a34a" />}
                  </View>
                  <Text style={styles.reassignRole}>{s.role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* CTA Button */}
        {canAdvance && (
          <TouchableOpacity
            style={[styles.ctaButton, update.isPending && styles.btnDisabled]}
            onPress={advanceStatus}
            disabled={update.isPending}
            activeOpacity={0.85}
          >
            {update.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={job.status === "pending" ? "play-circle-outline" : "checkmark-circle-outline"}
                  size={22}
                  color="#fff"
                />
                <Text style={styles.ctaButtonText}>
                  {job.status === "pending" ? "Start Job" : "Mark as Completed"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color="#16a34a" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PhotoSlot({
  label,
  uri,
  onCapture,
}: {
  label: string;
  uri: string | null;
  onCapture: () => void;
}) {
  return (
    <View style={styles.photoSlot}>
      <Text style={styles.photoLabel}>{label}</Text>
      {uri ? (
        <TouchableOpacity onPress={onCapture} activeOpacity={0.9}>
          <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
          <View style={styles.photoRetakeOverlay}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.photoRetakeText}>Tap to retake</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.photoPlaceholder} onPress={onCapture} activeOpacity={0.8}>
          <View style={styles.photoPlaceholderIcon}>
            <Ionicons name="camera-outline" size={32} color="#9ca3af" />
          </View>
          <Text style={styles.photoPlaceholderText}>Tap to capture photo</Text>
          <Text style={styles.photoPlaceholderSub}>Required for service report</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Stepper
  stepperCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
    alignItems: "center",
  },
  stepper: { flexDirection: "row", alignItems: "flex-start", width: "100%", paddingHorizontal: 4 },
  stepperItem: { flex: 1, alignItems: "center", gap: 6 },
  stepperRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#e5e7eb" },
  stepLineDone: { backgroundColor: "#16a34a" },
  stepLineActive: { backgroundColor: "#bbf7d0" },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  stepCircleDone: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  stepCircleActive: { backgroundColor: "#fff", borderColor: "#16a34a" },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#d1d5db" },
  stepDotActive: { backgroundColor: "#16a34a" },
  stepLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textAlign: "center" },
  stepLabelDone: { color: "#16a34a" },
  stepLabelActive: { color: "#16a34a", fontWeight: "700" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    gap: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  infoRow: { flexDirection: "row", paddingVertical: 10, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  infoLabel: { fontSize: 13, color: "#9ca3af", width: 90, fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#111827", flex: 1, fontWeight: "500" },

  // Photos
  photoSlot: { marginBottom: 14 },
  photoLabel: { fontSize: 13, color: "#6b7280", fontWeight: "600", marginBottom: 8 },
  photo: { width: "100%", height: 200, borderRadius: 12 },
  photoRetakeOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoRetakeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  photoPlaceholder: {
    height: 130,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    gap: 4,
  },
  photoPlaceholderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  photoPlaceholderText: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  photoPlaceholderSub: { fontSize: 11, color: "#9ca3af" },

  // Remarks
  remarksInput: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
    backgroundColor: "#fafafa",
  },
  saveRemarksBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  saveRemarksBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Report
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#16a34a",
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#f0fdf4",
  },
  reportButtonText: { color: "#16a34a", fontWeight: "700", fontSize: 15 },

  // Reassign
  currentStaff: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  reassignBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  reassignBtnActive: { borderColor: "#16a34a", backgroundColor: "#f0fdf4" },
  reassignRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reassignName: { fontSize: 14, fontWeight: "600", color: "#374151" },
  reassignNameActive: { color: "#16a34a" },
  reassignRole: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  // CTA
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 18,
    shadowColor: "#16a34a",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});
