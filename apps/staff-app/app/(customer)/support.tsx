import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { API_BASE_URL } from "@/lib/constants";

const CATEGORIES = ["Service Issue", "Billing Query", "Subscription", "Technical Problem", "Feedback", "Other"] as const;

export default function CustomerSupportScreen() {
  const { data: profile } = useGetMyProfile();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) { Alert.alert("Required", "Please describe your issue"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile?.name ?? "Customer",
          email: (profile as typeof profile & { email?: string })?.email ?? "customer@greenvolt.in",
          phone: profile?.phone ?? "",
          message: `[${category}] ${message.trim()}`,
        }),
      });
      if (res.ok) {
        Alert.alert("Submitted", "Your request has been received. Our support team will contact you within 24 hours.", [
          { text: "OK", onPress: () => { setMessage(""); router.back(); } },
        ]);
      } else {
        Alert.alert("Error", "Could not submit request. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Support",
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

          <View style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="headset-outline" size={24} color="#00450d" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>GreenVolt Support</Text>
              <Text style={styles.contactSub}>Mon–Sat, 9 AM – 6 PM · We respond within 24 hours</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What do you need help with?</Text>
            <View style={styles.categories}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                  onPress={() => setCategory(c)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Describe your issue</Text>
            <TextInput
              style={styles.msgInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us what happened and how we can help..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Send Message</Text>
                </>
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
  contactCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#fff", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#f0f0f0",
  },
  contactIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#f0fdf4", justifyContent: "center", alignItems: "center",
  },
  contactTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  contactSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  section: { backgroundColor: "#fff", borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: "#f3f4f6", borderWidth: 1.5, borderColor: "transparent",
  },
  catChipActive: { backgroundColor: "#f0fdf4", borderColor: "#00450d" },
  catText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  catTextActive: { color: "#00450d" },
  msgInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    padding: 14, fontSize: 14, color: "#111827", minHeight: 130, backgroundColor: "#fafafa",
  },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
