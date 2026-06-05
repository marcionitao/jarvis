// src/db/seed.ts
// Seed mínimo: cria 1 user local e o projeto Inbox (necessário para tarefas sem projeto).
// Idempotente — pode ser chamado várias vezes sem duplicar dados.

import { eq } from 'drizzle-orm';
import { getDB } from './client';
import { users, projects } from './schema';

const DEFAULT_USER_ID = '01J0USER000000000000000000';
const INBOX_PROJECT_ID = '01J0INBOX000000000000000000';

export async function seedIfEmpty(): Promise<void> {
  const db = await getDB();
  const now = Date.now();

  const existingUser = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID));
  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: DEFAULT_USER_ID,
      name: 'Eu',
      timezone: 'Europe/Lisbon',
      createdAt: now,
      updatedAt: now,
    });
  }

  const existingInbox = await db.select().from(projects).where(eq(projects.id, INBOX_PROJECT_ID));
  if (existingInbox.length === 0) {
    await db.insert(projects).values({
      id: INBOX_PROJECT_ID,
      name: 'Inbox',
      color: '#838c91',
      icon: 'inbox',
      parentId: null,
      order: 0,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      clientUpdatedAt: now,
      syncStatus: 'local',
    });
  }
}

export { DEFAULT_USER_ID, INBOX_PROJECT_ID };
