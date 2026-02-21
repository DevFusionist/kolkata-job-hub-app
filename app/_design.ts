/**
 * Shared design system aligned with login page:
 * - Responsive scale, background image style, card/button/input styles
 * - Reanimated enter/exit/layout presets for consistent transitions
 */
import { Dimensions } from 'react-native';
import type { ThemeColors } from './_theme';

const { width } = Dimensions.get('window');

/** Responsive scale (base 375). Use for padding, margins, font sizes. */
export function scale(size: number): number {
  return (width / 375) * size;
}

/** Background image style for nostalgic screens (login-style). */
export function imageBackgroundStyle(colors: ThemeColors) {
  return { opacity: 0.12, tintColor: colors.ink };
}

/** Slightly stronger opacity for tab screens that use tram image. */
export function imageBackgroundStyleTabs(colors: ThemeColors) {
  return { opacity: 0.15, tintColor: colors.ink };
}

/** GlassCard / content card style (border, padding, surface). */
export function cardStyle(colors: ThemeColors) {
  return {
    padding: scale(20),
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  };
}

/** Primary CTA button (ink bg, 48 height). */
export function mainButtonStyle(colors: ThemeColors) {
  return {
    backgroundColor: colors.ink,
    height: 48,
  };
}

/** Primary button label. */
export function mainButtonLabelStyle() {
  return {
    color: '#fff',
    fontWeight: 'bold' as const,
    letterSpacing: 1,
  };
}

/** TextInput theme (underline/label primary color). */
export function inputTheme(colors: ThemeColors) {
  return { colors: { primary: colors.terracotta } };
}

/** Section title (e.g. welcome, step title). */
export function sectionTitleStyle() {
  return { fontSize: 22, fontWeight: 'bold' as const, marginBottom: 10 };
}

/** Instruction / secondary body text. */
export function instructionTextStyle(colors: ThemeColors) {
  return {
    textAlign: 'center' as const,
    marginBottom: 20,
    color: colors.textSecondary,
  };
}

/** Scroll content padding (screen horizontal). */
export const screenPaddingHorizontal = scale(24);

/** Standard content padding (16). */
export const contentPadding = scale(16);
