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
| `tabBarButton` (phantom tab) **NÃO existe** no `@bottom-tabs/react-navigation` (native tabs). Só existe em `@react-navigation/bottom-tabs` (JS, default Expo Router `Tabs`) | Para usar o padrão barmittel (tab central raised `+` com `tabBarIcon: () => null` + `tabBarButton: () => <CustomJSX />`), fazer **downgrade para JS tabs**. Trade-off: perde Material 3 nativo, mas JS tabs já renderizam com Material fallback no Android. Ver §15. |
| `expo prebuild --clean` falha com `ENOENT .../android-icon-foreground.png` se `app.json` `android.adaptiveIcon.foregroundImage/backgroundImage/monochromeImage` apontam para PNGs inexistentes em `assets/images/`. Cache previa mascarava o erro. | Garantir que **todos** os PNGs referenciados em `app.json` `android.adaptiveIcon` existem em `assets/images/`. Se só temos um icon, copiar (ex: `cp assets/images/adaptive-icon.png assets/images/android-icon-foreground.png` para os 3 nomes). Ver §16 (Fase 1). |
| `react-hooks/immutability` (React 19 Compiler) rejeita `scale.value = withTiming(...)` no Reanimated, reportando "This value cannot be modified" | Adicionar `'react-hooks/immutability': 'off'` em `eslint.config.js` (alinhado com `purity`/`refs`/`set-state-in-effect` que já estão off). O `.value` de `useSharedValue` É para ser mutado — é o contract da Reanimated. Ver §16 (Fase 2). |
| Modais em route groups (`src/app/(modals)/_layout.tsx` com Stack aninhada `presentation: 'modal'`) causam comportamento imprevisível no Android (freeze, touch events bloqueados) | **Padrão oficial Expo Router:** modais vão em `src/app/<name>.tsx` (root-level), com `<Stack.Screen name="<name>" options={{ presentation: 'modal' }} />` no root Stack. **NÃO** usar groups para modais. Ver §16 (reversão da Fase 3). |
| `dueDate` em SQLite como `epochDay` (`Math.floor(local_midnight_ts / 86400000)`) é **timezone-dependente**: Berlin 2026-06-07 → 20610 (floor de 20610.916) → display `new Date(20610 * 86400000)` = 2026-06-06 22:00 UTC = dia local ANTERIOR. Bug off-by-1 em qualquer timezone ≠ UTC. | **Fix:** armazenar como `YYYYMMDD` integer (ex: `20260607`) — timezone-indep, comparável, sem perda no roundtrip. Helpers `toDateKey(date)` (= `year*10000 + (month+1)*100 + day`) e `fromDateKey(key)` (= `new Date(floor(key/10000), floor(key/100)%100-1, key%100)`). Migration 0001 converte dados existentes com `strftime(..., 'localtime', '+1 day')` para compensar o off-by-1 (assume mesmo timezone na criação e na migração). Ver §17 (fix timezone). |
| `"mês".toLowerCase()` em JS mantém o cedilha (`"mês"` ≠ `"mes"`). `startsWith("mes")` é `false` para `"mês"`. Mesmo problema com `ã`/`õ`/`ç` em outras palavras pt. | Normalizar manualmente: `.toLowerCase().replace(/[ê]/g, 'e')` antes do `startsWith`. Ou usar `localeCompare` com `{ sensitivity: 'base' }`. Ver §19 (Quick Add parser v2). |

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
- DB em `expo-sqlite` → storage privado. **Path real** (SDK 55, expo-sqlite v15+): `/data/data/com.marcionitao.jarvis/files/SQLite/jarvis.db`. (Antes era `databases/` mas mudou.)
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

---

## 15. Análise do padrão barmittel (referência para 1.7)

### 15.1 Contexto
O utilizador mostrou o projecto `~/MeinProjekts/barmittel` (gestor de despesas, RN + Expo SDK 51, Expo Router) onde existe um **botão "+" fantasma** no centro da bottom tab bar — um tab registado (file-based routing) que **nunca navega** porque o seu `tabBarButton` foi substituído por JSX custom.

