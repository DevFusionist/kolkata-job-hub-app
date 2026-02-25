import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../_contexts/ThemeContext';
import LottieView from 'lottie-react-native';

export function FloatingAssistant() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const lottieRef = useRef<LottieView>(null);

  // Warm pulsing glow ring
  const ringScale = useSharedValue(1);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: 2 - ringScale.value,
  }));

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.88, { damping: 10, stiffness: 300 });
  };
  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <View style={styles.wrap}>
      {/* Warm glow ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            backgroundColor: colors.primary + '20',
            borderColor: colors.primary + '30',
          },
          ringStyle,
        ]}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(tabs)/protibha')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              ...Platform.select({
                ios: {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                },
                android: { elevation: 8 },
              }),
            },
            fabStyle,
          ]}
        >
          {Platform.OS !== 'web' ? (
            <LottieView
              ref={lottieRef}
              source={require('../../assets/lottie/loading.json')}
              autoPlay
              loop
              style={styles.lottie}
              renderMode="AUTOMATIC"
            />
          ) : (
            <MaterialCommunityIcons name="robot-happy" size={28} color="#FFF" />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 36,
    height: 36,
  },
});
