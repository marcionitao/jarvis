// src/lib/format/date.test.ts
// Smoke test para a etapa 1.2 — valida que o pipeline Vitest funciona.
import { describe, it, expect } from 'vitest';
import { formatSmartDate, formatDate } from './date';

describe('formatSmartDate', () => {
  it('returns "Hoje" for today in pt', () => {
    const today = new Date();
    expect(formatSmartDate(today, 'pt')).toBe('Hoje');
  });

  it('returns "Today" for today in en', () => {
    const today = new Date();
    expect(formatSmartDate(today, 'en')).toBe('Today');
  });

  it('returns "Amanhã" for tomorrow in pt', () => {
    const tomorrow = new Date(Date.now() + 86400000);
    expect(formatSmartDate(tomorrow, 'pt')).toBe('Amanhã');
  });
});

describe('formatDate', () => {
  it('formats with default pattern', () => {
    const d = new Date('2026-01-15T10:00:00Z');
    const result = formatDate(d, 'en', 'yyyy-MM-dd');
    expect(result).toBe('2026-01-15');
  });
});
