import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { useCreateCustomer } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function CreateCustomerScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [solarCapacity, setSolarCapacity] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [notes, setNotes] = useState("");

  const create = useCreateCustomer();

  const handleSave = () => {
    if (!name.trim()) { Alert.alert("Required", "Customer name is required"); return; }
    if (!phone.trim()) { Alert.alert("Required", "Phone number is required"); return; }
    if (!address.trim()) { Alert.alert("Required", "Address is required"); return; }

    create.mutate(
      {
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
          Alert.alert("Success", "Customer added successfully", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (e) => Alert.alert("Error", (e as Error).message ?? "Failed to create customer"),
      }
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Customer",
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
            <Field label="Full Name *" value={name} onChangeText={setName} placeholder="e.g. Rajesh Kumar" />
            <Field label="Phone Number *" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboard="phone-pad" />
            <Field label="Address *" value={address} onChangeText={setAddress} placeholder="Full address" multiline />
            <Field label="City" value={city} onChangeText={setCity} placeholder="e.g. Noida" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solar System</Text>
            <Field label="Solar Capacity (kW)" value={solarCapacity} onChangeText={setSolarCapacity} placeholder="e.g. 5.5" keyboard="decimal-pad" />
            <Field label="Installation Date (YYYY-MM-DD)" value={installationDate} onChangeText={setInstallationDate} placeholder="e.g. 2024-01-15" />
            <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Any additional info..." multiline />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, create.isPending && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={create.isPending}
            activeOpacity={0.85}
          >
            {create.isPending
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Add Customer</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboard, multiline,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboard?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
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
