/**
 * Full-screen loading state with elite, professional animation.
 * Fade-in overlay + subtle pulse on indicator (no spring).
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
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
import { useTheme } from '../_contexts/ThemeContext';

type LoadingScreenProps = {
  message?: string;
  /** Use over a specific area instead of full screen */
  fullScreen?: boolean;
  /** Semi-transparent overlay (e.g. over form during submit) */
  overlay?: boolean;
};

export function LoadingScreen({ message, fullScreen = true, overlay = false }: LoadingScreenProps) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const pulse = useSharedValue(1);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const containerStyle = fullScreen
    ? [styles.overlay, { width, height, backgroundColor: overlay ? 'rgba(0,0,0,0.35)' : colors.background }]
    : [styles.inline, { backgroundColor: colors.background }];

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.container, containerStyle]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.indicatorWrap, pulseStyle]}>
        <Animated.View
          style={[
            styles.ring,
            {
              borderTopColor: colors.terracotta,
              borderRightColor: colors.terracotta + '40',
              borderBottomColor: colors.terracotta + '20',
              borderLeftColor: colors.terracotta + '60',
            },
            ringStyle,
          ]}
        />
        <View style={[styles.ringInner, { backgroundColor: colors.background }]} />
      </Animated.View>
      {message ? (
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {message}
        </Text>
      ) : null}
    </Animated.View>
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
  indicatorWrap: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
  },
  ringInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
