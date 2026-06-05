// src/state/db.context.tsx
// DBProvider — stub para a Etapa 1.3 (Drizzle + expo-sqlite).
// No MVP, o `ready: false` indica que o cliente ainda não foi inicializado.
// A interface é a fronteira que os repos e hooks consomem.

import { createContext, useContext } from 'react';

interface DBContextValue {
  ready: boolean;
}

const DBContext = createContext<DBContextValue | null>(null);

export function DBProvider({ children }: { children: React.ReactNode }) {
  return <DBContext.Provider value={{ ready: false }}>{children}</DBContext.Provider>;
}

export function useDB(): DBContextValue {
  const ctx = useContext(DBContext);
  if (!ctx) throw new Error('useDB must be used within DBProvider');
  return ctx;
}
