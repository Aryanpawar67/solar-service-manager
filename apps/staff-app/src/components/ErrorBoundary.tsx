import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";

interface Props { children: React.ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    Sentry.captureException(error);
  }

  retry = () => this.setState({ hasError: false, message: "" });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="warning-outline" size={32} color="#d97706" />
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{this.state.message}</Text>
        <TouchableOpacity style={styles.btn} onPress={this.retry} activeOpacity={0.85}>
          <Ionicons name="refresh-outline" size={15} color="#fff" />
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", alignItems: "center",
    padding: 40, backgroundColor: "#f8fafb", gap: 10,
  },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "#fffbeb",
    justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#374151" },
  message: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
  btn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#00450d", borderRadius: 12,
    paddingHorizontal: 28, paddingVertical: 13,
    marginTop: 6,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
