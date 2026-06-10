import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useListCustomers, useListStaff, useCreateService } from "@workspace/api-client-react";

const SERVICE_TYPES = [
  "Annual Maintenance",
  "Cleaning",
  "Diagnostic",
  "Inspection",
  "Installation",
  "Panel Replacement",
  "Inverter Service",
  "Wiring & Electrical",
  "Other",
];

export default function CreateJobScreen() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string; phone: string } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<{ id: number; name: string } | null>(null);
  const [serviceType, setServiceType] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const { data: customersData, isLoading: loadingCustomers } = useListCustomers({ search: customerSearch, limit: 50 });
  const { data: staffData, isLoading: loadingStaff } = useListStaff({ available: true });
  const create = useCreateService();

  const handleCreate = () => {
    if (!selectedCustomer) { Alert.alert("Required", "Select a customer"); return; }
    if (!scheduledDate.trim()) { Alert.alert("Required", "Scheduled date is required"); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate.trim())) {
      Alert.alert("Format", "Date must be in YYYY-MM-DD format (e.g. 2026-06-15)");
      return;
    }

    create.mutate(
      {
        data: {
          customerId: selectedCustomer.id,
          staffId: selectedStaff?.id ?? undefined,
          serviceType: serviceType || undefined,
          scheduledDate: scheduledDate.trim(),
          notes: notes.trim() || undefined,
          status: "pending",
        },
      },
      {
        onSuccess: () => {
          Alert.alert("Created", "Job created successfully", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (e) => Alert.alert("Error", (e as Error).message ?? "Failed to create job"),
      }
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Job",
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
            <Text style={styles.sectionTitle}>Assignment</Text>

            {/* Customer picker */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Customer *</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowCustomerPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="person-outline" size={16} color="#9ca3af" />
                <Text style={[styles.pickerText, !selectedCustomer && styles.pickerPlaceholder]}>
                  {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Staff picker */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Assign Technician</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowStaffPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="construct-outline" size={16} color="#9ca3af" />
                <Text style={[styles.pickerText, !selectedStaff && styles.pickerPlaceholder]}>
                  {selectedStaff ? selectedStaff.name : "Unassigned (assign later)"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Details</Text>

            {/* Service type */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Service Type</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowTypePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={16} color="#9ca3af" />
                <Text style={[styles.pickerText, !serviceType && styles.pickerPlaceholder]}>
                  {serviceType || "Select service type..."}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Scheduled Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.fieldInput}
                value={scheduledDate}
                onChangeText={setScheduledDate}
                placeholder="e.g. 2026-06-20"
                placeholderTextColor="#9ca3af"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createBtn, create.isPending && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={create.isPending}
            activeOpacity={0.85}
          >
            {create.isPending
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>Create Job</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Customer picker modal */}
      <Modal visible={showCustomerPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search customers..."
              placeholderTextColor="#9ca3af"
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
          </View>
          {loadingCustomers
            ? <ActivityIndicator style={{ marginTop: 40 }} color="#00450d" />
            : (
              <FlatList
                data={customersData?.data ?? []}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => { setSelectedCustomer({ id: item.id, name: item.name, phone: item.phone }); setShowCustomerPicker(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalItemAvatar}>
                      <Text style={styles.modalItemAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      <Text style={styles.modalItemSub}>{item.phone}</Text>
                    </View>
                    {selectedCustomer?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#00450d" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.modalEmpty}>No customers found</Text>}
              />
            )
          }
        </View>
      </Modal>

      {/* Staff picker modal */}
      <Modal visible={showStaffPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Technician</Text>
            <TouchableOpacity onPress={() => setShowStaffPicker(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          {loadingStaff
            ? <ActivityIndicator style={{ marginTop: 40 }} color="#00450d" />
            : (
              <FlatList
                data={[{ id: 0, name: "Unassigned", phone: "" }, ...(staffData?.data ?? [])]}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedStaff(item.id === 0 ? null : { id: item.id, name: item.name });
                      setShowStaffPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalItemAvatar, item.id === 0 && styles.modalItemAvatarGray]}>
                      <Text style={styles.modalItemAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      {item.id !== 0 && <Text style={styles.modalItemSub}>{item.phone}</Text>}
                    </View>
                    {(item.id === 0 ? !selectedStaff : selectedStaff?.id === item.id) && (
                      <Ionicons name="checkmark-circle" size={20} color="#00450d" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )
          }
        </View>
      </Modal>

      {/* Service type picker modal */}
      <Modal visible={showTypePicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Service Type</Text>
            <TouchableOpacity onPress={() => setShowTypePicker(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={SERVICE_TYPES}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setServiceType(item); setShowTypePicker(false); }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalItemName}>{item}</Text>
                {serviceType === item && <Ionicons name="checkmark-circle" size={20} color="#00450d" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
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
  pickerBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#fafafa",
  },
  pickerText: { flex: 1, fontSize: 14, color: "#111827" },
  pickerPlaceholder: { color: "#9ca3af" },
  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modal: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  modalSearch: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, height: 44, backgroundColor: "#f9fafb",
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: "#111827" },
  modalItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#f9fafb",
  },
  modalItemAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center",
  },
  modalItemAvatarGray: { backgroundColor: "#f3f4f6" },
  modalItemAvatarText: { fontSize: 15, fontWeight: "700", color: "#00450d" },
  modalItemName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  modalItemSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  modalEmpty: { textAlign: "center", color: "#9ca3af", marginTop: 40, fontSize: 14 },
});
