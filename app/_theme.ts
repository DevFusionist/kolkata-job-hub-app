// Shared theme for Kolkata Job Hub – light and dark palettes

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  cream: string;
  terracotta: string;
  gold: string;
  ink: string;
  muted: string;
  white: string;
  border: string;
  bengaliRed: string;
  /** Background for main screens */
  background: string;
  /** Card/surface background */
  surface: string;
  /** Primary text */
  text: string;
  /** Secondary/subtle text */
  textSecondary: string;
}

export const LIGHT_COLORS: ThemeColors = {
  cream: '#FDFCF0',
  terracotta: '#A04035',
  gold: '#D4AF37',
  ink: '#1A252F',
  muted: '#7F8C8D',
  white: '#FFF',
  border: '#DEDBC1',
  bengaliRed: '#B22222',
  background: '#FDFCF0',
  surface: '#FFF',
  text: '#1A252F',
  textSecondary: '#7F8C8D',
};

export const DARK_COLORS: ThemeColors = {
  cream: '#1A252F',
  terracotta: '#E07B6F',
  gold: '#E5C158',
  ink: '#FDFCF0',
  muted: '#9CA3A8',
  white: '#252F3B',
  border: '#3D4A55',
  bengaliRed: '#E85555',
  background: '#1A252F',
  surface: '#252F3B',
  text: '#FDFCF0',
  textSecondary: '#9CA3A8',
};

// Backward compatibility: default export light colors as COLORS
export const COLORS = LIGHT_COLORS;

export const VINTAGE_STYLES = {
  card: {
    borderRadius: 2,
    elevation: 3,
    borderWidth: 1,
  },
  title: {
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
};
