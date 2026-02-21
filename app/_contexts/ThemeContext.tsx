import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { ThemeMode, ThemeColors } from '../_theme';
import { LIGHT_COLORS, DARK_COLORS } from '../_theme';

const THEME_STORAGE_KEY = '@app_theme';

type ThemeModeValue = ThemeMode;

interface ThemeContextType {
  themeMode: ThemeModeValue;
  setThemeMode: (mode: ThemeModeValue) => Promise<void>;
  colors: ThemeColors;
  isDark: boolean;
  /** For PaperProvider */
  paperTheme: typeof MD3LightTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeModeValue>('light');
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') {
          setThemeModeState(stored);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const setThemeMode = async (mode: ThemeModeValue) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const colors = themeMode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const isDark = themeMode === 'dark';

  const paperTheme = useMemo(() => {
    const base = isDark ? MD3DarkTheme : MD3LightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.terracotta,
        primaryContainer: isDark ? '#3D2522' : '#F5E0DE',
        secondary: colors.gold,
        background: colors.background,
        surface: colors.surface,
        surfaceVariant: isDark ? colors.white : colors.cream,
        outline: colors.border,
        error: colors.bengaliRed,
        onPrimary: '#FFF',
        onSecondary: '#FFF',
        onBackground: colors.text,
        onSurface: colors.text,
        onSurfaceVariant: colors.textSecondary,
        onError: '#FFF',
        outlineVariant: colors.border,
      },
    };
  }, [isDark, colors.terracotta, colors.gold, colors.background, colors.surface, colors.border, colors.bengaliRed, colors.text, colors.textSecondary, colors.white, colors.cream]);

  const value: ThemeContextType = {
    themeMode,
    setThemeMode,
    colors,
    isDark,
    paperTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
