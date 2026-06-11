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

// Lazily import Razorpay so the app doesn't crash in Expo Go
let RazorpayCheckout: typeof import("react-native-razorpay").default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RazorpayCheckout = require("react-native-razorpay").default;
} catch {}

type AppliedCoupon = {
  couponId: number;
  code: string;
  description: string;
  discount: number;
};

const PAYMENT_METHODS = [
  { id: "upi",        label: "UPI",          icon: "qr-code-outline" as const,   sub: "GPay, PhonePe, Paytm" },
  { id: "card",       label: "Card",         icon: "card-outline" as const,       sub: "Debit / Credit" },
  { id: "netbanking", label: "Net Banking",  icon: "business-outline" as const,   sub: "All major banks" },
  { id: "wallet",     label: "Wallet",       icon: "wallet-outline" as const,     sub: "Paytm, Amazon Pay" },
  { id: "cash",       label: "Cash",         icon: "cash-outline" as const,       sub: "Pay on service" },
] as const;

type PaymentMethodId = typeof PAYMENT_METHODS[number]["id"];

export default function BookReviewScreen() {
  const { id, date, slot, notes } = useLocalSearchParams<{
    id: string; date: string; slot: string; notes: string;
  }>();
  const item = getCatalogItem(id ?? "");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("upi");

  const { subtotal, tax, total } = item ? calcPricing(item) : { subtotal: 0, tax: 0, total: 0 };
  const discountAmount = appliedCoupon?.discount ?? 0;
  const finalTotal = total - discountAmount;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/me/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, orderAmount: total }),
      });
      const data = await res.json() as { error?: string; couponId?: number; code?: string; description?: string; discount?: number };
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid coupon code.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ couponId: data.couponId!, code: data.code!, description: data.description!, discount: data.discount! });
        setCouponInput("");
      }
    } catch {
      setCouponError("Could not validate coupon. Check your connection.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponError(""); };

  // ── Cash booking ─────────────────────────────────────────────────────────────
  const cashMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/me/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          serviceType: item!.name,
          scheduledDate: date,
          timeSlot: slot,
          notes: notes || undefined,
          estimatedPrice: finalTotal,
          couponId: appliedCoupon?.couponId,
          discountApplied: discountAmount > 0 ? discountAmount : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Booking failed. Please try again.");
      }
      return res.json() as Promise<{ bookingId: number }>;
    },
    onSuccess: (data) => navigateSuccess(data.bookingId),
    onError: (err: Error) => Alert.alert("Booking Failed", err.message),
  });

  // ── Online payment (Razorpay) ─────────────────────────────────────────────────
  const onlineMutation = useMutation({
    mutationFn: async () => {
      if (!RazorpayCheckout) {
        throw new Error(
          "Online payments require a dev build. Please build the app with EAS or use Cash payment."
        );
      }

      const token = await getToken();

      // Step 1: create Razorpay order
      const orderRes = await fetch(`${API_URL}/api/me/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: finalTotal }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Could not initiate payment.");
      }
      const { razorpayOrderId, amount, currency, paymentId, keyId } =
        await orderRes.json() as {
          razorpayOrderId: string;
          amount: number;
          currency: string;
          paymentId: number;
          keyId: string;
        };

      // Step 2: open Razorpay checkout
      const checkoutOptions = {
        description: `GreenVolt – ${item!.name}`,
        currency,
        key: keyId,
        amount,
        order_id: razorpayOrderId,
        name: "GreenVolt",
        theme: { color: "#00450d" },
        retry: { enabled: false },
        ...(paymentMethod !== "cash" && { method: { [paymentMethod]: 1 } }),
      };

      let paymentData: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
      try {
        paymentData = await RazorpayCheckout.open(checkoutOptions) as typeof paymentData;
      } catch {
        // User cancelled or checkout was dismissed — mark payment as cancelled
        fetch(`${API_URL}/api/me/razorpay/cancel-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ razorpayOrderId }),
        }).catch(() => {});
        throw new Error("Payment cancelled.");
      }

      // Step 3: verify + create booking
      const verifyRes = await fetch(`${API_URL}/api/me/razorpay/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          razorpayPaymentId: paymentData.razorpay_payment_id,
          razorpayOrderId: paymentData.razorpay_order_id,
          razorpaySignature: paymentData.razorpay_signature,
          paymentId,
          serviceType: item!.name,
          scheduledDate: date,
          timeSlot: slot,
          notes: notes || undefined,
          finalAmount: finalTotal,
          couponId: appliedCoupon?.couponId,
          discountApplied: discountAmount > 0 ? discountAmount : undefined,
        }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Payment verification failed.");
      }
      return verifyRes.json() as Promise<{ bookingId: number }>;
    },
    onSuccess: (data) => navigateSuccess(data.bookingId),
    onError: (err: Error) => Alert.alert("Payment Failed", err.message),
  });

  const navigateSuccess = (bookingId: number) => {
    router.replace({
      pathname: "/(customer)/book/success",
      params: {
        bookingId: String(bookingId),
        serviceType: item!.name,
        date: date ?? "",
        slot: slot ?? "",
        total: String(finalTotal),
      },
    });
  };

  const handleConfirm = () => {
    if (paymentMethod === "cash") {
      cashMutation.mutate();
    } else {
      onlineMutation.mutate();
    }
  };

  const isPending = cashMutation.isPending || onlineMutation.isPending;

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Service not found.</Text>
      </View>
    );
  }

  const displayDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Review & Pay",
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

          {/* Price breakdown */}
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
                  <Ionicons name="pricetag-outline" size={12} color="#00450d" />
                  <Text style={styles.discountKey}>Discount ({appliedCoupon?.code})</Text>
                </View>
                <Text style={styles.discountVal}>−₹{discountAmount}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalKey}>Total Amount</Text>
              <Text style={styles.totalVal}>₹{finalTotal}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.savingsBanner}>
                <Ionicons name="happy-outline" size={14} color="#00450d" />
                <Text style={styles.savingsText}>You saved ₹{discountAmount} on this booking!</Text>
              </View>
            )}
          </View>

          {/* Coupon */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>OFFERS & COUPONS</Text>
            {appliedCoupon ? (
              <View style={styles.appliedCoupon}>
                <View style={styles.appliedCouponLeft}>
                  <Ionicons name="pricetag" size={16} color="#00450d" />
                  <View>
                    <Text style={styles.appliedCode}>{appliedCoupon.code} applied</Text>
                    <Text style={styles.appliedLabel}>{appliedCoupon.description}</Text>
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
                    editable={!couponLoading}
                  />
                  <TouchableOpacity
                    style={[styles.applyBtn, (!couponInput.trim() || couponLoading) && styles.applyBtnDisabled]}
                    onPress={applyCoupon}
                    disabled={!couponInput.trim() || couponLoading}
                    activeOpacity={0.75}
                  >
                    {couponLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.applyBtnText}>Apply</Text>
                    }
                  </TouchableOpacity>
                </View>
                {couponError ? (
                  <View style={styles.couponError}>
                    <Ionicons name="alert-circle-outline" size={13} color="#ef4444" />
                    <Text style={styles.couponErrorText}>{couponError}</Text>
                  </View>
                ) : null}
                <LinearGradient colors={["#1c1917", "#292524"]} style={styles.offerHint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="gift-outline" size={14} color="#f59e0b" />
                  <Text style={styles.offerHintText}>
                    Try <Text style={styles.offerHintCode}>SOLAR10</Text> or{" "}
                    <Text style={styles.offerHintCode}>FIRSTSERVICE</Text> for instant savings
                  </Text>
                </LinearGradient>
              </>
            )}
          </View>

          {/* Payment method */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>PAYMENT METHOD</Text>
            <View style={styles.methodGrid}>
              {PAYMENT_METHODS.map((m) => {
                const selected = paymentMethod === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.methodChip, selected && styles.methodChipSelected]}
                    onPress={() => setPaymentMethod(m.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.methodIconBox, selected && styles.methodIconBoxSelected]}>
                      <Ionicons name={m.icon} size={18} color={selected ? "#00450d" : "#6b7280"} />
                    </View>
                    <Text style={[styles.methodLabel, selected && styles.methodLabelSelected]}>{m.label}</Text>
                    <Text style={styles.methodSub}>{m.sub}</Text>
                    {selected && (
                      <View style={styles.methodCheck}>
                        <Ionicons name="checkmark-circle" size={16} color="#00450d" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {paymentMethod !== "cash" && (
              <View style={styles.onlineNote}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#00450d" />
                <Text style={styles.onlineNoteText}>
                  Secured by Razorpay. Supports UPI, cards, wallets and net banking.
                </Text>
              </View>
            )}
            {paymentMethod === "cash" && (
              <View style={styles.cashNote}>
                <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
                <Text style={styles.cashNoteText}>
                  Payment will be collected by the technician at the time of service.
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Sticky CTA */}
        <View style={styles.stickyBottom}>
          <View style={styles.stickyLeft}>
            <Text style={styles.stickyLabel}>Total payable</Text>
            <Text style={styles.stickyTotal}>₹{finalTotal}</Text>
            {discountAmount > 0 && (
              <Text style={styles.stickySaved}>Saved ₹{discountAmount}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.ctaBtn, isPending && styles.ctaBtnDisabled]}
            onPress={handleConfirm}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={paymentMethod === "cash" ? "checkmark-circle-outline" : "lock-closed-outline"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.ctaBtnText}>
                  {paymentMethod === "cash" ? "Confirm Booking" : `Pay ₹${finalTotal}`}
                </Text>
              </>
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
  cardLabel: { fontSize: 11, fontWeight: "800", color: "#9ca3af", letterSpacing: 0.8, marginBottom: 2 },

  serviceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  serviceIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  serviceTagline: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  divider: { height: 1, backgroundColor: "#f3f4f6" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 13, color: "#374151", flex: 1 },

  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceRowBorder: { paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  priceKey: { fontSize: 13, color: "#6b7280" },
  priceVal: { fontSize: 13, color: "#374151", fontWeight: "500" },
  discountLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  discountKey: { fontSize: 13, color: "#00450d", fontWeight: "600" },
  discountVal: { fontSize: 13, color: "#00450d", fontWeight: "700" },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTopWidth: 1.5, borderTopColor: "#f0fdf4", marginTop: 2,
  },
  totalKey: { fontSize: 15, fontWeight: "700", color: "#111827" },
  totalVal: { fontSize: 18, fontWeight: "800", color: "#111827" },
  savingsBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10,
  },
  savingsText: { fontSize: 12, color: "#00450d", fontWeight: "600", flex: 1 },

  couponInputRow: { flexDirection: "row", gap: 10 },
  couponInput: {
    flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111827",
    backgroundColor: "#f9fafb", letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: "#00450d", borderRadius: 12, paddingHorizontal: 20,
    justifyContent: "center", alignItems: "center", minWidth: 72,
  },
  applyBtnDisabled: { backgroundColor: "#d1d5db" },
  applyBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  couponError: { flexDirection: "row", alignItems: "center", gap: 5 },
  couponErrorText: { fontSize: 12, color: "#ef4444" },
  offerHint: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12, marginTop: 2 },
  offerHintText: { fontSize: 12, color: "rgba(255,255,255,0.65)", flex: 1 },
  offerHintCode: { color: "#f59e0b", fontWeight: "700" },
  appliedCoupon: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#bbf7d0",
  },
  appliedCouponLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  appliedCode: { fontSize: 14, fontWeight: "700", color: "#00450d" },
  appliedLabel: { fontSize: 11, color: "#00450d", opacity: 0.8, marginTop: 1 },

  // Payment method
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  methodChip: {
    width: "30%",
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    padding: 12,
    alignItems: "center",
    gap: 5,
    position: "relative",
  },
  methodChipSelected: {
    borderColor: "#00450d",
    backgroundColor: "#f0fdf4",
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  methodIconBoxSelected: { backgroundColor: "#dcfce7" },
  methodLabel: { fontSize: 13, fontWeight: "700", color: "#374151" },
  methodLabelSelected: { color: "#00450d" },
  methodSub: { fontSize: 9, color: "#9ca3af", textAlign: "center" },
  methodCheck: { position: "absolute", top: 6, right: 6 },

  onlineNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10,
  },
  onlineNoteText: { fontSize: 12, color: "#00450d", flex: 1, lineHeight: 17 },
  cashNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fef3c7", borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: "#fde68a",
  },
  cashNoteText: { fontSize: 12, color: "#92400e", flex: 1, lineHeight: 17 },

  stickyBottom: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: "#f3f4f6",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  stickyLeft: { gap: 2 },
  stickyLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  stickyTotal: { fontSize: 20, fontWeight: "800", color: "#111827" },
  stickySaved: { fontSize: 10, color: "#00450d", fontWeight: "700" },
  ctaBtn: {
    backgroundColor: "#00450d", borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14,
    shadowColor: "#00450d", shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
    minWidth: 160, alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center",
  },
  ctaBtnDisabled: { backgroundColor: "#9ca3af", shadowOpacity: 0 },
  ctaBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
