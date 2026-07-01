// src/hooks/use-tasks-search.ts
// Hook para pesquisa de tarefas com filtros e debounce.

import { useState, useEffect, useCallback } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { SearchFilters, TaskWithProject } from '@/repositories/tasks.repo';
import { useQuery } from './use-query';
import { useDebounce } from './use-debounce';

export function useTasksSearch(initialFilters: Partial<SearchFilters> = {}) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialFilters.query ?? null,
    projectId: initialFilters.projectId,
    priority: initialFilters.priority,
    labelId: initialFilters.labelId,
    dueDateFrom: initialFilters.dueDateFrom,
    dueDateTo: initialFilters.dueDateTo,
    status: initialFilters.status ?? 'all',
  });

  const debouncedQuery = useDebounce(filters.query ?? '', 300);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, query: debouncedQuery || null }));
  }, [debouncedQuery]);

  const fetcher = useCallback(
    async (db: Parameters<typeof tasksRepo.searchWithFilters>[0]) => {
      return tasksRepo.searchWithFilters(db, filters);
    },
    [filters]
  );

  const { data, isLoading, error, refetch } = useQuery<TaskWithProject[]>(
    fetcher,
    ['tasks:changed'],
    filters
  );

  const setFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: null,
      projectId: undefined,
      priority: undefined,
      labelId: undefined,
      dueDateFrom: undefined,
      dueDateTo: undefined,
      status: 'all',
    });
  }, []);

  return {
    filters,
    data: data ?? [],
    isLoading,
    error,
    refetch,
    setFilter,
    clearFilters,
  };
}

export type { SearchFilters } from '@/repositories/tasks.repo';