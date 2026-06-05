// src/hooks/event-bus.ts
// Event bus minimalista para invalidação de queries entre hooks.
// Cada hook de query subscreve os eventos que lhe interessam
// e refresca os dados quando uma mutation os emite.

export type EventName =
  | 'tasks:changed'
  | 'projects:changed'
  | 'labels:changed'
  | 'reminders:changed'
  | 'outbox:changed';

export type Listener = () => void;

class EventBus {
  private listeners = new Map<EventName, Set<Listener>>();

  on(event: EventName, listener: Listener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => this.off(event, listener);
  }

  off(event: EventName, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: EventName): void {
    this.listeners.get(event)?.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error(`[event-bus] listener for "${event}" threw`, err);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }

  listenerCount(event: EventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const eventBus = new EventBus();
