import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getCatalogItem, calcPricing } from "@/constants/catalog";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { getToken } from "@/lib/auth";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const MOCK_COUPONS: Record<string, { label: string; discount: number; type: "flat" | "percent" }> = {
  SOLAR10:       { label: "10% off on all services",  discount: 10,  type: "percent" },
  FIRSTSERVICE:  { label: "₹100 off your first booking", discount: 100, type: "flat" },
  AMC10:         { label: "10% off AMC plans",        discount: 10,  type: "percent" },
};

function applyDiscount(total: number, coupon: { discount: number; type: "flat" | "percent" }) {
  if (coupon.type === "flat") return Math.min(coupon.discount, total);
  return Math.round(total * (coupon.discount / 100));
}

export default function BookReviewScreen() {
  const { id, date, slot, notes } = useLocalSearchParams<{
    id: string; date: string; slot: string; notes: string;
  }>();
  const item = getCatalogItem(id ?? "");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<null | { code: string; label: string; discount: number; type: "flat" | "percent" }>(null);
  const [couponError, setCouponError] = useState("");

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const found = MOCK_COUPONS[code];
    if (!found) {
      setCouponError("Invalid or expired coupon code.");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon({ code, ...found });
    setCouponError("");
    setCouponInput("");
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/me/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceType: item!.name,
          scheduledDate: date,
          timeSlot: slot,
          notes: notes || undefined,
          estimatedPrice: finalTotal,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Booking failed. Please try again.");
      }
      return res.json() as Promise<{ bookingId: number }>;
    },
    onSuccess: (data) => {
      router.replace({
        pathname: "/(customer)/book/success",
        params: {
          bookingId: String(data.bookingId),
          serviceType: item!.name,
          date: date ?? "",
          slot: slot ?? "",
          total: String(finalTotal),
        },
      });
    },
    onError: (err: Error) => {
      Alert.alert("Booking Failed", err.message);
    },
  });

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Service not found.</Text>
      </View>
    );
  }

  const { subtotal, tax, total } = calcPricing(item);
  const discountAmount = appliedCoupon ? applyDiscount(total, appliedCoupon) : 0;
  const finalTotal = total - discountAmount;

  const displayDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Review Order",
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.root}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

          {/* Service summary */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>SERVICE</Text>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceTagline}>{item.tagline}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text style={styles.metaText}>{displayDate}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text style={styles.metaText}>{slot || "—"}</Text>
            </View>
            {notes ? (
              <View style={styles.metaRow}>
                <Ionicons name="document-text-outline" size={14} color="#9ca3af" />
                <Text style={styles.metaText} numberOfLines={2}>{notes}</Text>
              </View>
            ) : null}
          </View>

          {/* Price breakdown — Zomato-style */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>PRICE BREAKDOWN</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceKey}>Service Charge</Text>
              <Text style={styles.priceVal}>₹{item.basePrice}</Text>
            </View>
            {item.visitCharge > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceKey}>Visit Charge</Text>
                <Text style={styles.priceVal}>₹{item.visitCharge}</Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.priceRowBorder]}>
              <Text style={styles.priceKey}>Subtotal</Text>
              <Text style={styles.priceVal}>₹{subtotal}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceKey}>GST (18%)</Text>
              <Text style={styles.priceVal}>₹{tax}</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.priceRow}>
                <View style={styles.discountLabelRow}>
                  <Ionicons name="pricetag-outline" size={12} color="#16a34a" />
                  <Text style={styles.discountKey}>Discount ({appliedCoupon?.code})</Text>
                </View>
                <Text style={styles.discountVal}>−₹{discountAmount}</Text>
              </View>
            )}

            <View style={[styles.totalRow]}>
              <Text style={styles.totalKey}>Total Amount</Text>
              <Text style={styles.totalVal}>₹{finalTotal}</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.savingsBanner}>
                <Ionicons name="happy-outline" size={14} color="#16a34a" />
                <Text style={styles.savingsText}>You saved ₹{discountAmount} on this booking!</Text>
              </View>
            )}
          </View>

          {/* Coupon section */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>OFFERS & COUPONS</Text>

            {appliedCoupon ? (
              <View style={styles.appliedCoupon}>
                <View style={styles.appliedCouponLeft}>
                  <Ionicons name="pricetag" size={16} color="#16a34a" />
                  <View>
                    <Text style={styles.appliedCode}>{appliedCoupon.code} applied</Text>
                    <Text style={styles.appliedLabel}>{appliedCoupon.label}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={removeCoupon} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.couponInputRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter coupon code"
                    placeholderTextColor="#9ca3af"
                    value={couponInput}
                    onChangeText={(t) => { setCouponInput(t); setCouponError(""); }}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={applyCoupon}
                  />
                  <TouchableOpacity
                    style={[styles.applyBtn, !couponInput.trim() && styles.applyBtnDisabled]}
                    onPress={applyCoupon}
                    disabled={!couponInput.trim()}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
                {couponError ? (
                  <View style={styles.couponError}>
                    <Ionicons name="alert-circle-outline" size={13} color="#ef4444" />
                    <Text style={styles.couponErrorText}>{couponError}</Text>
                  </View>
                ) : null}
                {/* Available coupons hint */}
                <LinearGradient
                  colors={["#1c1917", "#292524"]}
                  style={styles.offerHint}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="gift-outline" size={14} color="#f59e0b" />
                  <Text style={styles.offerHintText}>
                    Try <Text style={styles.offerHintCode}>SOLAR10</Text> or{" "}
                    <Text style={styles.offerHintCode}>FIRSTSERVICE</Text> for instant savings
                  </Text>
                </LinearGradient>
              </>
            )}
          </View>

          {/* Payment note */}
          <View style={styles.paymentNote}>
            <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
            <Text style={styles.paymentNoteText}>
              Payment will be collected by the technician at the time of service visit.
              Online payment coming soon.
            </Text>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Sticky CTA */}
        <View style={styles.stickyBottom}>
          <View style={styles.stickyLeft}>
            <Text style={styles.stickyLabel}>Total payable</Text>
            <Text style={styles.stickyTotal}>₹{finalTotal}</Text>
            {discountAmount > 0 && (
              <Text style={styles.stickySaved}>You saved ₹{discountAmount}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.ctaBtn, bookMutation.isPending && styles.ctaBtnDisabled]}
            onPress={() => bookMutation.mutate()}
            disabled={bookMutation.isPending}
            activeOpacity={0.85}
          >
            {bookMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.ctaBtnText}>Confirm Booking →</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 15, color: "#6b7280" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    gap: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  // Service row
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  serviceTagline: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  divider: { height: 1, backgroundColor: "#f3f4f6" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 13, color: "#374151", flex: 1 },

  // Price breakdown
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceRowBorder: { paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  priceKey: { fontSize: 13, color: "#6b7280" },
  priceVal: { fontSize: 13, color: "#374151", fontWeight: "500" },
  discountLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  discountKey: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
  discountVal: { fontSize: 13, color: "#16a34a", fontWeight: "700" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: "#f0fdf4",
    marginTop: 2,
  },
  totalKey: { fontSize: 15, fontWeight: "700", color: "#111827" },
  totalVal: { fontSize: 18, fontWeight: "800", color: "#111827" },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 10,
  },
  savingsText: { fontSize: 12, color: "#16a34a", fontWeight: "600", flex: 1 },

  // Coupon
  couponInputRow: { flexDirection: "row", gap: 10 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnDisabled: { backgroundColor: "#d1d5db" },
  applyBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  couponError: { flexDirection: "row", alignItems: "center", gap: 5 },
  couponErrorText: { fontSize: 12, color: "#ef4444" },
  offerHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
  },
  offerHintText: { fontSize: 12, color: "rgba(255,255,255,0.65)", flex: 1 },
  offerHintCode: { color: "#f59e0b", fontWeight: "700" },
  appliedCoupon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  appliedCouponLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  appliedCode: { fontSize: 14, fontWeight: "700", color: "#16a34a" },
  appliedLabel: { fontSize: 11, color: "#16a34a", opacity: 0.8, marginTop: 1 },

  // Payment note
  paymentNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  paymentNoteText: { fontSize: 12, color: "#92400e", flex: 1, lineHeight: 17 },

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
  stickyLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  stickyTotal: { fontSize: 20, fontWeight: "800", color: "#111827" },
  stickySaved: { fontSize: 10, color: "#16a34a", fontWeight: "700" },
  ctaBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: "#16a34a",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 170,
    alignItems: "center",
  },
  ctaBtnDisabled: { backgroundColor: "#9ca3af", shadowOpacity: 0 },
  ctaBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
