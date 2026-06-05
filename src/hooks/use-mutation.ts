// src/hooks/use-mutation.ts
// Hook base para mutations (create/update/delete).
// Após sucesso, emite o evento no bus para que os hooks de query façam refresh.

import { useCallback, useState } from 'react';
import { useDB } from '@/state/db.context';
import type { JarvisDB } from '@/db/client';
import { eventBus, type EventName } from './event-bus';

export interface MutationState {
  loading: boolean;
  error: Error | null;
}

export function useMutation<TArgs extends unknown[], TResult>(
  event: EventName,
  fn: (db: JarvisDB, ...args: TArgs) => Promise<TResult>
): MutationState & {
  mutate: (...args: TArgs) => Promise<TResult | null>;
} {
  const { db } = useDB();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      if (!db) return null;
      setLoading(true);
      setError(null);
      try {
        const result = await fn(db, ...args);
        eventBus.emit(event);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db, fn, event]
  );

  return { mutate, loading, error };
}
