// src/repositories/projects.repo.test.ts
// Testes do repositório de projects.

import { describe, it, expect, afterEach } from 'vitest';
import { createTestDB, type TestDB } from './test-utils';
import * as projectsRepo from './projects.repo';
import * as outboxRepo from './outbox.repo';

let db: TestDB;
let close: () => void;

afterEach(() => {
  close?.();
});

describe('projects.repo', () => {
  it('create: insere projecto e enfileira evento na outbox', async () => {
    ({ db, close } = createTestDB());
    const project = await projectsRepo.create(db, {
      name: 'Trabalho',
      color: '#0079bf',
      icon: 'briefcase',
    });
    expect(project.id).toBeTruthy();
    expect(project.name).toBe('Trabalho');
    expect(project.syncStatus).toBe('local');
    const outbox = await outboxRepo.listAll(db);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].op).toBe('create');
    expect(outbox[0].entity).toBe('project');
  });

  it('listActive: exclui projectos arquivados', async () => {
    ({ db, close } = createTestDB());
    const a = await projectsRepo.create(db, { name: 'A', color: '#000', icon: 'a' });
    const b = await projectsRepo.create(db, { name: 'B', color: '#000', icon: 'b' });
    await projectsRepo.archive(db, b.id);
    const active = await projectsRepo.listActive(db);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(a.id);
  });

  it('update: altera campos e enfileira update na outbox', async () => {
    ({ db, close } = createTestDB());
    const project = await projectsRepo.create(db, { name: 'Old', color: '#000', icon: 'i' });
    await outboxRepo.clearAll(db);
    const updated = await projectsRepo.update(db, project.id, { name: 'New' });
    expect(updated?.name).toBe('New');
    expect(updated?.syncStatus).toBe('pending');
    const outbox = await outboxRepo.listAll(db);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].op).toBe('update');
  });

  it('softDelete: marca archivedAt e enfileira update', async () => {
    ({ db, close } = createTestDB());
    const project = await projectsRepo.create(db, { name: 'X', color: '#000', icon: 'i' });
    await outboxRepo.clearAll(db);
    const ok = await projectsRepo.softDelete(db, project.id);
    expect(ok).toBe(true);
    const after = await projectsRepo.getById(db, project.id);
    expect(after?.archivedAt).not.toBeNull();
    const outbox = await outboxRepo.listAll(db);
    expect(outbox[0].op).toBe('update');
  });

  it('hardDelete: remove o projecto e enfileira delete', async () => {
    ({ db, close } = createTestDB());
    const project = await projectsRepo.create(db, { name: 'X', color: '#000', icon: 'i' });
    await outboxRepo.clearAll(db);
    const ok = await projectsRepo.hardDelete(db, project.id);
    expect(ok).toBe(true);
    const after = await projectsRepo.getById(db, project.id);
    expect(after).toBeNull();
    const outbox = await outboxRepo.listAll(db);
    expect(outbox[0].op).toBe('delete');
  });

  it('getById: devolve null para id inexistente', async () => {
    ({ db, close } = createTestDB());
    const result = await projectsRepo.getById(db, 'nope');
    expect(result).toBeNull();
  });

  it('create: suporta type="shopping"', async () => {
    ({ db, close } = createTestDB());
    const project = await projectsRepo.create(db, {
      name: 'Lista de Compras',
      color: '#4CAF50',
      icon: 'cart-outline',
      type: 'shopping',
    });
    expect(project.id).toBeTruthy();
    expect(project.name).toBe('Lista de Compras');
    expect(project.type).toBe('shopping');
  });

  it('create: type default é "default" quando omitido', async () => {
    ({ db, close } = createTestDB());
    const project = await projectsRepo.create(db, {
      name: 'Trabalho',
      color: '#0079bf',
      icon: 'briefcase',
    });
    expect(project.type).toBe('default');
  });

  it('update: pode alterar type de default para shopping', async () => {
    ({ db, close } = createTestDB());
    const project = await projectsRepo.create(db, {
      name: 'X',
      color: '#000',
      icon: 'i',
      type: 'default',
    });
    const updated = await projectsRepo.update(db, project.id, { type: 'shopping' });
    expect(updated?.type).toBe('shopping');
  });

  it('update: pode alterar type de shopping para default', async () => {
    ({ db, close } = createTestDB());
    const project = await projectsRepo.create(db, {
      name: 'X',
      color: '#000',
      icon: 'i',
      type: 'shopping',
    });
    const updated = await projectsRepo.update(db, project.id, { type: 'default' });
    expect(updated?.type).toBe('default');
  });
});
