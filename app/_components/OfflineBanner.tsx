import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../_contexts/ThemeContext';

export function OfflineBanner() {
  const netInfo = useNetInfo();
  const { colors } = useTheme();
  const translateY = useSharedValue(-60);

  const isOffline = netInfo.isConnected === false;

  useEffect(() => {
    translateY.value = withSpring(isOffline ? 0 : -60, { damping: 14, stiffness: 220 });
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, { backgroundColor: colors.accent }, animatedStyle]}>
      <MaterialCommunityIcons name="wifi-off" size={18} color="#fff" />
      <Text style={styles.text}>You're offline — check your connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
