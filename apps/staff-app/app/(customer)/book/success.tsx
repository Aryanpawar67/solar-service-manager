import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
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

  // Entrance animations
  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide    = useRef(new Animated.Value(40)).current;
  const cardOpacity  = useRef(new Animated.Value(0)).current;
  const btnsOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1 — checkmark pops in
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 12 }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      // 2 — detail card slides up
      Animated.parallel([
        Animated.timing(cardSlide,   { toValue: 0,  duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1,  duration: 380, useNativeDriver: true }),
      ]),
      // 3 — buttons fade in
      Animated.timing(btnsOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const displayDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>

        {/* Top green section */}
        <View style={styles.topSection}>
          {/* Animated checkmark */}
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}>
            <View style={styles.checkInner}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: checkOpacity, alignItems: "center", gap: 6 }}>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSub}>Your service has been scheduled</Text>
          </Animated.View>

          <Animated.View style={[styles.bookingIdBadge, { opacity: checkOpacity }]}>
            <Ionicons name="receipt-outline" size={13} color="#bbf7d0" />
            <Text style={styles.bookingIdText}>Booking ID: #SVC-{bookingId}</Text>
          </Animated.View>
        </View>

        {/* Detail card */}
        <Animated.View
          style={[
            styles.detailCard,
            { transform: [{ translateY: cardSlide }], opacity: cardOpacity },
          ]}
        >
          <Text style={styles.detailLabel}>BOOKING SUMMARY</Text>

          <DetailRow icon="construct-outline" label="Service" value={serviceType ?? "—"} />
          <View style={styles.rowDivider} />
          <DetailRow icon="calendar-outline" label="Date" value={displayDate} />
          <View style={styles.rowDivider} />
          <DetailRow icon="time-outline" label="Time Slot" value={slot ?? "—"} />
          <View style={styles.rowDivider} />
          <DetailRow
            icon="cash-outline"
            label="Est. Amount"
            value={total ? `₹${total}` : "—"}
            valueColor="#00450d"
          />

          <View style={styles.smsNote}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#00450d" />
            <Text style={styles.smsNoteText}>
              SMS confirmation sent to your registered number. A technician will be assigned soon.
            </Text>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View style={[styles.btnGroup, { opacity: btnsOpacity }]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.replace("/(customer)/services")}
            activeOpacity={0.85}
          >
            <Ionicons name="construct-outline" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>View My Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.replace("/(customer)" as never)}
            activeOpacity={0.75}
          >
            <Ionicons name="home-outline" size={18} color="#00450d" />
            <Text style={styles.btnSecondaryText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>
        <Ionicons name={icon} size={15} color="#00450d" />
      </View>
      <View style={styles.detailRowContent}>
        <Text style={styles.detailRowLabel}>{label}</Text>
        <Text style={[styles.detailRowValue, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4" },

  topSection: {
    backgroundColor: "#00450d",
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 48,
    gap: 16,
  },

  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  successTitle: { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  successSub: { fontSize: 14, color: "rgba(255,255,255,0.75)" },

  bookingIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  bookingIdText: { fontSize: 13, color: "#bbf7d0", fontWeight: "700", letterSpacing: 0.3 },

  // Detail card
  detailCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    gap: 4,
    marginTop: -24,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  detailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  detailIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  detailRowContent: { flex: 1 },
  detailRowLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  detailRowValue: { fontSize: 14, color: "#111827", fontWeight: "600", marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: "#f9fafb", marginLeft: 44 },

  smsNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  smsNoteText: { fontSize: 12, color: "#00450d", flex: 1, lineHeight: 17 },

  // Buttons
  btnGroup: { paddingHorizontal: 16, gap: 10, marginTop: 8 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00450d",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#00450d",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
  },
  btnSecondaryText: { fontSize: 15, fontWeight: "700", color: "#00450d" },
});
