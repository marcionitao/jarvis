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
- `better-sqlite3` + `@types/better-sqlite3` (testes em memória)
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
- `@testing-library/react-native` 13.3 (instalado mas não usado — testes usam `react-dom/client` directamente)
- `react-test-renderer@19.2.0` (peer dep) + `@types/react-dom`

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
    │   ├── _layout.tsx            # Providers + useFonts + SplashScreen + Stack temático + Stack.Screen quick-add (modal)
    │   ├── index.tsx              # Tela "Hoje" (substitui PreviewScreen — etapa 1.6)
    │   └── quick-add.tsx          # Modal Quick Add (presentation: 'modal') — etapa 1.6
    ├── state/
    │   ├── theme.store.tsx        # ThemeProvider (light/dark/system + AsyncStorage)
    │   ├── i18n.context.tsx       # I18nProvider (pt/en + AsyncStorage)
    │   ├── notifications.context.tsx  # Handler + push token + channels
    │   └── db.context.tsx         # DBProvider (Drizzle client + seed automático)
    ├── i18n/
    │   ├── pt.json
    │   └── en.json
    ├── styles/
    │   ├── Colors.ts              # Existente — fonte de verdade (mantido)
    │   ├── theme.ts               # Paletas lightTheme + darkTheme + tokens (date/project/priority)
    │   └── reusables-adapter.ts   # Adaptador shadcn (background/foreground/primary/...)
    ├── components/
    │   ├── ui/                    # text, button, card, input, chip, icon
    │   ├── tasks/                 # ← etapa 1.6
    │   │   └── TaskRow.tsx        # Linha de tarefa (BouncyCheckbox + título + chips)
    │   └── preview/index.tsx      # Ecrã de preview (candidato a remoção — substituído por index.tsx em 1.6)
    ├── lib/
    │   ├── cn.ts                  # clsx + tailwind-merge
    │   └── format/
    │       ├── date.ts            # formatDate/formatRelative/formatSmartDate
    │       ├── date.test.ts       # 4 testes smoke (passa)
    │       └── priority.ts        # getPriorityLabel/getPriorityColor
    ├── db/                        # ← etapa 1.3 concluída
    │   ├── schema.ts              # 7 tabelas Drizzle + índices
    │   ├── client.ts              # Singleton Drizzle + expo-sqlite + migrate
    │   ├── seed.ts                # Seed idempotente (user + Inbox)
    │   └── migrations/            # Geradas por drizzle-kit
    │       ├── 0000_abnormal_morlocks.sql
    │       ├── migrations.ts      # Aggregator {journal, migrations}
    │       └── meta/
    │           ├── _journal.json
    │           └── 0000_snapshot.json
    ├── repositories/              # ← etapa 1.4 concluída
    │   ├── tasks.repo.ts          # CRUD + listToday, listUpcoming, listByProject, toggleComplete
    │   ├── projects.repo.ts       # CRUD + archive, softDelete
    │   ├── labels.repo.ts         # CRUD + attachToTask, detachFromTask, listLabelsForTask
    │   ├── reminders.repo.ts      # CRUD + listPending, listUpcoming, markFired
    │   ├── outbox.repo.ts         # enqueueOutbox, listPending, markAttempt, remove
    │   ├── index.ts               # Re-exports públicos
    │   ├── test-utils.ts          # Helper SQLite in-memory para testes
    │   └── *.test.ts              # 5 ficheiros, 31 testes
    ├── hooks/                     # ← etapa 1.5 concluída
    │   ├── event-bus.ts           # Bus pub/sub
    │   ├── use-query.ts           # Base useQuery<T>(fetcher, events)
    │   ├── use-mutation.ts        # Base useMutation(event, fn)
    │   ├── use-tasks.ts           # useTodayTasks, useUpcomingTasks, useProjectTasks, useTask
    │   ├── use-task-mutations.ts  # useCreateTask, useUpdateTask, useDeleteTask, useToggleComplete
    │   ├── use-projects.ts        # useProjects, useProject, useCreateProject, ...
    │   ├── use-labels.ts          # useLabels, useCreateLabel, ...
    │   ├── use-quick-add.ts       # ← etapa 1.6 — mutation encadeada (parse → project → label → task)
    │   ├── index.ts               # Re-exports
    │   └── *.test.ts(x)           # 3 ficheiros de teste, 24 testes
    ├── services/                  # ← etapa 1.6
    │   ├── quick-capture.service.ts    # Parser regex (!p1 #proj @label hoje/amanhã)
    │   └── quick-capture.service.test.ts  # 7 testes (lógica pura)
    ├── schemas/                   # ← etapa 1.6
    │   └── task.schema.ts         # Zod quickAddParsedSchema (validação defensiva)
    └── types/                     # (Vazio — expandir quando necessário)
