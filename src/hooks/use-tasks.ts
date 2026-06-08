// src/hooks/use-tasks.ts
// Hooks de query para tarefas. Todos partilham a base useQuery.

import { useCallback, useEffect } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { useQuery, type QueryState } from './use-query';
import { useUIPrefs } from '@/state/ui-prefs.context';

export function useTodayTasks(): QueryState<TaskDTO[]> {
  const { showCompleted } = useUIPrefs();
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listToday>[0]) =>
      tasksRepo.listToday(db, new Date(), showCompleted),
    [showCompleted]
  );
  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed'], showCompleted);
}

export function useUpcomingTasks(days: number = 7): QueryState<TaskDTO[]> {
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listUpcoming>[0]) =>
      tasksRepo.listUpcoming(db, new Date(), days),
    [days]
  );
  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed'], days);
}

export function useProjectTasks(projectId: string | null): QueryState<TaskDTO[]> {
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listByProject>[0]) =>
      tasksRepo.listByProject(db, projectId),
    [projectId]
  );
  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed'], projectId);
}

export function useTask(id: string | null): QueryState<TaskDTO | null> {
  const fetcher = useCallback(
    async (db: Parameters<typeof tasksRepo.getById>[0]) =>
      id ? tasksRepo.getById(db, id) : null,
    [id]
  );
  return useQuery<TaskDTO | null>(fetcher, ['tasks:changed'], id);
}
