// src/repositories/tasks.repo.test.ts
// Testes do repositório de tasks.

import { describe, it, expect, afterEach } from 'vitest';
import { createTestDB, type TestDB } from './test-utils';
import * as tasksRepo from './tasks.repo';
import * as outboxRepo from './outbox.repo';

let db: TestDB;
let close: () => void;

afterEach(() => {
  close?.();
});

describe('tasks.repo', () => {
  it('create: insere tarefa e enfileira create na outbox', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, {
      title: 'Comprar leite',
      priority: 1,
    });
    expect(task.id).toBeTruthy();
    expect(task.title).toBe('Comprar leite');
    expect(task.priority).toBe(1);
    expect(task.status).toBe('todo');
    const outbox = await outboxRepo.listAll(db);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].op).toBe('create');
  });

  it('listByProject: devolve apenas tarefas do projecto', async () => {
    ({ db, close } = createTestDB());
    await tasksRepo.create(db, { title: 'A', projectId: 'p1' });
    await tasksRepo.create(db, { title: 'B', projectId: 'p2' });
    await tasksRepo.create(db, { title: 'C', projectId: 'p1' });
    const p1 = await tasksRepo.listByProject(db, 'p1');
    expect(p1).toHaveLength(2);
    const p2 = await tasksRepo.listByProject(db, 'p2');
    expect(p2).toHaveLength(1);
    const inbox = await tasksRepo.listByProject(db, null);
    expect(inbox).toHaveLength(0);
  });

  it('listToday: devolve tarefas com dueDate <= hoje e status todo', async () => {
    ({ db, close } = createTestDB());
    const today = new Date();
    const todayEpoch = Math.floor(
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 86400000
    );
    await tasksRepo.create(db, { title: 'Hoje', dueDate: todayEpoch });
    await tasksRepo.create(db, { title: 'Atrasada', dueDate: todayEpoch - 1 });
    await tasksRepo.create(db, { title: 'Amanha', dueDate: todayEpoch + 1 });
    await tasksRepo.create(db, { title: 'Sem data' });
    const list = await tasksRepo.listToday(db, today);
    const titles = list.map((t) => t.title).sort();
    expect(titles).toEqual(['Atrasada', 'Hoje']);
  });

  it('listUpcoming: limita ao intervalo de N dias', async () => {
    ({ db, close } = createTestDB());
    const today = new Date();
    const todayEpoch = Math.floor(
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 86400000
    );
    await tasksRepo.create(db, { title: 'Hoje', dueDate: todayEpoch });
    await tasksRepo.create(db, { title: '3 dias', dueDate: todayEpoch + 3 });
    await tasksRepo.create(db, { title: '10 dias', dueDate: todayEpoch + 10 });
    const list = await tasksRepo.listUpcoming(db, today, 7);
    const titles = list.map((t) => t.title).sort();
    expect(titles).toEqual(['3 dias', 'Hoje']);
  });

  it('toggleComplete: marca completedAt e muda status', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'X' });
    expect(task.completedAt).toBeNull();
    const done = await tasksRepo.toggleComplete(db, task.id, true);
    expect(done?.status).toBe('done');
    expect(done?.completedAt).not.toBeNull();
    const undone = await tasksRepo.toggleComplete(db, task.id, false);
    expect(undone?.status).toBe('todo');
    expect(undone?.completedAt).toBeNull();
  });

  it('update: altera campos e enfileira update na outbox', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'Old' });
    await outboxRepo.clearAll(db);
    const updated = await tasksRepo.update(db, task.id, { title: 'New', priority: 2 });
    expect(updated?.title).toBe('New');
    expect(updated?.priority).toBe(2);
    const outbox = await outboxRepo.listAll(db);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].op).toBe('update');
  });

  it('hardDelete: remove tarefa e enfileira delete', async () => {
    ({ db, close } = createTestDB());
    const task = await tasksRepo.create(db, { title: 'X' });
    await outboxRepo.clearAll(db);
    const ok = await tasksRepo.hardDelete(db, task.id);
    expect(ok).toBe(true);
    const after = await tasksRepo.getById(db, task.id);
    expect(after).toBeNull();
    const outbox = await outboxRepo.listAll(db);
    expect(outbox[0].op).toBe('delete');
  });
});
