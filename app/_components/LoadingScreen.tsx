/**
 * Full-screen loading state with Lottie animation.
 * Falls back to a neon spinning ring if Lottie is unavailable.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useTheme } from '../_contexts/ThemeContext';

type LoadingScreenProps = {
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
};

export function LoadingScreen({
  message,
  fullScreen = true,
  overlay = false,
}: LoadingScreenProps) {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const pulse = useSharedValue(1);
  const lottieRef = React.useRef<LottieView>(null);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const containerStyle = fullScreen
    ? [
      styles.overlay,
      {
        width,
        height,
        backgroundColor: overlay
          ? 'rgba(13,13,26,0.6)'
          : isDark
            ? colors.background + 'EE'
            : colors.background + 'EE',
      },
    ]
    : [styles.inline, { backgroundColor: 'transparent' }];

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.container, containerStyle]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.lottieWrap, pulseStyle]}>
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
          <NeonRingFallback colors={colors} />
        )}
      </Animated.View>

      {message ? (
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      ) : null}
    </Animated.View>
  );
}

/** Ring spinner fallback for web / if Lottie unavailable */
function NeonRingFallback({ colors }: { colors: any }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          borderTopColor: colors.primary,
          borderRightColor: colors.secondary + '60',
          borderBottomColor: colors.accent + '40',
          borderLeftColor: colors.primary + '80',
        },
        ringStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1000,
  },
  inline: {
    flex: 1,
    alignSelf: 'stretch',
    minHeight: 200,
  },
  lottieWrap: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 100,
    height: 100,
  },
  ring: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3.5,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    maxWidth: '75%',
    fontSize: 14,
    lineHeight: 20,
  },
});
