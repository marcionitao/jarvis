// src/repositories/labels.repo.test.ts
// Testes do repositório de labels + gestão M:N com tasks.

import { describe, it, expect, afterEach } from 'vitest';
import { createTestDB, type TestDB } from './test-utils';
import * as labelsRepo from './labels.repo';
import * as tasksRepo from './tasks.repo';
import * as outboxRepo from './outbox.repo';

let db: TestDB;
let close: () => void;

afterEach(() => {
  close?.();
});

describe('labels.repo', () => {
  it('create: insere label e enfileira create na outbox', async () => {
    ({ db, close } = createTestDB());
    const label = await labelsRepo.create(db, { name: 'urgente', color: '#dc4c3e' });
    expect(label.id).toBeTruthy();
    expect(label.name).toBe('urgente');
    const outbox = await outboxRepo.listAll(db);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].entity).toBe('label');
  });

  it('list: devolve todas as labels ordenadas por nome', async () => {
    ({ db, close } = createTestDB());
    await labelsRepo.create(db, { name: 'beta', color: '#000' });
    await labelsRepo.create(db, { name: 'alfa', color: '#111' });
    const list = await labelsRepo.list(db);
    expect(list.map((l) => l.name)).toEqual(['alfa', 'beta']);
  });

  it('update: altera nome/cor e enfileira update', async () => {
    ({ db, close } = createTestDB());
    const label = await labelsRepo.create(db, { name: 'old', color: '#000' });
    await outboxRepo.clearAll(db);
    const updated = await labelsRepo.update(db, label.id, { name: 'new' });
    expect(updated?.name).toBe('new');
    const outbox = await outboxRepo.listAll(db);
    expect(outbox[0].op).toBe('update');
  });

  it('hardDelete: remove label e enfileira delete', async () => {
    ({ db, close } = createTestDB());
    const label = await labelsRepo.create(db, { name: 'x', color: '#000' });
    await outboxRepo.clearAll(db);
    const ok = await labelsRepo.hardDelete(db, label.id);
    expect(ok).toBe(true);
    const after = await labelsRepo.getById(db, label.id);
    expect(after).toBeNull();
    const outbox = await outboxRepo.listAll(db);
    expect(outbox[0].op).toBe('delete');
  });

  it('attachToTask: associa label a task', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'A' });
    const label = await labelsRepo.create(db, { name: 'tag', color: '#000' });
    await labelsRepo.attachToTask(db, task.id, label.id);
    const labels = await labelsRepo.listLabelsForTask(db, task.id);
    expect(labels).toHaveLength(1);
    expect(labels[0].id).toBe(label.id);
  });

  it('attachToTask: idempotente (não duplica)', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'A' });
    const label = await labelsRepo.create(db, { name: 'tag', color: '#000' });
    await labelsRepo.attachToTask(db, task.id, label.id);
    await labelsRepo.attachToTask(db, task.id, label.id);
    const labels = await labelsRepo.listLabelsForTask(db, task.id);
    expect(labels).toHaveLength(1);
  });

  it('countTasksPerLabel: devolve contagem correcta por label', async () => {
    ({ db, close } = createTestDB());
    const { create: createLabel, attachToTask } = await import('./labels.repo');

    const task1 = await tasksRepo.create(db, { title: 'Tarefa 1' });
    const task2 = await tasksRepo.create(db, { title: 'Tarefa 2' });
    const task3 = await tasksRepo.create(db, { title: 'Tarefa 3' });

    const labelA = await createLabel(db, { name: 'A', color: '#f00' });
    const labelB = await createLabel(db, { name: 'B', color: '#0f0' });

    await attachToTask(db, task1.id, labelA.id);
    await attachToTask(db, task2.id, labelA.id);
    await attachToTask(db, task2.id, labelB.id);
    await attachToTask(db, task3.id, labelB.id);

    const counts = await labelsRepo.countTasksPerLabel(db);
    expect(counts.get(labelA.id)).toBe(2);
    expect(counts.get(labelB.id)).toBe(2);
  });
});
