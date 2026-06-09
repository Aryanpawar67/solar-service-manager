import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { router } from "expo-router";
import { setToken, decodeJwtPayload } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance animations
  const brandOpacity   = useRef(new Animated.Value(0)).current;
  const brandTranslate = useRef(new Animated.Value(-24)).current;
  const cardOpacity    = useRef(new Animated.Value(0)).current;
  const cardTranslate  = useRef(new Animated.Value(40)).current;
  const footerOpacity  = useRef(new Animated.Value(0)).current;
  // Button press animation
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(brandOpacity,   { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(brandTranslate, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity,   { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(footerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const onBtnPressIn  = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const onBtnPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 4 }).start();

  async function handleLogin() {
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid email or password");
        return;
      }
      const token = data.token ?? "";
      await setToken(token);
      const payload = decodeJwtPayload(token);
      const role = typeof payload?.role === "string" ? payload.role : "staff";
      if (role === "admin") router.replace("/(admin)/jobs");
      else if (role === "customer") router.replace("/(customer)");
      else router.replace("/(staff)/jobs");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#15803d" />

      {/* Decorative background circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleCenter} />

      {/* Branding — slides down + fades in */}
      <Animated.View style={[styles.brandArea, { opacity: brandOpacity, transform: [{ translateY: brandTranslate }] }]}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>☀️</Text>
        </View>
        <Text style={styles.brandName}>GreenVolt</Text>
        <Text style={styles.brandTagline}>Solar Service Management</Text>
        <Text style={styles.brandProvider}>Service Provider: Sun House Solar</Text>
      </Animated.View>

      {/* Form card — slides up + fades in */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.cardWrapper}>
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@greenvolt.in"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <Animated.View style={[styles.errorBox, { opacity: cardOpacity }]}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </Animated.View>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            onPressIn={onBtnPressIn}
            onPressOut={onBtnPressOut}
            disabled={isPending}
            activeOpacity={1}
          >
            <Animated.View style={[styles.button, isPending && styles.buttonDisabled, { transform: [{ scale: btnScale }] }]}>
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In →</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>

      <Animated.Text style={[styles.footer, { opacity: footerOpacity }]}>
        GreenVolt © 2025 · Solar Service Platform
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#16a34a", justifyContent: "center" },

  circleTopRight: {
    position: "absolute", width: 300, height: 300, borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.07)", top: -80, right: -70,
  },
  circleBottomLeft: {
    position: "absolute", width: 240, height: 240, borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: 60, left: -90,
  },
  circleCenter: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.04)", top: "35%", right: -40,
  },

  brandArea: { alignItems: "center", marginBottom: 24, paddingHorizontal: 24 },
  iconBadge: {
    width: 68, height: 68, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
  },
  iconText: { fontSize: 34 },
  brandName: { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  brandTagline: { fontSize: 14, color: "#bbf7d0", marginTop: 4, fontWeight: "500" },
  brandProvider: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 },

  cardWrapper: { paddingHorizontal: 20 },
  card: {
    backgroundColor: "#fff", borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: "#6b7280", marginBottom: 20 },

  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: "#111827", backgroundColor: "#f9fafb", marginBottom: 16,
  },
  passwordRow: { position: "relative", marginBottom: 16 },
  passwordInput: { marginBottom: 0, paddingRight: 50 },
  eyeBtn: { position: "absolute", right: 12, top: 12, padding: 2 },
  eyeText: { fontSize: 18 },

  errorBox: {
    backgroundColor: "#fef2f2", borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: "#fecaca",
  },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "500" },

  button: {
    backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 16,
    alignItems: "center", marginTop: 4,
    shadowColor: "#16a34a", shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  footer: {
    textAlign: "center", color: "rgba(255,255,255,0.45)",
    fontSize: 11, marginTop: 24, paddingBottom: 16,
  },
});
