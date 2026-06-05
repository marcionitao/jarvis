// src/services/quick-capture.service.test.ts
// Testes do parser Quick Add — lógica pura.

import { describe, it, expect } from 'vitest';
import { parseQuickAdd } from './quick-capture.service';

describe('parseQuickAdd', () => {
  it('parses title only', () => {
    expect(parseQuickAdd('Comprar leite')).toEqual({
      title: 'Comprar leite',
      priority: 0,
      projectName: null,
      labelName: null,
      dueDate: null,
    });
  });

  it('parses priority !p1', () => {
    const r = parseQuickAdd('Comprar leite !p1');
    expect(r.priority).toBe(1);
    expect(r.title).toBe('Comprar leite');
  });

  it('parses project #nome', () => {
    const r = parseQuickAdd('Comprar leite #trabalho');
    expect(r.projectName).toBe('trabalho');
    expect(r.title).toBe('Comprar leite');
  });

  it('parses label @nome', () => {
    const r = parseQuickAdd('Comprar leite @urgente');
    expect(r.labelName).toBe('urgente');
    expect(r.title).toBe('Comprar leite');
  });

  it('parses today keyword', () => {
    const r = parseQuickAdd('Reunião hoje');
    expect(r.dueDate).not.toBeNull();
    expect(r.title).toBe('Reunião');
  });

  it('parses tomorrow keyword (amanhã)', () => {
    const r = parseQuickAdd('Reunião amanhã');
    expect(r.dueDate).not.toBeNull();
    expect(r.title).toBe('Reunião');
  });

  it('parses combined input', () => {
    const r = parseQuickAdd('Reunião cliente amanhã !p2 #trabalho @urgente');
    expect(r.title).toBe('Reunião cliente');
    expect(r.priority).toBe(2);
    expect(r.projectName).toBe('trabalho');
    expect(r.labelName).toBe('urgente');
    expect(r.dueDate).not.toBeNull();
  });
});
