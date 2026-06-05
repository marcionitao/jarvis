# Jarvis — Session State (Handoff)

> Documento de continuidade entre sessões.
> Lido pelo agente no início de uma nova conversa para reconstruir contexto.
> O documento "fonte de verdade" do produto é `analise-do-produto.md` (Fase 0).
> As regras do agente estão em `AGENTS.md`.

---

## 1. Contexto do produto (TL;DR)

App mobile de **gestão de tarefas pessoal**, mobile-first, **offline-first**, inspirada no Todoist. Plataforma alvo: **Android only** (sem iOS, sem Web no MVP). Foco em captura rápida, organização por projetos, prioridades, datas, agenda e notificações. Arquitectura preparada para IA, OCR, NL e sync cloud (sem implementação no MVP).

---

## 2. Decisões fechadas (resumo)

| # | Decisão | Resposta |
|---|---------|----------|
| 1 | ORM no mobile | **Drizzle** + `expo-sqlite` (substitui Prisma) |
| 2 | UI Kit estilo shadcn | **react-native-reusables** |
| 3 | Subtarefas | **Sim, 1 nível** |
| 4 | Etiquetas | **Sim** |
| 5 | Recorrência | **Simples** (diária, semanal, mensal, anual) |
| 6 | i18n | **pt-PT + en-US** |
| 7 | Tema | **Auto (system) + manual** |
| 8 | Autenticação local | **Não no MVP** |
| 9 | Estatísticas | **Placeholder** |
| 10 | Plataforma | **Android only** |
| 11 | Cor primária | **`#dc4c3e`** (vermelho Todoist) — identidade do Jarvis |
| 12 | Remoção de assets | **Adiada** (marcados, não removidos) |
| 13 | Fonte principal | **Inter** (4 pesos) + SpaceMono (decorativo) |
| 14 | Context menu | **`react-native-context-menu-view`** |
| 15 | Bottom tabs | **`@bottom-tabs/react-navigation`** |
| 16 | Gestão de estado | **Context + custom `createStore` hook** (sem Zustand) |
| 17 | Tabs | **Opção B** (5 tabs sem hub "Mais": Hoje, Agenda, FAB, Pesquisar, Projetos) |
| 18 | FAB | Tap = Quick Add; long press = reservado para futura IA |
| 19 | Fonte de verdade do design system | **`src/styles/Colors.ts`** (estendido para light + dark) |

Detalhe completo em `analise-do-produto.md` (secções 8.1 e 11).

---

## 3. Stack instalada

### Framework
- Expo SDK 55.0.26 + React 19.2.0 + React Native 0.83.6
- TypeScript 5.9.2 (strict)
- Expo Router 55 (file-based em `src/app/`)

### Bottom tabs
- `@bottom-tabs/react-navigation` 1.2.0 (substitui `@react-navigation/bottom-tabs`)
- `react-native-bottom-tabs` 1.2.0 (peer dep)
- Native Material 3 no Android via plugin em `app.json`

### Estilo e UI
- `nativewind` 4.2.4 + `tailwindcss` 3.4.19
- `react-native-reusables` (CLI: `@react-native-reusables/cli` 0.7.1) — componentes escritos manualmente em `src/components/ui/`
- `@expo/vector-icons` (Ionicons)
- Componentes custom: `Text`, `Button`, `Card`, `Input`, `Chip`, `Icon`

### Estado
- Context API + `useState` + `useMemo` (sem Zustand)
- Persistência: `@react-native-async-storage/async-storage`

### Dados e forms
- `drizzle-orm` 0.45.2 + `drizzle-kit` 0.31.10
- `expo-sqlite` 55.0.16
- `react-hook-form` 7.77 + `zod` 4.4 + `@hookform/resolvers` 5.4
- `ulid` 3.0 (IDs offline-friendly)
- `date-fns` 4.4 + locales pt/en

### Componentes específicos
- `@shopify/flash-list` 2.3
- `react-native-bouncy-checkbox` 4.1 (não `@shopify/react-native-bouncy-checkbox` — esse nome não existe)
- `sonner-native` 0.26 (toasts)
- `react-native-context-menu-view` 1.21
- `clsx` 2.1 + `tailwind-merge` 3.6 (helper `cn()`)

### Plataforma
- `expo-notifications` 55.0.23
- `expo-localization` (recém-adicionado)
- `expo-font` 55.0.8 + `@expo-google-fonts/inter` 0.4.2
- `expo-haptics` 55.0.14
- `react-native-reanimated` 4.2.1 (peer de worklets) + `react-native-worklets` 0.7.4
- `react-native-gesture-handler` 2.30 + `react-native-svg` 15.15

### Testes
- `vitest` 4.1 + `happy-dom` 20.10
- `@testing-library/react-native` 13.3

