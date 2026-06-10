import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

const SECTIONS = [
  {
    title: "Staff Code of Conduct",
    icon: "shield-checkmark-outline" as const,
    content: `• Arrive on time for all scheduled service visits.\n• Wear company uniform and carry your GreenVolt ID at all times.\n• Treat all customers with respect and professionalism.\n• Do not share customer data or service details with third parties.\n• Report all job completions and issues through the GreenVolt app.\n• Any damage caused during service must be reported immediately to the supervisor.`,
  },
  {
    title: "Privacy & Data Policy",
    icon: "lock-closed-outline" as const,
    content: `• Customer information is confidential and must not be shared externally.\n• Service photographs must only be used for official reporting.\n• App access credentials are personal and must not be shared.\n• Data collected during service visits is owned by GreenVolt.\n• Any breach of data policy will result in disciplinary action.`,
  },
  {
    title: "Safety Guidelines",
    icon: "warning-outline" as const,
    content: `• Always de-energize panels before performing maintenance.\n• Use proper PPE (gloves, safety glasses) during all service work.\n• Do not work on rooftops alone — always have a spotter.\n• Report any electrical hazards immediately and do not proceed.\n• Follow local safety regulations for working at height.\n• Keep the work area clean and organized during and after service.`,
  },
  {
    title: "Leave & Availability",
    icon: "calendar-outline" as const,
    content: `• Apply for leave at least 3 working days in advance.\n• Emergency leave must be communicated to your supervisor immediately.\n• Mark yourself as unavailable in the app if you are on leave.\n• Unplanned absences without notice may affect performance ratings.\n• Overtime will be compensated as per company policy.`,
  },
];

export default function PoliciesScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Company Policies",
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
        <View style={styles.headerCard}>
          <Ionicons name="document-text-outline" size={28} color="#00450d" />
          <Text style={styles.headerTitle}>GreenVolt Staff Policies</Text>
          <Text style={styles.headerSub}>Last updated: January 2025. Tap a section to expand.</Text>
        </View>

        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.title}
            style={styles.section}
            onPress={() => setExpanded(expanded === s.title ? null : s.title)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name={s.icon} size={18} color="#00450d" />
              </View>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Ionicons name={expanded === s.title ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
            </View>
            {expanded === s.title && (
              <Text style={styles.sectionContent}>{s.content}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  headerCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 12, color: "#9ca3af", textAlign: "center" },
  section: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#f0f0f0", gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#f0fdf4", justifyContent: "center", alignItems: "center",
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionContent: { fontSize: 13, color: "#374151", lineHeight: 22, paddingTop: 4 },
});
