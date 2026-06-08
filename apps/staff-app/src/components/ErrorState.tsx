import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{message ?? "Something went wrong."}</Text>
      <TouchableOpacity style={styles.btn} onPress={onRetry}>
        <Text style={styles.btnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  text: { color: "#6b7280", fontSize: 15, textAlign: "center", marginBottom: 16 },
  btn: { backgroundColor: "#16a34a", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
