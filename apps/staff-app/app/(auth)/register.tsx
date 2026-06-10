import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/constants";
import { setToken } from "@/lib/auth";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) { Alert.alert("Required", "Full name is required"); return; }
    if (!email.trim()) { Alert.alert("Required", "Email is required"); return; }
    if (!phone.trim()) { Alert.alert("Required", "Phone number is required"); return; }
    if (!password || password.length < 8) { Alert.alert("Too Short", "Password must be at least 8 characters"); return; }
    if (password !== confirmPwd) { Alert.alert("Mismatch", "Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: address.trim() || undefined,
          password,
        }),
      });
      const text = await res.text();
      let json: { token?: string; user?: { role?: string }; error?: string } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) {
        Alert.alert("Error", json.error ?? `Server error (${res.status})`);
        return;
      }
      if (json.token) {
        await setToken(json.token);
        router.replace("/(customer)");
      }
    } catch (e) {
      Alert.alert("Error", `Network error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Create Account", headerStyle: { backgroundColor: "#fff" }, headerTintColor: "#00450d", headerTitleStyle: { fontWeight: "700", color: "#111827" } }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="flash" size={24} color="#00450d" />
            </View>
            <Text style={styles.title}>Create Customer Account</Text>
            <Text style={styles.sub}>For staff and admin accounts, contact your administrator.</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#9ca3af" />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email Address *</Text>
              <TextInput style={styles.fieldInput} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <TextInput style={styles.fieldInput} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={address}
                onChangeText={setAddress}
                placeholder="Your installation address"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password *</Text>
              <View style={styles.pwdRow}>
                <TextInput style={styles.pwdInput} value={password} onChangeText={setPassword} secureTextEntry={!showPwd} placeholder="Min. 8 characters" placeholderTextColor="#9ca3af" />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                  <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Confirm Password *</Text>
              <View style={styles.pwdRow}>
                <TextInput style={styles.pwdInput} value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry={!showConfirm} placeholder="••••••••" placeholderTextColor="#9ca3af" />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Create Account</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  header: { alignItems: "center", gap: 8, paddingVertical: 16 },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center" },
  sub: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 18, maxWidth: 300 },
  section: { backgroundColor: "#fff", borderRadius: 16, padding: 18, gap: 14, borderWidth: 1, borderColor: "#f0f0f0" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827", backgroundColor: "#fafafa",
  },
  fieldInputMulti: { minHeight: 64, paddingTop: 12, textAlignVertical: "top" },
  pwdRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, backgroundColor: "#fafafa",
  },
  pwdInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827" },
  eyeBtn: { paddingHorizontal: 12 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  loginLink: { alignItems: "center", paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: "#6b7280" },
  loginLinkBold: { fontWeight: "700", color: "#00450d" },
});
