// src/lib/format/date.ts
// Helpers de formatação de datas com date-fns e locale (pt-PT, en-US).
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { pt as ptLocale, enUS as enLocale } from 'date-fns/locale';

const locales = {
  pt: ptLocale,
  en: enUSLocale(),
};

function enUSLocale() {
  return enLocale;
}

export type SupportedLocale = keyof typeof locales;

export function formatDate(date: Date | number | string, locale: SupportedLocale = 'en', pattern = 'PP'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: locales[locale] });
}

export function formatRelative(date: Date | number | string, locale: SupportedLocale = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: locales[locale] });
}

export function formatSmartDate(date: Date | number | string, locale: SupportedLocale = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return locale === 'pt' ? 'Hoje' : 'Today';
  if (isTomorrow(d)) return locale === 'pt' ? 'Amanhã' : 'Tomorrow';
  if (isYesterday(d)) return locale === 'pt' ? 'Ontem' : 'Yesterday';
  return format(d, locale === 'pt' ? "EEE, d 'de' MMM" : 'EEE, MMM d', { locale: locales[locale] });
}