### ESLint
- `eslint` 9.39 + `@typescript-eslint/eslint-plugin` + `eslint-plugin-react-hooks`
- Flat config em `eslint.config.js` (CommonJS)
- **Regra `react-hooks/purity` desactivada** (experimental, demasiado restritiva)

---

## 4. Estrutura actual do projecto

```
jarvis/
├── analise-do-produto.md          # Fase 0 (fonte de verdade do produto)
├── session-state.md               # Este ficheiro
├── AGENTS.md                      # Regras do agente
├── README.md                      # Boilerplate Expo (a actualizar no futuro)
├── package.json                   # Deps instaladas (ver secção 3)
├── app.json                       # Plugin react-native-bottom-tabs adicionado
├── babel.config.js                # babel-preset-expo + nativewind/babel + worklets/plugin
├── metro.config.js                # withNativeWind(global.css)
├── tailwind.config.js             # Tokens semânticos do Colors.ts
├── global.css                     # @tailwind directives
├── drizzle.config.ts              # schema path + migrations out + dialect sqlite
├── eslint.config.js               # Flat config (TS + React Hooks)
├── vitest.config.ts               # env node, include src/**/*.test.ts(x)
├── tsconfig.json                  # Inclui .css + nativewind-env.d.ts
├── nativewind-env.d.ts            # Tipos NativeWind
├── assets/
│   ├── fonts/                     # Inter (4 pesos) + SpaceMono-Regular
│   └── images/                    # (intactos — política de remoção adiada)
└── src/
    ├── app/
    │   ├── _layout.tsx            # Providers + useFonts + SplashScreen + Stack temático
    │   └── index.tsx              # Redireciona para PreviewScreen (temporário)
    ├── state/
    │   ├── theme.store.tsx        # ThemeProvider (light/dark/system + AsyncStorage)
    │   ├── i18n.context.tsx       # I18nProvider (pt/en + AsyncStorage)
    │   ├── notifications.context.tsx  # Handler + push token + channels
    │   └── db.context.tsx         # DBProvider (STUB — pronto para 1.3)
    ├── i18n/
    │   ├── pt.json
    │   └── en.json
    ├── styles/
    │   ├── Colors.ts              # Existente — fonte de verdade (mantido)
    │   ├── theme.ts               # Paletas lightTheme + darkTheme + tokens (date/project/priority)
    │   └── reusables-adapter.ts   # Adaptador shadcn (background/foreground/primary/...)
    ├── components/
    │   ├── ui/                    # text, button, card, input, chip, icon
    │   └── preview/index.tsx      # Ecrã de preview (temporário — substitui index)
    ├── lib/
    │   ├── cn.ts                  # clsx + tailwind-merge
    │   └── format/
    │       ├── date.ts            # formatDate/formatRelative/formatSmartDate
    │       ├── date.test.ts       # 4 testes smoke (passa)
    │       └── priority.ts        # getPriorityLabel/getPriorityColor
    ├── db/                        # (Vazio — etapa 1.3)
    ├── repositories/              # (Vazio — etapa 1.4)
    ├── hooks/                     # (Vazio — etapa 1.5)
    ├── schemas/                   # (Vazio — etapa 1.6)
    └── types/                     # (Vazio — expandir quando necessário)
```

---

## 5. Estado da Fase 1 (8 etapas)

| # | Etapa | Status | Validação |
|---|-------|--------|------------|
| 1.1 | Setup de packages | **Concluída** | tsc OK, eslint OK |
| 1.2 | Providers e UI base | **Concluída** | tsc OK, eslint OK, 4/4 testes |
| 1.3 | Schema DB + migrações | **Pendente** ← próxima | — |
| 1.4 | Repositórios + testes | Pendente | — |
| 1.5 | Hooks de dados | Pendente | — |
| 1.6 | Quick Add (POC) | Pendente | — |
| 1.7 | Bottom Tabs + FAB | Pendente | — |
| 1.8 | Gate Go/No-Go | Pendente | — |

---

## 6. Comandos de validação

```bash
npx tsc --noEmit        # typecheck (sem output = OK)
npx eslint .            # lint (exit 0 = OK)
npm test                # vitest (4 testes passam)
npm run db:generate     # gerar migração Drizzle (a usar na 1.3)
npm run db:migrate      # aplicar migração (a usar na 1.3)
npm run android         # dev build + emulador Android (requer SDK)
```

---

## 7. Pegadinhas conhecidas (e como lidar)

