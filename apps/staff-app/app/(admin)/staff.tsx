import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Alert, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { useListStaff, useUpdateStaff, useCreateStaff } from "@workspace/api-client-react";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ErrorState";
import { useState } from "react";
import { getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";

type StaffModal = { mode: "add" } | { mode: "edit"; id: number; name: string; phone: string; role: string; workArea: string };

export default function AdminStaffScreen() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<StaffModal | null>(null);
  const { data, isLoading, isError, refetch, isRefetching } = useListStaff({});
  const update = useUpdateStaff();
  const create = useCreateStaff();

  // Form state
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fRole, setFRole] = useState("Technician");
  const [fWorkArea, setFWorkArea] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setFName(""); setFPhone(""); setFRole("Technician"); setFWorkArea(""); setFEmail(""); setFPassword("");
    setModal({ mode: "add" });
  };

  const openEdit = (s: { id: number; name: string; phone: string; role: string; workArea?: string | null }) => {
    setFName(s.name); setFPhone(s.phone); setFRole(s.role); setFWorkArea(s.workArea ?? "");
    setFEmail(""); setFPassword("");
    setModal({ mode: "edit", id: s.id, name: s.name, phone: s.phone, role: s.role, workArea: s.workArea ?? "" });
  };

  const handleSave = async () => {
    if (!fName.trim()) { Alert.alert("Required", "Name is required"); return; }
    if (!fPhone.trim()) { Alert.alert("Required", "Phone is required"); return; }

    if (modal?.mode === "add") {
      if (!fEmail.trim()) { Alert.alert("Required", "Email is required for login"); return; }
      if (!fPassword.trim() || fPassword.length < 6) { Alert.alert("Required", "Password must be at least 6 characters"); return; }
      setSaving(true);
      try {
        const token = await getToken();
        if (!token) { Alert.alert("Error", "Not authenticated. Please log in again."); return; }
        const res = await fetch(`${API_BASE_URL}/api/admin/create-staff`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: fName.trim(), phone: fPhone.trim(), role: fRole.trim(), email: fEmail.trim(), password: fPassword, workArea: fWorkArea.trim() || undefined }),
        });
        const text = await res.text();
        let data2: { ok?: boolean; error?: string } = {};
        try { data2 = JSON.parse(text); } catch { /* non-JSON response (e.g. 503 from cold start) */ }
        if (!res.ok) {
          Alert.alert("Error", data2.error ?? `Server error (${res.status}). If the server is starting up, wait 30 seconds and try again.`);
        } else {
          setModal(null);
          refetch();
          Alert.alert("Success", `Staff member ${fName} added. They can log in with:\nEmail: ${fEmail}`);
        }
      } catch (e) {
        Alert.alert("Error", `Network error: ${(e as Error).message}. Check your internet connection and try again.`);
      } finally {
        setSaving(false);
      }
    } else if (modal?.mode === "edit") {
      update.mutate(
        { id: modal.id, data: { name: fName.trim(), phone: fPhone.trim(), role: fRole.trim(), workArea: fWorkArea.trim() || undefined } },
        {
          onSuccess: () => { setModal(null); refetch(); },
          onError: () => Alert.alert("Error", "Failed to update staff"),
        }
      );
    }
  };

  const toggleActive = (id: number, current: boolean) => {
    const action = current ? "deactivate" : "activate";
    Alert.alert("Confirm", `Are you sure you want to ${action} this staff member?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => update.mutate({ id, data: { isActive: !current } }, { onSuccess: () => refetch() }) },
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00450d" /></View>;
  }
  if (isError) return <ErrorState onRetry={refetch} />;

  const staffList = (data?.data ?? []).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.role ?? "").toLowerCase().includes(q) || String(s.id).includes(q);
  });

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Staff Directory</Text>
        <Text style={styles.pageSub}>Manage field technicians and administrative personnel.</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="person-add-outline" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Search by name or ID..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color="#9ca3af" /></TouchableOpacity>
        )}
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, staffList.length === 0 && styles.contentEmpty]}
        data={staffList}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00450d" colors={["#00450d"]} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="people-outline" size={52} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No staff found</Text>
            <Text style={styles.emptyText}>Staff members will appear here once added.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const staffId = `GV-T${String(item.id).padStart(3, "0")}`;
          const isActive = item.isActive ?? false;
          const assignment = item.workArea ?? "Standby / Depot";
          return (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.8}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}><Ionicons name="person-outline" size={20} color="#9ca3af" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{item.name}</Text>
                  <Text style={styles.staffId}>ID: {staffId} · {item.role}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleActive(item.id, isActive)} activeOpacity={0.8}>
                  <View style={[styles.statusBadge, { backgroundColor: isActive ? "#00450d" : "#f59e0b" }]}>
                    <Text style={styles.statusBadgeText}>{isActive ? "ACTIVE" : "ON LEAVE"}</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.assignmentBox}>
                <View style={styles.assignmentRow}>
                  <Ionicons name="construct-outline" size={13} color="#6b7280" />
                  <View>
                    <Text style={styles.assignmentLabel}>Current Assignment</Text>
                    <Text style={styles.assignmentText}>{assignment}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.editHint}>
                <Ionicons name="create-outline" size={13} color="#9ca3af" />
                <Text style={styles.editHintText}>Tap to edit details</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Add/Edit Modal */}
      <Modal visible={!!modal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modal?.mode === "add" ? "Add Staff Member" : "Edit Staff"}</Text>
                <TouchableOpacity onPress={() => setModal(null)} style={styles.modalClose}>
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <MField label="Full Name *" value={fName} onChange={setFName} placeholder="e.g. Amit Sharma" />
                <MField label="Phone *" value={fPhone} onChange={setFPhone} placeholder="+91 98765 43210" keyboard="phone-pad" />
                <MField label="Role *" value={fRole} onChange={setFRole} placeholder="e.g. Technician" />
                <MField label="Work Area / Region" value={fWorkArea} onChange={setFWorkArea} placeholder="e.g. Sector 15-30, Noida" />
                {modal?.mode === "add" && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.loginSectionLabel}>Login Credentials</Text>
                    <MField label="Email Address *" value={fEmail} onChange={setFEmail} placeholder="staff@greenvolt.in" keyboard="email-address" />
                    <MField label="Temporary Password *" value={fPassword} onChange={setFPassword} placeholder="min 6 characters" secure />
                  </>
                )}
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, (saving || update.isPending) && styles.confirmBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving || update.isPending}
                >
                  {(saving || update.isPending)
                    ? <ActivityIndicator color="#00450d" size="small" />
                    : <Text style={styles.confirmBtnText}>{modal?.mode === "add" ? "Add Staff" : "Save Changes"}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function MField({ label, value, onChange, placeholder, keyboard, secure }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: any; secure?: boolean;
}) {
  return (
    <View style={mf.field}>
      <Text style={mf.label}>{label}</Text>
      <TextInput
        style={mf.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboard ?? "default"}
        secureTextEntry={secure}
        autoCapitalize={keyboard === "email-address" ? "none" : "words"}
      />
    </View>
  );
}

const mf = StyleSheet.create({
  field: { gap: 5 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: "#111827", backgroundColor: "#fafafa",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  list: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  contentEmpty: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 3, lineHeight: 18 },
  actionRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#00450d", borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 11, alignSelf: "flex-start",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 10, marginTop: 6,
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, height: 44, backgroundColor: "#fff",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  staffName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  staffId: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  assignmentBox: { backgroundColor: "#f8fafb", borderRadius: 10, padding: 12 },
  assignmentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  assignmentLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.3 },
  assignmentText: { fontSize: 13, color: "#374151", marginTop: 2 },
  editHint: { flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "flex-end" },
  editHintText: { fontSize: 11, color: "#9ca3af" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end",
  },
  modalWrap: { justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb",
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  modalClose: { padding: 4 },
  modalContent: { padding: 20, gap: 14 },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 4 },
  loginSectionLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5 },
  modalFooter: {
    flexDirection: "row", gap: 10, padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: "#f0f0f0",
  },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  confirmBtn: {
    flex: 1.5, backgroundColor: "#bcf200", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { fontSize: 14, fontWeight: "800", color: "#00450d" },
});