### 15.2 Padrão identificado (5 linhas-chave)
```tsx
<Tabs.Screen
  name="plus"
  options={{
    title: '',
    tabBarIcon: () => null,    // esconde ícone default
    tabBarButton: () => (      // substitui o botão default
      <View style={{ top: -6, justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <Feather name="plus" size={32} color="..." />
        </TouchableOpacity>
      </View>
    ),
  }}
/>
```
- Ficheiro `app/(tabs)/plus.tsx` com `return null` (stub obrigatório para file-based routing)
- `top: -6` no `View` exterior = efeito "raised" (ícone sobe 6px acima da baseline dos outros tabs)
- `tabBarStyle.height: 70` dá espaço para o ícone raised
- Tap = side-effect (abrir modal), nunca chama navigation
- Sem long press no barmittel (AI assistant é um `<AssistantFAB />` **separado**, não variante do +)

### 15.3 Incompatibilidade com native bottom-tabs
O `tabBarButton` **NÃO existe** no `@bottom-tabs/react-navigation` (native). O native só tem:
- `tabBarIcon` (função)
- `tabBarButtonTestID` (string)
- `tabBar` (função que substitui a tab bar **inteira** em JS)
- `BottomAccessoryView` (view nativa abaixo do tab bar)
- `preventsDefault` (bool)

| API surface | Classic JS (`@react-navigation/bottom-tabs`) | Native (`@bottom-tabs/react-navigation`) |
|-------------|---------------------------------------------|------------------------------------------|
| `tabBarButton` (per-item custom) | ✅ | ❌ |
| `tabBar` (custom whole bar) | ✅ | ✅ |
| `BottomAccessoryView` | ❌ | ✅ |
| `Material 3` look | ❌ (fallback) | ✅ |
| Tap + LongPress custom | trivial | só via `tabBar` ou `BottomAccessoryView` |

### 15.4 Decisão tomada
**Downgrade para JS tabs** (Opção A confirmada pelo utilizador). Justificação:
- Padrão barmittel é provado (~30 linhas vs ~150 para custom `tabBar`)
- Tap + long press triviais via `onPress`/`onLongPress` no `TouchableOpacity`
- Reanimated 4 + gesto de long press com `delayLongPress={400}`
- Visual continua Material 3 no Android (JS tabs renderiza com Material fallback por defeito)
- Upgradability: podemos sempre custom `tabBar` no native em 1.7.1 se sentirmos falta do look 100% Material 3

### 15.5 Pegadinha nova (adicionada à §7)
- **`tabBarButton` (phantom tab) só existe em JS bottom-tabs**, não no `@bottom-tabs/react-navigation` (native). Se queres padrão barmittel no Jarvis → downgrade para JS tabs (default do Expo Router `Tabs`).

---

## 16. Etapa 1.7 — Bottom Tabs + FAB (JS tabs, padrão barmittel)

> **Status:** 🟢 1.7 + 1.7b concluídos · ⏳ Aguardando smoke test runtime do 1.7b no emulador

### 16.1 Objectivo
Implementar navegação por tabs (Hoje, Agenda, +, Pesquisar, Projetos) com o "+" como tab fantasma central (raised, abre Quick Add modal). Tap = Quick Add, long press = placeholder "Em breve" (reservado para futura IA). Validar o padrão `tabBarButton` com `onPress` + `onLongPress` + Reanimated scale.

### 16.2 Ficheiros a criar
| Ficheiro | Conteúdo |
|----------|----------|
| `src/app/(tabs)/_layout.tsx` | `<Tabs>` (Expo Router, default JS) com 5 Tabs.Screen, `tabBarButton` custom no `plus`, animação Reanimated scale 0.94 on press, ToastAndroid no long press |
| `src/app/(tabs)/index.tsx` | Movido de `src/app/index.tsx` (TodayScreen, SEM o botão + do header — FAB substitui) |
| `src/app/(tabs)/agenda.tsx` | Placeholder "Em breve" (calendário é fase 2) |
| `src/app/(tabs)/search.tsx` | Placeholder "Em breve" (pesquisa é fase 2) |
| `src/app/(tabs)/projects.tsx` | Placeholder "Em breve" (consome `useProjects` numa mini-lista ou só empty state) |
| `src/app/(tabs)/plus.tsx` | `return null` — stub obrigatório para file-based routing |
| `src/app/(modals)/_layout.tsx` | `<Stack screenOptions={{ presentation: 'modal', headerShown: false }} />` |
| `src/app/(modals)/quick-add.tsx` | Movido de `src/app/quick-add.tsx` (inalterado, só path diferente) |

