import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useGetService, useUpdateService } from "@workspace/api-client-react";
import { uploadFile } from "@workspace/api-client-react";
import * as ImagePicker from "expo-image-picker";

const STATUS_SEQUENCE = ["pending", "in_progress", "completed"] as const;
type Status = (typeof STATUS_SEQUENCE)[number];

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Number(id);

  const { data: job, isLoading, refetch } = useGetService(jobId);
  const update = useUpdateService();

  const advanceStatus = () => {
    if (!job) return;
    const current = job.status as Status;
    const idx = STATUS_SEQUENCE.indexOf(current);
    if (idx === -1 || idx === STATUS_SEQUENCE.length - 1) return;
    const next = STATUS_SEQUENCE[idx + 1];

    Alert.alert(
      "Update Status",
      `Mark this job as "${next.replace("_", " ")}"?`,
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
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
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

  if (isLoading || !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const canAdvance =
    job.status === "pending" || job.status === "in_progress";

  return (
    <>
      <Stack.Screen
        options={{
          title: job.customer?.name ?? "Job Detail",
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
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.status, { color: statusColor(job.status) }]}>
            {job.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Row label="Customer" value={job.customer?.name ?? "—"} />
          <Row label="Address" value={job.customer?.address ?? "—"} />
          <Row
            label="Scheduled"
            value={
              job.scheduledDate
                ? new Date(job.scheduledDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"
            }
          />
          <Row label="Notes" value={job.notes ?? "—"} />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
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

        {/* Action */}
        {canAdvance && (
          <TouchableOpacity
            style={[styles.button, update.isPending && styles.buttonDisabled]}
            onPress={advanceStatus}
            disabled={update.isPending}
          >
            {update.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {job.status === "pending" ? "Start Job" : "Mark Complete"}
              </Text>
            )}
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
        <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
      ) : (
        <TouchableOpacity style={styles.photoPlaceholder} onPress={onCapture}>
          <Text style={styles.photoPlaceholderText}>Tap to capture</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    pending: "#f59e0b",
    in_progress: "#3b82f6",
    completed: "#16a34a",
    cancelled: "#6b7280",
  };
  return map[status] ?? "#111827";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#374151", marginBottom: 12 },
  label: { fontSize: 12, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase" },
  status: { fontSize: 20, fontWeight: "700" },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 100 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  photoSlot: { marginBottom: 12 },
  photoLabel: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  photo: { width: "100%", height: 180, borderRadius: 10 },
  photoPlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  photoPlaceholderText: { color: "#9ca3af", fontSize: 14 },
  button: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
