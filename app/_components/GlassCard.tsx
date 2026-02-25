import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../_contexts/ThemeContext';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Show top-left accent blob (default: true) */
  accent?: boolean;
  /** Show warm glow shadow */
  glow?: boolean;
};

export function GlassCard({
  children,
  style,
  contentStyle,
  accent = true,
  glow = false,
}: GlassCardProps) {
  const { colors, isDark } = useTheme();

  const containerStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    // Warm soft shadow
    Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: glow ? 8 : 4 },
        shadowOpacity: glow ? 0.2 : 0.1,
        shadowRadius: glow ? 20 : 12,
      },
      android: { elevation: glow ? 8 : 4 },
    }),
    style,
  ];

  return (
    <View style={containerStyle}>
      {/* Playful accent blob (top-left corner) */}
      {accent && (
        <View
          style={[
            styles.accentBlob,
            { backgroundColor: isDark ? colors.primary + '18' : colors.primary + '12' },
          ]}
        />
      )}

      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBlob: {
    position: 'absolute',
    left: -12,
    top: -12,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  content: {
    padding: 18,
  },
});