### 16.3 Ficheiros a modificar
| Ficheiro | Alteração |
|----------|-----------|
| `app.json` | Remover plugin `"react-native-bottom-tabs"` |
| `package.json` | Remover `@bottom-tabs/react-navigation` e `react-native-bottom-tabs` |
| `src/app/(tabs)/index.tsx` | Remover `<Pressable>` do header (FAB central é o entry point) |
| `src/app/_layout.tsx` | Sem alterações directas (o `(tabs)` e `(modals)` são auto-descobertos pelo Expo Router) |

### 16.4 Ficheiros a remover
- ~~`src/app/index.tsx`~~ ✅ **Apagado na Fase 2** (resolvido conflito de rota com `(tabs)/index.tsx`)
- ~~`src/app/quick-add.tsx`~~ ✅ **Apagado na Fase 3 e re-criado na reversão** (movido para `(modals)/quick-add.tsx`, depois revertido para `src/app/quick-add.tsx` por causa do freeze)
- ~~`src/app/(modals)/_layout.tsx` e `src/app/(modals)/quick-add.tsx`~~ ✅ **Apagados na reversão** (route group não-padrão, causava freeze)

### 16.5 Fluxo esperado
1. Utilizador abre a app → cai em `(tabs)/index` ("Hoje").
2. Tap no **+** central (raised, vermelho, sombra) → `router.push('/(modals)/quick-add')` → modal abre.
3. Long press no **+** → `ToastAndroid.show('Em breve')` (placeholder).
4. Tap num dos 4 tabs normais → navega com fade/slide do React Navigation.
5. Modal fecha com `router.back()` → regresso à tab anterior.

### 16.6 Implementação em 5 fases (a executar sequencialmente)

