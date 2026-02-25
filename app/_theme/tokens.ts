/**
 * Design tokens — radius, spacing, typography, elevation, motion
 */

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  xl: 40,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const typography = {
  hero: 32,
  headingLarge: 26,
  headingMedium: 22,
  headingSmall: 18,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  label: 12,
  caption: 11,
  micro: 10,
} as const;

export const elevation = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: "#2D1B0E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    shadowColor: "#2D1B0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  warm: {
    shadowColor: "#E76F51",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  float: {
    shadowColor: "#2D1B0E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const motion = {
  quick: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150, mass: 1 },
  springBouncy: { damping: 12, stiffness: 180, mass: 0.8 },
} as const;
