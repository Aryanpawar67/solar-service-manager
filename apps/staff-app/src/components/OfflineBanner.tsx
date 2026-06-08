import { View, Text, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";

export function OfflineBanner({ visible }: { visible: boolean }) {
  const translateY = useRef(new Animated.Value(-48)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -48,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <Text style={styles.text}>⚡ No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  text: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
