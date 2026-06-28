// src/hooks/use-shopping-list.ts
// Hook para shopping list — retorna tarefas agrupadas por secção (label).

import { useCallback } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { LabelDTO } from '@/repositories/labels.repo';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { useQuery, type QueryState } from './use-query';

export interface ShoppingSection {
  label: LabelDTO | null;
  tasks: TaskDTO[];
}

export function useShoppingList(projectId: string | null): QueryState<ShoppingSection[]> {
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listByProjectGroupedBySection>[0]) =>
      projectId ? tasksRepo.listByProjectGroupedBySection(db, projectId) : Promise.resolve([]),
    [projectId]
  );
  return useQuery<ShoppingSection[]>(fetcher, ['tasks:changed'], projectId ? `shopping-list:${projectId}` : undefined);
}