import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert, Switch } from "react-native";
import { router } from "expo-router";
import { useGetMyProfile, useUpdateMyProfile, useUpdateNotificationPrefs } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { useState } from "react";

export default function CustomerProfileScreen() {
  const { data: profile, isLoading, refetch } = useGetMyProfile();
  const update = useUpdateMyProfile();
  const updateNotifs = useUpdateNotificationPrefs();

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const startEdit = () => {
    setPhone(profile?.phone ?? "");
    setAddress(profile?.address ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    update.mutate(
      { phone, address },
      {
        onSuccess: () => {
          setEditing(false);
          refetch();
        },
        onError: () => Alert.alert("Error", "Failed to save. Please try again."),
      }
    );
  };

  const togglePush = (value: boolean) => {
    updateNotifs.mutate(value, {
      onError: () => Alert.alert("Error", "Failed to update notification preference."),
    });
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearToken();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (isLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // pushEnabled is returned alongside customer fields from GET /api/me/profile
  const pushEnabled = (profile as typeof profile & { pushEnabled?: boolean }).pushEnabled ?? true;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        {profile.city && <Text style={styles.city}>{profile.city}</Text>}
      </View>

      {/* Solar info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>System Info</Text>
        {profile.solarCapacity && <Row label="Capacity" value={`${profile.solarCapacity} kW`} />}
        {profile.installationDate && <Row label="Installed" value={profile.installationDate} />}
      </View>

      {/* Contact details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          {!editing && (
            <TouchableOpacity onPress={startEdit}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={address} onChangeText={setAddress} multiline />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, update.isPending && styles.saveBtnDisabled]}
                onPress={saveEdit}
                disabled={update.isPending}
              >
                <Text style={styles.saveBtnText}>{update.isPending ? "Saving…" : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Row label="Phone" value={profile.phone} />
            <Row label="Address" value={profile.address} />
          </>
        )}
      </View>

      {/* Notification preferences */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Text style={styles.toggleSub}>
              {pushEnabled ? "You will receive service updates" : "Push notifications are off"}
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            trackColor={{ false: "#d1d5db", true: "#86efac" }}
            thumbColor={pushEnabled ? "#16a34a" : "#9ca3af"}
            disabled={updateNotifs.isPending}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarWrapper: { alignItems: "center", paddingVertical: 16, gap: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 36, fontWeight: "700", color: "#fff" },
  name: { fontSize: 22, fontWeight: "700", color: "#111827" },
  city: { fontSize: 14, color: "#6b7280" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151" },
  editLink: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowLabel: { fontSize: 13, color: "#6b7280", width: 100 },
  rowValue: { fontSize: 14, color: "#111827", flex: 1 },
  fieldLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14, color: "#111827", backgroundColor: "#f9fafb" },
  editActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 14, color: "#374151", fontWeight: "600" },
  saveBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 8, padding: 12, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, color: "#fff", fontWeight: "600" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  logoutBtn: { backgroundColor: "#fee2e2", borderRadius: 12, padding: 16, alignItems: "center" },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});
