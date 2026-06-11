import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { useGetMyProfile, useUpdateMyProfile, useUpdateNotificationPrefs } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export default function CustomerProfileScreen() {
  const { data: profile, isLoading, refetch } = useGetMyProfile();
  const update = useUpdateMyProfile();
  const updateNotifs = useUpdateNotificationPrefs();

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [nameField, setNameField] = useState("");
  const [emailField, setEmailField] = useState("");

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);

  // Load persisted notification prefs on mount
  useEffect(() => {
    SecureStore.getItemAsync("notif_email_alerts").then((v) => { if (v !== null) setEmailAlerts(v === "true"); });
    SecureStore.getItemAsync("notif_sms_notifs").then((v) => { if (v !== null) setSmsNotifs(v === "true"); });
  }, []);

  const handleEmailAlertsChange = (value: boolean) => {
    setEmailAlerts(value);
    SecureStore.setItemAsync("notif_email_alerts", String(value)).catch(() => {});
  };

  const handleSmsNotifsChange = (value: boolean) => {
    setSmsNotifs(value);
    SecureStore.setItemAsync("notif_sms_notifs", String(value)).catch(() => {});
  };

  const startEdit = () => {
    setPhone(profile?.phone ?? "");
    setCity((profile as typeof profile & { city?: string })?.city ?? profile?.address ?? "");
    setNameField(profile?.name ?? "");
    setEmailField((profile as typeof profile & { email?: string })?.email ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    update.mutate(
      { phone, city, name: nameField, email: emailField },
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }

  const pushEnabled = (profile as typeof profile & { pushEnabled?: boolean }).pushEnabled ?? true;
  const customerId = `GV-${String(profile.id ?? "0000").padStart(4, "0")}-X`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Identity card */}
      <View style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.identityInfo}>
          <Text style={styles.identityName}>{profile.name}</Text>
          <Text style={styles.identityId}>CUSTOMER ID: {customerId}</Text>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="id-card-outline" size={18} color="#111827" />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={[styles.inputBox, styles.inputBoxReadonly]}>
            <Text style={styles.inputText}>{(profile as typeof profile & { email?: string })?.email ?? "—"}</Text>
          </View>
        </View>

        {editing ? (
          <>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.inputBox}
                value={nameField}
                onChangeText={setNameField}
                placeholderTextColor="#9ca3af"
                placeholder="Your full name"
              />
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.inputBox}
                value={emailField}
                onChangeText={setEmailField}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
                placeholder="email@example.com"
              />
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.inputBox}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Service City</Text>
              <TextInput
                style={styles.inputBox}
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#9ca3af"
              />
            </View>
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
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TouchableOpacity style={styles.inputBox} onPress={startEdit} activeOpacity={0.7}>
                <Text style={styles.inputText}>{profile.phone || "—"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Service City</Text>
              <TouchableOpacity style={styles.inputBox} onPress={startEdit} activeOpacity={0.7}>
                <Text style={styles.inputText}>
                  {(profile as typeof profile & { city?: string })?.city || profile.address || "—"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* System Details */}
      {(profile.solarCapacity || profile.installationDate) ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={18} color="#111827" />
            <Text style={styles.sectionTitle}>System Details</Text>
          </View>

          {profile.solarCapacity ? (
            <View style={styles.capacityCard}>
              <Text style={styles.capacityLabel}>TOTAL CAPACITY</Text>
              <View style={styles.capacityRow}>
                <Text style={styles.capacityValue}>{profile.solarCapacity}</Text>
                <Text style={styles.capacityUnit}> kW</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineBadgeText}>ONLINE</Text>
            </View>
          </View>

          {profile.installationDate ? (
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Install Date</Text>
              <Text style={styles.detailValue}>{profile.installationDate}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Notification Preferences */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="options-outline" size={18} color="#111827" />
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
        </View>

        <View style={styles.toggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Email Alerts</Text>
            <Text style={styles.toggleSub}>Weekly summaries and critical system faults.</Text>
          </View>
          <Switch
            value={emailAlerts}
            onValueChange={handleEmailAlertsChange}
            trackColor={{ false: "#d1d5db", true: "#86efac" }}
            thumbColor={emailAlerts ? "#00450d" : "#f3f4f6"}
          />
        </View>

        <View style={[styles.toggleCard, styles.toggleCardBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>SMS Notifications</Text>
            <Text style={styles.toggleSub}>Real-time alerts for grid disconnects.</Text>
          </View>
          <Switch
            value={smsNotifs}
            onValueChange={handleSmsNotifsChange}
            trackColor={{ false: "#d1d5db", true: "#86efac" }}
            thumbColor={smsNotifs ? "#00450d" : "#f3f4f6"}
          />
        </View>

        <View style={[styles.toggleCard, styles.toggleCardBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Push Notifications</Text>
            <Text style={styles.toggleSub}>Daily production milestones on mobile app.</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            trackColor={{ false: "#d1d5db", true: "#86efac" }}
            thumbColor={pushEnabled ? "#00450d" : "#f3f4f6"}
            disabled={updateNotifs.isPending}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Logout securely</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  identityCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 16,
    borderWidth: 1, borderColor: "#f0f0f0",
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#e5e7eb",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  avatarText: { fontSize: 26, fontWeight: "800", color: "#374151" },
  identityInfo: { flex: 1 },
  identityName: { fontSize: 20, fontWeight: "800", color: "#111827" },
  identityId: { fontSize: 12, color: "#9ca3af", marginTop: 3 },

  section: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },

  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  inputBox: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111827", backgroundColor: "#fff",
  },
  inputBoxReadonly: { backgroundColor: "#f9fafb" },
  inputText: { fontSize: 14, color: "#111827" },
  editActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: "#d1d5db",
    borderRadius: 10, padding: 12, alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, color: "#374151", fontWeight: "600" },
  saveBtn: { flex: 1, backgroundColor: "#00450d", borderRadius: 10, padding: 12, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, color: "#fff", fontWeight: "700" },

  capacityCard: {
    backgroundColor: "#f8fafb", borderRadius: 10, padding: 16, gap: 4,
  },
  capacityLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  capacityRow: { flexDirection: "row", alignItems: "baseline" },
  capacityValue: { fontSize: 36, fontWeight: "800", color: "#00450d" },
  capacityUnit: { fontSize: 18, fontWeight: "700", color: "#00450d" },

  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 8,
  },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: "#f4f4f5" },
  detailLabel: { fontSize: 14, color: "#374151" },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  onlineBadge: {
    backgroundColor: "#dcfce7", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3,
  },
  onlineBadgeText: { fontSize: 11, fontWeight: "700", color: "#00450d" },

  toggleCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  toggleCardBorder: { borderTopWidth: 1, borderTopColor: "#f4f4f5" },
  toggleTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  toggleSub: { fontSize: 12, color: "#9ca3af", marginTop: 2, lineHeight: 17 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1.5, borderColor: "#fca5a5", borderRadius: 12,
    paddingVertical: 15, backgroundColor: "#fff",
  },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});
