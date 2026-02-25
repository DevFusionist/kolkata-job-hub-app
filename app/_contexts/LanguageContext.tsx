"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCALE_KEY = "@app_locale";
export type Locale = "en" | "bn";

type Translations = Record<string, string | Record<string, string>>;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string) => string;
  translations: { en: Translations; bn: Translations };
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolveKey(obj: Translations, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return typeof current === "string" ? current : undefined;
}

export function LanguageProvider({
  children,
  translations,
}: {
  children: React.ReactNode;
  translations: { en: Translations; bn: Translations };
}) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCALE_KEY);
        if (cancelled) return;
        if (stored === "bn" || stored === "en") setLocaleState(stored);
      } catch {
        if (cancelled) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = async (next: Locale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(LOCALE_KEY, next);
  };

  const t = (key: string): string => {
    const val = resolveKey(translations[locale], key);
    if (val != null) return val;
    const enVal = resolveKey(translations.en, key);
    return enVal ?? key;
  };

  const value: LanguageContextValue = {
    locale,
    setLocale,
    t,
    translations,
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
