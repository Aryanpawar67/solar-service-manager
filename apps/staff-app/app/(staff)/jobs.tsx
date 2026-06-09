import {
  View,
  Text,
  FlatList,
  Pressable,
  Platform,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useListServices, useGetMe } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { FadeInView } from "@/components/FadeInView";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7", label: "Pending" },
  in_progress: { color: "#2563eb", bg: "#dbeafe", label: "In Progress" },
  completed:   { color: "#16a34a", bg: "#dcfce7", label: "Completed" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6", label: "Cancelled" },
};

const STATUS_BORDER: Record<string, string> = {
  pending:     "#f59e0b",
  in_progress: "#3b82f6",
  completed:   "#16a34a",
  cancelled:   "#d1d5db",
};

export default function JobsScreen() {
  const { data: meData, isLoading: meLoading, isError: meError } = useGetMe();
  const staffId = meData?.user?.staffId;

  const { data, isLoading, isError, refetch, isRefetching } = useListServices(
    staffId != null ? { staffId } : {}
  );

  if (meLoading || (isLoading && meData != null)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (meError || isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (staffId == null) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-remove-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyTitle}>Account not linked</Text>
        <Text style={styles.emptyText}>Ask an admin to link your account to a staff profile.</Text>
      </View>
    );
  }

  const jobs = data?.data ?? [];

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.content, jobs.length === 0 && styles.contentEmpty]}
      data={jobs}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />
      }
      ListHeaderComponent={
        jobs.length > 0 ? (
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>{jobs.length} job{jobs.length !== 1 ? "s" : ""} assigned</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="briefcase-outline" size={52} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No jobs assigned</Text>
          <Text style={styles.emptyText}>You have no jobs assigned at the moment.</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.cancelled;
        const borderColor = STATUS_BORDER[item.status] ?? "#d1d5db";
        return (
          <FadeInView delay={Math.min(index * 80, 560)}>
          <Pressable
            android_ripple={{ color: "#16a34a18" }}
            style={({ pressed }) => [
              styles.card,
              { borderLeftColor: borderColor },
              Platform.OS === "ios" && pressed && { opacity: 0.75 },
            ]}
            onPress={() => router.push(`/job/${item.id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.customerName} numberOfLines={1}>{item.customer?.name ?? "—"}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>

            {item.serviceType && (
              <Text style={styles.serviceType}>{item.serviceType}</Text>
            )}

            <View style={styles.cardMeta}>
              {item.customer?.address ? (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.customer.address}</Text>
                </View>
              ) : null}
              {item.scheduledDate ? (
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>
                    {new Date(item.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.tapHint}>Tap to view details</Text>
              <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
            </View>
          </Pressable>
          </FadeInView>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151", textAlign: "center" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
  listHeader: { marginBottom: 4 },
  listHeaderText: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    overflow: "hidden",
    borderLeftWidth: 4,
    borderLeftColor: "#d1d5db",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  customerName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  serviceType: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  cardMeta: { gap: 4, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#9ca3af", flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f9fafb" },
  tapHint: { fontSize: 11, color: "#d1d5db", fontStyle: "italic" },
});
