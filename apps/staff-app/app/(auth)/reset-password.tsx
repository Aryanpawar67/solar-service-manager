import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

export default function ResetPasswordScreen() {
  const { token: paramToken, email } = useLocalSearchParams<{ token?: string; email?: string }>();

  const [resetToken, setResetToken] = useState(paramToken ?? "");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!resetToken.trim()) { Alert.alert("Required", "Paste your reset token"); return; }
    if (!newPwd || newPwd.length < 8) { Alert.alert("Too Short", "Password must be at least 8 characters"); return; }
    if (newPwd !== confirmPwd) { Alert.alert("Mismatch", "Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: resetToken.trim(), newPassword: newPwd }),
      });
      const text = await res.text();
      let json: { ok?: boolean; error?: string; message?: string } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) {
        Alert.alert("Error", json.error ?? `Server error (${res.status})`);
      } else {
        Alert.alert("Success", "Password reset successfully. You can now log in with your new password.", [
          { text: "Go to Login", onPress: () => router.replace("/(auth)/login") },
        ]);
      }
    } catch (e) {
      Alert.alert("Error", `Network error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Reset Password", headerStyle: { backgroundColor: "#fff" }, headerTintColor: "#00450d", headerTitleStyle: { fontWeight: "700", color: "#111827" } }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.iconBox}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#00450d" />
          </View>
          <Text style={styles.title}>Set New Password</Text>
          {email ? <Text style={styles.sub}>Resetting password for: {email}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Reset Token</Text>
            <TextInput
              style={[styles.fieldInput, styles.tokenInput]}
              value={resetToken}
              onChangeText={setResetToken}
              placeholder="Paste your reset token here"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <View style={styles.pwdRow}>
              <TextInput
                style={styles.pwdInput}
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry={!showNew}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <View style={styles.pwdRow}>
              <TextInput
                style={styles.pwdInput}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry={!showConfirm}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.requirements}>
            <Text style={styles.reqItem}>• Minimum 8 characters</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Reset Password</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.backLink}>
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
  sub: { fontSize: 13, color: "#6b7280", textAlign: "center" },
  field: { gap: 6, width: "100%" },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: "#111827", backgroundColor: "#fff",
  },
  tokenInput: { fontSize: 12, minHeight: 70, textAlignVertical: "top" },
  pwdRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, backgroundColor: "#fff",
  },
  pwdInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: "#111827" },
  eyeBtn: { paddingHorizontal: 14 },
  requirements: { backgroundColor: "#f3f4f6", borderRadius: 10, padding: 10, width: "100%" },
  reqItem: { fontSize: 12, color: "#6b7280" },
  submitBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backLink: { paddingVertical: 8 },
  backLinkText: { color: "#00450d", fontWeight: "600", fontSize: 14 },
});
