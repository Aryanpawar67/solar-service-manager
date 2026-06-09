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
import { useGetMyServices } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { FadeInView } from "@/components/FadeInView";

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  pending:     { color: "#d97706", bg: "#fef3c7", border: "#f59e0b" },
  in_progress: { color: "#2563eb", bg: "#dbeafe", border: "#3b82f6" },
  completed:   { color: "#16a34a", bg: "#dcfce7", border: "#16a34a" },
  cancelled:   { color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
};

export default function CustomerServicesScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useGetMyServices({ limit: 50 });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  const serviceList = data?.data ?? [];

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.content, serviceList.length === 0 && styles.contentEmpty]}
      data={serviceList}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" colors={["#16a34a"]} />
      }
      ListHeaderComponent={
        serviceList.length > 0 ? (
          <Text style={styles.listMeta}>{serviceList.length} service{serviceList.length !== 1 ? "s" : ""}</Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="construct-outline" size={52} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No service history</Text>
          <Text style={styles.emptyText}>Your completed and upcoming services will appear here.</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.cancelled;
        return (
          <FadeInView delay={Math.min(index * 80, 560)}>
          <Pressable
            android_ripple={{ color: "#16a34a18" }}
            style={({ pressed }) => [
              styles.card,
              { borderLeftColor: cfg.border },
              Platform.OS === "ios" && pressed && { opacity: 0.75 },
            ]}
            onPress={() => router.push(`/(customer)/services/${item.id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.serviceType}>{item.serviceType ?? "Maintenance"}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>
                  {item.status.replace("_", " ")}
                </Text>
              </View>
            </View>
            {item.scheduledDate ? (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                <Text style={styles.metaText}>
                  {new Date(item.scheduledDate + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "short", day: "numeric", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
            ) : null}
            {item.staff ? (
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={13} color="#9ca3af" />
                <Text style={[styles.metaText, { color: "#3b82f6", fontWeight: "600" }]}>{item.staff.name}</Text>
              </View>
            ) : null}
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
  content: { padding: 16, gap: 10, paddingBottom: 24 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  listMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    overflow: "hidden",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  serviceType: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#9ca3af" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f9fafb",
  },
  tapHint: { fontSize: 11, color: "#d1d5db", fontStyle: "italic" },
});
