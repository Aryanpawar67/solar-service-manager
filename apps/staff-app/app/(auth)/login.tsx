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
  Alert,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { router } from "expo-router";
import { setToken, decodeJwtPayload } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const brandOpacity   = useRef(new Animated.Value(0)).current;
  const brandTranslate = useRef(new Animated.Value(-20)).current;
  const cardOpacity    = useRef(new Animated.Value(0)).current;
  const cardTranslate  = useRef(new Animated.Value(32)).current;
  const footerOpacity  = useRef(new Animated.Value(0)).current;
  const btnScale       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(brandOpacity,   { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(brandTranslate, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity,   { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(footerOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 4 }).start();

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
    <LinearGradient
      colors={["#e8f5e9", "#f1f8e9", "#ffffff"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />

      <Animated.View style={[styles.brandArea, { opacity: brandOpacity, transform: [{ translateY: brandTranslate }] }]}>
        <View style={styles.logoBox}>
          <Ionicons name="flash" size={32} color="#00450d" />
        </View>
        <Text style={styles.brandName}>GreenVolt</Text>
        <Text style={styles.brandTagline}>Efficient stewardship of your solar telemetry.</Text>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.cardWrapper}>
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
          <Text style={styles.cardTitle}>Welcome Back</Text>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="operator@greenvolt.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotRow} onPress={() => router.push("/(auth)/forgot-password")} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={isPending}
            activeOpacity={1}
          >
            <Animated.View style={[styles.button, isPending && styles.buttonDisabled, { transform: [{ scale: btnScale }] }]}>
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login  →</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>

      <Animated.View style={[styles.footerRow, { opacity: footerOpacity }]}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/register")} activeOpacity={0.7}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center" },

  brandArea: { alignItems: "center", marginBottom: 28, paddingHorizontal: 24 },
  logoBox: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: "#d1fae5",
    justifyContent: "center", alignItems: "center",
    marginBottom: 14,
  },
  brandName: { fontSize: 30, fontWeight: "800", color: "#00450d", letterSpacing: 0.2 },
  brandTagline: { fontSize: 13, color: "#52525b", marginTop: 6, textAlign: "center", lineHeight: 19 },

  cardWrapper: { paddingHorizontal: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 20 },

  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    marginBottom: 16,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  eyeBtn: { padding: 4 },

  forgotRow: { alignItems: "flex-end", marginBottom: 16, marginTop: -4 },
  forgotText: { fontSize: 13, color: "#00450d", fontWeight: "600" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1 },

  button: {
    backgroundColor: "#00450d",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.3 },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    paddingBottom: 16,
  },
  footerText: { fontSize: 13, color: "#6b7280" },
  footerLink: { fontSize: 13, color: "#00450d", fontWeight: "700" },
});
