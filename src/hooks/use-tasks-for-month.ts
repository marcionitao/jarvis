// src/hooks/use-tasks-for-month.ts
// Hook para obter tarefas de um mês inteiro (para marcar dias no calendário).

import { useCallback } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { TaskWithProject } from '@/repositories/tasks.repo';
import { useQuery, type QueryState } from './use-query';

export function useTasksForMonth(year: number, month: number): QueryState<TaskWithProject[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listUpcoming>[0]) =>
      tasksRepo.listUpcoming(db, startDate, endDate.getDate()),
    [year, month]
  );

  const monthKey = `${year}-${month}`;
  return useQuery<TaskWithProject[]>(fetcher, ['tasks:changed'], monthKey);
}