```

---

## 5. Estado da Fase 1 (8 etapas)

| # | Etapa | Status | Validação |
|---|-------|--------|------------|
| 1.1 | Setup de packages | **Concluída** | tsc OK, eslint OK |
| 1.2 | Providers e UI base | **Concluída** | tsc OK, eslint OK, 4/4 testes |
| 1.3 | Schema DB + migrações | **Concluída** | tsc OK, eslint OK, migration gerada |
| 1.4 | Repositórios + testes | **Concluída** | tsc OK, eslint OK, 35/35 testes |
| 1.5 | Hooks de dados | **Concluída** | tsc OK, eslint OK, 59/59 testes |
| 1.6 | Quick Add (POC) | **Concluída** | tsc OK, eslint OK, 66/66 testes |
| 1.7 | Bottom Tabs + FAB | **Pendente** ← próxima | — |
| 1.8 | Gate Go/No-Go | Pendente | — |

---

## 6. Comandos de validação

```bash
npx tsc --noEmit        # typecheck (sem output = OK)
npx eslint .            # lint (exit 0 = OK)
npm test                # vitest (66 testes passam — 59 anteriores + 7 do parser Quick Add)
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
| `drizzle-orm/expo-sqlite` migrator não aceita `migrationsFolder` | Usar aggregator `{ journal, migrations }` importado como JS object |
| Imports de ficheiros `.sql` sem tipos | Adicionar `declare module '*.sql'` em `nativewind-env.d.ts` |
| `JarvisDB` (expo-sqlite) e `TestDB` (better-sqlite3) incompatíveis | Usar `BaseSQLiteDatabase<'sync', unknown, typeof schema>` como tipo genérico |
| `interface DTO extends Type {}` (vazio) é erro de lint | Usar `type DTO = Type` em vez de interface vazia |
| `react-native` index.js usa Flow types (`import typeof * as ...`) | Não bundlear em testes; mockar `react-native` ou usar `react-dom` directamente |
| `@testing-library/react-native` falha com "Unexpected token 'typeof'" | Usar `react-dom/client` + `createRoot` directamente para testes de hooks |
| `react-test-renderer@19.x` peer dep mismatch | Instalar com `--legacy-peer-deps` |
| `react-hooks/refs` e `react-hooks/set-state-in-effect` (React 19) demasiado estritos | Desactivar em `eslint.config.js` (mantém `purity` desactivado também) |
| `\b` no fim de palavra Unicode (ex: "amanhã" no fim) — bug V8/Node com `u` flag | Substituir `\b` por lookarounds: `/(?:^\|\W)(amanh[ãa]\|tomorrow)(?=\W\|$)/iu` |
| `router.push('/nova-rota')` falha TS em SDK 55 (typed routes não conhece a rota) | Cast com `as never` ou activar `experimental.typedRoutes: true` em `app.json` (config não-trivial) |
| `Cannot find module 'babel-preset-expo'` em runtime (hoisted em `expo/node_modules/`, não em root) | Adicionar `babel-preset-expo` como devDep explícita em `package.json` |
| `nativewind/babel` v4.2.4 → `react-native-css-interop` v0.2.4 — exporta função, não plugin object. Babel 7.29+ valida e rejeita `plugins: [require('nativewind/babel')]` com `.plugins is not a valid Plugin property` | Em `babel.config.js`: `plugins: [...require('nativewind/babel')().plugins]`. Nota: `react-native-worklets/plugin` já vem incluído na lista, não duplicar. **CORRECÇÃO POSTERIOR:** a doc oficial usa `nativewind/babel` como **PRESET**, não plugin. Spread em `plugins` quebra a ordem de aplicação (jsx-transform com `importSource: 'react-native-css-interop'` conflita com `jsxImportSource: 'nativewind'` do babel-preset-expo). Usar: `presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel']`. |
| Metro worker **não invoca** `babelTransformerPath` customizado para extensões não-padrão (ex: `.sql`). Resultado: `Unable to resolve '../0000_abnormal_morlocks.sql'` mesmo com transformer configurado | Usar **babel plugin** que substitui `ImportDeclaration` por `VariableDeclaration` no AST. Plugin corre na fase de parse, que é sempre invocada. Ver `babel-plugin-sql-import.js`. |
| **NativeWind v4 — CSS não aplicar (estilos "raw" no ecrã)** | 2 causas combinadas: (a) `nativewind/babel` deve ser **PRESET**, não plugin (ver linha acima); (b) `global.css` **tem de ser importado** no root layout (`import '../../global.css';` em `src/app/_layout.tsx`). Sem o import, Metro processa o input mas não o inclui no bundle → zero estilos. |
| `Failed to find a reliable PRNG (PRNG_DETECT)` ao usar `ulid()` em RN | `ulid@3` usa `crypto.getRandomValues()` que não existe em RN por padrão. Instalar `react-native-get-random-values` e importar como side-effect **antes** de qualquer código que use `ulid`/`uuid`/etc: `import 'react-native-get-random-values';` no topo de `src/app/_layout.tsx`. Package: `~1.11.0`. |
| `TaskRow` mostra só checkbox, sem título (mesmo com NativeWind aplicado) | **Causa real:** `react-native-bouncy-checkbox@4.1.4` renderiza SEMPRE um `View` interno com `flex: 1` (o `textContainer`), mesmo quando não passas a prop `text`. Esse `flex: 1` interno faz o TouchableComponent (Pressable) do checkbox expandir para **toda a largura** do row, esmagando o `View className="flex-1"` do título para 0px. **Fix:** passar `disableText` (ou `disableText={true}`) ao BouncyCheckbox — assim o `textContainer` interno não é renderizado e o checkbox fica com o seu tamanho natural. |

