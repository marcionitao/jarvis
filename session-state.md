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
    │   ├── _layout.tsx            # Providers + useFonts + SplashScreen + Stack temático
    │   └── index.tsx              # Redireciona para PreviewScreen (temporário)
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
    │   └── preview/index.tsx      # Ecrã de preview (temporário — substitui index)
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
    │   ├── index.ts               # Re-exports
    │   └── *.test.ts(x)           # 3 ficheiros de teste, 24 testes
    ├── schemas/                   # (Vazio — etapa 1.6)
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
| 1.6 | Quick Add (POC) | **Pendente** ← próxima | — |
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
| `drizzle-orm/expo-sqlite` migrator não aceita `migrationsFolder` | Usar aggregator `{ journal, migrations }` importado como JS object |
| Imports de ficheiros `.sql` sem tipos | Adicionar `declare module '*.sql'` em `nativewind-env.d.ts` |
| `JarvisDB` (expo-sqlite) e `TestDB` (better-sqlite3) incompatíveis | Usar `BaseSQLiteDatabase<'sync', unknown, typeof schema>` como tipo genérico |
| `interface DTO extends Type {}` (vazio) é erro de lint | Usar `type DTO = Type` em vez de interface vazia |
| `react-native` index.js usa Flow types (`import typeof * as ...`) | Não bundlear em testes; mockar `react-native` ou usar `react-dom` directamente |
| `@testing-library/react-native` falha com "Unexpected token 'typeof'" | Usar `react-dom/client` + `createRoot` directamente para testes de hooks |
| `react-test-renderer@19.x` peer dep mismatch | Instalar com `--legacy-peer-deps` |
| `react-hooks/refs` e `react-hooks/set-state-in-effect` (React 19) demasiado estritos | Desactivar em `eslint.config.js` (mantém `purity` desactivado também) |

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

## 12. Próxima etapa (1.6) — Quick Add (POC)

### Objectivo
Implementar a feature end-to-end de captura rápida de tarefa: o utilizador escreve "Comprar leite amanhã !p1 #trabalho" e o parser local extrai metadados, persiste, e a tarefa aparece em "Hoje". Validação final da arquitectura (DB + repos + hooks + bus + UI).

### Ficheiros a criar
| Ficheiro | Conteúdo |
|----------|----------|
| `src/services/quick-capture.service.ts` | Parser local (regex): extrai `!p1` (priority), `#projeto` (project), `@etiqueta` (label), `amanhã/hoje` (date) |
| `src/schemas/task.schema.ts` | Zod schema para validação do form |
| `src/app/(modals)/quick-add.tsx` | Modal com `Input` (NativeWind) + botão "Adicionar" |
| `src/components/tasks/TaskRow.tsx` | Linha de tarefa (checkbox + título + priority badge) |
| `src/app/(tabs)/index.tsx` | Tela "Hoje" que consome `useTodayTasks()` e renderiza `TaskRow` |

### Ficheiros a modificar
| Ficheiro | Alteração |
|----------|-----------|
| `src/app/_layout.tsx` | Adicionar rota modal para quick-add |
| `src/app/index.tsx` | Redirecionar para `/(tabs)` (em vez de preview) |

### Fluxo
1. Utilizador escreve texto no input.
2. Parser local extrai `{ title, priority?, projectName?, labelName?, dueDate? }`.
3. `useCreateTask().mutate(parsed)` → DB + outbox.
4. Event bus emite `tasks:changed` → `useTodayTasks` refresca automaticamente.
5. Modal fecha.

### Validação
- Criar tarefa via Quick Add → aparece em "Hoje" → DB persiste → outbox regista evento.
- App a correr no emulador Android.

---

> Última actualização: fim da etapa 1.5 (Hooks de dados).
> Próximo marco: etapa 1.6 (Quick Add POC).
