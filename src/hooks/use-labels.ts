// src/hooks/use-labels.ts
// Hooks de query e mutation para etiquetas (labels).

import { useCallback } from 'react';
import * as labelsRepo from '@/repositories/labels.repo';
import type { LabelDTO, CreateLabelInput, UpdateLabelInput } from '@/repositories/labels.repo';
import { useQuery, type QueryState } from './use-query';
import { useMutation } from './use-mutation';

export function useLabels(): QueryState<LabelDTO[]> {
  const fetcher = useCallback(
    (db: Parameters<typeof labelsRepo.list>[0]) => labelsRepo.list(db),
    []
  );
  return useQuery<LabelDTO[]>(fetcher, ['labels:changed']);
}

export function useCreateLabel() {
  return useMutation<[CreateLabelInput], LabelDTO>('labels:changed', (db, input) =>
    labelsRepo.create(db, input)
  );
}

export function useUpdateLabel() {
  return useMutation<[string, UpdateLabelInput], LabelDTO | null>(
    'labels:changed',
    (db, id, input) => labelsRepo.update(db, id, input)
  );
}

export function useDeleteLabel() {
  return useMutation<[string], boolean>('labels:changed', (db, id) =>
    labelsRepo.hardDelete(db, id)
  );
}

export function useLabel(id: string | null): QueryState<LabelDTO | null> {
  const fetcher = useCallback(
    (db: Parameters<typeof labelsRepo.getById>[0]) =>
      id ? labelsRepo.getById(db, id) : Promise.resolve(null),
    [id]
  );
  return useQuery<LabelDTO | null>(fetcher, ['labels:changed'], id);
}

export function useAttachLabel() {
  return useMutation<[string, string], boolean>('tasks:changed', (db, taskId, labelId) =>
    labelsRepo.attachToTask(db, taskId, labelId)
  );
}

export function useLabelTaskCounts(): QueryState<Map<string, number>> {
  const fetcher = useCallback(
    (db: Parameters<typeof labelsRepo.countTasksPerLabel>[0]) => labelsRepo.countTasksPerLabel(db),
    []
  );
  return useQuery<Map<string, number>>(fetcher, ['tasks:changed', 'labels:changed']);
}
