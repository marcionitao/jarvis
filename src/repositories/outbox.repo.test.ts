// src/repositories/outbox.repo.test.ts
// Testes do repositório de outbox (fila de mutações para sync).

import { describe, it, expect, afterEach } from 'vitest';
import { createTestDB, type TestDB } from './test-utils';
import * as outboxRepo from './outbox.repo';

let db: TestDB;
let close: () => void;

afterEach(() => {
  close?.();
});

describe('outbox.repo', () => {
  it('enqueueOutbox: cria entrada com attempts=0', async () => {
    ({ db, close } = createTestDB());
    const entry = await outboxRepo.enqueueOutbox(db, {
      entity: 'task',
      entityId: 'task-1',
      op: 'create',
      payload: { title: 'A' },
    });
    expect(entry.id).toBeTruthy();
    expect(entry.attempts).toBe(0);
    expect(entry.op).toBe('create');
  });

  it('listPending: devolve entradas ordenadas por createdAt', async () => {
    ({ db, close } = createTestDB());
    const a = await outboxRepo.enqueueOutbox(db, {
      entity: 'task',
      entityId: '1',
      op: 'create',
      payload: {},
    });
    await new Promise((r) => setTimeout(r, 5));
    const b = await outboxRepo.enqueueOutbox(db, {
      entity: 'task',
      entityId: '2',
      op: 'create',
      payload: {},
    });
    const list = await outboxRepo.listPending(db);
    expect(list[0].id).toBe(a.id);
    expect(list[1].id).toBe(b.id);
  });

  it('markAttempt: incrementa contador', async () => {
    ({ db, close } = createTestDB());
    const entry = await outboxRepo.enqueueOutbox(db, {
      entity: 'task',
      entityId: '1',
      op: 'create',
      payload: {},
    });
    await outboxRepo.markAttempt(db, entry.id);
    await outboxRepo.markAttempt(db, entry.id);
    const after = await outboxRepo.getById(db, entry.id);
    expect(after?.attempts).toBe(2);
  });

  it('remove: apaga entrada', async () => {
    ({ db, close } = createTestDB());
    const entry = await outboxRepo.enqueueOutbox(db, {
      entity: 'task',
      entityId: '1',
      op: 'create',
      payload: {},
    });
    const ok = await outboxRepo.remove(db, entry.id);
    expect(ok).toBe(true);
    const after = await outboxRepo.getById(db, entry.id);
    expect(after).toBeNull();
  });

  it('clearAll: apaga todas as entradas', async () => {
    ({ db, close } = createTestDB());
    await outboxRepo.enqueueOutbox(db, { entity: 'task', entityId: '1', op: 'create', payload: {} });
    await outboxRepo.enqueueOutbox(db, { entity: 'task', entityId: '2', op: 'create', payload: {} });
    await outboxRepo.clearAll(db);
    const list = await outboxRepo.listAll(db);
    expect(list).toHaveLength(0);
  });

  it('count: devolve número de entradas', async () => {
    ({ db, close } = createTestDB());
    expect(await outboxRepo.count(db)).toBe(0);
    await outboxRepo.enqueueOutbox(db, { entity: 'task', entityId: '1', op: 'create', payload: {} });
    await outboxRepo.enqueueOutbox(db, { entity: 'task', entityId: '2', op: 'create', payload: {} });
    expect(await outboxRepo.count(db)).toBe(2);
  });
});
