// @vitest-environment happy-dom
// src/hooks/use-query.test.tsx
// Testes do hook base useQuery: carregamento, refresh, invalidação via bus, error handling.
// Usa react-dom directamente (em vez de @testing-library/react-native) por causa de incompatibilidades
// de Flow types em react-native (resolvido em runtime, mas esbuild no vitest não os processa).

// @vitest-environment happy-dom
// src/hooks/use-query.test.tsx
// Testes do hook base useQuery: carregamento, refresh, invalidação via bus, error handling.
// Usa react-dom directamente (em vez de @testing-library/react-native) por causa de incompatibilidades
// de Flow types em react-native (resolvido em runtime, mas esbuild no vitest não os processa).

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/state/db.context', () => ({
  useDB: vi.fn(),
}));

import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { useQuery } from './use-query';
import { eventBus } from './event-bus';
import { useDB } from '@/state/db.context';
import type { JarvisDB } from '@/db/client';

const mockUseDB = vi.mocked(useDB);
const mockDb = {} as JarvisDB;

function mockUseDBReturning(ready: boolean) {
  mockUseDB.mockReturnValue({ ready, db: ready ? mockDb : null });
}

interface RenderedHook<T> {
  value: T;
  unmount: () => void;
  root: Root;
}

function renderHookInAct<T>(hookFn: () => T): RenderedHook<T> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let value!: T;
  function Test() {
    value = hookFn();
    return null;
  }
  act(() => {
    root.render(<Test />);
  });
  return {
    get value() {
      return value;
    },
    set value(v) {
      value = v;
    },
    unmount: () => {
      act(() => root.unmount());
      document.body.removeChild(container);
    },
    root,
  };
}

beforeEach(() => {
  eventBus.clear();
  mockUseDB.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useQuery', () => {
  it('carrega dados na montagem quando db está pronta', async () => {
    mockUseDBReturning(true);
    const fetcher = vi.fn().mockResolvedValue([{ id: '1' }]);
    const rendered = renderHookInAct(() => useQuery(fetcher));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.data).toEqual([{ id: '1' }]);
    expect(rendered.value.loading).toBe(false);
    expect(rendered.value.error).toBeNull();
    expect(fetcher).toHaveBeenCalledWith(mockDb);
    rendered.unmount();
  });

  it('loading=true enquanto db não está pronta', () => {
    mockUseDBReturning(false);
    const fetcher = vi.fn().mockResolvedValue([]);
    const rendered = renderHookInAct(() => useQuery(fetcher));
    expect(rendered.value.loading).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
    rendered.unmount();
  });

  it('expõe error quando fetcher rejeita', async () => {
    mockUseDBReturning(true);
    const err = new Error('boom');
    const fetcher = vi.fn().mockRejectedValue(err);
    const rendered = renderHookInAct(() => useQuery(fetcher));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.error).toBe(err);
    expect(rendered.value.loading).toBe(false);
    rendered.unmount();
  });

  it('refresh: recarrega dados manualmente', async () => {
    mockUseDBReturning(true);
    let count = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      count += 1;
      return [`v${count}`];
    });
    const rendered = renderHookInAct(() => useQuery(fetcher));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.data).toEqual(['v1']);

    await act(async () => {
      await rendered.value.refresh();
    });
    expect(rendered.value.data).toEqual(['v2']);
    expect(fetcher).toHaveBeenCalledTimes(2);
    rendered.unmount();
  });

  it('invalidação: emite evento do bus → refetch automático', async () => {
    mockUseDBReturning(true);
    let count = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      count += 1;
      return [`v${count}`];
    });
    const rendered = renderHookInAct(() => useQuery(fetcher, ['tasks:changed']));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.data).toEqual(['v1']);

    await act(async () => {
      eventBus.emit('tasks:changed');
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.data).toEqual(['v2']);
    expect(fetcher).toHaveBeenCalledTimes(2);
    rendered.unmount();
  });

  it('invalidação: não refetch para evento não subscrito', async () => {
    mockUseDBReturning(true);
    const fetcher = vi.fn().mockResolvedValue([]);
    const rendered = renderHookInAct(() => useQuery(fetcher, ['tasks:changed']));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const callsAtRest = fetcher.mock.calls.length;

    await act(async () => {
      eventBus.emit('projects:changed');
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(fetcher).toHaveBeenCalledTimes(callsAtRest);
    rendered.unmount();
  });

  it('cleanup: ao desmontar, removido do bus', async () => {
    mockUseDBReturning(true);
    const fetcher = vi.fn().mockResolvedValue([]);
    const rendered = renderHookInAct(() => useQuery(fetcher, ['tasks:changed']));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(eventBus.listenerCount('tasks:changed')).toBe(1);

    rendered.unmount();
    expect(eventBus.listenerCount('tasks:changed')).toBe(0);
  });

  it('múltiplos eventos: refetch em qualquer um', async () => {
    mockUseDBReturning(true);
    let count = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      count += 1;
      return [count];
    });
    const rendered = renderHookInAct(() =>
      useQuery(fetcher, ['tasks:changed', 'projects:changed'])
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.data).toEqual([1]);

    await act(async () => {
      eventBus.emit('projects:changed');
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.data).toEqual([2]);

    await act(async () => {
      eventBus.emit('tasks:changed');
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.data).toEqual([3]);
    rendered.unmount();
  });
});
