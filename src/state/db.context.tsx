// src/state/db.context.tsx
// DBProvider — inicializa a DB local (Drizzle + expo-sqlite) e corre o seed mínimo.
// Disponibiliza `db` e `ready` via hook `useDB`.

import { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getDB, JarvisDB } from '@/db/client';
import { seedIfEmpty } from '@/db/seed';

interface DBContextValue {
  ready: boolean;
  db: JarvisDB | null;
}

const DBContext = createContext<DBContextValue | null>(null);

export function DBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<JarvisDB | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const instance = await getDB();
      await seedIfEmpty();
      if (!cancelled) setDb(instance);
    })().catch((err) => {
      console.error('[DBProvider] init failed', err);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!db) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <DBContext.Provider value={{ ready: true, db }}>{children}</DBContext.Provider>;
}

export function useDB(): DBContextValue {
  const ctx = useContext(DBContext);
  if (!ctx) throw new Error('useDB must be used within DBProvider');
  return ctx;
}
