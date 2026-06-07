// src/repositories/tasks.repo.ts
// Repositório de tarefas. CRUD + queries comuns (Hoje, Por projeto, Por data).
// Toda mutation enfileira evento na outbox (sync-ready).

import { and, asc, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { JarvisDB } from '@/db/client';
import { tasks, type Task, type NewTask } from '@/db/schema';
import { enqueueOutbox } from './outbox.repo';

export type TaskDTO = Task;

export function toDateKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function fromDateKey(key: number): Date {
  const y = Math.floor(key / 10000);
  const m = Math.floor((key % 10000) / 100) - 1;
  const d = key % 100;
  return new Date(y, m, d);
}

function startOfDayKey(date: Date): number {
  return toDateKey(date);
}

function endOfDayKey(date: Date): number {
  return toDateKey(date);
}

export async function getById(db: JarvisDB, id: string): Promise<TaskDTO | null> {
  const rows = await db.select().from(tasks).where(eq(tasks.id, id));
  return rows[0] ?? null;
}

export async function listByProject(
  db: JarvisDB,
  projectId: string | null
): Promise<TaskDTO[]> {
  if (projectId === null) {
    return db
      .select()
      .from(tasks)
      .where(isNull(tasks.projectId))
      .orderBy(asc(tasks.order));
  }
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.order));
}

export async function listToday(
  db: JarvisDB,
  today: Date = new Date(),
  includeCompleted: boolean = false
): Promise<TaskDTO[]> {
  const dayKey = startOfDayKey(today);
  const statusFilter = includeCompleted
    ? or(eq(tasks.status, 'todo'), eq(tasks.status, 'done'))
    : eq(tasks.status, 'todo');
  return db
    .select()
    .from(tasks)
    .where(and(statusFilter, or(eq(tasks.dueDate, dayKey), lte(tasks.dueDate, dayKey))))
    .orderBy(asc(tasks.dueDate), asc(tasks.order));
}

export async function listUpcoming(
  db: JarvisDB,
  from: Date = new Date(),
  days: number = 7
): Promise<TaskDTO[]> {
  const fromKey = startOfDayKey(from);
  const toKey = endOfDayKey(new Date(from.getTime() + days * 86400000));
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'todo'),
        gte(tasks.dueDate, fromKey),
        lte(tasks.dueDate, toKey)
      )
    )
    .orderBy(asc(tasks.dueDate), asc(tasks.order));
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  projectId?: string | null;
  parentId?: string | null;
  priority?: number;
  dueDate?: number | null;
  dueTime?: number | null;
  recurrenceRule?: string | null;
  order?: number;
}

export async function create(db: JarvisDB, input: CreateTaskInput): Promise<TaskDTO> {
  const now = Date.now();
  const id = ulid();
  const newTask: NewTask = {
    id,
    title: input.title,
    description: input.description ?? null,
    projectId: input.projectId ?? null,
    parentId: input.parentId ?? null,
    priority: input.priority ?? 0,
    status: 'todo',
    dueDate: input.dueDate ?? null,
    dueTime: input.dueTime ?? null,
    recurrenceRule: input.recurrenceRule ?? null,
    order: input.order ?? now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    syncStatus: 'local',
  };
  await db.insert(tasks).values(newTask);
  await enqueueOutbox(db, { entity: 'task', entityId: id, op: 'create', payload: newTask });
  const created = await getById(db, id);
  if (!created) throw new Error('Failed to create task');
  return created;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  projectId?: string | null;
  parentId?: string | null;
  priority?: number;
  status?: 'todo' | 'done';
  dueDate?: number | null;
  dueTime?: number | null;
  recurrenceRule?: string | null;
  order?: number;
}

export async function update(
  db: JarvisDB,
  id: string,
  input: UpdateTaskInput
): Promise<TaskDTO | null> {
  const existing = await getById(db, id);
  if (!existing) return null;
  const now = Date.now();
  const completedAt =
    input.status === 'done' && !existing.completedAt
      ? now
      : input.status === 'todo'
        ? null
        : existing.completedAt;
  const patch = {
    ...input,
    completedAt,
    updatedAt: now,
    clientUpdatedAt: now,
    syncStatus: 'pending' as const,
  };
  await db.update(tasks).set(patch).where(eq(tasks.id, id));
  const updated = { ...existing, ...patch };
  await enqueueOutbox(db, { entity: 'task', entityId: id, op: 'update', payload: updated });
  return updated;
}

export async function toggleComplete(
  db: JarvisDB,
  id: string,
  done: boolean
): Promise<TaskDTO | null> {
  return update(db, id, { status: done ? 'done' : 'todo' });
}

export async function hardDelete(db: JarvisDB, id: string): Promise<boolean> {
  const existing = await getById(db, id);
  if (!existing) return false;
  await db.delete(tasks).where(eq(tasks.id, id));
  await enqueueOutbox(db, { entity: 'task', entityId: id, op: 'delete', payload: { id } });
  return true;
}

export async function search(db: JarvisDB, _query: string): Promise<TaskDTO[]> {
  return db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.clientUpdatedAt))
    .limit(100);
}

// TODO fase 2: substituir por FTS5 (full-text search).
// export async function searchByText(db: JarvisDB, query: string): Promise<TaskDTO[]> {
//   const pattern = `%${query.toLowerCase()}%`;
//   return db
//     .select()
//     .from(tasks)
//     .where(like(tasks.title, pattern))
//     .orderBy(desc(tasks.clientUpdatedAt))
//     .limit(100);
// }
