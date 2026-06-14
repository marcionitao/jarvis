// src/repositories/tasks.repo.test.ts
// Testes do repositório de tasks.

import { describe, it, expect, afterEach } from 'vitest';
import { addDays } from 'date-fns';
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
    const todayKey = tasksRepo.toDateKey(today);
    const yesterdayKey = tasksRepo.toDateKey(addDays(today, -1));
    const tomorrowKey = tasksRepo.toDateKey(addDays(today, 1));
    await tasksRepo.create(db, { title: 'Hoje', dueDate: todayKey });
    await tasksRepo.create(db, { title: 'Atrasada', dueDate: yesterdayKey });
    await tasksRepo.create(db, { title: 'Amanha', dueDate: tomorrowKey });
    await tasksRepo.create(db, { title: 'Sem data' });
    const list = await tasksRepo.listToday(db, today);
    const titles = list.map((t) => t.title).sort();
    expect(titles).toEqual(['Atrasada', 'Hoje']);
  });

  it('listToday(includeCompleted=true): devolve tambem tarefas com status done', async () => {
    ({ db, close } = createTestDB());
    const today = new Date();
    const todayKey = tasksRepo.toDateKey(today);
    const aberta = await tasksRepo.create(db, { title: 'Aberta', dueDate: todayKey });
    const concluida = await tasksRepo.create(db, { title: 'Concluida', dueDate: todayKey });
    await tasksRepo.toggleComplete(db, concluida.id, true);
    const list = await tasksRepo.listToday(db, today, true);
    const titles = list.map((t) => t.title).sort();
    expect(titles).toEqual(['Aberta', 'Concluida']);
    expect(list.find((t) => t.id === aberta.id)?.status).toBe('todo');
    expect(list.find((t) => t.id === concluida.id)?.status).toBe('done');
  });

  it('listToday(includeCompleted=false, default): exclui tarefas done', async () => {
    ({ db, close } = createTestDB());
    const today = new Date();
    const todayKey = tasksRepo.toDateKey(today);
    const aberta = await tasksRepo.create(db, { title: 'Aberta', dueDate: todayKey });
    const concluida = await tasksRepo.create(db, { title: 'Concluida', dueDate: todayKey });
    await tasksRepo.toggleComplete(db, concluida.id, true);
    const listDefault = await tasksRepo.listToday(db, today);
    expect(listDefault.map((t) => t.id)).toEqual([aberta.id]);
    const listExplicit = await tasksRepo.listToday(db, today, false);
    expect(listExplicit.map((t) => t.id)).toEqual([aberta.id]);
  });

  it('listUpcoming: limita ao intervalo de N dias', async () => {
    ({ db, close } = createTestDB());
    const today = new Date();
    const todayKey = tasksRepo.toDateKey(today);
    const in3 = tasksRepo.toDateKey(addDays(today, 3));
    const in10 = tasksRepo.toDateKey(addDays(today, 10));
    await tasksRepo.create(db, { title: 'Hoje', dueDate: todayKey });
    await tasksRepo.create(db, { title: '3 dias', dueDate: in3 });
    await tasksRepo.create(db, { title: '10 dias', dueDate: in10 });
    const list = await tasksRepo.listUpcoming(db, today, 7);
    const titles = list.map((t) => t.title).sort();
    expect(titles).toEqual(['3 dias', 'Hoje']);
  });

  it('toDateKey/fromDateKey: roundtrip preserva ano/mes/dia', () => {
    const samples: Date[] = [
      new Date(2026, 0, 1),
      new Date(2026, 11, 31),
      new Date(2024, 1, 29),
      new Date(2026, 5, 7),
    ];
    for (const d of samples) {
      const key = tasksRepo.toDateKey(d);
      const back = tasksRepo.fromDateKey(key);
      expect(key).toBe(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
      expect(back.getFullYear()).toBe(d.getFullYear());
      expect(back.getMonth()).toBe(d.getMonth());
      expect(back.getDate()).toBe(d.getDate());
    }
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

    it('listByDate: devolve tarefas com dueDate igual ao dia especificado', async () => {
      ({ db, close } = createTestDB());
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const taskToday = await tasksRepo.create(db, {
        title: 'Hoje',
        dueDate: tasksRepo.toDateKey(today),
      });
      const taskTomorrow = await tasksRepo.create(db, {
        title: 'Amanhã',
        dueDate: tasksRepo.toDateKey(tomorrow),
      });
      const taskYesterday = await tasksRepo.create(db, {
        title: 'Ontem',
        dueDate: tasksRepo.toDateKey(yesterday),
      });

      const tasks = await tasksRepo.listByDate(db, today);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Hoje');
    });

  describe('searchWithFilters', () => {
    it('devolve tarefas filtradas por labelId', async () => {
      ({ db, close } = createTestDB());
      const task1 = await tasksRepo.create(db, { title: 'Comprar leite' });
      const task2 = await tasksRepo.create(db, { title: 'Pagar contas' });
      const task3 = await tasksRepo.create(db, { title: 'Reunião' });

      const { create: createLabel, attachToTask } = await import('./labels.repo');
      const label1 = await createLabel(db, { name: 'casa', color: '#ff0' });
      const label2 = await createLabel(db, { name: 'trabalho', color: '#00f' });

      await attachToTask(db, task1.id, label1.id);
      await attachToTask(db, task2.id, label2.id);
      await attachToTask(db, task3.id, label2.id);

      const result1 = await tasksRepo.searchWithFilters(db, { labelId: label1.id });
      expect(result1).toHaveLength(1);
      expect(result1[0].title).toBe('Comprar leite');

      const result2 = await tasksRepo.searchWithFilters(db, { labelId: label2.id });
      expect(result2).toHaveLength(2);
      expect(result2.map((t) => t.title).sort()).toEqual(['Pagar contas', 'Reunião']);
    });

    it('devolve lista vazia se nenhuma task tem a label', async () => {
      ({ db, close } = createTestDB());
      await tasksRepo.create(db, { title: 'Qualquer' });
      const { create: createLabel } = await import('./labels.repo');
      const label = await createLabel(db, { name: 'sozinha', color: '#f00' });

      const result = await tasksRepo.searchWithFilters(db, { labelId: label.id });
      expect(result).toHaveLength(0);
    });

    it('search com query @label retorna tasks com essa label', async () => {
      ({ db, close } = createTestDB());
      const { create: createLabel, attachToTask } = await import('./labels.repo');

      const task = await tasksRepo.create(db, { title: 'Comprar leite' });
      const label = await createLabel(db, { name: 'casa', color: '#ff0' });
      await attachToTask(db, task.id, label.id);

      const result = await tasksRepo.searchWithFilters(db, { query: '@casa' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Comprar leite');
    });

    it('search com query @label não retorna tasks sem essa label', async () => {
      ({ db, close } = createTestDB());
      const { create: createLabel, attachToTask } = await import('./labels.repo');

      const task = await tasksRepo.create(db, { title: 'Reunião' });
      const label = await createLabel(db, { name: 'casa', color: '#ff0' });
      await attachToTask(db, task.id, label.id);

      const result = await tasksRepo.searchWithFilters(db, { query: '@trabalho' });
      expect(result).toHaveLength(0);
    });

    it('search com query @label também pesquisa por texto (@ literal)', async () => {
      ({ db, close } = createTestDB());

      // Task cujo título contém literalmente "@casa"
      const task = await tasksRepo.create(db, { title: 'Marcar @casa reunião' });

      const result = await tasksRepo.searchWithFilters(db, { query: '@casa' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Marcar @casa reunião');
    });

    it('search com nome de label (sem @) retorna tasks com essa label', async () => {
      ({ db, close } = createTestDB());
      const { create: createLabel, attachToTask } = await import('./labels.repo');

      const task = await tasksRepo.create(db, { title: 'Comprar remédios' });
      const label = await createLabel(db, { name: 'saude', color: '#f00' });
      await attachToTask(db, task.id, label.id);

      // Pesquisa sem @ - deve encontrar pela label
      const result = await tasksRepo.searchWithFilters(db, { query: 'saude' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Comprar remédios');
    });

    it('search com nome parcial de label retorna tasks com label correspondente', async () => {
      ({ db, close } = createTestDB());
      const { create: createLabel, attachToTask } = await import('./labels.repo');

      const task = await tasksRepo.create(db, { title: 'Curso online' });
      const label = await createLabel(db, { name: 'formacao profissional', color: '#0f0' });
      await attachToTask(db, task.id, label.id);

      // Pesquisa parcial - deve encontrar
      const result = await tasksRepo.searchWithFilters(db, { query: 'formacao' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Curso online');
    });

    it('combina labelId com outros filtros', async () => {
      ({ db, close } = createTestDB());
      const { create: createLabel, attachToTask } = await import('./labels.repo');

      const taskA = await tasksRepo.create(db, { title: 'Urgente casa', priority: 1 });
      const taskB = await tasksRepo.create(db, { title: 'Normal casa', priority: 3 });
      const label = await createLabel(db, { name: 'casa', color: '#ff0' });
      await attachToTask(db, taskA.id, label.id);
      await attachToTask(db, taskB.id, label.id);

      const result = await tasksRepo.searchWithFilters(db, {
        labelId: label.id,
        priority: 1,
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Urgente casa');
    });
  });
});
