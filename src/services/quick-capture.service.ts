// src/services/quick-capture.service.ts
// Parser local do Quick Add. Extrai metadados inline do texto digitado.
// Suporta:
//   - !p1..4 (priority)
//   - #nome (project)
//   - @nome (label)
//   - hoje/amanhã (date keywords pt/en)
//   - dd/mm, dd-mm (absolute date, ano corrente; se já passou, próximo)
//   - "d de mês" (pt) / "month d" (en)
//   - "em N dias/semanas/meses" (pt/en)
//   - "próxima/next <weekday>" (pt/en)
//   - HHh, HH:MM, "às HH" (pt) / "at HH" (en)
// Default: se nada for detectado, dueDate = hoje (spec §10.2 etapa 1.6).
// Locale-agnostic para palavras-chave (suporta pt e en).

import { addDays, addWeeks, addMonths, getDay } from 'date-fns';

export interface QuickAddParsed {
  title: string;
  priority: 0 | 1 | 2 | 3 | 4;
  projectName: string | null;
  labelName: string | null;
  dueDate: number | null;
  dueTime: number | null;
}

const PRIORITY_REGEX = /!p([1-4])\b/giu;
const PROJECT_REGEX = /#([\p{L}\p{N}_-]+)/giu;
const LABEL_REGEX = /@([\p{L}\p{N}_-]+)/giu;
const KEYWORD_TODAY = /(?:^|\W)(hoje|today)(?=\W|$)/iu;
const KEYWORD_TOMORROW = /(?:^|\W)(amanh[ãa]|tomorrow)(?=\W|$)/iu;

// dd/mm ou dd-mm ou dd.mm (1-2 dígitos dia, 1-2 mês)
const DATE_ABSOLUTE = /(?:^|\W)(\d{1,2})[\/\-\.](\d{1,2})(?:\.(\d{2,4}))?(?=\W|$)/g;

// "d de mês" (pt) ou "month d" (en) — nomes completos
const MONTHS_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_RE_PT = new RegExp(`(?:^|[\\s\\W])(\\d{1,2})\\s+de\\s+(${MONTHS_PT.join('|')})(?=[\\s\\W]|$)`, 'iu');
const MONTH_RE_EN = new RegExp(`(?:^|[\\s\\W])(${MONTHS_EN.join('|')})\\s+(\\d{1,2})(?=[\\s\\W]|$)`, 'iu');
// "em <mês>" (pt) / "in <month>" (en) — sem dia; usa dia 1 (mês corrente se ainda não passou, próximo ano se já)
const MONTH_ONLY_PT = new RegExp(`(?:^|\\W)em\\s+(${MONTHS_PT.join('|')})(?=\\W|$)`, 'iu');
const MONTH_ONLY_EN = new RegExp(`(?:^|\\W)in\\s+(${MONTHS_EN.join('|')})(?=\\W|$)`, 'iu');

// "em N dias/semanas/meses" (pt/en) / "in N days/weeks/months"
// m[êe]s(?:es)? cobre "mes", "mês", "meses", "mêses" (com/sem cedilha)
const RELATIVE_PT = /(?:^|\W)em\s+(\d+|uma?|duas?)\s+(dias?|semanas?|m[êe]s(?:es)?)(?=\W|$)/iu;
const RELATIVE_EN = /(?:^|\W)in\s+(\d+|a|an|two|three)\s+(days?|weeks?|months?)(?=\W|$)/iu;

// "próxima sexta" / "next monday"
const WEEKDAY_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const WEEKDAY_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_PT_RE = new RegExp(`(?:^|\\W)(pr[óo]xima\\s+)?(${WEEKDAY_PT.join('|')})(?=\\W|$)`, 'iu');
const WEEKDAY_EN_RE = new RegExp(`(?:^|\\W)(next\\s+)?(${WEEKDAY_EN.join('|')})(?=\\W|$)`, 'iu');

// Time: "10h", "10hs", "10:30", "às 10", "as 10", "at 10", "às 14" (sem h)
// Ordem de tentativa: BARE (com prefixo obrigatório) > COLON > H
// BARE só dispara com prefixo "às"/"as"/"at", evitando match acidental em "10 coisas".
const TIME_BARE = /(?:^|[\s\W])(?:[aà]s\s+|at\s+)(\d{1,2})(?::(\d{2}))?(?=[\s\W]|$)/iu;
const TIME_COLON = /(?:^|[\s\W])(?:[aà]s?\s+|at\s+)?(\d{1,2}):(\d{2})(?=[\s\W]|$)/iu;
const TIME_H = /(?:^|[\s\W])(?:[aà]s?\s+|at\s+)?(\d{1,2})h(s)?(?=[\s\W]|$)/iu;

function toDateKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function strip(text: string, regex: RegExp): string {
  return text.replace(regex, '').replace(/\s+/g, ' ').trim();
}

const WORD_TO_NUM: Record<string, number> = {
  uma: 1,
  um: 1,
  duas: 2,
  dois: 2,
  a: 1,
  an: 1,
  two: 2,
  three: 3,
};

