/**
 * Shared design system — Toony Bengali Joy
 * Warm, playful, cartoon-inspired.
 * Radius tokens, soft shadows, responsive scale helpers.
 */
import { Dimensions, Platform } from 'react-native';
import type { ThemeColors } from './_theme';

const { width } = Dimensions.get('window');

// ─── Radius tokens (cartoon feel) ─────────────────────────────────────────────

export const radius = {
  sm: 12,
  md: 20,
  lg: 32,
  xl: 50,
} as const;

// ─── Font family tokens ───────────────────────────────────────────────────────

/** Heading font: Poppins — friendly, geometric, startup vibe. */
export const fontHeading = 'Poppins_600SemiBold';
export const fontHeadingBold = 'Poppins_700Bold';

/** Body font: HindSiliguri — great for Bengali + English readability. */
export const fontBody = 'HindSiliguri_400Regular';
export const fontBodyMedium = 'HindSiliguri_500Medium';
export const fontBodyBold = 'HindSiliguri_600SemiBold';

// ─── Responsive scale ─────────────────────────────────────────────────────────

/** Responsive scale (base 375). Use for padding, margins, font sizes. */
export function scale(size: number): number {
  return (width / 375) * size;
}

// ─── Image background helpers ─────────────────────────────────────────────────

/** Background image style — subtle warm tint for any ImageBackground. */
export function imageBackgroundStyle(colors: ThemeColors) {
  return { opacity: 0.06, tintColor: colors.primary };
}

/** Slightly stronger opacity for tab screens. */
export function imageBackgroundStyleTabs(colors: ThemeColors) {
  return { opacity: 0.08, tintColor: colors.primary };
}

// ─── Card style ───────────────────────────────────────────────────────────────

/** Playful card style — warm, very rounded, soft shadow. */
export function cardStyle(colors: ThemeColors) {
  return {
    padding: scale(20),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  };
}

// ─── Shadow helpers ───────────────────────────────────────────────────────────

/** Soft warm shadow for playful depth. Emotional trust via soft shadows. */
export function softShadow(colors: ThemeColors, intensity: 'low' | 'med' | 'high' = 'med') {
  const opacity = intensity === 'low' ? 0.08 : intensity === 'med' ? 0.15 : 0.25;
  const shadowRadius = intensity === 'low' ? 8 : intensity === 'med' ? 16 : 24;
  const elevation = intensity === 'low' ? 3 : intensity === 'med' ? 6 : 10;
  return Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: opacity,
      shadowRadius: shadowRadius,
    },
    android: { elevation },
    default: {},
  });
}

// Backward compat aliases
export const neonShadow = softShadow;

/** Warm border color helper. */
export function warmBorderColor(colors: ThemeColors, strong = false) {
  return strong ? colors.borderGlow : colors.border;
}

export const glowBorderColor = warmBorderColor;

// ─── Button helpers ───────────────────────────────────────────────────────────

/** Primary CTA button (solid warm, very rounded). */
export function mainButtonStyle(colors: ThemeColors) {
  return {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.lg,
  };
}

/** Primary button label. */
export function mainButtonLabelStyle() {
  return {
    color: '#fff',
    fontWeight: 'bold' as const,
    letterSpacing: 0.8,
    fontSize: 15,
  };
}

// ─── Input helpers ────────────────────────────────────────────────────────────

/** TextInput theme (underline/label primary color). */
export function inputTheme(colors: ThemeColors) {
  return { colors: { primary: colors.primary } };
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

/** Section title style. */
export function sectionTitleStyle(colors: ThemeColors) {
  return { fontSize: 18, fontWeight: '700' as const, marginBottom: 10, color: colors.text };
}

/** Secondary body text. */
export function instructionTextStyle(colors: ThemeColors) {
  return {
    textAlign: 'center' as const,
    marginBottom: 20,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  };
}

// ─── Spacing constants ────────────────────────────────────────────────────────

/** Scroll content padding (screen horizontal). */
export const screenPaddingHorizontal = scale(20);

/** Standard content padding. */
export const contentPadding = scale(16);
