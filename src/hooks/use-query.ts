// src/hooks/use-query.ts
// Hook base partilhado por todos os hooks de query (useTodayTasks, useProjectTasks, etc.).
// Responsabilidades:
//   1. Chamar o fetcher com a DB pronta
//   2. Expor { data, loading, error, refresh }
//   3. Subscrever eventos do bus e refrescar quando relevante
// Sem cache, sem retry, sem optimistic. SQLite local é rápido.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDB } from '@/state/db.context';
import type { JarvisDB } from '@/db/client';
import { eventBus, type EventName } from './event-bus';

export interface QueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useQuery<T>(
  fetcher: (db: JarvisDB) => Promise<T>,
  events: EventName[] = []
): QueryState<T> {
  const { db, ready } = useDB();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(db);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (ready && db) {
      void refresh();
    }
  }, [ready, db, refresh]);

  const eventsKey = events.join(',');
  useEffect(() => {
    if (!ready) return;
    const unsubs = events.map((evt) => eventBus.on(evt, refresh));
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [ready, eventsKey, refresh, events]);

  return { data: data as T, loading, error, refresh };
}
