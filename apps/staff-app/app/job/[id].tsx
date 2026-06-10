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
  Linking,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetService, useUpdateService, useListStaff, useGetMe } from "@workspace/api-client-react";
import { uploadFile } from "@workspace/api-client-react";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { getToken } from "../../src/lib/auth";
import { API_BASE_URL } from "../../src/lib/constants";
import { ErrorState } from "../../src/components/ErrorState";
import { useState } from "react";

const STATUS_SEQUENCE = ["pending", "in_progress", "completed"] as const;
type Status = (typeof STATUS_SEQUENCE)[number];

// Visual-only 4-step mapping (en_route is a display step, not a DB status)
const STEPS = [
  { label: "Scheduled",   short: "Scheduled" },
  { label: "En Route",    short: "En Route" },
  { label: "In Progress", short: "In Progress" },
  { label: "Completed",   short: "Completed" },
];

function getVisualStep(status: string): number {
  if (status === "completed") return 4;
  if (status === "in_progress") return 2; // active on step index 2
  return 0; // pending = active on step 0
}

function isStepDone(stepIdx: number, activeStep: number): boolean {
  return stepIdx < activeStep;
}
function isStepActive(stepIdx: number, activeStep: number): boolean {
  return stepIdx === activeStep;
}

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

  const advanceStatus = (targetStatus: "in_progress" | "completed") => {
    if (!job) return;
    const labels: Record<string, string> = {
      in_progress: "Start Job",
      completed: "Complete Job",
    };
    Alert.alert(
      labels[targetStatus],
      `Mark this job as "${targetStatus.replace("_", " ")}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            update.mutate(
              { id: jobId, data: { status: targetStatus } },
              { onSuccess: () => refetch() }
            ),
        },
      ]
    );
  };

  const pickAndUpload = async (field: "preServiceImage" | "postServiceImage") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission required", "Please enable camera access in Settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const file = { uri: asset.uri, name: asset.fileName ?? "photo.jpg", type: asset.mimeType ?? "image/jpeg" } as unknown as File;
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
    if (!token) { Alert.alert("Not logged in"); return; }
    const url = `${API_BASE_URL}/api/services/${jobId}/report?token=${encodeURIComponent(token)}`;
    Linking.openURL(url).catch(() => Alert.alert("Cannot open report", "No app available to open PDF files."));
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError || !job) return <ErrorState onRetry={refetch} />;

  const activeStep = getVisualStep(job.status);
  const canAdvance = job.status === "pending" || job.status === "in_progress";
  const capturedCount = (job.preServiceImage ? 1 : 0) + (job.postServiceImage ? 1 : 0);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: `Job #GV-${String(jobId).padStart(4, "0")}`,
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#111827",
          headerTitleStyle: { fontWeight: "700", fontSize: 15 },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Service type subtitle under header */}
      {job.serviceType ? (
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>{job.serviceType.toUpperCase()}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 4-Step Progress Bar */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Job Status</Text>
          <View style={styles.stepper}>
            {STEPS.map((step, idx) => {
              const done   = isStepDone(idx, activeStep);
              const active = isStepActive(idx, activeStep);
              return (
                <View key={step.label} style={styles.stepItem}>
                  <View style={styles.stepTrack}>
                    {idx > 0 && (
                      <View style={[styles.stepLine, done && styles.stepLineFilled, active && styles.stepLinePartial]} />
                    )}
                    <View style={[styles.stepCircle, done && styles.stepCircleDone, active && styles.stepCircleActive]}>
                      {done
                        ? <Ionicons name="checkmark" size={11} color="#fff" />
                        : <View style={[styles.stepInnerDot, active && styles.stepInnerDotActive]} />
                      }
                    </View>
                  </View>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone, active && styles.stepLabelActive]}>
                    {step.short}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CUSTOMER</Text>
          <Text style={styles.customerName}>{job.customer?.name ?? "—"}</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => job.customer?.phone && Linking.openURL(`tel:${job.customer.phone}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={15} color="#374151" />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => job.customer?.phone && Linking.openURL(`sms:${job.customer.phone}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={15} color="#374151" />
              <Text style={styles.contactBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LOCATION</Text>
          <Text style={styles.locationText}>{job.customer?.address ?? "—"}</Text>
          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={() => {
              if (job.customer?.address) {
                const encoded = encodeURIComponent(job.customer.address);
                Linking.openURL(`https://maps.google.com/?q=${encoded}`);
              }
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate-outline" size={16} color="#fff" />
            <Text style={styles.navigateBtnText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Service Overview */}
        {job.serviceType ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>SERVICE OVERVIEW</Text>
            <View style={styles.serviceRow}>
              <View style={styles.serviceIconBox}>
                <Ionicons name="flash-outline" size={18} color="#00450d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>{job.serviceType}</Text>
                {job.notes ? <Text style={styles.serviceNotes}>{job.notes}</Text> : null}
              </View>
            </View>
            {job.scheduledDate ? (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                <Text style={styles.metaText}>
                  {new Date(job.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Site Documentation */}
        <View style={styles.card}>
          <View style={styles.docHeader}>
            <Text style={styles.cardLabel}>Site Documentation</Text>
            <Text style={styles.docCount}>{capturedCount}/2 Captured</Text>
          </View>
          <View style={styles.photoRow}>
            <PhotoSlot label="Before Service" uri={job.preServiceImage ?? null} onCapture={() => pickAndUpload("preServiceImage")} />
            <PhotoSlot label="After Service"  uri={job.postServiceImage ?? null} onCapture={() => pickAndUpload("postServiceImage")} />
          </View>
        </View>

        {/* Remarks */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Technician Remarks</Text>
          <TextInput
            style={styles.remarksInput}
            placeholder="Enter findings, parts used, or client notes..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={currentRemarks}
            onChangeText={setRemarksText}
            textAlignVertical="top"
          />
          {remarksText !== null && remarksText !== (job.remarks ?? "") && (
            <TouchableOpacity
              style={[styles.saveBtn, savingRemarks && styles.btnDisabled]}
              onPress={saveRemarks}
              disabled={savingRemarks}
            >
              {savingRemarks
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Save Remarks</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Report */}
        <TouchableOpacity style={styles.reportBtn} onPress={openReport} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={18} color="#374151" />
          <Text style={styles.reportBtnText}>Generate Preliminary Report</Text>
        </TouchableOpacity>

        {/* Admin: Reassign */}
        {isAdmin && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Reassign Technician</Text>
            <Text style={styles.currentStaff}>Current: {job.staff?.name ?? "Unassigned"}</Text>
            <View style={{ gap: 8, marginTop: 10 }}>
              {(staffList?.data ?? []).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.reassignItem, job.staffId === s.id && styles.reassignItemActive]}
                  onPress={() => {
                    if (job.staffId === s.id) return;
                    Alert.alert("Reassign", `Assign to ${s.name}?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Assign", onPress: () => update.mutate({ id: jobId, data: { staffId: s.id } }, { onSuccess: () => refetch() }) },
                    ]);
                  }}
                >
                  <Text style={[styles.reassignName, job.staffId === s.id && { color: "#00450d" }]}>{s.name}</Text>
                  {job.staffId === s.id && <Ionicons name="checkmark-circle" size={16} color="#00450d" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: canAdvance ? 90 : 16 }} />
      </ScrollView>

      {/* Sticky bottom CTAs */}
      {canAdvance && (
        <View style={styles.stickyBar}>
          {job.status === "in_progress" ? (
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={() => advanceStatus("pending" as any)}
              activeOpacity={0.85}
              disabled={update.isPending}
            >
              <Ionicons name="pause-outline" size={18} color="#374151" />
              <Text style={styles.pauseBtnText}>Pause Job</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.completeBtn, update.isPending && styles.btnDisabled, job.status === "pending" && { flex: 1 }]}
            onPress={() => advanceStatus(job.status === "pending" ? "in_progress" : "completed")}
            activeOpacity={0.9}
            disabled={update.isPending}
          >
            {update.isPending
              ? <ActivityIndicator color="#00450d" />
              : <>
                  <Ionicons name={job.status === "pending" ? "play-circle-outline" : "checkmark-circle-outline"} size={20} color="#00450d" />
                  <Text style={styles.completeBtnText}>
                    {job.status === "pending" ? "Start Job" : "Complete Job"}
                  </Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function PhotoSlot({ label, uri, onCapture }: { label: string; uri: string | null; onCapture: () => void }) {
  return (
    <TouchableOpacity style={styles.photoSlot} onPress={onCapture} activeOpacity={0.8}>
      {uri ? (
        <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />
      ) : (
        <View style={styles.photoEmpty}>
          <Ionicons name="camera-add-outline" size={26} color="#9ca3af" />
        </View>
      )}
      <Text style={styles.photoLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafb" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  subHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  subHeaderText: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 1 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    gap: 10,
  },
  cardLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5, marginBottom: 2 },

  // Stepper
  stepper: { flexDirection: "row", alignItems: "flex-start" },
  stepItem: { flex: 1, alignItems: "center", gap: 6 },
  stepTrack: { flexDirection: "row", alignItems: "center", width: "100%" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#e5e7eb" },
  stepLineFilled: { backgroundColor: "#00450d" },
  stepLinePartial: { backgroundColor: "#bbf7d0" },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#e5e7eb",
  },
  stepCircleDone: { backgroundColor: "#00450d", borderColor: "#00450d" },
  stepCircleActive: { backgroundColor: "#fff", borderColor: "#00450d" },
  stepInnerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#d1d5db" },
  stepInnerDotActive: { backgroundColor: "#00450d" },
  stepLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "600", textAlign: "center" },
  stepLabelDone: { color: "#00450d" },
  stepLabelActive: { color: "#00450d", fontWeight: "700" },

  // Customer
  customerName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  contactRow: { flexDirection: "row", gap: 10 },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  contactBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },

  // Location
  locationText: { fontSize: 15, color: "#111827", fontWeight: "500", lineHeight: 22 },
  navigateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#00450d",
    borderRadius: 10,
    paddingVertical: 11,
  },
  navigateBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Service
  serviceRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  serviceIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#f0fdf4",
    justifyContent: "center", alignItems: "center",
  },
  serviceTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  serviceNotes: { fontSize: 13, color: "#6b7280", marginTop: 3, lineHeight: 19 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#6b7280" },

  // Photos
  docHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  docCount: { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
  photoRow: { flexDirection: "row", gap: 10 },
  photoSlot: { flex: 1, alignItems: "center", gap: 6 },
  photoImg: { width: "100%", height: 110, borderRadius: 10 },
  photoEmpty: {
    width: "100%", height: 110, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderStyle: "dashed",
    backgroundColor: "#fafafa",
    justifyContent: "center", alignItems: "center",
  },
  photoLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600", textAlign: "center" },

  // Remarks
  remarksInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    padding: 12, fontSize: 14, color: "#111827", minHeight: 90,
    backgroundColor: "#fafafa",
  },
  saveBtn: {
    backgroundColor: "#00450d", borderRadius: 10,
    padding: 12, alignItems: "center", marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Report
  reportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: "#e5e7eb",
    borderRadius: 12, padding: 14, backgroundColor: "#fff",
  },
  reportBtnText: { color: "#374151", fontWeight: "600", fontSize: 14 },

  // Reassign
  currentStaff: { fontSize: 13, color: "#6b7280" },
  reassignItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    padding: 12, backgroundColor: "#fafafa",
  },
  reassignItemActive: { borderColor: "#00450d", backgroundColor: "#f0fdf4" },
  reassignName: { fontSize: 14, fontWeight: "600", color: "#374151" },

  // Sticky CTAs
  stickyBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  pauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 14,
  },
  pauseBtnText: { color: "#374151", fontWeight: "700", fontSize: 14 },
  completeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#bcf200",
    borderRadius: 12,
    paddingVertical: 14,
  },
  completeBtnText: { color: "#00450d", fontWeight: "800", fontSize: 14 },
  btnDisabled: { opacity: 0.55 },
});
