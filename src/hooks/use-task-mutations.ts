// src/hooks/use-task-mutations.ts
// Hooks de mutation para tarefas. Todos partilham a base useMutation
// e emitem 'tasks:changed' no bus após sucesso.

import * as tasksRepo from '@/repositories/tasks.repo';
import type { CreateTaskInput, UpdateTaskInput, TaskDTO } from '@/repositories/tasks.repo';
import { useMutation } from './use-mutation';
import { scheduleTaskReminder, cancelTaskReminder } from '@/services/notifications.service';

export function useCreateTask() {
  return useMutation<[CreateTaskInput], TaskDTO>('tasks:changed', async (db, input) => {
    const task = await tasksRepo.create(db, input);
    if (task.dueTime !== null) {
      await scheduleTaskReminder(task);
    }
    return task;
  });
}

export function useUpdateTask() {
  return useMutation<[string, UpdateTaskInput], TaskDTO | null>(
    'tasks:changed',
    async (db, id, input) => {
      const task = await tasksRepo.update(db, id, input);
      if (task) {
        await cancelTaskReminder(id);
        if (task.dueTime !== null) {
          await scheduleTaskReminder(task);
        }
      }
      return task;
    }
  );
}

export function useDeleteTask() {
  return useMutation<[string], boolean>('tasks:changed', async (db, id) => {
    await cancelTaskReminder(id);
    return tasksRepo.hardDelete(db, id);
  });
}

export function useToggleComplete() {
  return useMutation<[string, boolean], TaskDTO | null>(
    'tasks:changed',
    async (db, id, done) => {
      if (done) {
        await cancelTaskReminder(id);
      }
      return tasksRepo.toggleComplete(db, id, done);
    }
  );
}
