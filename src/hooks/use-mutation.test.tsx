// @vitest-environment happy-dom
// src/hooks/use-mutation.test.tsx
// Testes do hook base useMutation: execução, loading, error, emissão de evento.

// @vitest-environment happy-dom
// src/hooks/use-mutation.test.tsx
// Testes do hook base useMutation: execução, loading, error, emissão de evento.

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/state/db.context', () => ({
  useDB: vi.fn(),
}));

import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { useMutation } from './use-mutation';
import { eventBus } from './event-bus';
import { useDB } from '@/state/db.context';
import type { JarvisDB } from '@/db/client';

const mockUseDB = vi.mocked(useDB);
const mockDb = {} as JarvisDB;

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
  mockUseDB.mockReturnValue({ ready: true, db: mockDb });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMutation', () => {
  it('mutate: executa fn com db e args', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const rendered = renderHookInAct(() => useMutation<[string], string>('tasks:changed', fn));

    let returnValue: string | null = null;
    await act(async () => {
      returnValue = await rendered.value.mutate('hello');
    });
    expect(fn).toHaveBeenCalledWith(mockDb, 'hello');
    expect(returnValue).toBe('ok');
    rendered.unmount();
  });

  it('mutate: emite evento no bus após sucesso', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const fn = vi.fn().mockResolvedValue('ok');
    const rendered = renderHookInAct(() => useMutation<[], string>('tasks:changed', fn));

    await act(async () => {
      await rendered.value.mutate();
    });
    expect(emitSpy).toHaveBeenCalledWith('tasks:changed');
    rendered.unmount();
  });

  it('mutate: loading alterna entre true e false', async () => {
    let resolveFn: (v: string) => void = () => {};
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveFn = resolve;
        })
    );
    const rendered = renderHookInAct(() => useMutation<[], string>('tasks:changed', fn));

    expect(rendered.value.loading).toBe(false);

    act(() => {
      void rendered.value.mutate();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.loading).toBe(true);

    await act(async () => {
      resolveFn('ok');
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rendered.value.loading).toBe(false);
    rendered.unmount();
  });

  it('mutate: expõe error quando fn rejeita', async () => {
    const err = new Error('mutation failed');
    const fn = vi.fn().mockRejectedValue(err);
    const rendered = renderHookInAct(() => useMutation<[], string>('tasks:changed', fn));

    let returnValue: string | null = 'not-null';
    await act(async () => {
      returnValue = await rendered.value.mutate();
    });
    expect(returnValue).toBeNull();
    expect(rendered.value.error).toBe(err);
    rendered.unmount();
  });

  it('mutate: db não pronta → retorna null sem chamar fn', async () => {
    mockUseDB.mockReturnValue({ ready: false, db: null });
    const fn = vi.fn().mockResolvedValue('ok');
    const rendered = renderHookInAct(() => useMutation<[], string>('tasks:changed', fn));

    let returnValue: string | null = 'initial';
    await act(async () => {
      returnValue = await rendered.value.mutate();
    });
    expect(fn).not.toHaveBeenCalled();
    expect(returnValue).toBeNull();
    rendered.unmount();
  });

  it('mutate: error não emite evento no bus', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    const rendered = renderHookInAct(() => useMutation<[], string>('tasks:changed', fn));

    await act(async () => {
      await rendered.value.mutate();
    });
    expect(emitSpy).not.toHaveBeenCalled();
    rendered.unmount();
  });
});
