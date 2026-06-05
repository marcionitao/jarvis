// src/repositories/index.ts
// Re-exports públicos da camada de repositórios.
// A UI e os hooks importam APENAS daqui — nunca directamente de um repo.

export * as tasksRepo from './tasks.repo';
export * as projectsRepo from './projects.repo';
export * as labelsRepo from './labels.repo';
export * as remindersRepo from './reminders.repo';
export * as outboxRepo from './outbox.repo';

export type { ProjectDTO } from './projects.repo';
export type { TaskDTO } from './tasks.repo';
export type { LabelDTO } from './labels.repo';
export type { ReminderDTO } from './reminders.repo';
export type { OutboxEntryDTO, EnqueueOutboxInput } from './outbox.repo';
