import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useGetCustomer, useUpdateCustomer } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);
  const { data: customer, isLoading } = useGetCustomer(customerId);
  const update = useUpdateCustomer();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [solarCapacity, setSolarCapacity] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (customer) {
      setName(customer.name ?? "");
      setPhone(customer.phone ?? "");
      setAddress(customer.address ?? "");
      setCity(customer.city ?? "");
      setSolarCapacity(customer.solarCapacity ? String(customer.solarCapacity) : "");
      setInstallationDate(customer.installationDate ?? "");
      setNotes(customer.notes ?? "");
    }
  }, [customer]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert("Required", "Customer name is required"); return; }
    if (!phone.trim()) { Alert.alert("Required", "Phone number is required"); return; }
    update.mutate(
      {
        id: customerId,
        data: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim() || undefined,
          solarCapacity: solarCapacity ? parseFloat(solarCapacity) : undefined,
          installationDate: installationDate.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          Alert.alert("Saved", "Customer updated successfully", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (e) => Alert.alert("Error", (e as Error).message ?? "Failed to update"),
      }
    );
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Customer",
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
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <Field label="Full Name" value={name} onChangeText={setName} />
            <Field label="Phone Number" value={phone} onChangeText={setPhone} keyboard="phone-pad" />
            <Field label="Address" value={address} onChangeText={setAddress} multiline />
            <Field label="City" value={city} onChangeText={setCity} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solar System</Text>
            <Field label="Solar Capacity (kW)" value={solarCapacity} onChangeText={setSolarCapacity} keyboard="decimal-pad" />
            <Field label="Installation Date (YYYY-MM-DD)" value={installationDate} onChangeText={setInstallationDate} />
            <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, update.isPending && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={update.isPending}
            activeOpacity={0.85}
          >
            {update.isPending
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Field({ label, value, onChangeText, keyboard, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void; keyboard?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboard ?? "default"}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
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
  fieldInputMulti: { minHeight: 80, paddingTop: 11 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