---

## 8. Etapa 1.3 — Schema DB + migrações (CONCLUÍDA)

### Objectivo
Inicializar a base de dados local (SQLite via `expo-sqlite`) com o schema completo (7 tabelas + índices) e gerar/aplicar a primeira migração.

### Ficheiros criados
| Ficheiro | Conteúdo |
|----------|----------|
| `src/db/schema.ts` | Schema Drizzle: `users`, `projects`, `tasks`, `labels`, `taskLabels`, `reminders`, `outbox` (7 tabelas) + índices |
| `src/db/client.ts` | Init pattern (singleton), `expo-sqlite` + Drizzle, migração on first launch |
| `src/db/seed.ts` | Seed mínimo idempotente (utilizador default + projeto Inbox) |
| `src/db/migrations/0000_abnormal_morlocks.sql` | Primeira migração (gerada por `drizzle-kit`) |
| `src/db/migrations/migrations.ts` | Aggregator `{ journal, migrations }` para o migrator do expo-sqlite |
| `src/db/migrations/meta/_journal.json` | Journal gerado por drizzle-kit |
| `src/db/migrations/meta/0000_snapshot.json` | Snapshot do schema |

### Ficheiros modificados
| Ficheiro | Alteração |
|----------|-----------|
| `src/state/db.context.tsx` | Substituir stub por implementação real com Drizzle client + seed automático |
| `nativewind-env.d.ts` | Adicionar declaração `declare module '*.sql'` para imports de .sql |

### Validação
- `npx tsc --noEmit` → OK
- `npx eslint .` → OK
- `npm test` → 4/4 passa
- `npm run db:generate` → migração gerada (7 tabelas, 6 índices)

