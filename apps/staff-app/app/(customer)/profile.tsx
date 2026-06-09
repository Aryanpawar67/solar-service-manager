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
import { FadeInView } from "@/components/FadeInView";
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

  const pushEnabled = (profile as typeof profile & { pushEnabled?: boolean }).pushEnabled ?? true;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Green header */}
      <FadeInView delay={0} fromY={-20}>
      <View style={styles.header}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        {profile.city ? <Text style={styles.city}>{profile.city}</Text> : null}
        <View style={styles.roleBadge}>
          <Ionicons name="person-outline" size={11} color="#16a34a" />
          <Text style={styles.roleBadgeText}>Customer</Text>
        </View>
      </View>
      </FadeInView>

      {/* Solar info */}
      {(profile.solarCapacity || profile.installationDate) ? (
        <FadeInView delay={100}>
        <View style={styles.card}>
          <SectionHeader icon="sunny-outline" title="System Info" />
          {profile.solarCapacity ? (
            <InfoRow icon="flash-outline" label="Capacity" value={`${profile.solarCapacity} kW`} />
          ) : null}
          {profile.installationDate ? (
            <InfoRow icon="calendar-outline" label="Installed" value={profile.installationDate} last />
          ) : null}
        </View>
        </FadeInView>
      ) : null}

      {/* Contact details */}
      <FadeInView delay={180}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <SectionHeader icon="call-outline" title="Contact Details" />
          {!editing ? (
            <TouchableOpacity onPress={startEdit} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={14} color="#16a34a" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {editing ? (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={address}
                onChangeText={setAddress}
                multiline
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
            <InfoRow icon="call-outline" label="Phone" value={profile.phone} />
            <InfoRow icon="location-outline" label="Address" value={profile.address} last />
          </>
        )}
      </View>
      </FadeInView>

      {/* Notifications */}
      <FadeInView delay={260}>
      <View style={styles.card}>
        <SectionHeader icon="notifications-outline" title="Notifications" />
        <View style={styles.toggleRow}>
          <View style={styles.toggleIconBox}>
            <Ionicons name="phone-portrait-outline" size={14} color="#16a34a" />
          </View>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Text style={styles.toggleSub}>
              {pushEnabled ? "Receive service updates" : "Push notifications are off"}
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            trackColor={{ false: "#d1d5db", true: "#86efac" }}
            thumbColor={pushEnabled ? "#16a34a" : "#f3f4f6"}
            disabled={updateNotifs.isPending}
          />
        </View>
      </View>
      </FadeInView>

      {/* Logout */}
      <FadeInView delay={340}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      </FadeInView>

      <Text style={styles.version}>GreenVolt · v1.0.0</Text>
    </ScrollView>
  );
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={15} color="#16a34a" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={14} color="#16a34a" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#16a34a",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 36,
    gap: 6,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 34, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: "#fff" },
  city: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 16,
    marginBottom: 0,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    gap: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editBtnText: { fontSize: 13, color: "#16a34a", fontWeight: "600" },

  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500", marginTop: 1 },

  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  inputMultiline: { height: 80, textAlignVertical: "top" },
  editActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 14, color: "#374151", fontWeight: "600" },
  saveBtn: { flex: 1, backgroundColor: "#16a34a", borderRadius: 10, padding: 12, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, color: "#fff", fontWeight: "700" },

  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  toggleIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    margin: 16,
    marginBottom: 0,
    padding: 16,
  },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },

  version: { textAlign: "center", fontSize: 12, color: "#d1d5db", marginTop: 20 },
});
