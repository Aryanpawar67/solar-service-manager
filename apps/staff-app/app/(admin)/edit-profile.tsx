import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";

export default function AdminEditProfileScreen() {
  const { data, isLoading, refetch } = useGetMe();
  const user = data?.user;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Password fields
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!name.trim()) { Alert.alert("Required", "Name cannot be empty"); return; }
    if (!email.trim()) { Alert.alert("Required", "Email cannot be empty"); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const text = await res.text();
      let json: { ok?: boolean; error?: string } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) {
        Alert.alert("Error", json.error ?? `Server error (${res.status})`);
      } else {
        await refetch();
        Alert.alert("Saved", "Profile updated successfully");
      }
    } catch (e) {
      Alert.alert("Error", `Network error: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd) { Alert.alert("Required", "Enter your current password"); return; }
    if (!newPwd || newPwd.length < 8) { Alert.alert("Too Short", "New password must be at least 8 characters"); return; }
    if (newPwd !== confirmPwd) { Alert.alert("Mismatch", "New passwords do not match"); return; }
    setChangingPwd(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const text = await res.text();
      let json: { ok?: boolean; error?: string } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) {
        Alert.alert("Error", json.error ?? `Server error (${res.status})`);
      } else {
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        Alert.alert("Success", "Password changed successfully");
      }
    } catch (e) {
      Alert.alert("Error", `Network error: ${(e as Error).message}`);
    } finally {
      setChangingPwd(false);
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Profile",
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

          {/* Profile section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.readonlyField}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.readonlyBox}>
                <Ionicons name="shield-outline" size={15} color="#9ca3af" />
                <Text style={styles.readonlyText}>System Administrator</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#00450d" />
              : <Text style={styles.saveBtnText}>Save Profile</Text>
            }
          </TouchableOpacity>

          {/* Change password section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>

            <PwdField label="Current Password" value={currentPwd} onChange={setCurrentPwd} show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
            <PwdField label="New Password" value={newPwd} onChange={setNewPwd} show={showNew} toggle={() => setShowNew(!showNew)} />
            <PwdField label="Confirm New Password" value={confirmPwd} onChange={setConfirmPwd} show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />

            <View style={styles.requirements}>
              <Text style={styles.reqItem}>• Minimum 8 characters</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.pwdBtn, changingPwd && styles.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={changingPwd}
            activeOpacity={0.85}
          >
            {changingPwd
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                  <Text style={styles.pwdBtnText}>Update Password</Text>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { backgroundColor: "#fff", borderRadius: 16, padding: 18, gap: 14, borderWidth: 1, borderColor: "#f0f0f0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#111827", backgroundColor: "#fafafa",
  },
  readonlyField: { gap: 6 },
  readonlyBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: "#f0f0f0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#f9fafb",
  },
  readonlyText: { fontSize: 14, color: "#9ca3af" },
  pwdRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#fafafa",
  },
  pwdInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#111827" },
  eyeBtn: { paddingHorizontal: 12 },
  requirements: { backgroundColor: "#f8fafb", borderRadius: 10, padding: 10, gap: 3 },
  reqItem: { fontSize: 12, color: "#6b7280" },
  saveBtn: {
    backgroundColor: "#bcf200", borderRadius: 14, paddingVertical: 16, alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#00450d", fontWeight: "800", fontSize: 15 },
  pwdBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  pwdBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
