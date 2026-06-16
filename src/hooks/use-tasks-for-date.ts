// src/hooks/use-tasks-for-date.ts
// Hook para obter tarefas de uma data específica.

import { useCallback } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { useQuery } from './use-query';

export function useTasksForDate(date: Date): QueryState<TaskDTO[]> {
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listByDate>[0]) =>
      tasksRepo.listByDate(db, date),
    [dateKey]
  );
  
  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed'], dateKey);
}