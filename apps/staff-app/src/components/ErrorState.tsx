import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <View style={styles.iconBox}>
        <Ionicons name="cloud-offline-outline" size={36} color="#9ca3af" />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.text}>{message ?? "We couldn't load this data. Check your connection and try again."}</Text>
      <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.8}>
        <Ionicons name="refresh-outline" size={16} color="#fff" />
        <Text style={styles.btnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 12 },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#374151" },
  text: { color: "#9ca3af", fontSize: 13, textAlign: "center", lineHeight: 20 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
