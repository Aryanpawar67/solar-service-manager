import { Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";

export function OfflineBanner({ visible }: { visible: boolean }) {
  const translateY = useRef(new Animated.Value(-52)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : -52,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <Ionicons name="wifi-outline" size={14} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 44,
    backgroundColor: "#374151",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    zIndex: 1000,
  },
  text: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
