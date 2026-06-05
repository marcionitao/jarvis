// src/state/i18n.context.tsx
// I18nProvider com pt-PT e en-US. Detecção inicial via expo-localization.
// Persistência da escolha manual do utilizador em AsyncStorage.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import en from '@/i18n/en.json';
import pt from '@/i18n/pt.json';

export type Locale = 'pt' | 'en';

const dictionaries: Record<Locale, Record<string, string>> = { pt, en };

const STORAGE_KEY = '@jarvis/locale';

function detectLocale(): Locale {
  try {
    const locales = getLocales();
    for (const l of locales) {
      if (l.languageCode === 'pt') return 'pt';
      if (l.languageCode === 'en') return 'en';
    }
  } catch {
    // expo-localization pode falhar em testes — fallback
  }
  return 'en';
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'pt' || stored === 'en') setLocaleState(stored);
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    void AsyncStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[locale] ?? dictionaries.en;
      let value = dict[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return value;
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