function wordToNum(s: string): number {
  const lower = s.toLowerCase();
  if (WORD_TO_NUM[lower] !== undefined) return WORD_TO_NUM[lower];
  const n = Number(lower);
  return Number.isFinite(n) ? n : 0;
}

function parseAbsoluteDate(day: number, month: number, year: number | null, now: Date): Date | null {
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const y = year ?? now.getFullYear();
  const candidate = new Date(y, month - 1, day);
  // Se a data já passou este ano, roll over para o próximo ano
  if (candidate.getTime() < now.setHours(0, 0, 0, 0)) {
    return new Date(y + 1, month - 1, day);
  }
  return candidate;
}

function parseMonthDay(day: number, monthIndex: number, now: Date): Date {
  const candidate = new Date(now.getFullYear(), monthIndex, day);
  if (candidate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    return new Date(now.getFullYear() + 1, monthIndex, day);
  }
  return candidate;
}

function parseMonthOnly(monthIndex: number, now: Date): Date {
  // "em <mês>" — se o mês já passou este ano, próximo ano; senão este ano
  if (monthIndex < now.getMonth()) {
    return new Date(now.getFullYear() + 1, monthIndex, 1);
  }
  return new Date(now.getFullYear(), monthIndex, 1);
}

function parseRelativeDate(num: number, unit: string, now: Date): Date {
  // toLowerCase NÃO normaliza "ê" → "e" (cedilha fica). Normalizar manualmente.
  const lower = unit.toLowerCase().replace(/[ê]/g, 'e');
  if (lower.startsWith('dia') || lower.startsWith('day')) return addDays(now, num);
  if (lower.startsWith('semana') || lower.startsWith('week')) return addWeeks(now, num);
  if (lower.startsWith('mes') || lower.startsWith('month')) return addMonths(now, num);
  return now;
}

function parseWeekday(weekdayIndex: number, withNext: boolean, now: Date): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentDay = getDay(today);
  let diff = weekdayIndex - currentDay;
  if (withNext) {
    if (diff <= 0) diff += 7;
  } else {
    if (diff < 0) diff += 7;
  }
  return addDays(today, diff);
}

function parseTime(h: number, m: number): number {
  if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
  return h * 60 + m;
}