**Fase 1 — Remover native bottom-tabs** ✅ **CONCLUÍDA**
1. ✅ Editar `app.json` — removido plugin `"react-native-bottom-tabs"`
2. ✅ Editar `package.json` — removidos `@bottom-tabs/react-navigation` e `react-native-bottom-tabs`
3. ✅ `npm install --legacy-peer-deps` (205 packages, 14 moderate vulns — mesmo nível que antes)
4. ✅ `npx expo prebuild --clean --platform android` (após criar 3 ícones em falta — `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`, todos cópias de `adaptive-icon.png`)
- **Verificações:** `app.json`/`package.json`/`android/` zero referências a native tabs. Autolinking dinâmico via Expo Gradle plugin. `newArchEnabled=true`, `hermesEnabled=true` mantidos.
- **Pegadinha nova (§7 #10):** prebuild --clean falhava com ENOENT para adaptive icon PNGs que não existiam em disco mas estavam referenciados em `app.json`. Cache previa mascarava.

**Fase 2 — Criar grupo (tabs)** ✅ **CONCLUÍDA**
5. ✅ Criar `src/app/(tabs)/_layout.tsx` com 5 Tabs.Screen + `<CentralFab>` (Reanimated scale 0.94 on press, `delayLongPress={400}` → ToastAndroid "Em breve")
6. ✅ Criar `src/app/(tabs)/index.tsx` (TodayScreen sem `+` do header)
7. ✅ Criar `src/app/(tabs)/agenda.tsx`, `search.tsx`, `projects.tsx` (3 placeholders; `projects.tsx` consome `useProjects(true)`), `plus.tsx` (stub `return null`)
- **Verificações:** tsc OK · eslint OK · 66/66 testes · paths do `+` apontam para `/quick-add` (antigo, ainda funciona)
- **Pegadinha nova (§7 #11):** `react-hooks/immutability` (React 19 Compiler) rejeita `scale.value = withTiming(...)` no Reanimated. Adicionado `'react-hooks/immutability': 'off'` em `eslint.config.js` (alinhado com `purity`/`refs`/`set-state-in-effect`).
- **⚠️ Correcção de rota:** `src/app/index.tsx` E `src/app/(tabs)/index.tsx` resolvem ambos para `/` (groups não adicionam path). Conflito detectado após criar `(tabs)/`. **Solução:** apagar `src/app/index.tsx` IMEDIATAMENTE (não esperar pela Fase 4) — a versão nova é cópia sem o `+` do header.

**Fase 3 — Mover Quick Add para (modals)** ⚠️ **REVERTIDA**
8. ✅ Criar `src/app/(modals)/_layout.tsx` (Stack `presentation: 'modal'`, `headerShown: false`)
9. ✅ Criar `src/app/(modals)/quick-add.tsx` (cópia literal, só muda header comment)
10. ✅ Apagar `src/app/quick-add.tsx` (atomicamente após criar o novo)
11. ✅ Editar `src/app/(tabs)/_layout.tsx` — `router.push('/(modals)/quick-add' as never)`
12. ✅ Editar `src/app/(tabs)/index.tsx` — `router.push('/(modals)/quick-add' as never)` (empty state CTA)
13. ✅ Editar `src/app/_layout.tsx` — removido `<Stack.Screen name="quick-add" ...>`

**⚠️ Revertido após smoke test do utilizador (freeze na página do modal).**
- **Causa:** route group `(modals)` com Stack aninhada `presentation: 'modal'` é não-padrão. Doc oficial Expo Router recomenda modais em root-level (`src/app/<name>.tsx`) + `<Stack.Screen name="<name>" options={{ presentation: 'modal' }} />` no root Stack.
- **Acções da reversão:**
  - ✅ Re-criado `src/app/quick-add.tsx` (cópia literal)
  - ✅ Apagados `src/app/(modals)/_layout.tsx` e `src/app/(modals)/quick-add.tsx`
  - ✅ `rmdir "src/app/(modals)"`
  - ✅ Editado `src/app/_layout.tsx` — re-adicionado `<Stack.Screen name="quick-add" options={{ presentation: 'modal', headerShown: false }} />`
  - ✅ Editado `src/app/(tabs)/_layout.tsx` — `router.push('/quick-add' as never)` (path simples)
  - ✅ Editado `src/app/(tabs)/index.tsx` — `router.push('/quick-add' as never)` (empty state CTA)
- **Verificações:** tsc OK · eslint OK · 66/66 testes · estrutura limpa (8 ficheiros: `_layout.tsx`, `quick-add.tsx`, `(tabs)/{_layout,index,plus,agenda,search,projects}.tsx`)
- **Pegadinha nova (§7 #12):** modais em route groups causam comportamento imprevisível (freeze, touch blocked). Usar root-level.

**Fase 4 — Limpar ficheiros antigos** ✅ **CONCLUÍDA (no-op)**
- Ambos os ficheiros a apagar (`src/app/index.tsx` e `src/app/quick-add.tsx`) já foram removidos nas Fases 2 e 3, respectivamente, como **correcções de rota obrigatórias** (não podiam coexistir com os novos). Nada a fazer nesta fase.

**Fase 5 — Validar** ✅ **CONCLUÍDA (smoke test runtime passou)**
14. ✅ `npx tsc --noEmit && npx eslint . && npm test` (66/66 testes passam)
15. ✅ Rebuild + reload no emulador Android
16. ✅ Smoke test runtime — 9/10 itens OK:
   - ✅ App abre em "Hoje" (sem header `+`)
   - ✅ 5 tabs visíveis (Hoje · Agenda · ⊕ · Pesquisar · Projetos)
   - ✅ Tab central `+` raised (top: -6, sombra, vermelho)
   - ✅ **Tap `+` → modal Quick Add abre (sem freeze — reversão funcionou)**
   - ✅ Long press `+` → toast "Em breve" (Android)
   - ✅ Criar tarefa `!p1 comprar leite hoje` → aparece na lista
   - ✅ Tap nos 4 tabs normais → navegam
   - ✅ Tap no checkbox → tarefa sai da lista "Hoje" (status muda para `done`, filtro `useTodayTasks` exclui concluídas)
   - ✅ DB persiste: 96KB em `/data/data/com.marcionitao.jarvis/files/SQLite/jarvis.db` (não `/databases/` como tinha errado na §6 — corrigir)
   - ⏳ **NÃO TESTADO:** dark mode toggle (utilizador não confirmou)
- **Descoberta do smoke test:** "Tap no checkbox → item desaparece" é **comportamento esperado** (filtro de "Hoje" esconde concluídas). Próximas etapas podem incluir:
  - **1.7a (polish):** toast "Concluído!" + animação slide-out na TaskRow
  - **1.7b (filtro):** toggle "Mostrar concluídas" no header "Hoje"
  - **1.8 (calendário):** implementar Agenda view
  - **1.9 (pesquisa):** implementar Search view
  - **2.0 (projetos):** detalhe de projeto + criar/editar projeto
  - **2.1 (etiquetas):** vista de etiquetas
  - **2.2 (settings):** tema, idioma, etc.

**Fase 3 — Mover Quick Add para (modals)**
8. Criar `src/app/(modals)/_layout.tsx`
9. Criar `src/app/(modals)/quick-add.tsx` (movido, sem alterações)

**Fase 4 — Limpar ficheiros antigos**
10. Apagar `src/app/index.tsx`
11. Apagar `src/app/quick-add.tsx`

**Fase 5 — Validar**
12. `npx tsc --noEmit && npx eslint . && npm test`
13. Rebuild + reload no emulador Android
14. Smoke test: tabs navegam, + abre modal, long press mostra toast, dark mode, criar tarefa, voltar para "Hoje", tarefa persiste

### 16.7 Validação final esperada
- 5 tabs visíveis na barra: Hoje | Agenda | ⊕ | Pesquisar | Projetos
- Tab central **+** é raised (top: -6), fundo vermelho, ícone branco, sombra
- Tap → modal Quick Add abre por cima das tabs
- Long press → "Em breve" toast (Android Toast)
- Reanimated scale anima 1 → 0.94 → 1 em ~200ms
- Navegação entre tabs é fluida
- tsc OK · eslint OK · 66/66 testes passam

### 16.8 Riscos conhecidos
- **`expo prebuild --clean`** apaga `android/` e regenera. Se houver customizações manuais no Android (SigningConfigs, network security config, etc.) são perdidas. Rever `android/app/build.gradle` antes/depois.
- **Bottom tab icons**: a usar `Ionicons` (`@expo/vector-icons`) com nomes: `today-outline`, `calendar-outline`, `search-outline`, `folder-outline`. Verificar que renderizam no Android (por vezes `outline` não existe no Ionicons — fallback para filled).
- **Reanimated worklets** no gesture handler: a escala 0.94 é só visual (não layout-affecting), deve correr no UI thread sem warning.
- **Native tabs foram removidos da app.json** mas o `react-native-bottom-tabs` continua em `node_modules/` até `npm install`. Limpar para evitar autolinking residual.

> Última actualização: 1.7b implementado (toggle "Mostrar concluídas" + subtítulo "Concluída há X" + persistência AsyncStorage). tsc/eslint OK · 68/68 testes (66+2 novos). A aguardar smoke test runtime.

---

## 17. Etapa 1.7b — Toggle "Mostrar concluídas" (Etapa 1.7b)

> **Status:** 🟢 Implementação completa · ⏳ Aguardando smoke test runtime

### 17.1 Objectivo
Adicionar toggle no header de "Hoje" para mostrar/esconder tarefas com `status='done'`. Estado persiste em AsyncStorage. Tarefas concluídas mostram subtítulo "Concluída há X" (formato `formatRelative`).

### 17.2 Ficheiros criados/modificados
| Ficheiro | Tipo | Conteúdo |
|----------|------|----------|
| `src/state/ui-prefs.context.tsx` | NOVO | Context para `showCompleted` + persistência AsyncStorage `@jarvis/ui-prefs:v1` |
| `src/app/_layout.tsx` | EDIT | Wrap `<UIPrefsProvider>` à volta de `<ThemedStack>` (dentro de `<NotificationsProvider>`) |
| `src/repositories/tasks.repo.ts` | EDIT | `listToday(db, today?, includeCompleted = false)` — novo parâmetro |
| `src/hooks/use-tasks.ts` | EDIT | `useTodayTasks` lê `useUIPrefs().showCompleted` + `useEffect` que chama `refresh()` quando toggle muda |
| `src/components/tasks/TaskRow.tsx` | EDIT | Sub-row mostra "Concluída há {time}" com ícone `checkmark-circle` para tarefas done |
| `src/app/(tabs)/index.tsx` | EDIT | Header agora tem `flex-row justify-between` + `<Pressable>` com `<Icon name="eye"\|"eye-off">` |
| `src/i18n/pt.json` + `en.json` | EDIT | Novas keys: `task.completedAt`, `today.showCompleted`, `today.hideCompleted` |
| `src/repositories/tasks.repo.test.ts` | EDIT | +2 testes: `listToday(includeCompleted=true)` devolve done, default exclui done |

### 17.3 Como funciona
1. User tap no ícone 👁/👁‍🗨 no header → `toggleShowCompleted()` em `ui-prefs.context`
2. Context persiste `showCompleted` em AsyncStorage (`@jarvis/ui-prefs:v1`) + atualiza state local
3. `useTodayTasks` re-cria o fetcher (dep: `[showCompleted]`)
4. `useEffect([showCompleted, refresh])` chama `refresh()` → lista refresca
5. Repo `listToday(db, new Date(), true)` agora devolve também status='done'
6. TaskRow para done tasks: `opacity-60` + `line-through` (já existia) **+** subtítulo "Concluída há 5m"

### 17.4 Validação esperada
- tsc OK · eslint OK · 68/68 testes (66 prior + 2 novos) · smoke test runtime pendente

### 17.5 Smoke test checklist (10 itens)
1. ✅ Tap no ícone `eye-off` → tarefas concluídas reaparecem na lista
2. ✅ Tarefas done mostram `opacity-60` + strikethrough + "Concluída há Xm"
3. ✅ Tap no ícone `eye` → tarefas concluídas escondem-se novamente
4. ✅ Tap no checkbox de uma tarefa done → vira todo, sai da lista (se toggle off)
5. ✅ Tap no checkbox de uma tarefa todo → vira done, fica visível (se toggle on) / sai (se off)
6. ✅ Estado do toggle persiste após kill + reabrir app
7. ✅ Mudar de tab "Hoje" → "Agenda" → voltar "Hoje" → toggle mantém-se
8. ✅ Toggle "off" + criar tarefa nova → aparece na lista imediatamente
9. ✅ Toggle "on" + sem concluídas → empty state aparece
10. ✅ Idioma pt-PT: "Concluída há 5 minutos" / en-US: "Completed 5 minutes ago"

### 17.6 Notas técnicas
- **`completedAt` está em milissegundos** (não epoch days) — confirmado no `update` do repo (`Date.now()`).
- **Reanimated worklet rule desactivada em §7 #11** — não relacionada, mas aplicável.
- **`useQuery` API limitation:** `events: EventName[]` é só para event bus, não para cache key. Para re-fetch por mudança de prefs, uso `useEffect` separado que chama `refresh()`.
- **React Compiler purity:** extrair `refresh` para local var evita o warning `react-hooks/exhaustive-deps` (a `query` object é re-criada em cada render, o que causaria loop).
- **Ícones:** usei `eye`/`eye-off` (filled) em vez de `eye-outline`/`eye-off-outline` (outline) — mais standard no Ionicons v15, sem risco de fallback.

---

## 18. Etapa 1.7c — Fix timezone `dueDate` (off-by-1)

### 18.1 Diagnóstico
- `dueDate` estava armazenado como `epochDay` (integer) = `Math.floor(new Date(year, month, day).getTime() / 86400000)`.
- Em Berlin (CEST = UTC+2), 2026-06-07 00:00 local = 2026-06-06 22:00 UTC = timestamp 1780783200000.
- `1780783200000 / 86400000 = 20610.916...`, `floor = 20610`.
- Display via `new Date(20610 * 86400000) = new Date(2026-06-06 00:00 UTC) = 2026-06-06 02:00 Berlin`.
- Cor: `dateColorFor(20610)` vs `todayEpoch=20610` → "Hoje" ✓. **Display string:** `formatSmartDate(2026-06-06, now)` → "Ontem" ❌.
- Bug: o **label** era correcto mas o **display** estava off-by-1. Em UTC puro (sem offset) não acontecia.

### 18.2 Solução
- Mudar representação de `epochDay` (timezone-dep) → **YYYYMMDD** (timezone-indep).
- Comparação `task.dueDate === todayKey()` agora funciona em qualquer timezone.
- Display `formatSmartDate(fromDateKey(task.dueDate), locale)` é timezone-stable (cria `new Date(year, month, day)` — sempre o dia local pretendido).

### 18.3 Helpers
```ts
// src/repositories/tasks.repo.ts
export function toDateKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}
export function fromDateKey(key: number): Date {
  const y = Math.floor(key / 10000);
  const m = Math.floor((key % 10000) / 100) - 1;
  const d = key % 100;
  return new Date(y, m, d);
}
```
- `startOfDayKey(date)` = `toDateKey(date)`.
- `endOfDayKey(date)` = última key do dia (não usado actualmente — `listToday` usa `WHERE due_date <= endOfDayKey`).

### 18.4 Ficheiros modificados
| Ficheiro | Alteração |
|----------|-----------|
| `src/db/migrations/0001_convert_due_date_to_yyyymmdd.sql` | NOVO. `UPDATE tasks SET due_date = CAST(strftime('%Y%m%d', due_date * 86400000, 'unixepoch', 'localtime', '+1 day') AS INTEGER) WHERE due_date IS NOT NULL;` (best-effort, +1 day compensa off-by-1) |
| `src/db/migrations/meta/_journal.json` | Adicionado entry `{ idx: 1, tag: '0001_convert_due_date_to_yyyymmdd', breakpoints: true }` |
| `src/db/migrations/migrations.ts` | Importa `m0000` + `m0001` |
| `src/services/quick-capture.service.ts` | `epochDay` → `toDateKey(date)` |
| `src/repositories/tasks.repo.ts` | Helpers `toDateKey`/`fromDateKey` exportados. `startOfDayKey`/`endOfDayKey`. `listToday`/`listUpcoming` usam `dayKey` |
| `src/components/tasks/TaskRow.tsx` | `dateColorFor(dayKey)` e `formatSmartDate(fromDateKey(task.dueDate), locale)` |
| `src/repositories/tasks.repo.test.ts` | Fixtures: `todayKey = tasksRepo.toDateKey(today)`; `addDays` da `date-fns` para yest/tomorrow; novo teste `toDateKey/fromDateKey roundtrip` |

### 18.5 Validação esperada
- tsc OK · eslint OK · 69/69 testes (68 prior + 1 novo roundtrip) ✅ **alcançado**
- Smoke test runtime (utilizador): criar tarefa "hoje" → "Hoje" (não "Ontem"); "amanhã" → "Amanhã" ✓

### 18.6 Notas técnicas / Riscos
- **Migration best-effort:** assume mesmo timezone na criação e na migração. Se user mudou de timezone entre criação e migração, datas podem ficar erradas. Mitigação: 1-2 tasks, user pode re-editar.
- **Não recriar DB:** migration aplica em runtime na próxima abertura do app; dados existentes migram automaticamente.
- **Faltou type-safety:** `dueDate: number` no schema Drizzle — sem `int` mode. Aceitável porque YYYYMMDD cabe em int32 e comparação é exacta.
- **Storage gain:** 8 bytes (int) vs 4 (int) — mesmo tamanho, sem overhead.
- **Performance:** todas as conversões são in-place no client; sem round-trip JS Date para comparar — comparação `===` é mais rápida que `isSameDay()`.

---

## 19. Etapa 1.8 — Quick Add Parser v2 (NL date/time + default=hoje)

### 19.1 Problema
- Parser original (v1) só reconhecia `hoje`/`amanhã` (pt/en). Tudo o resto caía em `dueDate=null`.
- Tarefas com `dueDate=null` **não aparecem** na aba "Hoje" (filtro `WHERE due_date <= todayKey`), parecendo "não adicionadas".
- Spec §10.2 (etapa 1.6) diz "Criar tarefa via FAB → aparece em **Hoje**" — violado pela impl.
- `analise-do-produto.md` §5 declara o parser como "**NL parser local (stub para futuro)**" — melhorado aqui.

### 19.2 Solução
- **Default = hoje** quando nenhuma keyword de data é detectada.
- **NL date parser** (regex pt/en, zero deps):
  - Absoluta: `dd/mm`, `dd-mm`, `dd.mm`, com ou sem ano `.yyyy`
  - "d de mês" (pt) / "month d" (en) — meses completos
  - Relativa: `em N dias/semanas/meses` (pt) / `in N days/weeks/months` (en) — aceita numerais E palavras (`uma`, `duas`, `a`, `an`, `two`, `three`)
  - Weekday: `próxima <dia>` (pt) / `next <day>` (en) — salta para o próximo ≥ hoje
- **Time parser** (devolve `dueTime` em minutos-desde-meia-noite):
  - `HHh`, `HHhs` (com sufixo)
  - `HH:MM`
  - `às HH` / `as HH` (pt, prefixo obrigatório, sem h)
  - `at HH` (en, prefixo obrigatório, sem h)
- BARE regex (sem h, sem colon) **só dispara com prefixo** `às`/`as`/`at` para não fazer match acidental em "10 coisas".

### 19.3 Ficheiros modificados
| Ficheiro | Alteração |
|----------|-----------|
| `src/services/quick-capture.service.ts` | Reescrita. Adiciona `dueTime`, default=hoje, NL date/time regex pt/en. |
| `src/services/quick-capture.service.test.ts` | NOVO. 20 testes cobrindo: default, keywords, dd/mm, "d de mês" pt/en, relativas pt/en, weekdays pt/en, horas com/sem h, caso combinado do user ("Levar o carro a oficina no dia 10 de junho as 10hs"). |
| `src/schemas/task.schema.ts` | Adiciona `dueTime: z.number().int().min(0).max(1439).nullable()`. |
| `src/hooks/use-quick-add.ts` | Passa `dueTime` para `tasksRepo.create`. |
| `src/i18n/pt.json` + `en.json` | Hint actualizada: `"!p1 amanhã 10h @etiqueta"`. |
| `src/repositories/tasks.repo.ts` | Sem mudança — `dueTime` já era aceite. |

### 19.4 Validação
- tsc OK · eslint OK · 89/89 testes (69 prior + 20 novos) ✅

### 19.5 Casos cobertos (exemplos)
| Input | Resultado |
|-------|-----------|
| `"Vou buscar a Ana"` | `title="Vou buscar a Ana"`, `dueDate=hoje` |
| `"Comprar leite hoje"` | `title="Comprar leite"`, `dueDate=hoje` |
| `"Buscar pão amanhã"` | `title="Buscar pão"`, `dueDate=amanhã` |
| `"Levar o carro 10/06"` | `title="Levar o carro"`, `dueDate=20260610` |
| `"Levar o carro 10 de junho"` | `title="Levar o carro"`, `dueDate=20260610` |
| `"Levar o carro a oficina no dia 10 de junho as 10hs"` | `title="..."`, `dueDate=20260610`, `dueTime=600` |
| `"Dentista em 1 mês"` | `dueDate=2026-07-07` |
| `"Estudar em 5 dias"` | `dueDate=+5 dias` |
| `"Reunião próxima sexta"` | `dueDate=próxima sexta` (≥1 dia) |
| `"Standup next monday"` | `dueDate=próxima segunda` |
| `"Almoço às 14"` | `title="Almoço"`, `dueTime=840` |
| `"Call at 3"` | `title="Call"`, `dueTime=180` |
| `"Reunião 10:30"` | `title="Reunião"`, `dueTime=630` |
| `"Reunião !p2 #trabalho @importante amanhã"` | tudo separado, `dueDate=amanhã` |

### 19.6 Notas técnicas / Pegadinhas
- **"mês".toLowerCase() mantém cedilha** — `"mês".startsWith("mes")` é `false`. Solução: `.replace(/[ê]/g, 'e')` antes do `startsWith`. Ver pegadinha #14.
- **Relativa com palavras:** `em uma semana` (não "1 semana") funciona via `wordToNum`. Cobre pt (`uma`, `um`, `duas`, `dois`) e en (`a`, `an`, `two`, `three`). Acima de 3 não suporta (raro).
- **Weekday sem "próxima":** salta para o próximo ≥ hoje. `"sexta"` num domingo = próxima sexta. Aceitável.
- **Year rollover:** "10/06" se a data já passou este ano → próximo ano. `addMonths`/`addWeeks`/`addDays` do `date-fns` lidam com transições.
- **Time BARE regex limitation:** "às 10" OK; "10 horas" (sem h, sem prefixo) **NÃO** é capturado. Se for preciso, adicionar.
- **dueTime guardado mas não display:** schema aceita, parser produz, hook passa, repo grava. UI (TaskRow) ainda não mostra hora. Próxima etapa: TaskRow + notification scheduling.
- **Performance:** 20 regexes por tarefa criada. ~0.1ms no V8. Não é bottleneck.
- **Default=hoje trade-off:** user que escreve "limpar a garagem" sem data pretendida vai para "Hoje". Workaround futuro: prefixo `!nodate` (não implementado) ou filtro de "Sem data" na aba Inbox.
