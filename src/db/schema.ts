// src/db/schema.ts
// Schema Drizzle para a base de dados local (expo-sqlite).
// 7 tabelas: users, projects, tasks, labels, taskLabels, reminders, outbox.
// IDs são ULIDs gerados no cliente (offline-friendly).
// Campos clientUpdatedAt + syncStatus preparam a integração com sync cloud.

import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color').notNull(),
    icon: text('icon').notNull(),
    type: text('type', { enum: ['default', 'shopping'] }).default('default'),
    parentId: text('parent_id'),
    order: integer('order').notNull(),
    archivedAt: integer('archived_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    clientUpdatedAt: integer('client_updated_at').notNull(),
    syncStatus: text('sync_status', { enum: ['local', 'pending', 'synced'] })
      .notNull()
      .default('local'),
  },
  (table) => ({
    parentIdx: index('projects_parent_idx').on(table.parentId),
    orderIdx: index('projects_order_idx').on(table.order),
  })
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    projectId: text('project_id'),
    parentId: text('parent_id'),
    priority: integer('priority').notNull().default(0),
    status: text('status', { enum: ['todo', 'done'] })
      .notNull()
      .default('todo'),
    dueDate: integer('due_date'),
    dueTime: integer('due_time'),
    recurrenceRule: text('recurrence_rule'),
    order: integer('order').notNull(),
    completedAt: integer('completed_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    clientUpdatedAt: integer('client_updated_at').notNull(),
    syncStatus: text('sync_status', { enum: ['local', 'pending', 'synced'] })
      .notNull()
      .default('local'),
  },
  (table) => ({
    dueDateStatusIdx: index('tasks_due_date_status_idx').on(table.dueDate, table.status),
    projectStatusOrderIdx: index('tasks_project_status_order_idx').on(
      table.projectId,
      table.status,
      table.order
    ),
    clientUpdatedAtIdx: index('tasks_client_updated_at_idx').on(table.clientUpdatedAt),
  })
);

export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const taskLabels = sqliteTable(
  'task_labels',
  {
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    labelId: text('label_id')
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.labelId] }),
    labelIdx: index('task_labels_label_idx').on(table.labelId),
  })
);

export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  triggerAt: integer('trigger_at').notNull(),
  type: text('type', { enum: ['absolute', 'relative'] }).notNull(),
  relativeMinutes: integer('relative_minutes'),
  notificationId: text('notification_id'),
  fired: integer('fired', { mode: 'boolean' }).notNull().default(false),
});

export const outbox = sqliteTable(
  'outbox',
  {
    id: text('id').primaryKey(),
    entity: text('entity', { enum: ['task', 'project', 'label', 'reminder'] }).notNull(),
    entityId: text('entity_id').notNull(),
    op: text('op', { enum: ['create', 'update', 'delete'] }).notNull(),
    payload: text('payload', { mode: 'json' }).notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    attempts: integer('attempts').notNull().default(0),
  },
  (table) => ({
    createdAtIdx: index('outbox_created_at_idx').on(table.createdAt),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type OutboxEntry = typeof outbox.$inferSelect;
export type NewOutboxEntry = typeof outbox.$inferInsert;
