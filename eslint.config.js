// ESLint v9 flat config — mínimo viável para o projeto Jarvis.
// CommonJS para evitar warning de ESM (projeto não tem "type": "module").
// Cobertura: TypeScript + React Hooks.

const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'android/**',
      'dist/**',
      'src/db/migrations/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        __DEV__: 'readonly',
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
    },
  },
];