### Notas
- O migrator do `drizzle-orm/expo-sqlite` exige o formato `{ journal, migrations }` em vez de `migrationsFolder`. Por isso o ficheiro `migrations.ts` agrega o `_journal.json` + os ficheiros `.sql`.
- IDs determinísticos no seed (`01J0USER...`, `01J0INBOX...`) para reprodutibilidade.
- O `DBProvider` mostra `ActivityIndicator` enquanto a DB inicializa.

---

## 9. Etapa 1.4 — Repositórios + testes (CONCLUÍDA)

### Objectivo
Criar a camada de repositórios (tasks, projects, labels, reminders, outbox) que serve de **fronteira de dados** entre a UI/hooks e a DB. Os repos devolvem DTOs e gerem a `outbox` para preparar sync futuro. Cobertura de testes >80% nos repos.

### Ficheiros criados
| Ficheiro | Conteúdo |
|----------|----------|
| `src/repositories/tasks.repo.ts` | CRUD + `getById`, `listByProject`, `listToday`, `listUpcoming`, `toggleComplete`, `search` |
| `src/repositories/projects.repo.ts` | CRUD + `listActive`, `archive`, `softDelete`, `hardDelete` |
| `src/repositories/labels.repo.ts` | CRUD + `attachToTask` (idempotente), `detachFromTask`, `listLabelsForTask` |
| `src/repositories/reminders.repo.ts` | CRUD + `listPending`, `listUpcoming`, `markFired`, `deleteForTask` |
| `src/repositories/outbox.repo.ts` | `enqueueOutbox`, `listPending`, `markAttempt`, `remove`, `clearAll`, `count` |
| `src/repositories/index.ts` | Re-exports públicos (namespace + DTOs) |
| `src/repositories/test-utils.ts` | Helper SQLite in-memory (better-sqlite3) com migrações |
| `src/repositories/*.test.ts` | 5 ficheiros de testes |

### Ficheiros modificados
| Ficheiro | Alteração |
|----------|-----------|
| `src/db/client.ts` | `JarvisDB` agora é `BaseSQLiteDatabase<'sync', unknown, typeof schema>` — aceita expo-sqlite E better-sqlite3 |
| `package.json` | Adicionado `better-sqlite3` + `@types/better-sqlite3` (dev) |

### Validação
- `npx tsc --noEmit` → OK
- `npx eslint .` → OK
- `npm test` → **35/35 passa** (31 novos + 4 existentes)
- Cobertura: cada repo testado em create/read/update/delete + edge cases

### Princípios aplicados
- Repos são **assíncronos** e devolvem **DTOs** (tipos inferidos do schema Drizzle).
- Toda mutation (create/update/delete) enfileira evento na `outbox` (sync-ready).
- `clientUpdatedAt` actualizado em cada update.
- Testes usam `better-sqlite3` em memória (sem dependência do `expo-sqlite` em ambiente Node).
- `toggleComplete` gere `completedAt` automaticamente (atribui ao concluir, limpa ao reabrir).

### Notas
- O tipo `JarvisDB` foi abstraído para `BaseSQLiteDatabase<'sync', unknown, typeof schema>` para aceitar drivers diferentes. Repos funcionam com qualquer um.
- `search()` é placeholder (sem FTS5 ainda — adiado para fase 2). Implementação actual devolve últimos 100 por data.
- 5 ficheiros de teste, 31 assertions, padrão `createTestDB()` com `afterEach(close)`.

---

## 10. Etapa 1.5 — Hooks de dados (CONCLUÍDA)

### Objectivo
Criar a camada de hooks de dados que a UI consome. **Sem cache, sem optimistic updates, sem TanStack Query-like**. Apenas `useState`/`useEffect` + event bus para invalidação. API estável que permite evolução futura para sync cloud sem alterar screens.

