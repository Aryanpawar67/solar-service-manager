import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";

export default function SecurityScreen() {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = async () => {
    if (!current) { Alert.alert("Required", "Enter your current password"); return; }
    if (!newPwd) { Alert.alert("Required", "Enter a new password"); return; }
    if (newPwd.length < 8) { Alert.alert("Too Short", "New password must be at least 8 characters"); return; }
    if (newPwd !== confirm) { Alert.alert("Mismatch", "New passwords do not match"); return; }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) { Alert.alert("Error", "Not authenticated. Please log in again."); return; }
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: newPwd }),
      });
      const text = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      try { data = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) {
        Alert.alert("Error", data.error ?? `Server error (${res.status})`);
      } else {
        Alert.alert("Success", "Password changed successfully", [
          { text: "OK", onPress: () => router.back() },
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
      <Stack.Screen
        options={{
          title: "Security & Password",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#00450d",
          headerTitleStyle: { fontWeight: "700", color: "#111827" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#00450d" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>

            <PwdField label="Current Password" value={current} onChange={setCurrent} show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
            <PwdField label="New Password" value={newPwd} onChange={setNewPwd} show={showNew} toggle={() => setShowNew(!showNew)} />
            <PwdField label="Confirm New Password" value={confirm} onChange={setConfirm} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />

            <View style={styles.requirements}>
              <Text style={styles.reqTitle}>Password requirements:</Text>
              <Text style={styles.reqItem}>• Minimum 8 characters</Text>
              <Text style={styles.reqItem}>• Use a mix of letters and numbers</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleChange}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Update Password</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function PwdField({ label, value, onChange, show, toggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pwdRow}>
        <TextInput
          style={styles.pwdInput}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity onPress={toggle} style={styles.eyeBtn}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  section: { backgroundColor: "#fff", borderRadius: 16, padding: 18, gap: 14, borderWidth: 1, borderColor: "#f0f0f0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  pwdRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#fafafa",
  },
  pwdInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#111827" },
  eyeBtn: { paddingHorizontal: 12 },
  requirements: { backgroundColor: "#f8fafb", borderRadius: 10, padding: 12, gap: 4 },
  reqTitle: { fontSize: 12, fontWeight: "600", color: "#374151" },
  reqItem: { fontSize: 12, color: "#6b7280" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
