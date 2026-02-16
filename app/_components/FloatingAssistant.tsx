import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../_contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const ICON_SIZE = 54;
const GLOW_SIZE = 72;
const FLOAT_RANGE = 5;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDark } = useTheme();
  const isOnProtibha = pathname?.includes('protibha');

  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(isDark ? 0.45 : 0.35);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(FLOAT_RANGE, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(-FLOAT_RANGE, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(isDark ? 0.7 : 0.55, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(isDark ? 0.45 : 0.35, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [isDark]);

  const onPressIn = useCallback(() => {
    pressScale.value = withSpring(0.88, { damping: 15, stiffness: 300 });
  }, []);

  const onPressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);

  const onPress = useCallback(() => {
    router.push('/(tabs)/protibha');
  }, [router]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: pressScale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (isOnProtibha) return null;

  return (
    <AnimatedPressable
      style={[styles.fabWrapper, floatStyle]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityLabel="Open Protibha assistant"
      accessibilityRole="button"
    >
      {/* Outer neon glow ring */}
      <Animated.View style={[styles.glowRing, glowStyle, { borderColor: colors.gold }]}>
        <Animated.View
          style={[
            styles.glowRingInner,
            glowStyle,
            {
              borderColor: colors.terracotta,
              ...Platform.select({
                ios: {
                  shadowColor: colors.terracotta,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 14,
                },
                android: {},
              }),
            },
          ]}
        />
      </Animated.View>

      {/* Main button with gradient */}
      <LinearGradient
        colors={[colors.terracotta, colors.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.fab,
          Platform.select({
            ios: {
              shadowColor: colors.terracotta,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
            },
            android: { elevation: 10 },
          }),
        ]}
      >
        <MaterialCommunityIcons name="robot-happy-outline" size={26} color="#fff" />
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: GLOW_SIZE + 10,
    height: GLOW_SIZE + 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  glowRing: {
    position: 'absolute',
    width: GLOW_SIZE + 6,
    height: GLOW_SIZE + 6,
    borderRadius: (GLOW_SIZE + 6) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingInner: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    borderWidth: 1.5,
  },
  fab: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