### Ficheiros criados
| Ficheiro | Conteúdo |
|----------|----------|
| `src/hooks/event-bus.ts` | Bus minimalista (pub/sub) com `EventName` + `eventBus` |
| `src/hooks/use-query.ts` | Base `useQuery<T>(fetcher, events)` — partilhado por todos os hooks de query |
| `src/hooks/use-mutation.ts` | Base `useMutation(event, fn)` — partilhado por todos os hooks de mutation |
| `src/hooks/use-tasks.ts` | `useTodayTasks`, `useUpcomingTasks`, `useProjectTasks`, `useTask` |
| `src/hooks/use-task-mutations.ts` | `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useToggleComplete` |
| `src/hooks/use-projects.ts` | `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, `useArchiveProject` |
| `src/hooks/use-labels.ts` | `useLabels`, `useCreateLabel`, `useUpdateLabel`, `useDeleteLabel`, `useAttachLabel` |
| `src/hooks/index.ts` | Re-exports públicos |
| `src/hooks/event-bus.test.ts` | 10 testes (subscribe/unsubscribe/emit/erro) |
| `src/hooks/use-query.test.tsx` | 8 testes (loading/error/refresh/invalidação/cleanup) |
| `src/hooks/use-mutation.test.tsx` | 6 testes (mutate/loading/error/evento) |

### Ficheiros modificados
| Ficheiro | Alteração |
|----------|-----------|
| `eslint.config.js` | Desactivar `react-hooks/refs` e `react-hooks/set-state-in-effect` (rules de React 19 demasiado estritas para o nosso padrão) |
| `package.json` | Adicionado `react-test-renderer@19.2.0` + `@types/react-dom` (dev) |

### Validação
- `npx tsc --noEmit` → OK
- `npx eslint .` → OK
- `npm test` → **59/59 testes** (24 novos + 35 existentes)

### Princípios aplicados
- **API estável**: `{ data, loading, error, refresh }` para queries; `{ mutate, loading, error }` para mutations. Amanhã, ao trocar para sync cloud, a UI não muda — só a implementação interna dos hooks.
- **Event bus para invalidação**: mutations emitem eventos (`tasks:changed`, `projects:changed`, etc.); queries subscrevem e fazem `refresh()`.
- **Sem cache**: SQLite é lido em cada mount. Aceitável para volumes MVP.
- **Sem optimistic updates**: SQLite local é rápido (<20ms). Sem latência para mascarar.
- **DRY**: `useQuery` e `useMutation` partilhados. Cada hook de domínio (tasks, projects, labels) é composição simples.

### Decisões técnicas
- **Testes usam `react-dom/client` directamente** (em vez de `@testing-library/react-native`) — react-native tem Flow types incompatíveis com esbuild do vitest.
- **`@testing-library/react-native` instalado** (peer dep) mas não usado nos testes por agora.
- **`useQuery` usa `useRef` para o fetcher** — permite ao caller passar uma função sem memoizar.

### Notas para o futuro (sync cloud)
- Quando sync entrar: mutações passam a fazer `await syncWorker.push()` antes do `eventBus.emit()`.
- Queries podem subscrever um evento extra `'sync:completed'` para refetch após sync.
- A API dos hooks (`data/loading/error/refresh`) **não precisa de mudar**.

---

## 11. Notas de processo

- **Confirmar antes de aplicar** alterações a `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`.
- Para substituições simples, usar `bash`/`sed` em vez de `edit` (regra do AGENTS.md).
- Se `edit` falhar uma vez, mudar para `bash` imediatamente.
- Cada etapa termina com `tsc + eslint + tests` a passar.
- Não avançar para a etapa seguinte sem aprovação explícita.
- O documento `analise-do-produto.md` é read-only — só actualizar quando há nova decisão (com aprovação).
- Este `session-state.md` é actualizado no fim de cada etapa (e na transição para nova sessão).

---

## 12. Etapa 1.6 — Quick Add (POC) (CONCLUÍDA)

### Objectivo
Implementar a feature end-to-end de captura rápida de tarefa: o utilizador escreve "Comprar leite amanhã !p1 #trabalho" e o parser local extrai metadados, persiste, e a tarefa aparece em "Hoje". Validação final da arquitectura (DB + repos + hooks + bus + UI).

### Ficheiros criados
| Ficheiro | Conteúdo |
|----------|----------|
| `src/services/quick-capture.service.ts` | Parser local (regex): extrai `!p1` (priority), `#projeto` (project), `@etiqueta` (label), `hoje/amanhã/today/tomorrow` (date) |
| `src/services/quick-capture.service.test.ts` | 7 testes (lógica pura — title, priority, project, label, today, tomorrow, combined) |
| `src/schemas/task.schema.ts` | Zod `quickAddParsedSchema` (validação defensiva no hook) |
| `src/hooks/use-quick-add.ts` | Mutation encadeada: parse → find-or-create project → find-or-create label → create task → attach label |
| `src/components/tasks/TaskRow.tsx` | Linha de tarefa: BouncyCheckbox + título + chip priority + badge data |
| `src/app/quick-add.tsx` | Modal Quick Add: TextInput multiline + validação inline + botão "Adicionar" |