| Pegadinha | Solução aplicada |
|-----------|------------------|
| `react@19.2.0` vs `react-test-renderer@19.2.7` (peer dep mismatch) | Usar `npm install --legacy-peer-deps` sempre que instalar packages |
| `@shopify/react-native-bouncy-checkbox` não existe | Usar `react-native-bouncy-checkbox` |
| `react-native-reusables` não é package npm | É plataforma via CLI: `npm install -D @react-native-reusables/cli` |
| `@expo/vector-icons` aninhado em `expo/node_modules/` | Instalar explicitamente: `npm install --save @expo/vector-icons` |
| `require()` para fontes em `_layout.tsx` | `/* eslint-disable @typescript-eslint/no-require-imports */` no topo do ficheiro |
| `react-hooks/purity` (React 19 Compiler) demasiado restritivo | `react-hooks/purity: 'off'` em `eslint.config.js` |
| `as const` em `lightTheme`/`darkTheme` causa narrowing | Usar `interface Theme` partilhada em vez de `typeof` |
| Inter fonts não descarregáveis de fora (rede limitada) | Copiar de `node_modules/@expo-google-fonts/inter/{400Regular,500Medium,600SemiBold,700Bold}/` para `assets/fonts/` |
| `Ionicons` (default export) sem `IconProps` nomeado | Usar `ComponentProps<typeof Ionicons>['name']` |
| `expo install` falha com peer dep | Fallback para `npm install --save --legacy-peer-deps <pkg>` |

---

## 8. Próxima etapa (1.3) — Schema DB + migrações

### Objectivo
Inicializar a base de dados local (SQLite via `expo-sqlite`) com o schema completo (6 tabelas + índices) e gerar/aplicar a primeira migração.

### Ficheiros a criar
| Ficheiro | Conteúdo |
|----------|----------|
| `src/db/schema.ts` | Schema Drizzle: `users`, `projects`, `tasks`, `labels`, `taskLabels`, `reminders`, `outbox` |
| `src/db/client.ts` | Init pattern (singleton), `expo-sqlite` + Drizzle, migração on first launch |
| `src/db/migrations/0000_*.sql` | Primeira migração (gerada por `drizzle-kit`) |
| `src/db/seed.ts` | Opcional — seed mínimo (utilizador default + projeto Inbox) |

### Ficheiros a modificar
| Ficheiro | Alteração |
|----------|-----------|
| `src/state/db.context.tsx` | Substituir stub por implementação real com Drizzle client |

### Tabelas (recordatório do `analise-do-produto.md` secção 6)
- `users` — id (ULID), name, timezone, createdAt, updatedAt
- `projects` — id, name, color, icon, parentId, order, archivedAt, createdAt, updatedAt, clientUpdatedAt, syncStatus
- `tasks` — id, title, description, projectId, parentId, priority (1-4), status ('todo'|'done'), dueDate, dueTime, recurrenceRule, order, completedAt, createdAt, updatedAt, clientUpdatedAt, syncStatus
- `labels` — id, name, color, createdAt
- `taskLabels` — taskId, labelId (M:N)
- `reminders` — id, taskId, triggerAt, type, relativeMinutes, notificationId, fired
- `outbox` — id, entity, entityId, op, payload, createdAt, attempts

### Índices essenciais
- `tasks(dueDate, status)` — feed "Hoje/Próximas"
- `tasks(projectId, status, order)` — lista de projeto
- `tasks(clientUpdatedAt)` — sync incremental (futuro)
- `tasks(title)` — FTS5 para pesquisa (adiar para fase 2)
- `outbox(createdAt)` — consumir mutations por ordem

### Fluxo de execução esperado
1. Apresentar plano detalhado da etapa 1.3.
2. Listar packages a instalar (já estão — só `expo-sqlite` e `drizzle-orm` + `drizzle-kit`).
3. Listar ficheiros a criar/modificar.
4. Pedir confirmação.
5. Após aprovação:
   - Criar `src/db/schema.ts` com Drizzle.
   - Criar `src/db/client.ts` com init pattern + migração on first launch.
   - Correr `npm run db:generate` para gerar a migração SQL.
   - Correr `npm run db:migrate` para validar (ou testar via app).
   - Actualizar `src/state/db.context.tsx` para usar o client real.
6. Validar: `npx tsc --noEmit && npx eslint . && npm test`.

---

## 9. Notas de processo

- **Confirmar antes de aplicar** alterações a `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`.
- Para substituições simples, usar `bash`/`sed` em vez de `edit` (regra do AGENTS.md).
- Se `edit` falhar uma vez, mudar para `bash` imediatamente.
- Cada etapa termina com `tsc + eslint + tests` a passar.
- Não avançar para a etapa seguinte sem aprovação explícita.
- O documento `analise-do-produto.md` é read-only — só actualizar quando há nova decisão (com aprovação).
- Este `session-state.md` é actualizado no fim de cada etapa (e na transição para nova sessão).

---

> Última actualização: fim da etapa 1.2 (Providers e UI base).
> Próximo marco: etapa 1.3 (Schema DB + migrações).
