// Toony Bengali Joy Theme — Kolkata Job Hub
// Warm, playful, cartoon-inspired palette
// Primary: Coral #E76F51 | Secondary: Teal #2A9D8F | Accent: Warm Orange #F4A261

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Brand palette
  primary: string;       // Coral — CTA, active states
  secondary: string;     // Teal — trust, secondary actions
  accent: string;        // Warm Orange — highlights, badges
  teal: string;          // alias for secondary

  // Semantic aliases (backward compat)
  terracotta: string;    // maps to primary
  gold: string;          // maps to accent
  bengaliRed: string;    // maps to primary (destructive alias)
  muted: string;

  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;

  // Text
  text: string;
  textSecondary: string;
  ink: string;
  cream: string;
  white: string;

  // Borders
  border: string;
  borderGlow: string;

  // Gradients (start/end pairs)
  gradientStart: string;
  gradientEnd: string;
  gradientSecondaryStart: string;
  gradientSecondaryEnd: string;
}

export const LIGHT_COLORS: ThemeColors = {
  primary: '#E76F51',
  secondary: '#2A9D8F',
  accent: '#F4A261',
  teal: '#2A9D8F',
  terracotta: '#E76F51',
  gold: '#F4A261',
  bengaliRed: '#E76F51',
  muted: '#9E8E80',

  background: '#FFF8E7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFF3E0',

  text: '#2D1B0E',
  textSecondary: '#7A6555',
  ink: '#2D1B0E',
  cream: '#FFF3E0',
  white: '#FFFFFF',

  border: 'rgba(231,111,81,0.14)',
  borderGlow: 'rgba(231,111,81,0.28)',

  gradientStart: '#E76F51',
  gradientEnd: '#F4A261',
  gradientSecondaryStart: '#2A9D8F',
  gradientSecondaryEnd: '#3DB8A7',
};

export const DARK_COLORS: ThemeColors = {
  primary: '#F0886A',
  secondary: '#3DB8A7',
  accent: '#F7B97A',
  teal: '#3DB8A7',
  terracotta: '#F0886A',
  gold: '#F7B97A',
  bengaliRed: '#F0886A',
  muted: '#8A7A6A',

  background: '#1A1410',
  surface: '#2A221C',
  surfaceElevated: '#352C25',

  text: '#F5E8D8',
  textSecondary: '#B8A898',
  ink: '#F5E8D8',
  cream: '#2A221C',
  white: '#2A221C',

  border: 'rgba(240,136,106,0.18)',
  borderGlow: 'rgba(240,136,106,0.36)',

  gradientStart: '#F0886A',
  gradientEnd: '#F7B97A',
  gradientSecondaryStart: '#3DB8A7',
  gradientSecondaryEnd: '#2A9D8F',
};

export const COLORS = LIGHT_COLORS;

/** Legacy VINTAGE_STYLES */
export const VINTAGE_STYLES = {
  card: {
    borderRadius: 24,
    elevation: 4,
    borderWidth: 1,
  },
  title: {
    fontFamily: undefined,
    fontWeight: '700',
  },
};