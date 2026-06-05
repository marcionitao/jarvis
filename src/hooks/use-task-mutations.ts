// src/hooks/use-task-mutations.ts
// Hooks de mutation para tarefas. Todos partilham a base useMutation
// e emitem 'tasks:changed' no bus após sucesso.

import * as tasksRepo from '@/repositories/tasks.repo';
import type { CreateTaskInput, UpdateTaskInput, TaskDTO } from '@/repositories/tasks.repo';
import { useMutation } from './use-mutation';

export function useCreateTask() {
  return useMutation<[CreateTaskInput], TaskDTO>('tasks:changed', (db, input) =>
    tasksRepo.create(db, input)
  );
}

export function useUpdateTask() {
  return useMutation<[string, UpdateTaskInput], TaskDTO | null>(
    'tasks:changed',
    (db, id, input) => tasksRepo.update(db, id, input)
  );
}

export function useDeleteTask() {
  return useMutation<[string], boolean>('tasks:changed', (db, id) =>
    tasksRepo.hardDelete(db, id)
  );
}

export function useToggleComplete() {
  return useMutation<[string, boolean], TaskDTO | null>(
    'tasks:changed',
    (db, id, done) => tasksRepo.toggleComplete(db, id, done)
  );
}
