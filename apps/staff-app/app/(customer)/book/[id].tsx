import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getCatalogItem, calcPricing, TIME_SLOTS } from "@/constants/catalog";
import { useState, useMemo } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getNext14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // start from tomorrow
    return d;
  });
}

function toDateString(d: Date) {
  return d.toISOString().split("T")[0]!;
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = getCatalogItem(id ?? "");

  const dates = useMemo(() => getNext14Days(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]!);
  const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[0]!);
  const [notes, setNotes] = useState("");

  if (!item) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
        <Text style={styles.errorText}>Service not found.</Text>
      </View>
    );
  }

  const { total } = calcPricing(item);

  const handleContinue = () => {
    router.push({
      pathname: "/(customer)/book/review",
      params: {
        id: item.id,
        date: toDateString(selectedDate),
        slot: selectedSlot,
        notes: notes.trim(),
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: item.name,
          headerStyle: { backgroundColor: "#00450d" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700", fontSize: 15 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.root}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

          {/* Service summary card */}
          <View style={styles.serviceCard}>
            <View style={[styles.serviceIconBox, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text style={styles.serviceDesc}>{item.description}</Text>
              {item.durationMins > 0 && (
                <View style={styles.durationRow}>
                  <Ionicons name="time-outline" size={12} color="#9ca3af" />
                  <Text style={styles.durationText}>~{item.durationMins} min</Text>
                </View>
              )}
            </View>
          </View>

          {/* What's included */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WHAT'S INCLUDED</Text>
            <View style={styles.includesList}>
              {item.includes.map((inc) => (
                <View key={inc} style={styles.includeRow}>
                  <View style={styles.includeDot}>
                    <Ionicons name="checkmark" size={12} color="#00450d" />
                  </View>
                  <Text style={styles.includeText}>{inc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Date picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT DATE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScroll}
            >
              {dates.map((d) => {
                const isSelected = toDateString(d) === toDateString(selectedDate);
                return (
                  <TouchableOpacity
                    key={toDateString(d)}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                    onPress={() => setSelectedDate(d)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dateDayName, isSelected && styles.dateDayNameSelected]}>
                      {DAYS[d.getDay()]}
                    </Text>
                    <Text style={[styles.dateDayNum, isSelected && styles.dateDayNumSelected]}>
                      {d.getDate()}
                    </Text>
                    <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                      {d.toLocaleDateString("en-IN", { month: "short" })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time slot picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT TIME SLOT</Text>
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = slot === selectedSlot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                    onPress={() => setSelectedSlot(slot)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={isSelected ? "#00450d" : "#9ca3af"}
                    />
                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADDITIONAL NOTES (OPTIONAL)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any specific instructions for the technician..."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Padding for sticky button */}
          <View style={{ height: 100 }} />

        </ScrollView>

        {/* Sticky bottom CTA */}
        <View style={styles.stickyBottom}>
          <View style={styles.stickyLeft}>
            <Text style={styles.stickyDate}>
              {selectedDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </Text>
            <Text style={styles.stickySlot}>{selectedSlot}</Text>
          </View>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>Review Order →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 15, color: "#6b7280" },

  // Service card
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  serviceInfo: { flex: 1, gap: 4 },
  serviceName: { fontSize: 16, fontWeight: "800", color: "#111827" },
  serviceDesc: { fontSize: 12, color: "#6b7280", lineHeight: 18 },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  durationText: { fontSize: 11, color: "#9ca3af" },

  // Sections
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.8,
  },

  // Includes
  includesList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  includeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  includeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  includeText: { fontSize: 13, color: "#374151", fontWeight: "500" },

  // Date picker
  dateScroll: { gap: 8, paddingVertical: 4 },
  dateChip: {
    width: 58,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dateChipSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#00450d",
  },
  dateDayName: { fontSize: 10, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" },
  dateDayNameSelected: { color: "#00450d" },
  dateDayNum: { fontSize: 22, fontWeight: "800", color: "#374151" },
  dateDayNumSelected: { color: "#00450d" },
  dateMonth: { fontSize: 10, color: "#9ca3af" },
  dateMonthSelected: { color: "#00450d" },

  // Time slots
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  slotChipSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#00450d",
  },
  slotText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  slotTextSelected: { color: "#00450d" },

  // Notes
  notesInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 90,
  },

  // Sticky bottom
  stickyBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  stickyLeft: { gap: 2 },
  stickyDate: { fontSize: 13, fontWeight: "700", color: "#111827" },
  stickySlot: { fontSize: 11, color: "#9ca3af" },
  ctaBtn: {
    backgroundColor: "#00450d",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: "#00450d",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
