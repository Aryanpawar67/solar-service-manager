import { Animated, ViewStyle } from "react-native";
import { useRef, useEffect, ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  duration?: number;
  fromY?: number;
  fromX?: number;
  style?: ViewStyle | ViewStyle[];
}

export function FadeInView({ children, delay = 0, duration = 380, fromY = 18, fromX = 0, style }: Props) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;
  const translateX = useRef(new Animated.Value(fromX)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }, { translateX }] }, style]}>
      {children}
    </Animated.View>
  );
}