### Ficheiros modificados
| Ficheiro | Alteração |
|----------|-----------|
| `src/app/index.tsx` | Substitui `PreviewScreen` por `TodayScreen` (consome `useTodayTasks()`, renderiza `TaskRow`, header com botão `+`) |
| `src/app/_layout.tsx` | Adicionado `<Stack.Screen name="quick-add" options={{ presentation: 'modal', headerShown: false }} />` |

### Validação
- `npx tsc --noEmit` → OK
- `npx eslint .` → OK
- `npm test` → **66/66 testes** (59 anteriores + 7 do parser)
- `preview/index.tsx` mantido (candidato a remoção — segue regra do AGENTS.md)

### Princípios aplicados
- **Parser é pura lógica** → testável sem RN/Drizzle. Stateless (sem `lastIndex` partilhado entre regexes).
- **Project/label find-or-create** → UX sem fricção: o utilizador não precisa de criar projectos antes de referenciá-los.
- **Validação Zod no hook** → `quickAddParsedSchema.parse()` rejeita título vazio com mensagem útil.
- **Optimistic update não usado** → SQLite local é rápido (<20ms). Sem latência para mascarar.
- **Tela "Hoje" mostra também tarefas atrasadas** → `useTodayTasks` (já existia em 1.5) usa `or(eq(dueDate, today), lte(dueDate, today))`.

### Decisões técnicas
- **Rota `quick-add` directa** (sem grupo `(modals)`) — adicionado depois em 1.7 com as tabs.
- **`router.push('/quick-add' as never)`** — typed routes do SDK 55 não conhece a rota nova sem regeneração; cast é workaround mínimo.
- **Regex `\b` final substituído por lookarounds** — bug V8 com `\b` em palavra Unicode ("amanhã") no fim-de-string. Solução: `/(?:^|\W)(amanh[ãa]|tomorrow)(?=\W|$)/iu`.
- **`useQuickAdd` emite só `tasks:changed`** — queries de `projects:changed` / `labels:changed` não refrescam; aceitável para POC (Projects/Labels tabs não montados). Em 1.7 avaliar `eventBus.emit` adicional.
- **BouncyCheckbox `onPress`** — API v4 ainda suporta; `handleToggle` ignora o arg (calcula `!isDone` do estado controlado).

### Notas para o futuro (1.7 e sync cloud)
- Quando `(tabs)` entrar, mover `index.tsx` para `src/app/(tabs)/index.tsx`. O `preview/` pode ser removido.
- Quando sync entrar, `useQuickAdd` deve envolver cada sub-op com `await syncWorker.push()` antes do `eventBus.emit` final.
- `useTask` (hook de query detalhe) e `useUpdateTask` já estão prontos para a tela de detalhe em fase 2.

---

## 13. Próxima etapa (1.7) — Bottom Tabs + FAB

### Objectivo
Implementar a navegação por tabs (Opção B: Hoje, Agenda, FAB central, Pesquisar, Projetos) com FAB elevado, animação de pressão e gesto de long press reservado para futura IA. Validar o padrão `@bottom-tabs/react-navigation` + `withLayoutContext` no Expo Router SDK 55.

