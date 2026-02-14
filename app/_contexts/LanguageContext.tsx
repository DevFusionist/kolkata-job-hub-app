import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALE_KEY = '@app_locale';

type Locale = 'en' | 'bn';

type Translations = Record<string, Record<string, string>>;

const en = require('../../locales/en.json') as Translations;
const bn = require('../../locales/bn.json') as Translations;

const translations: Record<Locale, Translations> = { en, bn };

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return typeof current === 'string' ? current : undefined;
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string) => string;
  isBengali: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_KEY);
        if (saved === 'en' || saved === 'bn') {
          setLocaleState(saved);
        }
      } catch (_) {}
      setReady(true);
    })();
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      await AsyncStorage.setItem(LOCALE_KEY, newLocale);
    } catch (_) {}
  }, []);

  const t = useCallback(
    (key: string): string => {
      if (!ready) return key;
      const dict = translations[locale];
      return getNested(dict as Record<string, unknown>, key) ?? getNested(en as Record<string, unknown>, key) ?? key;
    },
    [locale, ready]
  );

  const value: LanguageContextType = {
    locale,
    setLocale,
    t,
    isBengali: locale === 'bn',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (ctx === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
