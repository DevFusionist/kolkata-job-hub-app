import { useRef, useCallback } from "react";
import { Pressable, Animated, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

interface AnimatedPressableProps extends PressableProps {
  scaleDown?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedPressable({ scaleDown = 0.97, style, children, onPressIn, onPressOut, ...rest }: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.spring(scale, { toValue: scaleDown, useNativeDriver: true, damping: 15, stiffness: 200 }).start();
      onPressIn?.(e);
    },
    [scaleDown, onPressIn, scale],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }).start();
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
