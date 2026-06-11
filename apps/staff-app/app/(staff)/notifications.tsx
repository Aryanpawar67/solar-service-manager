import {
  View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/lib/constants";

export default function StaffNotificationsScreen() {
  const [jobAssignment, setJobAssignment] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load persisted local prefs on mount
  useEffect(() => {
    SecureStore.getItemAsync("staff_notif_job_assignment").then((v) => { if (v !== null) setJobAssignment(v === "true"); });
    SecureStore.getItemAsync("staff_notif_reminders").then((v) => { if (v !== null) setReminders(v === "true"); });
  }, []);

  const handleJobAssignmentChange = (value: boolean) => {
    setJobAssignment(value);
    SecureStore.setItemAsync("staff_notif_job_assignment", String(value)).catch(() => {});
  };

  const handleRemindersChange = (value: boolean) => {
    setReminders(value);
    SecureStore.setItemAsync("staff_notif_reminders", String(value)).catch(() => {});
  };

  const savePushPref = async (value: boolean) => {
    setPushEnabled(value);
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${API_BASE_URL}/api/auth/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pushEnabled: value }),
      });
    } catch {
      Alert.alert("Error", "Could not save notification preference");
      setPushEnabled(!value); // revert
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notification Preferences",
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <ToggleRow
            icon="notifications-outline"
            title="Job Assignment Alerts"
            sub="Get notified when you are assigned a new job"
            value={jobAssignment}
            onChange={handleJobAssignmentChange}
          />
          <ToggleRow
            icon="alarm-outline"
            title="Job Reminders"
            sub="Reminder 1 hour before scheduled job time"
            value={reminders}
            onChange={handleRemindersChange}
          />
          <ToggleRow
            icon="phone-portrait-outline"
            title="Push Notifications"
            sub="Enable all push notifications on this device"
            value={pushEnabled}
            onChange={savePushPref}
            disabled={saving}
          />
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
          <Text style={styles.noteText}>
            Push notification preferences sync with the server. Other preferences are stored on this device.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function ToggleRow({ icon, title, sub, value, onChange, disabled }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string; sub: string; value: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <Ionicons name={icon} size={18} color="#00450d" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: "#d1d5db", true: "#86efac" }}
        thumbColor={value ? "#00450d" : "#f3f4f6"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  section: { backgroundColor: "#fff", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#f0f0f0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 14 },
  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f4f4f5",
  },
  toggleIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f0fdf4", justifyContent: "center", alignItems: "center",
  },
  toggleTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  noteCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#f3f4f6", borderRadius: 12, padding: 12,
  },
  noteText: { flex: 1, fontSize: 12, color: "#6b7280", lineHeight: 17 },
});