export function parseQuickAdd(input: string, now: Date = new Date()): QuickAddParsed {
  let working = input.trim();
  let priority: 0 | 1 | 2 | 3 | 4 = 0;
  let projectName: string | null = null;
  let labelName: string | null = null;
  let dueDate: number | null = null;
  let dueTime: number | null = null;

  const priorityMatches = [...working.matchAll(PRIORITY_REGEX)];
  if (priorityMatches.length > 0) {
    priority = Number(priorityMatches[0][1]) as 1 | 2 | 3 | 4;
    working = strip(working, PRIORITY_REGEX);
  }

  const projectMatches = [...working.matchAll(PROJECT_REGEX)];
  if (projectMatches.length > 0) {
    projectName = projectMatches[0][1];
    working = strip(working, PROJECT_REGEX);
  }

  const labelMatches = [...working.matchAll(LABEL_REGEX)];
  if (labelMatches.length > 0) {
    labelName = labelMatches[0][1];
    working = strip(working, LABEL_REGEX);
  }

  // 1. Keywords explícitas
  if (KEYWORD_TODAY.test(working)) {
    dueDate = toDateKey(now);
    working = strip(working, KEYWORD_TODAY);
  } else if (KEYWORD_TOMORROW.test(working)) {
    dueDate = toDateKey(addDays(now, 1));
    working = strip(working, KEYWORD_TOMORROW);
  }

  // 2. Data absoluta dd/mm
  if (dueDate === null) {
    const m = [...working.matchAll(DATE_ABSOLUTE)];
    if (m.length > 0) {
      const day = Number(m[0][1]);
      const month = Number(m[0][2]);
      const year = m[0][3] ? Number(m[0][3]) : null;
      const parsed = parseAbsoluteDate(day, month, year, new Date(now));
      if (parsed) {
        dueDate = toDateKey(parsed);
        const matchStr = m[0][0];
        const escaped = matchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Remove "em " / "in " prefixo se existir antes da data
        working = working.replace(new RegExp(`\\b(em|in)\\s+${escaped.trim()}\\b`, 'iu'), '').replace(/\s+/g, ' ').trim();
        working = working.replace(new RegExp(escaped.trim(), 'g'), '').replace(/\s+/g, ' ').trim();
      }
    }
  }

  // 3. "d de mês" (pt)
  if (dueDate === null) {
    const m = working.match(MONTH_RE_PT);
    if (m) {
      const day = Number(m[1]);
      const monthName = m[2].toLowerCase();
      const monthIndex = MONTHS_PT.indexOf(monthName);
      if (monthIndex >= 0 && day >= 1 && day <= 31) {
        const parsed = parseMonthDay(day, monthIndex, now);
        dueDate = toDateKey(parsed);
        // Remove também "em " prefixo se existir
        working = working.replace(new RegExp(`\\bem\\s+${m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'iu'), '').replace(/\s+/g, ' ').trim();
        working = strip(working, MONTH_RE_PT);
      }
    }
  }

  // 4. "month d" (en)
  if (dueDate === null) {
    const m = working.match(MONTH_RE_EN);
    if (m) {
      const monthName = m[1].toLowerCase();
      const day = Number(m[2]);
      const monthIndex = MONTHS_EN.indexOf(monthName);
      if (monthIndex >= 0 && day >= 1 && day <= 31) {
        const parsed = parseMonthDay(day, monthIndex, now);
        dueDate = toDateKey(parsed);
        // Remove também "in " prefixo se existir
        working = working.replace(new RegExp(`\\bin\\s+${m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'iu'), '').replace(/\s+/g, ' ').trim();
        working = strip(working, MONTH_RE_EN);
      }
    }
  }

  // 4b. "em <mês>" (pt) — sem dia, usa dia 1
  if (dueDate === null) {
    const m = working.match(MONTH_ONLY_PT);
    if (m) {
      const monthName = m[1].toLowerCase();
      const monthIndex = MONTHS_PT.indexOf(monthName);
      if (monthIndex >= 0) {
        const parsed = parseMonthOnly(monthIndex, now);
        dueDate = toDateKey(parsed);
        working = strip(working, MONTH_ONLY_PT);
      }
    }
  }

  // 4c. "in <month>" (en) — sem dia, usa dia 1
  if (dueDate === null) {
    const m = working.match(MONTH_ONLY_EN);
    if (m) {
      const monthName = m[1].toLowerCase();
      const monthIndex = MONTHS_EN.indexOf(monthName);
      if (monthIndex >= 0) {
        const parsed = parseMonthOnly(monthIndex, now);
        dueDate = toDateKey(parsed);
        working = strip(working, MONTH_ONLY_EN);
      }
    }
  }

  // 5. Relativo: "em N dias/semanas/meses" (pt)
  if (dueDate === null) {
    const m = working.match(RELATIVE_PT);
    if (m) {
      const num = wordToNum(m[1]);
      const parsed = parseRelativeDate(num, m[2], now);
      dueDate = toDateKey(parsed);
      working = strip(working, RELATIVE_PT);
    }
  }

  // 5b. Relativo: "in N days/weeks/months" (en)
  if (dueDate === null) {
    const m = working.match(RELATIVE_EN);
    if (m) {
      const num = wordToNum(m[1]);
      const parsed = parseRelativeDate(num, m[2], now);
      dueDate = toDateKey(parsed);
      working = strip(working, RELATIVE_EN);
    }
  }

  // 6. Weekday: "próxima sexta" (pt) / "next monday" (en)
  if (dueDate === null) {
    const mPt = working.match(WEEKDAY_PT_RE);
    const mEn = working.match(WEEKDAY_EN_RE);
    const m = mPt ?? mEn;
    if (m) {
      const withNext = m[1] !== undefined;
      const weekdayName = m[2].toLowerCase();
      let weekdayIndex = WEEKDAY_PT.indexOf(weekdayName);
      if (weekdayIndex < 0) weekdayIndex = WEEKDAY_EN.indexOf(weekdayName);
      if (weekdayIndex >= 0) {
        const parsed = parseWeekday(weekdayIndex, withNext, now);
        dueDate = toDateKey(parsed);
        working = mPt ? strip(working, WEEKDAY_PT_RE) : strip(working, WEEKDAY_EN_RE);
      }
    }
  }

  // 7. Default: hoje (se nenhum match)
  if (dueDate === null) {
    dueDate = toDateKey(now);
  }

  // 8. Time patterns
  let timeMatch: { h: number; m: number; stripPattern: RegExp } | null = null;
  const tBare = working.match(TIME_BARE);
  const tColon = working.match(TIME_COLON);
  const tH = working.match(TIME_H);
  if (tColon) {
    timeMatch = { h: Number(tColon[1]), m: Number(tColon[2]), stripPattern: TIME_COLON };
  } else if (tH) {
    timeMatch = { h: Number(tH[1]), m: 0, stripPattern: TIME_H };
  } else if (tBare) {
    timeMatch = {
      h: Number(tBare[1]),
      m: tBare[2] ? Number(tBare[2]) : 0,
      stripPattern: TIME_BARE,
    };
  }
  if (timeMatch) {
    const total = parseTime(timeMatch.h, timeMatch.m);
    if (total >= 0) {
      dueTime = total;
      working = strip(working, timeMatch.stripPattern);
    }
  }

  // Cleanup: remove "em" / "in" soltos deixados por datas (ex: "em 16 de junho" → "em" órfão)
  working = working.replace(/\b(em|in)\b/gi, '').replace(/\s+/g, ' ').trim();

  return { title: working, priority, projectName, labelName, dueDate, dueTime };
}
