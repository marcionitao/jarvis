// src/repositories/projects.repo.ts
// Repositório de projetos. CRUD + soft delete (archivedAt).
// Toda mutation enfileira evento na outbox (sync-ready).

import { eq, isNull, asc, and } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { JarvisDB } from '@/db/client';
import { projects, type Project, type NewProject } from '@/db/schema';
import { enqueueOutbox } from './outbox.repo';

export type ProjectDTO = Project;

export async function listActive(db: JarvisDB): Promise<ProjectDTO[]> {
  return db
    .select()
    .from(projects)
    .where(isNull(projects.archivedAt))
    .orderBy(asc(projects.order));
}

export async function listAll(db: JarvisDB): Promise<ProjectDTO[]> {
  return db.select().from(projects).orderBy(asc(projects.order));
}

export async function getById(db: JarvisDB, id: string): Promise<ProjectDTO | null> {
  const rows = await db.select().from(projects).where(eq(projects.id, id));
  return rows[0] ?? null;
}

export interface CreateProjectInput {
  name: string;
  color: string;
  icon: string;
  parentId?: string | null;
  order?: number;
}

export async function create(db: JarvisDB, input: CreateProjectInput): Promise<ProjectDTO> {
  const now = Date.now();
  const id = ulid();
  const newProject: NewProject = {
    id,
    name: input.name,
    color: input.color,
    icon: input.icon,
    parentId: input.parentId ?? null,
    order: input.order ?? now,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    syncStatus: 'local',
  };
  await db.insert(projects).values(newProject);
  await enqueueOutbox(db, { entity: 'project', entityId: id, op: 'create', payload: newProject });
  const created = await getById(db, id);
  if (!created) throw new Error('Failed to create project');
  return created;
}

export interface UpdateProjectInput {
  name?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
}

export async function update(
  db: JarvisDB,
  id: string,
  input: UpdateProjectInput
): Promise<ProjectDTO | null> {
  const existing = await getById(db, id);
  if (!existing) return null;
  const now = Date.now();
  const patch = { ...input, updatedAt: now, clientUpdatedAt: now, syncStatus: 'pending' as const };
  await db.update(projects).set(patch).where(eq(projects.id, id));
  const updated = { ...existing, ...patch };
  await enqueueOutbox(db, { entity: 'project', entityId: id, op: 'update', payload: updated });
  return updated;
}

export async function archive(db: JarvisDB, id: string): Promise<ProjectDTO | null> {
  const existing = await getById(db, id);
  if (!existing) return null;
  const now = Date.now();
  const archivedAt = now;
  await db
    .update(projects)
    .set({ archivedAt, updatedAt: now, clientUpdatedAt: now, syncStatus: 'pending' })
    .where(eq(projects.id, id));
  const updated = { ...existing, archivedAt, updatedAt: now, clientUpdatedAt: now, syncStatus: 'pending' as const };
  await enqueueOutbox(db, { entity: 'project', entityId: id, op: 'update', payload: updated });
  return updated;
}

export async function softDelete(db: JarvisDB, id: string): Promise<boolean> {
  const existing = await getById(db, id);
  if (!existing) return false;
  const now = Date.now();
  await db
    .update(projects)
    .set({ archivedAt: now, updatedAt: now, clientUpdatedAt: now, syncStatus: 'pending' })
    .where(and(eq(projects.id, id)));
  await enqueueOutbox(db, {
    entity: 'project',
    entityId: id,
    op: 'update',
    payload: { ...existing, archivedAt: now, updatedAt: now, clientUpdatedAt: now },
  });
  return true;
}

export async function hardDelete(db: JarvisDB, id: string): Promise<boolean> {
  const existing = await getById(db, id);
  if (!existing) return false;
  await db.delete(projects).where(eq(projects.id, id));
  await enqueueOutbox(db, {
    entity: 'project',
    entityId: id,
    op: 'delete',
    payload: { id },
  });
  return true;
}
