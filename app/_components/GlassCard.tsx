import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../_contexts/ThemeContext';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Optional left accent (gold) border */
  accent?: boolean;
};

export function GlassCard({ children, style, contentStyle, accent = true }: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const cardStyle = [
    styles.card,
    { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.28)' },
    accent && { borderLeftWidth: 4, borderLeftColor: colors.gold },
    style,
  ];
  const fallbackBg = isDark ? 'rgba(37,47,59,0.85)' : 'rgba(255,255,255,0.82)';

  return (
    <View style={cardStyle}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.fallback, { backgroundColor: fallbackBg }]} />
      ) : (
        <BlurView
          intensity={Platform.OS === 'ios' ? (isDark ? 40 : 70) : (isDark ? 35 : 60)}
          tint={isDark ? 'dark' : 'light'}
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
  },
  fallback: {},
  content: {
    padding: 16,
  },
});
