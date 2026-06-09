import { Animated, TouchableOpacity, ViewStyle, StyleProp } from "react-native";
import { useRef, ReactNode } from "react";

interface Props {
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
}

export function AnimatedPressable({ onPress, children, style, disabled, scaleTo = 0.96 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,       useNativeDriver: true, speed: 20, bounciness: 4 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
