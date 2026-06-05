// src/repositories/reminders.repo.ts
// Repositório de lembretes. CRUD + queries (pendentes, marcar como disparado).

import { and, eq, gt, asc, lte } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { JarvisDB } from '@/db/client';
import { reminders, type Reminder, type NewReminder } from '@/db/schema';

export type ReminderDTO = Reminder;

export async function getById(db: JarvisDB, id: string): Promise<ReminderDTO | null> {
  const rows = await db.select().from(reminders).where(eq(reminders.id, id));
  return rows[0] ?? null;
}

export async function listForTask(db: JarvisDB, taskId: string): Promise<ReminderDTO[]> {
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.taskId, taskId))
    .orderBy(asc(reminders.triggerAt));
}

export async function listPending(db: JarvisDB, now: number = Date.now()): Promise<ReminderDTO[]> {
  return db
    .select()
    .from(reminders)
    .where(and(eq(reminders.fired, false), lte(reminders.triggerAt, now)))
    .orderBy(asc(reminders.triggerAt));
}

export async function listUpcoming(
  db: JarvisDB,
  now: number = Date.now()
): Promise<ReminderDTO[]> {
  return db
    .select()
    .from(reminders)
    .where(and(eq(reminders.fired, false), gt(reminders.triggerAt, now)))
    .orderBy(asc(reminders.triggerAt));
}

export interface CreateReminderInput {
  taskId: string;
  triggerAt: number;
  type: 'absolute' | 'relative';
  relativeMinutes?: number | null;
  notificationId?: string | null;
}

export async function create(db: JarvisDB, input: CreateReminderInput): Promise<ReminderDTO> {
  const id = ulid();
  const newReminder: NewReminder = {
    id,
    taskId: input.taskId,
    triggerAt: input.triggerAt,
    type: input.type,
    relativeMinutes: input.relativeMinutes ?? null,
    notificationId: input.notificationId ?? null,
    fired: false,
  };
  await db.insert(reminders).values(newReminder);
  const created = await getById(db, id);
  if (!created) throw new Error('Failed to create reminder');
  return created;
}

export async function markFired(
  db: JarvisDB,
  id: string,
  notificationId?: string
): Promise<ReminderDTO | null> {
  const existing = await getById(db, id);
  if (!existing) return null;
  const patch: Partial<Reminder> = { fired: true };
  if (notificationId) patch.notificationId = notificationId;
  await db.update(reminders).set(patch).where(eq(reminders.id, id));
  return { ...existing, ...patch };
}

export async function hardDelete(db: JarvisDB, id: string): Promise<boolean> {
  const existing = await getById(db, id);
  if (!existing) return false;
  await db.delete(reminders).where(eq(reminders.id, id));
  return true;
}

export async function deleteForTask(db: JarvisDB, taskId: string): Promise<number> {
  const result = await db.delete(reminders).where(eq(reminders.taskId, taskId));
  return (result as { changes?: number }).changes ?? 0;
}
