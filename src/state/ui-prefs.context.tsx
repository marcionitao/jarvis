// src/state/ui-prefs.context.tsx
// Preferências de UI (filtros, toggles) com persistência em AsyncStorage.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@jarvis/ui-prefs:v1';

export interface UIPrefs {
  showCompleted: boolean;
}

interface UIPrefsContextValue extends UIPrefs {
  setShowCompleted: (value: boolean) => void;
  toggleShowCompleted: () => void;
}

const DEFAULT: UIPrefs = { showCompleted: false };

const Ctx = createContext<UIPrefsContextValue | null>(null);

export function UIPrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<UIPrefs>(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Partial<UIPrefs>;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore corrupt storage
      }
    });
  }, []);

  const persist = useCallback((next: UIPrefs) => {
    setPrefs(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setShowCompleted = useCallback(
    (value: boolean) => persist({ ...prefs, showCompleted: value }),
    [prefs, persist]
  );

  const toggleShowCompleted = useCallback(
    () => persist({ ...prefs, showCompleted: !prefs.showCompleted }),
    [prefs, persist]
  );

  const value = useMemo<UIPrefsContextValue>(
    () => ({ ...prefs, setShowCompleted, toggleShowCompleted }),
    [prefs, setShowCompleted, toggleShowCompleted]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUIPrefs(): UIPrefsContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUIPrefs must be used within UIPrefsProvider');
  return ctx;
}
