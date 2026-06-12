// src/hooks/use-projects.ts
// Hooks de query e mutation para projectos.

import { useCallback } from 'react';
import * as projectsRepo from '@/repositories/projects.repo';
import type { ProjectDTO, CreateProjectInput, UpdateProjectInput } from '@/repositories/projects.repo';
import { useQuery, type QueryState } from './use-query';
import { useMutation } from './use-mutation';

export function useProjects(includeArchived: boolean = false): QueryState<ProjectDTO[]> {
  const fetcher = useCallback(
    async (db: Parameters<typeof projectsRepo.listActive>[0]) =>
      includeArchived ? projectsRepo.listAll(db) : projectsRepo.listActive(db),
    [includeArchived]
  );
  return useQuery<ProjectDTO[]>(fetcher, ['projects:changed'], includeArchived);
}

export function useProject(id: string | null): QueryState<ProjectDTO | null> {
  const fetcher = useCallback(
    async (db: Parameters<typeof projectsRepo.getById>[0]) =>
      id ? projectsRepo.getById(db, id) : null,
    [id]
  );
  return useQuery<ProjectDTO | null>(fetcher, ['projects:changed'], id);
}

export function useCreateProject() {
  return useMutation<[CreateProjectInput], ProjectDTO>('projects:changed', (db, input) =>
    projectsRepo.create(db, input)
  );
}

export function useUpdateProject() {
  return useMutation<[string, UpdateProjectInput], ProjectDTO | null>(
    'projects:changed',
    (db, id, input) => projectsRepo.update(db, id, input)
  );
}

export function useArchiveProject() {
  return useMutation<[string], ProjectDTO | null>('projects:changed', (db, id) =>
    projectsRepo.archive(db, id)
  );
}

export function useRestoreProject() {
  return useMutation<[string], ProjectDTO | null>('projects:changed', (db, id) =>
    projectsRepo.restore(db, id)
  );
}

export function useHardDeleteProject() {
  return useMutation<[string], boolean>('projects:changed', (db, id) =>
    projectsRepo.hardDelete(db, id).then((ok) => ok ?? false)
  );
}
