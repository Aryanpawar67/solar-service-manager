import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { useGetMe, useUpdateStaff, useGetStaff } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

export default function PersonalDetailsScreen() {
  const { data: meData, isLoading: meLoading } = useGetMe();
  const staffId = meData?.user?.staffId;
  const { data: staffData, isLoading: staffLoading } = useGetStaff(staffId ?? 0);
  const update = useUpdateStaff();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [workArea, setWorkArea] = useState("");

  useEffect(() => {
    if (staffData) {
      setName(staffData.name ?? "");
      setPhone(staffData.phone ?? "");
      setWorkArea(staffData.workArea ?? "");
    }
  }, [staffData]);

  const handleSave = () => {
    if (!staffId) return;
    if (!name.trim()) { Alert.alert("Required", "Name is required"); return; }
    update.mutate(
      { id: staffId, data: { name: name.trim(), phone: phone.trim(), workArea: workArea.trim() || undefined } },
      {
        onSuccess: () => Alert.alert("Saved", "Profile updated successfully"),
        onError: () => Alert.alert("Error", "Failed to update profile"),
      }
    );
  };

  if (meLoading || staffLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Personal Details",
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

          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
            <Text style={styles.infoNoteText}>Email and role can only be changed by an administrator.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.readonlyField}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.readonlyBox}>
                <Ionicons name="mail-outline" size={15} color="#9ca3af" />
                <Text style={styles.readonlyText}>{meData?.user?.email ?? "—"}</Text>
              </View>
            </View>

            <View style={styles.readonlyField}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.readonlyBox}>
                <Ionicons name="briefcase-outline" size={15} color="#9ca3af" />
                <Text style={styles.readonlyText}>{staffData?.role ?? "Technician"}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholderTextColor="#9ca3af" placeholder="Your full name" />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput style={styles.fieldInput} value={phone} onChangeText={setPhone} placeholderTextColor="#9ca3af" keyboardType="phone-pad" placeholder="+91 98765 43210" />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Service Region / Work Area</Text>
              <TextInput style={styles.fieldInput} value={workArea} onChangeText={setWorkArea} placeholderTextColor="#9ca3af" placeholder="e.g. Noida Sector 18-35" />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, update.isPending && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={update.isPending}
            activeOpacity={0.85}
          >
            {update.isPending
              ? <ActivityIndicator color="#00450d" />
              : <Text style={styles.saveBtnText}>Save Changes</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#f3f4f6", borderRadius: 12, padding: 12,
  },
  infoNoteText: { flex: 1, fontSize: 12, color: "#6b7280", lineHeight: 17 },
  section: { backgroundColor: "#fff", borderRadius: 16, padding: 18, gap: 14, borderWidth: 1, borderColor: "#f0f0f0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  readonlyField: { gap: 6 },
  readonlyBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: "#f0f0f0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#f9fafb",
  },
  readonlyText: { fontSize: 14, color: "#9ca3af" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#111827", backgroundColor: "#fafafa",
  },
  saveBtn: {
    backgroundColor: "#bcf200", borderRadius: 14, paddingVertical: 16, alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#00450d", fontWeight: "800", fontSize: 15 },
});
