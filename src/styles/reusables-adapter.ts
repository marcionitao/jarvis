// src/styles/reusables-adapter.ts
// Adaptador entre a paleta Jarvis e a API de temas da react-native-reusables.
// Os tokens semânticos (background, foreground, primary, etc.) seguem a
// convenção shadcn para garantir interoperabilidade com componentes externos.

import { lightTheme, darkTheme, type Theme } from './theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

function buildReusablesTheme(theme: typeof lightTheme) {
  return {
    background: theme.background,
    foreground: theme.foreground,
    card: theme.card,
    'card-foreground': theme.cardForeground,
    popover: theme.card,
    'popover-foreground': theme.cardForeground,
    primary: theme.primary,
    'primary-foreground': '#ffffff',
    secondary: theme.secondary,
    'secondary-foreground': '#ffffff',
    muted: theme.muted,
    'muted-foreground': theme.mutedForeground,
    accent: theme.muted,
    'accent-foreground': theme.foreground,
    destructive: theme.destructive,
    'destructive-foreground': '#ffffff',
    border: theme.border,
    input: theme.input,
    ring: theme.ring,
  };
}

export const reusablesLight = buildReusablesTheme(lightTheme);
export const reusablesDark = buildReusablesTheme(darkTheme);

export type ReusablesTheme = typeof reusablesLight;

export function getReusablesTheme(resolved: ResolvedTheme): ReusablesTheme {
  return resolved === 'dark' ? reusablesDark : reusablesLight;
}

export function getTheme(resolved: ResolvedTheme): Theme {
  return resolved === 'dark' ? darkTheme : lightTheme;
}
