// src/lib/format/priority.ts
import { priorityColors } from '@/styles/theme';

export type Priority = 0 | 1 | 2 | 3 | 4;

export function getPriorityLabel(p: Priority, locale: 'pt' | 'en' = 'en'): string {
  const labels: Record<Priority, Record<'pt' | 'en', string>> = {
    0: { pt: 'Sem prioridade', en: 'No priority' },
    1: { pt: 'Prioridade 1', en: 'Priority 1' },
    2: { pt: 'Prioridade 2', en: 'Priority 2' },
    3: { pt: 'Prioridade 3', en: 'Priority 3' },
    4: { pt: 'Prioridade 4', en: 'Priority 4' },
  };
  return labels[p][locale];
}

export function getPriorityColor(p: Priority): string {
  switch (p) {
    case 1: return priorityColors.p1;
    case 2: return priorityColors.p2;
    case 3: return priorityColors.p3;
    case 4: return priorityColors.p4;
    default: return priorityColors.p4;
  }
}
