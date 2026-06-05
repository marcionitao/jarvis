// src/styles/theme.ts
// Paletas light e dark para o Jarvis.
// `Colors.ts` permanece o ponto de verdade para tokens de marca (primary).
// Este ficheiro define paletas completas consumidas pelo ThemeProvider e pelos
// componentes `react-native-reusables`.

export interface Theme {
  name: 'light' | 'dark';
  primary: string;
  secondary: string;
  background: string;
  backgroundAlt: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  success: string;
  warning: string;
  card: string;
  cardForeground: string;
  input: string;
  inputBorder: string;
  ring: string;
}

export const lightTheme: Theme = {
  name: 'light',
  primary: '#dc4c3e',
  secondary: '#D88E2E',
  background: '#ffffff',
  backgroundAlt: '#f5f5f5',
  foreground: '#1a1a1a',
  muted: '#f5f5f5',
  mutedForeground: '#a6a6a6',
  border: '#d9d9d9',
  destructive: '#dc4c3e',
  success: '#2f9d23',
  warning: '#D88E2E',
  card: '#ffffff',
  cardForeground: '#1a1a1a',
  input: '#ffffff',
  inputBorder: '#d9d9d9',
  ring: '#dc4c3e',
};

export const darkTheme: Theme = {
  name: 'dark',
  primary: '#dc4c3e',
  secondary: '#D88E2E',
  background: '#1a1a1a',
  backgroundAlt: '#2a2a2a',
  foreground: '#f5f5f5',
  muted: '#2a2a2a',
  mutedForeground: '#a6a6a6',
  border: '#3a3a3a',
  destructive: '#dc4c3e',
  success: '#2f9d23',
  warning: '#D88E2E',
  card: '#222222',
  cardForeground: '#f5f5f5',
  input: '#2a2a2a',
  inputBorder: '#3a3a3a',
  ring: '#dc4c3e',
};

export const dateColors = {
  today: '#2f9d23',
  tomorrow: '#9d6023',
  weekend: '#233d9d',
  other: '#54239d',
} as const;

export const projectColors = [
  '#0079bf',
  '#d29034',
  '#519839',
  '#b04632',
  '#89609e',
  '#cd5a91',
  '#4bbf6b',
  '#00aecc',
  '#838c91',
] as const;

export const priorityColors = {
  p1: '#dc4c3e',
  p2: '#D88E2E',
  p3: '#2f9d23',
  p4: '#a6a6a6',
} as const;