### Ficheiros a criar
| Ficheiro | Conteúdo |
|----------|----------|
| `src/app/(tabs)/_layout.tsx` | `<Tabs>` wrapped via `withLayoutContext(BottomTabBar)` — 5 tabs, FAB central sem screen (devolve `null`) |
| `src/app/(tabs)/index.tsx` | Move da rota actual `src/app/index.tsx` para cá (tela "Hoje") |
| `src/app/(tabs)/agenda.tsx` | Placeholder "Em breve" (calendário é fase 2) |
| `src/app/(tabs)/search.tsx` | Placeholder "Em breve" (pesquisa é fase 2) |
| `src/app/(tabs)/projects.tsx` | Placeholder "Em breve" ou lista básica de projectos (consome `useProjects`) |
| `src/components/navigation/FAB.tsx` | Contentor de modos (`mode="quickAdd" \| "assistant"`), escala 0.94 com Reanimated, `onPress`/`onLongPress` |

### Ficheiros a modificar
| Ficheiro | Alteração |
|----------|-----------|
| `src/app/index.tsx` | Remover (movido para `(tabs)/index.tsx`) OU redirecionar para `/(tabs)/index` |
| `src/app/_layout.tsx` | Sem alterações directas (o `(tabs)/_layout.tsx` é auto-descoberto) |
| `src/app/quick-add.tsx` | Mover para `src/app/(modals)/quick-add.tsx` + criar `src/app/(modals)/_layout.tsx` com `<Stack screenOptions={{ presentation: 'modal' }} />` |
| `app.json` | Plugin `react-native-bottom-tabs` (já adicionado na 1.1); rever `android.tabBar` config |
| `package.json` | Nada (deps já instaladas em 1.1) |

### Fluxo
1. Utilizador abre a app → cai em `(tabs)/index` ("Hoje").
2. Tap no FAB central → `tabBarButton` previne navegação, faz `router.push('/(modals)/quick-add')`.
3. Long press no FAB → `toast.info('Em breve')` (placeholder para futura IA).
4. Mudar de tab → Reanimated faz fade/slide.

### Validação
- Navegação entre 4 tabs (Hoje, Agenda, Pesquisar, Projetos) fluida.
- FAB central abre o Quick Add modal.
- Long press no FAB mostra toast.
- Dev build Android arranca (FAB requer `@bottom-tabs/react-navigation`; não corre em Expo Go — aceitável).

### Riscos
- `@bottom-tabs/react-navigation` pode ter fricções com `withLayoutContext` em SDK 55. Se sim, fallback para `@react-navigation/bottom-tabs`.
- Reanimated 4 + `react-native-bottom-tabs`: validar que gestos não conflitam com `react-native-gesture-handler`.

---

> Última actualização: TaskRow layout fix (BouncyCheckbox `disableText` — esmagava o título).

---

## 14. Notas desta sessão (build & polish)

### 14.1 Build errors corrigidos antes do primeiro `npm run android` bem-sucedido

| # | Erro | Causa | Solução |
|---|------|-------|---------|
| 1 | `Cannot find module 'babel-preset-expo'` | Preset hoisted em `expo/node_modules/`, não no root | Adicionar `"babel-preset-expo": "~55.0.22"` a devDependencies; `npm install --legacy-peer-deps` |
| 2 | `.plugins is not a valid Plugin property` (Babel 7.29+ validation) | `require('nativewind/babel')` devolve `{plugins: [P1, P2, 'react-native-worklets/plugin']}` (função, não plugin) | Em `babel.config.js`: `plugins: [...require('nativewind/babel')().plugins]` |
| 3 | `Unable to resolve '../0000_abnormal_morlocks.sql'` | Metro sem loader para `.sql`. Custom `babelTransformerPath` (em `metro.config.js`) **não é invocado** pelo worker para extensões não-padrão | Babel plugin `babel-plugin-sql-import.js` que substitui `ImportDeclaration` por `VariableDeclaration` inlining o conteúdo do ficheiro. Plugin corre no parse (sempre invocado) |

