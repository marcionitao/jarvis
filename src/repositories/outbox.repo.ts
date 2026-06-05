// src/repositories/outbox.repo.ts
// Outbox de mutações pendentes para sync cloud (Fase 3).
// Cada create/update/delete enfileira um evento. O worker de sync consome a fila.

import { asc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { JarvisDB } from '@/db/client';
import { outbox, type OutboxEntry, type NewOutboxEntry } from '@/db/schema';

export type OutboxEntryDTO = OutboxEntry;

export interface EnqueueOutboxInput {
  entity: 'task' | 'project' | 'label' | 'reminder';
  entityId: string;
  op: 'create' | 'update' | 'delete';
  payload: unknown;
}

export async function enqueueOutbox(db: JarvisDB, input: EnqueueOutboxInput): Promise<OutboxEntryDTO> {
  const id = ulid();
  const newEntry: NewOutboxEntry = {
    id,
    entity: input.entity,
    entityId: input.entityId,
    op: input.op,
    payload: input.payload as object,
    createdAt: Date.now(),
    attempts: 0,
  };
  await db.insert(outbox).values(newEntry);
  const created = await getById(db, id);
  if (!created) throw new Error('Failed to enqueue outbox entry');
  return created;
}

export async function getById(db: JarvisDB, id: string): Promise<OutboxEntryDTO | null> {
  const rows = await db.select().from(outbox).where(eq(outbox.id, id));
  return rows[0] ?? null;
}

export async function listPending(db: JarvisDB, limit: number = 100): Promise<OutboxEntryDTO[]> {
  return db
    .select()
    .from(outbox)
    .orderBy(asc(outbox.createdAt))
    .limit(limit);
}

export async function listAll(db: JarvisDB): Promise<OutboxEntryDTO[]> {
  return db.select().from(outbox).orderBy(asc(outbox.createdAt));
}

export async function markAttempt(db: JarvisDB, id: string): Promise<void> {
  const existing = await getById(db, id);
  if (!existing) return;
  await db
    .update(outbox)
    .set({ attempts: existing.attempts + 1 })
    .where(eq(outbox.id, id));
}

export async function remove(db: JarvisDB, id: string): Promise<boolean> {
  const existing = await getById(db, id);
  if (!existing) return false;
  await db.delete(outbox).where(eq(outbox.id, id));
  return true;
}

export async function clearAll(db: JarvisDB): Promise<number> {
  const result = await db.delete(outbox);
  return (result as { changes?: number }).changes ?? 0;
}

export async function count(db: JarvisDB): Promise<number> {
  const rows = await listAll(db);
  return rows.length;
}
