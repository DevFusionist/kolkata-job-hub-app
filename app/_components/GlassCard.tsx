import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../_theme';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Optional left accent (gold) border */
  accent?: boolean;
};

export function GlassCard({ children, style, contentStyle, accent = true }: GlassCardProps) {
  const cardStyle = [styles.card, accent && styles.cardAccent, style];

  return (
    <View style={cardStyle}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.fallback]} />
      ) : (
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 35}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    ...(Platform.OS === 'web' && {
      backgroundColor: 'rgba(255,255,255,0.18)',
    }),
  },
  cardAccent: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  fallback: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  content: {
    padding: 16,
  },
});
