// src/hooks/event-bus.test.ts
// Testes do event bus: subscribe, unsubscribe, emit, listener count.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from './event-bus';

describe('event-bus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  it('on: regista listener e retorna função de unsubscribe', () => {
    const listener = vi.fn();
    const unsub = eventBus.on('tasks:changed', listener);
    expect(typeof unsub).toBe('function');
    expect(eventBus.listenerCount('tasks:changed')).toBe(1);
  });

  it('emit: chama listeners registados para o evento', () => {
    const a = vi.fn();
    const b = vi.fn();
    eventBus.on('tasks:changed', a);
    eventBus.on('tasks:changed', b);
    eventBus.emit('tasks:changed');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('emit: não chama listeners de outros eventos', () => {
    const tasksListener = vi.fn();
    const projectsListener = vi.fn();
    eventBus.on('tasks:changed', tasksListener);
    eventBus.on('projects:changed', projectsListener);
    eventBus.emit('tasks:changed');
    expect(tasksListener).toHaveBeenCalledTimes(1);
    expect(projectsListener).not.toHaveBeenCalled();
  });

  it('unsubscribe (via retorno de on): remove o listener', () => {
    const listener = vi.fn();
    const unsub = eventBus.on('tasks:changed', listener);
    unsub();
    expect(eventBus.listenerCount('tasks:changed')).toBe(0);
    eventBus.emit('tasks:changed');
    expect(listener).not.toHaveBeenCalled();
  });

  it('off: remove listener explicitamente', () => {
    const listener = vi.fn();
    eventBus.on('tasks:changed', listener);
    eventBus.off('tasks:changed', listener);
    eventBus.emit('tasks:changed');
    expect(listener).not.toHaveBeenCalled();
  });

  it('múltiplos subscribers: cada um é chamado independentemente', () => {
    const a = vi.fn();
    const b = vi.fn();
    const c = vi.fn();
    eventBus.on('projects:changed', a);
    eventBus.on('projects:changed', b);
    eventBus.on('projects:changed', c);
    eventBus.emit('projects:changed');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(1);
  });

  it('emit: erro num listener não impede os outros', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const a = vi.fn(() => {
      throw new Error('boom');
    });
    const b = vi.fn();
    eventBus.on('tasks:changed', a);
    eventBus.on('tasks:changed', b);
    eventBus.emit('tasks:changed');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('clear: remove todos os listeners', () => {
    eventBus.on('tasks:changed', vi.fn());
    eventBus.on('projects:changed', vi.fn());
    eventBus.on('labels:changed', vi.fn());
    expect(eventBus.listenerCount('tasks:changed')).toBe(1);
    eventBus.clear();
    expect(eventBus.listenerCount('tasks:changed')).toBe(0);
    expect(eventBus.listenerCount('projects:changed')).toBe(0);
    expect(eventBus.listenerCount('labels:changed')).toBe(0);
  });

  it('off: silencioso quando listener não está registado', () => {
    const listener = vi.fn();
    expect(() => eventBus.off('tasks:changed', listener)).not.toThrow();
  });

  it('listenerCount: devolve 0 para evento sem listeners', () => {
    expect(eventBus.listenerCount('outbox:changed')).toBe(0);
  });
});
