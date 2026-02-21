// Shared theme for Kolkata Job Hub – Palette 4
// #1C1C1C Black | #F7F3E9 Cream | #3F5D6B Teal | #A54A3F Terracotta

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
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

export const LIGHT_COLORS: ThemeColors = {
  cream: '#F7F3E9',        // Off-white / cream
  terracotta: '#A54A3F',   // Terracotta / muted red-brown
  gold: '#3F5D6B',        // Teal as secondary accent
  ink: '#1C1C1C',         // Black / very dark gray
  muted: '#3F5D6B',       // Desaturated teal / slate blue
  white: '#FFFFFF',
  border: '#C5CFD4',      // Light teal-gray border
  bengaliRed: '#A54A3F',  // Terracotta for destructive/error
  background: '#F7F3E9',
  surface: '#FFFFFF',
  text: '#1C1C1C',
  textSecondary: '#3F5D6B',
};

export const DARK_COLORS: ThemeColors = {
  cream: '#1C1C1C',       // Black base
  terracotta: '#C45A4F',   // Slightly lighter terracotta for contrast
  gold: '#5A7A8A',        // Lighter teal for dark mode
  ink: '#F7F3E9',         // Cream as text
  muted: '#8A9BA8',       // Muted teal-gray
  white: '#2A2A2A',      // Dark surface
  border: '#3F5D6B',      // Teal border
  bengaliRed: '#E85A4F',  // Brighter terracotta for errors
  background: '#1C1C1C',
  surface: '#2A2A2A',
  text: '#F7F3E9',
  textSecondary: '#8A9BA8',
};

export const COLORS = LIGHT_COLORS;

export const VINTAGE_STYLES = {
  card: {
    borderRadius: 4,        // More sophisticated, less "bouncy"
    elevation: 2,           // Subtle shadow for a premium look
    borderWidth: 1.2,
  },
  title: {
    fontFamily: 'serif',    // Keeps the intellectual heritage feel
    fontWeight: '700',
  },
};