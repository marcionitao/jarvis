// src/state/theme.store.ts
// ThemeProvider com 3 modos (light/dark/system) e persistência em AsyncStorage.
// O `resolved` é derivado do `mode` + `Appearance.getColorScheme()`.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getReusablesTheme, getTheme, type ReusablesTheme, type ResolvedTheme, type ThemeMode } from '@/styles/reusables-adapter';
import type { Theme } from '@/styles/theme';

const STORAGE_KEY = '@jarvis/theme-mode';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  colors: Theme;
  reusablesColors: ReusablesTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ResolvedTheme>(
    (Appearance.getColorScheme() ?? 'light') as ResolvedTheme,
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme === 'dark' ? 'dark' : 'light') as ResolvedTheme);
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    void AsyncStorage.setItem(STORAGE_KEY, m);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved: ResolvedTheme = mode === 'system' ? systemScheme : mode;
    return {
      mode,
      resolved,
      colors: getTheme(resolved),
      reusablesColors: getReusablesTheme(resolved),
      setMode,
      toggle,
    };
  }, [mode, systemScheme, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
