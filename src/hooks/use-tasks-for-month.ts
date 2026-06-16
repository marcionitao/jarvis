// src/hooks/use-tasks-for-month.ts
// Hook para obter tarefas de um mês inteiro (para marcar dias no calendário).

import { useCallback } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { useQuery } from './use-query';

export function useTasksForMonth(year: number, month: number): QueryState<TaskDTO[]> {
  // month is 1-indexed (1=Jan, 12=Dec)
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // last day of month
  
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listUpcoming>[0]) =>
      tasksRepo.listUpcoming(db, startDate, endDate.getDate()),
    [year, month]
  );
  
  const monthKey = `${year}-${month}`;
  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed'], monthKey);
}