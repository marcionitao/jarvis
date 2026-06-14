// src/repositories/labels.repo.ts
// Repositório de etiquetas (labels) + gestão M:N com tasks.
// Toda mutation enfileira evento na outbox (sync-ready).

import { eq, asc, and, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { JarvisDB } from '@/db/client';
import { labels, taskLabels, type Label, type NewLabel } from '@/db/schema';
import { enqueueOutbox } from './outbox.repo';

export type LabelDTO = Label;

export async function list(db: JarvisDB): Promise<LabelDTO[]> {
  return db.select().from(labels).orderBy(asc(labels.name));
}

export async function getById(db: JarvisDB, id: string): Promise<LabelDTO | null> {
  const rows = await db.select().from(labels).where(eq(labels.id, id));
  return rows[0] ?? null;
}

export interface CreateLabelInput {
  name: string;
  color: string;
}

export async function create(db: JarvisDB, input: CreateLabelInput): Promise<LabelDTO> {
  const now = Date.now();
  const id = ulid();
  const newLabel: NewLabel = {
    id,
    name: input.name,
    color: input.color,
    createdAt: now,
  };
  await db.insert(labels).values(newLabel);
  await enqueueOutbox(db, { entity: 'label', entityId: id, op: 'create', payload: newLabel });
  const created = await getById(db, id);
  if (!created) throw new Error('Failed to create label');
  return created;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

export async function update(
  db: JarvisDB,
  id: string,
  input: UpdateLabelInput
): Promise<LabelDTO | null> {
  const existing = await getById(db, id);
  if (!existing) return null;
  await db.update(labels).set(input).where(eq(labels.id, id));
  const updated = { ...existing, ...input };
  await enqueueOutbox(db, { entity: 'label', entityId: id, op: 'update', payload: updated });
  return updated;
}

export async function hardDelete(db: JarvisDB, id: string): Promise<boolean> {
  const existing = await getById(db, id);
  if (!existing) return false;
  await db.delete(labels).where(eq(labels.id, id));
  await enqueueOutbox(db, { entity: 'label', entityId: id, op: 'delete', payload: { id } });
  return true;
}

export async function attachToTask(
  db: JarvisDB,
  taskId: string,
  labelId: string
): Promise<boolean> {
  const existing = await db
    .select()
    .from(taskLabels)
    .where(eq(taskLabels.taskId, taskId));
  if (existing.some((row) => row.labelId === labelId)) return true;
  await db.insert(taskLabels).values({ taskId, labelId });
  return true;
}

export async function detachFromTask(
  db: JarvisDB,
  taskId: string,
  labelId: string
): Promise<boolean> {
  await db
    .delete(taskLabels)
    .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));
  return true;
}

export async function listLabelsForTask(db: JarvisDB, taskId: string): Promise<LabelDTO[]> {
  return db
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
      createdAt: labels.createdAt,
    })
    .from(taskLabels)
    .innerJoin(labels, eq(taskLabels.labelId, labels.id))
    .where(eq(taskLabels.taskId, taskId));
}

export async function countTasksPerLabel(db: JarvisDB): Promise<Map<string, number>> {
  const rows = await db
    .select({
      labelId: taskLabels.labelId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(taskLabels)
    .groupBy(taskLabels.labelId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.labelId, Number(row.count));
  }
  return map;
}