### 14.2 Ficheiros criados nesta sessão
- `babel-plugin-sql-import.js` — plugin babel que inlina `.sql` como string

### 14.3 Ficheiros modificados nesta sessão
- `package.json` — adicionado `babel-preset-expo` a devDependencies
- `babel.config.js` — `nativewind/babel` como **PRESET** (não plugin) + plugin `./babel-plugin-sql-import.js`. Configuração canónica das docs.
- `metro.config.js` — `sourceExts.push('sql')` mantido; `babelTransformerPath` revertido (custom transformer approach abandonado)
- `metro-transformer.js` — **removido** (dead code, nunca invocado)
- `src/app/_layout.tsx` — `headerShown: false` no screenOptions do Stack; **`import '../../global.css';` adicionado** (necessário para Metro bundlar os estilos processados pelo `withNativeWind`); **`import 'react-native-get-random-values';` adicionado** (polyfill para `ulid()`)
- `src/app/index.tsx` — botão "+" maior (w-12 h-12, ícone 28, shadow-lg); empty state com CTA `<Button>` "Nova tarefa"
- `src/components/tasks/TaskRow.tsx` — wrap do `Pressable` em `<View className="flex-1">` (Pressable não respeita flex-1); `numberOfLines={2}` no título

### 14.4 Pegadinhas novas (já adicionadas à tabela §7)
- `babel-preset-expo` hoisting
- `nativewind/babel` é função, não plugin object (e **deve ser PRESET, não plugin**)
- Metro worker não invoca custom `babelTransformerPath` para extensões não-padrão
- **`global.css` tem de ser importado no root layout** — sem isso, Metro não bundla os estilos do NativeWind
- **`ulid()` falha com `PRNG_DETECT`** em RN — polyfill `react-native-get-random-values` importado como side-effect
- **`react-native-bouncy-checkbox` esmaga siblings** — passa sempre `disableText` para o `textContainer` interno (com `flex: 1`) não sugar toda a largura do row

### 14.5 Polish visual pós-primeiro-build
Após `npm run android` bem-sucedido, ecrã inicial mostrou "Index" no topo (header Stack duplicado) e botão "+" mal visível. Correcções aplicadas em `src/app/index.tsx` e `src/app/_layout.tsx` (ver §14.3).

### 14.6 Persistência de dados (confirmada)
- DB em `expo-sqlite` → storage privado (`/data/data/com.jarvis.app/databases/jarvis.db`).
- Persiste em: kill+reabrir, `adb install -r` (default do `expo run:android`), hot reload, prebuild --clean.
- **Não** persiste em: uninstall, "Limpar dados" Android, `adb uninstall`, mudança de `android.package` em `app.json`.
- Migrações Drizzle são idempotentes (tabela `__drizzle_migrations`).
- Backup manual: `adb shell run-as com.jarvis.app cat databases/jarvis.db > backup.db`; restore via `adb push` + `run-as cp`.
- Outbox acumula entries a cada mutation (sync-ready, drenada em fase 2).

### 14.7 Validação final
- `npx tsc --noEmit` → OK
- `npx eslint .` → OK
- `npm test` → **66/66 testes** (10 ficheiros)
- `npm run android` → app arranca, Quick Add modal abre, parser funciona, tarefa aparece em "Hoje"
- Persistência confirmada: kill+reabrir mantém DB intacta

### 14.8 Próximos passos
- ✅ Etapa 1.6 Quick Add POC oficialmente completa (parser + find-or-create + event bus + UI formatada + persistência confirmada)
- ➡️ Avançar para **Etapa 1.7 — Bottom Tabs + FAB** (ver §13)
- Smoke test mais profundo em 1.6: criar várias tarefas com variações de sintaxe, dark mode toggle, tap em row para toggle complete, validar refresh via event bus
- Avançar para **Etapa 1.7** (Bottom Tabs + FAB) — ver §13
> Próximo marco: etapa 1.7 (Bottom Tabs + FAB).
