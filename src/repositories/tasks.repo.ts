// src/repositories/tasks.repo.ts
// Repositório de tarefas. CRUD + queries comuns (Hoje, Por projeto, Por data).
// Toda mutation enfileira evento na outbox (sync-ready).

import { and, asc, desc, eq, gte, inArray, isNull, lte, like, or, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { JarvisDB } from '@/db/client';
import { tasks, taskLabels, labels, type Task, type NewTask } from '@/db/schema';
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

export interface SearchFilters {
  query?: string | null;
  projectId?: string | null;
  priority?: number | null;
  labelId?: string | null;
  dueDateFrom?: number | null;
  dueDateTo?: number | null;
  status?: 'todo' | 'done' | 'all';
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

export async function listByDate(
  db: JarvisDB,
  date: Date
): Promise<TaskDTO[]> {
  const dayKey = toDateKey(date);
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'todo'),
        eq(tasks.dueDate, dayKey)
      )
    )
    .orderBy(asc(tasks.order));
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

export async function searchWithFilters(
  db: JarvisDB,
  filters: SearchFilters
): Promise<TaskDTO[]> {
  const conditions = [];

  if (filters.query) {
    const pattern = `%${filters.query.toLowerCase()}%`;
    const queryConditions = [
      like(sql`lower(${tasks.title})`, pattern),
      like(sql`lower(${tasks.description})`, pattern),
    ];

    // Pesquisar labels cujo nome contém a query (funciona para "@saude" ou apenas "saude")
    const labelNamePattern = filters.query.startsWith('@')
      ? filters.query.slice(1).toLowerCase()
      : filters.query.toLowerCase();

    const matchingLabels = await db
      .select()
      .from(labels)
      .where(like(sql`lower(${labels.name})`, `%${labelNamePattern}%`));

    if (matchingLabels.length > 0) {
      const labelTaskRows = await db
        .select({ taskId: taskLabels.taskId })
        .from(taskLabels)
        .where(inArray(taskLabels.labelId, matchingLabels.map((l) => l.id)));

      if (labelTaskRows.length > 0) {
        queryConditions.push(inArray(tasks.id, labelTaskRows.map((r) => r.taskId)));
      }
    }

    conditions.push(or(...queryConditions));
  }

  if (filters.projectId !== undefined) {
    conditions.push(
      filters.projectId === null
        ? isNull(tasks.projectId)
        : eq(tasks.projectId, filters.projectId)
    );
  }

  if (filters.priority !== undefined && filters.priority > 0) {
    conditions.push(eq(tasks.priority, filters.priority));
  }

  if (filters.labelId !== undefined && filters.labelId !== null) {
    const labelTasks = await db
      .select({ taskId: taskLabels.taskId })
      .from(taskLabels)
      .where(eq(taskLabels.labelId, filters.labelId));
    if (labelTasks.length > 0) {
      const taskIds = labelTasks.map(lt => lt.taskId);
      conditions.push(inArray(tasks.id, taskIds));
    } else {
      conditions.push(eq(tasks.id, '__none__'));
    }
  }

  if (filters.status === 'todo') {
    conditions.push(eq(tasks.status, 'todo'));
  } else if (filters.status === 'done') {
    conditions.push(eq(tasks.status, 'done'));
  }

  if (filters.dueDateFrom) {
    conditions.push(gte(tasks.dueDate, filters.dueDateFrom));
  }

  if (filters.dueDateTo) {
    conditions.push(lte(tasks.dueDate, filters.dueDateTo));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(desc(tasks.clientUpdatedAt))
    .limit(100);
}

export async function listByLabel(
  db: JarvisDB,
  labelId: string,
  includeCompleted: boolean = false
): Promise<TaskDTO[]> {
  const labelTasks = await db
    .select({ taskId: taskLabels.taskId })
    .from(taskLabels)
    .where(eq(taskLabels.labelId, labelId));

  if (labelTasks.length === 0) return [];

  const taskIds = labelTasks.map(lt => lt.taskId);

  const conditions = [inArray(tasks.id, taskIds)];
  if (!includeCompleted) {
    conditions.push(eq(tasks.status, 'todo'));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.dueDate), asc(tasks.order));
}
