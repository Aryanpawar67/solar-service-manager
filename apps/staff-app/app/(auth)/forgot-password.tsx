import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleRequestReset = async () => {
    if (!email.trim()) { Alert.alert("Required", "Enter your email address"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const text = await res.text();
      let json: { ok?: boolean; resetToken?: string; message?: string; error?: string } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) {
        Alert.alert("Error", json.error ?? `Server error (${res.status})`);
        return;
      }
      // Show reset token (in production this would be sent via SMS/email)
      if (json.resetToken) {
        setResetToken(json.resetToken);
      } else {
        Alert.alert("Sent", "If that email exists, a reset token has been generated. Contact your administrator.");
      }
    } catch (e) {
      Alert.alert("Error", `Network error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  if (resetToken) {
    return (
      <>
        <Stack.Screen options={{ title: "Reset Password", headerStyle: { backgroundColor: "#fff" }, headerTintColor: "#00450d", headerTitleStyle: { fontWeight: "700", color: "#111827" } }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.tokenCard}>
            <View style={styles.iconBox}>
              <Ionicons name="key-outline" size={32} color="#00450d" />
            </View>
            <Text style={styles.tokenTitle}>Reset Token Generated</Text>
            <Text style={styles.tokenSub}>Copy this token and use it on the next screen to set a new password. Valid for 15 minutes.</Text>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenText} selectable>{resetToken}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.proceedBtn}
            onPress={() => router.push({ pathname: "/(auth)/reset-password", params: { token: resetToken, email } })}
            activeOpacity={0.85}
          >
            <Text style={styles.proceedBtnText}>Continue to Reset Password</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Forgot Password", headerStyle: { backgroundColor: "#fff" }, headerTintColor: "#00450d", headerTitleStyle: { fontWeight: "700", color: "#111827" } }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.iconBox}>
            <Ionicons name="lock-open-outline" size={32} color="#00450d" />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.sub}>Enter your registered email address. We'll generate a reset token you can use to set a new password.</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.fieldInput}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRequestReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#00450d" />
              : <Text style={styles.submitBtnText}>Generate Reset Token</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 24, gap: 16, paddingTop: 32, alignItems: "center" },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "#f0fdf4", justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center" },
  sub: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20, maxWidth: 320 },
  field: { gap: 6, width: "100%" },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: "#111827", backgroundColor: "#fff",
  },
  submitBtn: {
    width: "100%", backgroundColor: "#bcf200", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#00450d", fontWeight: "800", fontSize: 15 },
  backLink: { paddingVertical: 8 },
  backLinkText: { color: "#00450d", fontWeight: "600", fontSize: 14 },
  tokenCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 12, width: "100%", alignItems: "center",
  },
  tokenTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  tokenSub: { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 19 },
  tokenBox: {
    backgroundColor: "#f0fdf4", borderRadius: 10, padding: 14, width: "100%",
    borderWidth: 1, borderColor: "#bbf7d0",
  },
  tokenText: { fontSize: 11, color: "#00450d", fontFamily: "monospace" },
  proceedBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  proceedBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
