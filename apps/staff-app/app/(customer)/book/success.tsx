import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";

export default function BookSuccessScreen() {
  const { bookingId, serviceType, date, slot, total } = useLocalSearchParams<{
    bookingId: string;
    serviceType: string;
    date: string;
    slot: string;
    total: string;
  }>();

  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide    = useRef(new Animated.Value(30)).current;
  const cardOpacity  = useRef(new Animated.Value(0)).current;
  const btnsOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale,  { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 12 }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardSlide,   { toValue: 0, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      ]),
      Animated.timing(btnsOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const displayDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Checkmark */}
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={44} color="#00450d" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.titleBlock, { opacity: checkOpacity }]}>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <View style={styles.bookingIdBadge}>
            <Ionicons name="receipt-outline" size={13} color="#6b7280" />
            <Text style={styles.bookingIdText}>BOOKING ID: GV-{String(bookingId ?? "0").padStart(5, "0")}</Text>
          </View>
        </Animated.View>

        {/* Summary card */}
        <Animated.View
          style={[styles.summaryCard, { transform: [{ translateY: cardSlide }], opacity: cardOpacity }]}
        >
          <Text style={styles.summaryTitle}>Service Summary</Text>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Ionicons name="flash-outline" size={16} color="#00450d" />
              <Text style={styles.summaryLabel}>Service</Text>
            </View>
            <Text style={styles.summaryValue}>{serviceType ?? "—"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Ionicons name="calendar-outline" size={16} color="#00450d" />
              <Text style={styles.summaryLabel}>Schedule</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryValue}>{displayDate}</Text>
              <Text style={styles.summarySlot}>{slot ?? "—"}</Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{total ? Number(total).toLocaleString("en-IN") : "—"}</Text>
          </View>
        </Animated.View>

        {/* SMS note */}
        <Animated.View style={[styles.smsNote, { opacity: cardOpacity }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#6b7280" />
          <Text style={styles.smsNoteText}>You will receive an SMS confirmation shortly.</Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.btnGroup, { opacity: btnsOpacity }]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.replace("/(customer)/services")}
            activeOpacity={0.85}
          >
            <Ionicons name="list-outline" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>View My Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.replace("/(customer)" as never)}
            activeOpacity={0.75}
          >
            <Text style={styles.btnSecondaryText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  content: { padding: 24, paddingTop: 64, alignItems: "center", gap: 20, paddingBottom: 40 },

  checkWrap: { alignItems: "center", marginBottom: 4 },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#bcf200",
    justifyContent: "center", alignItems: "center",
  },

  titleBlock: { alignItems: "center", gap: 12 },
  successTitle: { fontSize: 26, fontWeight: "800", color: "#111827", letterSpacing: -0.5 },
  bookingIdBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  bookingIdText: { fontSize: 12, fontWeight: "700", color: "#374151", letterSpacing: 0.4 },

  summaryCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 20,
    width: "100%", gap: 14,
    borderWidth: 1, borderColor: "#f0f0f0",
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  divider: { height: 1, backgroundColor: "#f4f4f5" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryLabel: { fontSize: 14, color: "#374151" },
  summaryRight: { alignItems: "flex-end", gap: 2 },
  summaryValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  summarySlot: { fontSize: 12, color: "#9ca3af" },

  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f4f4f5", marginTop: -4,
  },
  totalLabel: { fontSize: 14, color: "#374151" },
  totalValue: { fontSize: 22, fontWeight: "800", color: "#00450d" },

  smsNote: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f3f4f6", borderRadius: 14, padding: 16,
    width: "100%",
  },
  smsNoteText: { fontSize: 13, color: "#6b7280", flex: 1, textAlign: "center" },

  btnGroup: { width: "100%", gap: 10, marginTop: 4 },
  btnPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#00450d", borderRadius: 14, paddingVertical: 16,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  btnSecondary: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", borderRadius: 14, paddingVertical: 16,
    borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  btnSecondaryText: { fontSize: 15, fontWeight: "700", color: "#374151" },
});
