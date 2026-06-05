// src/hooks/use-tasks.ts
// Hooks de query para tarefas. Todos partilham a base useQuery.

import { useCallback } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { useQuery, type QueryState } from './use-query';

export function useTodayTasks(): QueryState<TaskDTO[]> {
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listToday>[0]) => tasksRepo.listToday(db),
    []
  );
  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed']);
}

export function useUpcomingTasks(days: number = 7): QueryState<TaskDTO[]> {
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listUpcoming>[0]) =>
      tasksRepo.listUpcoming(db, new Date(), days),
    [days]
  );
  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed']);
}

export function useProjectTasks(projectId: string | null): QueryState<TaskDTO[]> {
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listByProject>[0]) =>
      tasksRepo.listByProject(db, projectId),
    [projectId]
  );
  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed']);
}

export function useTask(id: string | null): QueryState<TaskDTO | null> {
  const fetcher = useCallback(
    async (db: Parameters<typeof tasksRepo.getById>[0]) =>
      id ? tasksRepo.getById(db, id) : null,
    [id]
  );
  return useQuery<TaskDTO | null>(fetcher, ['tasks:changed']);
}
