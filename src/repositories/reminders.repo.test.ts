// src/repositories/reminders.repo.test.ts
// Testes do repositório de reminders.

import { describe, it, expect, afterEach } from 'vitest';
import { createTestDB, type TestDB } from './test-utils';
import * as remindersRepo from './reminders.repo';
import * as tasksRepo from './tasks.repo';

let db: TestDB;
let close: () => void;

afterEach(() => {
  close?.();
});

describe('reminders.repo', () => {
  it('create: insere lembrete', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'A' });
    const reminder = await remindersRepo.create(db, {
      taskId: task.id,
      triggerAt: Date.now() + 1000,
      type: 'absolute',
    });
    expect(reminder.id).toBeTruthy();
    expect(reminder.fired).toBe(false);
  });

  it('listPending: devolve apenas lembretes com triggerAt <= now e fired=false', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'A' });
    const now = Date.now();
    await remindersRepo.create(db, {
      taskId: task.id,
      triggerAt: now - 5000,
      type: 'absolute',
    });
    await remindersRepo.create(db, {
      taskId: task.id,
      triggerAt: now + 5000,
      type: 'absolute',
    });
    await remindersRepo.create(db, {
      taskId: task.id,
      triggerAt: now - 1000,
      type: 'absolute',
    });
    const pending = await remindersRepo.listPending(db, now);
    expect(pending).toHaveLength(2);
  });

  it('listUpcoming: devolve apenas lembretes futuros', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'A' });
    const now = Date.now();
    await remindersRepo.create(db, { taskId: task.id, triggerAt: now - 5000, type: 'absolute' });
    await remindersRepo.create(db, { taskId: task.id, triggerAt: now + 5000, type: 'absolute' });
    const upcoming = await remindersRepo.listUpcoming(db, now);
    expect(upcoming).toHaveLength(1);
  });

  it('markFired: marca fired=true e actualiza notificationId', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'A' });
    const reminder = await remindersRepo.create(db, {
      taskId: task.id,
      triggerAt: Date.now(),
      type: 'absolute',
    });
    const fired = await remindersRepo.markFired(db, reminder.id, 'notif-1');
    expect(fired?.fired).toBe(true);
    expect(fired?.notificationId).toBe('notif-1');
  });

  it('hardDelete: remove lembrete', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'A' });
    const reminder = await remindersRepo.create(db, {
      taskId: task.id,
      triggerAt: Date.now(),
      type: 'absolute',
    });
    const ok = await remindersRepo.hardDelete(db, reminder.id);
    expect(ok).toBe(true);
    const after = await remindersRepo.getById(db, reminder.id);
    expect(after).toBeNull();
  });

  it('deleteForTask: remove todos os lembretes da task', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'A' });
    await remindersRepo.create(db, { taskId: task.id, triggerAt: 100, type: 'absolute' });
    await remindersRepo.create(db, { taskId: task.id, triggerAt: 200, type: 'absolute' });
    const remaining = await remindersRepo.deleteForTask(db, task.id);
    const list = await remindersRepo.listForTask(db, task.id);
    expect(list).toHaveLength(0);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
});
