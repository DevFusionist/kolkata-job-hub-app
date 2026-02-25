"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors, type ColorScheme } from "../_theme/colors";

const THEME_KEY = "@app_theme";
export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  colors: ColorScheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useColorScheme() === "dark";
  const [mode, setModeState] = useState<ThemeMode>("system");

  const isDark = mode === "system" ? systemDark : mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (cancelled) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      } catch {
        if (cancelled) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = async (next: ThemeMode) => {
    setModeState(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  const value: ThemeContextValue = {
    mode,
    setMode,
    isDark,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
