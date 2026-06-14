// src/hooks/use-tasks-for-label.ts
// Hook para buscar tarefas filtradas por etiqueta.

import { useCallback } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { useQuery } from './use-query';

export function useTasksForLabel(
  labelId: string | null,
  includeCompleted: boolean = false
): { data: TaskDTO[]; loading: boolean; error: Error | null; refresh: () => void } {
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listByLabel>[0]) =>
      labelId ? tasksRepo.listByLabel(db, labelId, includeCompleted) : Promise.resolve([]),
    [labelId, includeCompleted]
  );

  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed'], labelId);
}