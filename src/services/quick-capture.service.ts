// src/services/quick-capture.service.ts
// Parser local do Quick Add. Extrai metadados inline do texto digitado.
// Suporta: !p1..4 (priority), #nome (project), @nome (label), hoje/amanhã (date).
// Locale-agnostic para palavras-chave (suporta pt e en).

import { addDays } from 'date-fns';

export interface QuickAddParsed {
  title: string;
  priority: 0 | 1 | 2 | 3 | 4;
  projectName: string | null;
  labelName: string | null;
  dueDate: number | null;
}

const PRIORITY_REGEX = /!p([1-4])\b/giu;
const PROJECT_REGEX = /#([\p{L}\p{N}_-]+)/giu;
const LABEL_REGEX = /@([\p{L}\p{N}_-]+)/giu;
const KEYWORD_TODAY = /(?:^|\W)(hoje|today)(?=\W|$)/iu;
const KEYWORD_TOMORROW = /(?:^|\W)(amanh[ãa]|tomorrow)(?=\W|$)/iu;

function toDateKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function strip(text: string, regex: RegExp): string {
  return text.replace(regex, '').replace(/\s+/g, ' ').trim();
}

export function parseQuickAdd(input: string): QuickAddParsed {
  let working = input.trim();
  let priority: 0 | 1 | 2 | 3 | 4 = 0;
  let projectName: string | null = null;
  let labelName: string | null = null;
  let dueDate: number | null = null;

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

  if (KEYWORD_TODAY.test(working)) {
    dueDate = toDateKey(new Date());
    working = strip(working, KEYWORD_TODAY);
  } else if (KEYWORD_TOMORROW.test(working)) {
    dueDate = toDateKey(addDays(new Date(), 1));
    working = strip(working, KEYWORD_TOMORROW);
  }

  return { title: working, priority, projectName, labelName, dueDate };
}
