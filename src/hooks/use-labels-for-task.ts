// src/hooks/use-labels-for-task.ts
// Hook para obter etiquetas de uma tarefa.

import { useCallback } from 'react';
import * as labelsRepo from '@/repositories/labels.repo';
import type { LabelDTO } from '@/repositories/labels.repo';
import { useQuery } from './use-query';

export function useLabelsForTask(
  taskId: string | null
): { data: LabelDTO[]; loading: boolean; error: Error | null; refresh: () => void } {
  const fetcher = useCallback(
    (db: Parameters<typeof labelsRepo.listLabelsForTask>[0]) =>
      taskId ? labelsRepo.listLabelsForTask(db, taskId) : Promise.resolve([]),
    [taskId]
  );

  return useQuery<LabelDTO[]>(fetcher, ['tasks:changed'], taskId);
}