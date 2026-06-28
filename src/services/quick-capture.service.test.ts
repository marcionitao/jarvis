// src/services/quick-capture.service.test.ts
// Testes do parser do Quick Add.

import { describe, it, expect } from 'vitest';
import { parseQuickAdd, parseQuickAddShopping } from './quick-capture.service';

const fixedNow = new Date(2026, 5, 7, 14, 30); // 2026-06-07 14:30 local

function key(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

describe('parseQuickAdd', () => {
  describe('default behaviour', () => {
    it('sem nenhuma keyword: dueDate = hoje', () => {
      const r = parseQuickAdd('Vou buscar a Ana', fixedNow);
      expect(r.title).toBe('Vou buscar a Ana');
      expect(r.dueDate).toBe(key(fixedNow));
      expect(r.dueTime).toBeNull();
    });

    it('string vazia devolve erro semântico (title vazio)', () => {
      const r = parseQuickAdd('', fixedNow);
      expect(r.title).toBe('');
    });
  });

  describe('keywords explícitas (hoje/amanhã)', () => {
    it('"hoje" → dueDate = hoje', () => {
      const r = parseQuickAdd('Comprar leite hoje', fixedNow);
      expect(r.title).toBe('Comprar leite');
      expect(r.dueDate).toBe(key(fixedNow));
    });

    it('"amanhã" → dueDate = hoje + 1', () => {
      const r = parseQuickAdd('Buscar pão amanhã', fixedNow);
      expect(r.title).toBe('Buscar pão');
      const expected = new Date(2026, 5, 8);
      expect(r.dueDate).toBe(key(expected));
    });

    it('"today" (en) funciona', () => {
      const r = parseQuickAdd('Buy milk today', fixedNow);
      expect(r.title).toBe('Buy milk');
      expect(r.dueDate).toBe(key(fixedNow));
    });

    it('"tomorrow" (en) funciona', () => {
      const r = parseQuickAdd('Buy bread tomorrow', fixedNow);
      expect(r.title).toBe('Buy bread');
      const expected = new Date(2026, 5, 8);
      expect(r.dueDate).toBe(key(expected));
    });
  });

  describe('datas absolutas', () => {
    it('"10/06" → 10 de junho (este ano)', () => {
      const r = parseQuickAdd('Levar o carro 10/06', fixedNow);
      expect(r.title).toBe('Levar o carro');
      expect(r.dueDate).toBe(20260610);
    });

    it('"10-06" (com hífen) também funciona', () => {
      const r = parseQuickAdd('Levar o carro 10-06', fixedNow);
      expect(r.dueDate).toBe(20260610);
    });

    it('data absoluta já passada este ano → próximo ano', () => {
      const r = parseQuickAdd('Aniversário 15/03', fixedNow);
      expect(r.dueDate).toBe(20270315);
    });

    it('"10 de junho" (pt) → 10 de junho', () => {
      const r = parseQuickAdd('Levar o carro 10 de junho', fixedNow);
      expect(r.title).toBe('Levar o carro');
      expect(r.dueDate).toBe(20260610);
    });

    it('"June 10" (en) → 10 de junho', () => {
      const r = parseQuickAdd('Take car June 10', fixedNow);
      expect(r.title).toBe('Take car');
      expect(r.dueDate).toBe(20260610);
    });

    it('"em agosto" (pt) → dia 1 de agosto deste ano', () => {
      const r = parseQuickAdd('Pagar conta de luz em agosto', fixedNow);
      expect(r.title).toBe('Pagar conta de luz');
      expect(r.dueDate).toBe(20260801);
    });

    it('"em março" (pt) — mês já passou este ano → próximo ano', () => {
      const r = parseQuickAdd('Aniversário em março', fixedNow);
      expect(r.dueDate).toBe(20270301);
    });

    it('"in june" (en) → dia 1 de junho', () => {
      const r = parseQuickAdd('Plan vacation in june', fixedNow);
      expect(r.title).toBe('Plan vacation');
      expect(r.dueDate).toBe(20260601);
    });

    it('"in january" (en) — mês já passou → próximo ano', () => {
      const r = parseQuickAdd('Review goals in january', fixedNow);
      expect(r.dueDate).toBe(20270101);
    });
  });

  describe('datas relativas', () => {
    it('"em 5 dias" → hoje + 5', () => {
      const r = parseQuickAdd('Estudar em 5 dias', fixedNow);
      expect(r.title).toBe('Estudar');
      const expected = new Date(2026, 5, 12);
      expect(r.dueDate).toBe(key(expected));
    });

    it('"em 2 semanas" → hoje + 14', () => {
      const r = parseQuickAdd('Reunião em 2 semanas', fixedNow);
      const expected = new Date(2026, 5, 21);
      expect(r.dueDate).toBe(key(expected));
    });

    it('"em 1 mês" → hoje + 1 mês', () => {
      const r = parseQuickAdd('Dentista em 1 mês', fixedNow);
      expect(r.dueDate).toBe(20260707);
    });

    it('"em uma semana" (pt, palavra) → hoje + 7', () => {
      const r = parseQuickAdd('Voltar em uma semana', fixedNow);
      const expected = new Date(2026, 5, 14);
      expect(r.dueDate).toBe(key(expected));
    });

    it('"in 3 days" (en) → hoje + 3', () => {
      const r = parseQuickAdd('Submit in 3 days', fixedNow);
      const expected = new Date(2026, 5, 10);
      expect(r.dueDate).toBe(key(expected));
    });

    it('"in a week" (en) → hoje + 7', () => {
      const r = parseQuickAdd('Call in a week', fixedNow);
      const expected = new Date(2026, 5, 14);
      expect(r.dueDate).toBe(key(expected));
    });
  });

  describe('dias da semana', () => {
    it('"próxima sexta" (pt) → próxima sexta', () => {
      const r = parseQuickAdd('Reunião próxima sexta', fixedNow);
      expect(r.title).toBe('Reunião');
      const expected = new Date(2026, 5, 12);
      expect(r.dueDate).toBe(key(expected));
    });

    it('"sexta" sem "próxima" salta para a próxima (≥1 dia)', () => {
      const r = parseQuickAdd('Reunião sexta', fixedNow);
      expect(r.dueDate).toBe(key(new Date(2026, 5, 12)));
    });

    it('"next monday" (en) → próxima segunda', () => {
      const r = parseQuickAdd('Standup next monday', fixedNow);
      expect(r.dueDate).toBe(key(new Date(2026, 5, 8)));
    });
  });

  describe('horas (dueTime)', () => {
    it('"10h" → 10:00', () => {
      const r = parseQuickAdd('Reunião 10h', fixedNow);
      expect(r.dueTime).toBe(10 * 60);
    });

    it('"10hs" → 10:00', () => {
      const r = parseQuickAdd('Reunião 10hs', fixedNow);
      expect(r.dueTime).toBe(10 * 60);
    });

    it('"10:30" → 10:30', () => {
      const r = parseQuickAdd('Reunião 10:30', fixedNow);
      expect(r.dueTime).toBe(10 * 60 + 30);
    });

    it('"às 14" (pt) → 14:00', () => {
      const r = parseQuickAdd('Almoço às 14', fixedNow);
      expect(r.title).toBe('Almoço');
      expect(r.dueTime).toBe(14 * 60);
    });

    it('"at 3pm" só capta "3" (sem meridiem) — limitado', () => {
      const r = parseQuickAdd('Call at 3', fixedNow);
      expect(r.dueTime).toBe(3 * 60);
    });
  });

  describe('caso combinado: "Levar o carro a oficina no dia 10 de junho as 10hs"', () => {
    it('extrai título, data e hora', () => {
      const r = parseQuickAdd('Levar o carro a oficina no dia 10 de junho as 10hs', fixedNow);
      expect(r.dueDate).toBe(20260610);
      expect(r.dueTime).toBe(10 * 60);
    });
  });

  describe('priority / project / label', () => {
    it('combinação: title + priority + project + label + date', () => {
      const r = parseQuickAdd('Reunião !p2 #trabalho @importante amanhã', fixedNow);
      expect(r.title).toBe('Reunião');
      expect(r.priority).toBe(2);
      expect(r.projectName).toBe('trabalho');
      expect(r.labelName).toBe('importante');
      expect(r.dueDate).toBe(key(new Date(2026, 5, 8)));
    });
  });
});

describe('parseQuickAddShopping', () => {
  describe('basic item parsing', () => {
    it('plain item: "leite" → title: "leite"', () => {
      const r = parseQuickAddShopping('leite', fixedNow);
      expect(r.title).toBe('leite');
      expect(r.quantity).toBeNull();
      expect(r.section).toBeNull();
    });

    it('item with quantity: "leite 2L" → title: "leite", quantity: "2L"', () => {
      const r = parseQuickAddShopping('leite 2L', fixedNow);
      expect(r.title).toBe('leite');
      expect(r.quantity).toBe('2L');
      expect(r.section).toBeNull();
    });

    it('item with quantity and section: "leite 2L #laticínios" → correct fields', () => {
      const r = parseQuickAddShopping('leite 2L #laticínios', fixedNow);
      expect(r.title).toBe('leite');
      expect(r.quantity).toBe('2L');
      expect(r.section).toBe('laticínios');
    });

    it('item with only section: "leite #laticínios" → title: "leite", section: "laticínios"', () => {
      const r = parseQuickAddShopping('leite #laticínios', fixedNow);
      expect(r.title).toBe('leite');
      expect(r.quantity).toBeNull();
      expect(r.section).toBe('laticínios');
    });
  });

  describe('quantity patterns', () => {
    it('numeric quantity: "pão 500g" → quantity: "500g"', () => {
      const r = parseQuickAddShopping('pão 500g', fixedNow);
      expect(r.title).toBe('pão');
      expect(r.quantity).toBe('500g');
    });

    it('multiple words quantity: "leite 1,5 L" → quantity: "1,5 L"', () => {
      const r = parseQuickAddShopping('leite 1,5 L', fixedNow);
      expect(r.title).toBe('leite');
      expect(r.quantity).toBe('1,5 L');
    });

    it('quantity at end: "ovos 12" → quantity: "12"', () => {
      const r = parseQuickAddShopping('ovos 12', fixedNow);
      expect(r.title).toBe('ovos');
      expect(r.quantity).toBe('12');
    });

    it('unit-only quantity not matched: "leite" → quantity: null', () => {
      const r = parseQuickAddShopping('leite', fixedNow);
      expect(r.quantity).toBeNull();
    });
  });

  describe('section label with #', () => {
    it('section after item: "leite #laticínios" → section: "laticínios"', () => {
      const r = parseQuickAddShopping('leite #laticínios', fixedNow);
      expect(r.section).toBe('laticínios');
    });

    it('section with special chars: "#café-da-manhã" → section: "café-da-manhã"', () => {
      const r = parseQuickAddShopping('café #café-da-manhã', fixedNow);
      expect(r.section).toBe('café-da-manhã');
    });

    it('section without item: invalid — title empty', () => {
      const r = parseQuickAddShopping('#laticínios', fixedNow);
      expect(r.title).toBe('');
      expect(r.section).toBeNull();
    });
  });

  describe('combined with regular quick add fields', () => {
    it('item + quantity + section: "leite 2L #laticínios"', () => {
      const r = parseQuickAddShopping('leite 2L #laticínios', fixedNow);
      expect(r.title).toBe('leite');
      expect(r.quantity).toBe('2L');
      expect(r.section).toBe('laticínios');
    });

    it('item with spaces in name: "iogurte natural 500g #laticínios"', () => {
      const r = parseQuickAddShopping('iogurte natural 500g #laticínios', fixedNow);
      expect(r.title).toBe('iogurte natural');
      expect(r.quantity).toBe('500g');
      expect(r.section).toBe('laticínios');
    });
  });
});