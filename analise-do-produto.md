# Jarvis — Análise do Produto (Fase 0)

> Documento de discovery e arquitetura.
> Sem código. Decisões confirmadas. Aguarda aprovação para avançar para a Fase 1 (scaffolding).

---

## Índice

1. [Visão resumida](#1-visão-resumida)
2. [Pontos críticos da stack](#2-pontos-críticos-da-stack)
3. [Arquitetura proposta](#3-arquitetura-proposta)
   - 3.4 [Recursos e design system](#34-recursos-e-design-system)
4. [Mapa de telas](#4-mapa-de-telas)
   - 4.1 [FAB — design preparado para IA futura](#41-fab--design-preparado-para-ia-futura)
5. [Fluxo de navegação](#5-fluxo-de-navegação)
6. [Modelo de dados](#6-modelo-de-dados)
7. [Stack final proposta](#7-stack-final-proposta)
8. [Decisões confirmadas](#8-decisões-confirmadas)
9. [Riscos identificados](#9-riscos-identificados)
10. [Plano de scaffolding (Fase 1)](#10-plano-de-scaffolding-fase-1)
11. [Tokens semânticos e mapeamento (Colors → UI)](#11-tokens-semânticos-e-mapeamento-colors--ui)

---

## 1. Visão resumida

Aplicação mobile de **gestão de tarefas pessoal**, mobile-first, **offline-first**, com inspiração no Todoist. Foco em captura rápida, organização por projetos, prioridades, datas, agenda e notificações. A arquitetura é preparada desde o dia 1 para integração futura de **IA**, **OCR**, **comandos em linguagem natural** e **sincronização cloud**, sem necessidade de refactor.

**Princípios de produto:**

- Captura de tarefa em menos de 5 segundos.
- Funciona 100% sem rede.
- Interface limpa, baixa carga cognitiva.
- Foco em produtividade pessoal (não equipas).

---

## 2. Pontos críticos da stack

Antes da arquitetura, há três pontos da stack indicada que provavelmente não funcionam como pedido. É necessário decisão antes de avançar.

| # | Item | Risco | Alternativa recomendada |
|---|------|-------|--------------------------|

| 1 | **Prisma em React Native** | Prisma é uma ORM server-side (Node.js). Em React Native não tem suporte oficial. Tentativas antigas com `prisma-bridge` estão abandonadas e quebram com o novo RN. | **Drizzle ORM** sobre `expo-sqlite` (type-safe, leve, oficial em RN). Manter **Prisma apenas no futuro backend cloud** (fase de sincronização). |
| 2 | **shadcn/ui em React Native** | shadcn/ui é web-only. Não existe port oficial. | **react-native-reusables** (port fiel de shadcn para RN sobre NativeWind) ou **gluestack-ui** (mais maduro, baseado em temas). |
| 3 | **NativeWind v5** | Está em pré-release. Pode ter fricções com Expo SDK 55. | Usar **NativeWind v4** (estável) ou **Uniwind** (mais moderno). |

**Pergunta crítica 1:** Confirmar a substituição de **Prisma → Drizzle** no mobile, mantendo Prisma no futuro backend cloud?

**Pergunta crítica 2:** Escolher entre **react-native-reusables** (alinhado com a filosofia shadcn) ou **gluestack-ui** (mais componentes prontos)?

> **Status:** ambas as perguntas críticas foram **resolvidas** (Drizzle e react-native-reusables confirmados). Ver secção 8.1, decisões 1 e 2.

---

## 3. Arquitetura proposta

### 3.1 Princípios arquiteturais

- **Offline-first** — a source of truth é a base de dados local; tudo funciona sem rede.
- **Repositórios como fronteira de dados** — a UI nunca toca na DB diretamente. Isto permite trocar a camada de persistência e adicionar sync cloud sem refactor.
- **Sync-ready desde o dia 1** — IDs gerados no cliente (ULID), campo `clientUpdatedAt`, `syncStatus`, e tabela **outbox** para mutations pendentes.
- **Feature-sliced dentro de `src/`** — organização por domínio funcional para escalar sem virar spaghetti.

### 3.2 Camadas

```bash
┌─────────────────────────────────────────────────────────┐
│  UI Layer                                               │
│  Expo Router (src/app) + Componentes (shadcn-style)     │
├─────────────────────────────────────────────────────────┤
│  State / Hooks Layer                                    │
│  Context API + custom `createStore` hook (UI state)     │
│  + TanStack Query-like (data cache)                     │
├─────────────────────────────────────────────────────────┤
│  Domain / Hooks de Negócio                              │
│  useTasks, useProjects, useQuickAdd, useAgendaView      │
├─────────────────────────────────────────────────────────┤
│  Repository Layer  ← FRONTEIRA DE DADOS                 │
│  tasks.repo, projects.repo, labels.repo, reminders.repo │
│  (assíncrono, devolve DTOs, nunca entidades de DB)      │
├─────────────────────────────────────────────────────────┤
│  Persistence                                            │
│  expo-sqlite + Drizzle ORM + migrações                  │
│  Outbox table (mutations pendentes para sync futuro)    │
├─────────────────────────────────────────────────────────┤
│  Platform / Native                                      │
│  expo-notifications, expo-calendar (futuro), file sys   │
└─────────────────────────────────────────────────────────┘
```

**Nota:** o `ThemeProvider` (camada de State) é alimentado por `src/styles/Colors.ts` (ver [3.4](#34-recursos-e-design-system)) e expõe a paleta activa ao NativeWind via `tailwind.config.js`. Os componentes `react-native-reusables` consomem tokens semânticos mapeados (ver [11](#11-tokens-semânticos-e-mapeamento-colors--ui)).

### 3.3 Estrutura de pastas

```bash
src/
├── styles/                       # Design system (fonte de verdade)
│   ├── Colors.ts                 # Paleta (light + dark) e tokens
│   ├── spacing.ts                # Tokens de espaçamento
│   ├── typography.ts             # Famílias (Inter + SpaceMono) e tamanhos
│   └── reusables-adapter.ts      # Mapeamento de tokens para react-native-reusables
├── app/                          # Expo Router (rotas)
│   ├── _layout.tsx               # Root providers (DB, Notif, Theme)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tabs
│   │   ├── index.tsx             # Hoje
│   │   ├── upcoming.tsx          # Próximas
│   │   ├── search.tsx            # Pesquisar
│   │   ├── projects.tsx          # Projetos
│   │   └── more.tsx              # Mais (Agenda, Defs, Arquivo)
│   ├── projects/
│   │   ├── [id].tsx
│   │   ├── new.tsx
│   │   └── [id]/edit.tsx
│   ├── tasks/
│   │   ├── [id].tsx
│   │   ├── new.tsx
│   │   └── [id]/edit.tsx
│   ├── agenda.tsx
│   ├── labels/index.tsx
│   ├── settings/
│   │   ├── index.tsx
│   │   ├── notifications.tsx
│   │   └── appearance.tsx
│   ├── onboarding.tsx
│   └── (modals)/
│       ├── quick-add.tsx
│       ├── task-picker.tsx
│       └── date-picker.tsx
│
├── components/
│   ├── ui/                       # shadcn-style (Button, Input, Dialog, Sheet…)
│   ├── tasks/                    # TaskRow, TaskList, TaskForm
│   ├── projects/                 # ProjectCard, ProjectForm
│   ├── agenda/                   # CalendarHeader, DayCell
│   └── shared/                   # EmptyState, PriorityChip, etc.
│
├── db/
│   ├── client.ts                 # expo-sqlite + drizzle init
│   ├── schema.ts                 # Tabelas + tipos inferidos
│   ├── migrations/
│   └── seed.ts
│
├── repositories/                 # FRONTEIRA DE DADOS
│   ├── tasks.repo.ts
│   ├── projects.repo.ts
│   ├── labels.repo.ts
│   ├── reminders.repo.ts
│   ├── outbox.repo.ts            # mutations pendentes para sync
│   └── index.ts
│
├── services/
│   ├── notifications.service.ts
│   ├── quick-capture.service.ts  # NL parser local (stub para futuro)
│   ├── ocr.service.ts            # stub
│   └── sync/                     # stub para cloud sync
│
├── state/                        # Context-based stores (sem Zustand)
│   ├── theme.store.ts
│   ├── filters.store.ts
│   └── quick-add.store.ts
│
├── hooks/                        # React Query-like (data fetching/caching)
│   ├── useTasks.ts
│   ├── useProjects.ts
│   ├── useTaskMutations.ts
│   └── useAgenda.ts
│
├── schemas/                      # Zod (validação RHF + boundaries)
│   ├── task.schema.ts
│   ├── project.schema.ts
│   └── reminder.schema.ts
│
├── lib/                          # cn(), formatadores, datas, RRULE utils
├── types/                        # tipos partilhados
└── constants/
```

### 3.4. Recursos e design system

#### 3.4.1 Cores — `src/styles/Colors.ts` (fonte de verdade)

A paleta existente é reorganizada para suportar **tema light + dark** a partir do mesmo ficheiro. `Colors.ts` permanece o único ponto de verdade; nenhum componente importa hex directamente.

**Estrutura proposta (sem código de implementação):**

- `Colors.light` e `Colors.dark` — paletas separadas.
- `Colors.primary` mantém-se **igual em ambos os temas** (identidade de marca `#dc4c3e`).
- Tokens semânticos acrescentados: `background`, `foreground`, `muted`, `mutedForeground`, `border`, `destructive`, `success`, `warning`.
- `DATE_COLORS` e `PROJECT_COLORS` mantêm-se (já são paletas semânticas para datas e projetos).
- Função helper `getColors(scheme: 'light' | 'dark')` devolve a paleta activa.

**Derivação para light/dark (proposta de alto nível):**

| Token | Light | Dark | Fonte |

|-------|-------|------|-------|
| primary | `#dc4c3e` | `#dc4c3e` | identidade de marca |
| background | `#fff` (existente) | `#1a1a1a` (a afinar) | derivado |
| backgroundAlt / muted | `#f5f5f5` (existente) | `#2a2a2a` (a afinar) | derivado |
| foreground | `#635E5E` (existente `dark`) | `#f5f5f5` (invertido) | derivado |
| lightText / mutedForeground | `#a6a6a6` (existente) | `#a6a6a6` (mantém) | derivado |
| lightBorder / border | `#d9d9d9` (existente) | `#3a3a3a` (a afinar) | derivado |
| destructive | `#dc4c3e` (igual a primary) | igual | derivado |
| success | `#2f9d23` (de `DATE_COLORS.today`) | igual | derivado |
| warning | `#D88E2E` (de `Colors.secondary`) | igual | derivado |

> **Nota:** os valores exactos de dark mode serão afinados na Fase 1.2 (UI base) com base no que o utilizador considerar legível. Esta tabela é o ponto de partida.

#### 3.4.2 Assets — `assets/images/`

**Política de uso (MVP):**

| Ficheiro | Uso | Nota |

|----------|-----|------|
| `icon.png` | Ícone principal da app | OK (106 KB) |
| `adaptive-icon.png` | Android adaptive icon | OK (17 KB) |
| `splash.png`, `splash-icon.png` | Splash screen | OK |
| `tabIcons/*.png` | **Substituir por Ionicons** | Vector font, mais flexível |
| `icon-blue.png`, `icon-green.png` | **Não usar** | Tamanho excessivo (4.2 MB) |
| `login.png`, `todoist-logo.png` | **Não usar** | Referências, não da app |
| `favicon.png` | **Não usar** | Sem Web no MVP |

**Política de remoção:** adiada. Os candidatos a remoção (`icon-blue.png`, `icon-green.png`, `login.png`, `todoist-logo.png`, `favicon.png`, `tabIcons/*.png`) ficam **marcados** no documento para limpeza futura, mas **não são removidos nesta fase** (decisão do utilizador — aguardar app funcional).

#### 3.4.3 Fontes — `assets/fonts/`

| Fonte | Uso | Pesos |
|-------|-----|-------|

| **Inter** (a adicionar) | Fonte principal — títulos, body, labels | Regular, Medium, Semibold, Bold |
| **SpaceMono-Regular** (existente) | Decorativo/pontual — timestamps, IDs, números | Regular |

Carregamento via `expo-font` com `useFonts` no root `_layout.tsx`. Splash screen segura até as fontes carregarem.

---

## 4. Mapa de telas

### Bottom Tabs (5 + FAB central)

**Decisão: Opção B** — 5 tabs sem hub "Mais". Acesso rápido às vistas core (Hoje, Agenda, Pesquisar, Projetos); definições, etiquetas, próximos e estatísticas ficam acessíveis via stack/header (a partir do tab respetivo ou do header da tab "Hoje").

```bash
┌──────────────────────────────────────────────────┐
│                                                  │
│                 (conteúdo)                       │
│                                                  │
├──────────────────────────────────────────────────┤
│  🏠      📅       ⬆️       🔍      📁           │
│  Hoje  Agenda     +      Pesq.   Proj.          │
│                   FAB                           │
└──────────────────────────────────────────────────┘
```

| # | Tab | Conteúdo principal |

|---|-----|---------------------|
| 1 | **Hoje** | Tarefas com `dueDate = hoje` + atrasadas + Inbox. Header com selector de filtro (Inbox / Projeto / Etiqueta). |
| 2 | **Agenda** | Vista mensal (react-native-calendars). Dots nas datas com tarefas. |
| 3 | **[FAB central]** | Não navega como tab. Abre modal Quick Add. Botão circular elevado com sombra e animação de pressão. |
| 4 | **Pesquisar** | Pesquisa full-text + filtros (projeto, prioridade, data, etiqueta). |
| 5 | **Projetos** | Lista de projetos. Tap → detalhe. Long press → reordenar. **Shopping List** acessível aqui (project.type="shopping"). |

### Telas em stack / modal

- **Tarefa detalhe** — metadata, descrição, lembretes, atividade.
- **Tarefa criar/editar** — formulário (RHF + Zod + NativeWind + shadcn).
- **Projeto detalhe** — lista de tarefas do projeto + metadata.
- **Projeto criar/editar** — formulário.
- **Shopping List** — lista de compras (checklist) com agrupamento por secção (Label). Acessível a partir de Projetos.
- **Próximas** — próximos 7 dias agrupados por data (acessível a partir do header de "Hoje" ou "Agenda").
- **Etiquetas** — gestão (criar, renomear, eliminar). Acessível a partir de "Projetos" e filtros.
- **Definições** — notificações, aparência, idioma, sobre. Acessível a partir do header de "Hoje".
- **Onboarding** — primeira execução: nome, permissões (notif), introdução.

### Ações globais (sempre acessíveis)

- **Quick Add** (modal) — atalho: FAB central + gesto. Ver [4.1](#41-fab--design-preparado-para-ia-futura).
- **Date Picker** (modal) — escolha de data/hora.
- **Task Picker** (modal) — seleção de tarefa pai/sub-tarefa (para subtasks de 1 nível).

### 4.1. FAB — design preparado para IA futura

#### Comportamento

- **Tap curto** → abre modal Quick Add (`presentation: 'modal'`, Expo Router).
- **Long press** → ação secundária reservada para o futuro Assistente IA. No MVP, mostra toast "Em breve" (placeholder).
- **Animação de pressão** com Reanimated 4 (scale 0.94 + sombra dinâmica).
- **Elevação visual** para destacar dos 4 tabs planos (círculo + shadow + posição elevada no tab bar).

#### Arquitectura do componente

O componente `<FAB>` é desenhado como contentor de modos, para que a introdução do Assistente IA no futuro não exija refactor de layout:

```typescript
<FAB mode="quickAdd" | "assistant" onPress onLongPress>
  <Icon />
</FAB>
```

- Hoje: `mode="quickAdd"` → ícone `plus`.
- Futuro: `mode="assistant"` → ícone de IA; long press comuta entre modos.

#### Implementação no React Navigation

O tab "central" no `@react-navigation/bottom-tabs` não é uma rota real. É um `tabBarButton` custom que renderiza o `<FAB>` e cujo `listeners` consome o evento sem navegar. Padrão conhecido:

```typescript
tabBarButton: (props) => <FAB {...props} />,
listeners: () => ({
  tabPress: (e) => {
    e.preventDefault();
    router.push('/(modals)/quick-add');
  },
}),
```

A screen do tab central devolve `null` (não renderiza conteúdo).

---

## 5. Fluxo de navegação

```bash
                         ┌─────────────┐
                         │  Onboarding │  (primeira vez)
                         └──────┬──────┘
                                ▼
       ┌──────────────────────────────────────────────────┐
       │              (TABS) Root                         │
       │ ┌────┐ ┌────┐ ┌──────┐ ┌────┐ ┌────┐             │
       │ │Hoje│ │Agd.│ │ FAB  │ │Pesq│ │Proj│             │
       │ └─┬──┘ └─┬──┘ └──┬───┘ └─┬──┘ └─┬──┘             │
       │   │      │       │        │       │               │
       └───┼──────┼───────┼────────┼───────┼───────────────┘
           │      │       │        │       │
           ▼      ▼       ▼        ▼       ▼
       Tarefa/  Próximas  Quick  Detalhe  Projeto
       detalhe           Add    tarefa   detalhe
           │      │       │        │       │
           ▼      ▼       ▼        ▼       ▼
        Editar  Filtros  (modal)  Editar  Editar

   ┌──────────────────────────────────────┐
   │ Modais globais (sempre disponíveis)  │
   │ • Quick Add (FAB central)            │
   │ • Date Picker                        │
   │ • Task Picker (subtasks)             │
   └──────────────────────────────────────┘

   Header / menu lateral:
   • Definições (a partir de Hoje)
   • Próximas 7 dias (a partir de Hoje/Agenda)
   • Etiquetas (a partir de Projetos)
   • Arquivo (a partir de Projetos)
```

### Fluxo principal — Quick Add (captura em menos de 5s)

1. Tap no FAB (ou gesto) → abre `quick-add.tsx` modal.
2. Utilizador escreve título com (opcional) `#projeto` `!p1` `amanhã` `@etiqueta`.
3. Parser local extrai metadados (regex / RRule lib) → pré-preenche form.
4. Enter / "Guardar" → `taskMutations.create` → repo → DB → notif agendada.
5. Modal fecha, lista atualiza (optimistic update).

---

## 6. Modelo de dados

> O esquema abaixo é conceptual. No código será Drizzle (ou Prisma, se a decisão for mantê-lo no mobile). Os tipos são inferidos a partir do schema.

### 6.1 Tabelas

#### users

```json
users {
  id: ULID (PK)
  name: string
  timezone: string
  createdAt: number
  updatedAt: number
}
```

Nota: num device local, 1 user = 1 utilizador local. O `remoteId` será adicionado na fase de sync.

#### projects

```json
projects {
  id: ULID (PK)
  name: string
  color: string             // hex
  icon: string              // symbol name
  type: 'default' | 'shopping'  // NOVO: tipo de projeto
  parentId: ULID?           // subprojetos
  order: number
  archivedAt: number?       // soft delete
  createdAtualCreatedAt: number
  updatedAt: number
  clientUpdatedAt: number
  syncStatus: 'local' | 'pending' | 'synced'
}
```

#### tasks

```json
tasks {
  id: ULID (PK)
  title: string
  description: string?
  projectId: ULID?          // null = Inbox
  parentId: ULID?           // subtasks (futuro)
  priority: 1..4            // p1..p4 (0 = none)
  status: 'todo' | 'done'
  dueDate: number?          // epoch day (sem timezone)
  dueTime: number?          // epoch mins (0..1439)
  recurrenceRule: string?   // RRULE
  order: number
  completedAt: number?
  createdAt: number
  updatedAt: number
  clientUpdatedAt: number
  syncStatus: 'local' | 'pending' | 'synced'
}
```

#### labels (etiquetas)

```json
labels {
  id: ULID (PK)
  name: string
  color: string
  createdAt: number
}
```

#### task_labels (M:N)

```json
task_labels {
  taskId: ULID
  labelId: ULID
}
```

#### reminders

```json
reminders {
  id: ULID (PK)
  taskId: ULID
  triggerAt: number                // epoch ms
  type: 'absolute' | 'relative'
  relativeMinutes: number?         // ex: -10 min antes da due
  notificationId: string?          // id devolvido por expo-notifications
  fired: boolean
}
```

#### outbox (mutações pendentes para sync)

```json
outbox {
  id: ULID (PK)
  entity: 'task' | 'project' | 'label' | 'reminder'
  entityId: ULID
  op: 'create' | 'update' | 'delete'
  payload: json
  createdAt: number
  attempts: number
}
```

### 6.2 Índices essenciais

- `tasks(dueDate, status)` — feed "Hoje/Próximas".
- `tasks(projectId, status, order)` — lista de projeto.
- `tasks(clientUpdatedAt)` — sync incremental.
- `tasks(title)` — pesquisa (FTS5 no SQLite para full-text).
- `outbox(createdAt)` — consumir mutations por ordem.

### 6.3 Estratégia de IDs e sync-ready

- **ULIDs no cliente** (ordenáveis, únicos, 26 chars) — permitem criar offline.
- `clientUpdatedAt` (epoch ms) é a verdade para resolução de conflitos.
- `syncStatus` + **outbox** = amanhã basta implementar um worker que consome a outbox sem refactor na UI.

---

## 7. Stack final proposta

| Camada | Escolha |

|--------|---------|
| Framework | **Expo SDK 55** + React 19 + RN 0.83 |
| Linguagem | **TypeScript** (strict mode) |
| Roteamento | **Expo Router** (`src/app/`) com `<Tabs>` wrapped via `withLayoutContext` |
| Bottom tabs | **`@bottom-tabs/react-navigation`** + `react-native-bottom-tabs` (substitui `@react-navigation/bottom-tabs`). Native Material 3 no Android. |
| Estilo | **NativeWind v4** (Tailwind em RN) |
| UI Kit | **react-native-reusables** (shadcn port) |
| Componentes específicos | **@shopify/react-native-bouncy-checkbox** (checkbox de tarefa), **sonner-native** (toasts), **react-native-context-menu-view** (long press menus) |
| Ícones | **@expo/vector-icons** — Ionicons (vector font, theme-aware) |
| Estado de dados | Camada de hooks sobre repos (TanStack Query-like, leve) |
| Estado de UI | **Context API + custom `createStore` hook** (sem Zustand no MVP) |
| Base de dados local | **expo-sqlite** + **Drizzle ORM** (substitui Prisma no mobile) |
| Migrações | drizzle-kit |
| Formulários | **React Hook Form** + **Zod** (resolver `@hookform/resolvers/zod`) |
| Datas | **date-fns** (formatação, recorrência, locale) |
| Calendário | **react-native-calendars** |
| Notificações | **expo-notifications** |
| Listas performantes | **@shopify/flash-list** (substitui FlatList) |
| Gestos e animações | Reanimated 4 + Gesture Handler (já no template) |
| Fontes | **Inter** (via `expo-font` / `@expo-google-fonts/inter`) + **SpaceMono-Regular** (decorativo) |
| Testes | **Vitest** + **@testing-library/react-native** |
| Plataforma alvo | **Android only** (MVP). iOS adicionado em fase futura. |

---

## 8. Decisões confirmadas

### 8.1 Resumo de decisões

| # | Decisão | Resposta | Implicação na arquitetura |

|---|---------|----------|----------------------------|
| 1 | ORM no mobile | **Drizzle** (substitui Prisma) | Prisma permanece como opção para o futuro backend cloud; mobile usa Drizzle + `expo-sqlite`. |
| 2 | UI Kit estilo shadcn | **react-native-reusables** | Componentes em `src/components/ui/` seguem a API do reusables (Button, Input, Dialog, Sheet, etc.). |
| 3 | Subtarefas | **Sim, 1 nível apenas** | Campo `parentId` em `tasks`; UI mostra 1 nível; sem árvore profunda. |
| 4 | Etiquetas | **Sim** | Tabela `labels` + M:N `task_labels`. Etiquetas são secundárias ao projeto. |
| 5 | Recorrência | **Simples** (diária, semanal, mensal, anual) | Campo `recurrenceRule` armazena string curta (`daily`/`weekly`/`monthly`/`yearly`) + campos auxiliares (ex: `weekday` para semanal). Sem RRULE completo. |
| 6 | i18n | **pt-PT + en-US** | Ficheiros em `src/i18n/{pt,en}.json`; detecção inicial via locale do sistema; toggle manual nas definições. |
| 7 | Tema | **Auto (system) + toggle manual** | Provider com 3 estados: `light`/`dark`/`system`. Auto = `Appearance.getColorScheme()`. Persistência em AsyncStorage. |
| 8 | Autenticação local | **Não no MVP** | Sem PIN/biometria. Acesso direto ao app. (Será reavaliado quando entrar sync cloud.) |
| 9 | Estatísticas | **Placeholder apenas** | Rota/separador "Estatísticas" existe com ecrã estático "Em breve". |
| 10 | Plataforma alvo | **Android only** | Sem iOS, sem Web. Foco em padrões Android (Material 3, gestos nativos). Expo Go suportado durante dev. |
| 11 | Cor primária | **`#dc4c3e`** (de `Colors.ts`) | Confirmada como identidade visual do Jarvis. Mantém-se igual em light e dark. |
| 12 | Remoção de assets | **Adiada** | `icon-blue.png`, `icon-green.png`, `login.png`, `todoist-logo.png`, `favicon.png`, `tabIcons/*.png` ficam marcados como candidatos a limpeza futura, mas não são removidos nesta fase. |
| 13 | Fonte principal | **Inter** | 4 pesos (Regular, Medium, Semibold, Bold). SpaceMono mantida para uso pontual (timestamps, IDs). |
| 14 | Context menu | **`react-native-context-menu-view`** | Lib confirmada pelo utilizador. Usada no long press de tarefas (editar, duplicar, mover, eliminar). |
| 15 | Bottom tabs | **`@bottom-tabs/react-navigation`** | Substitui `@react-navigation/bottom-tabs`. Compatível com Expo Router via `withLayoutContext`. Requer Development Build (não corre em Expo Go — aceitável para Android only). |
| 16 | Shopping List | **Sim** (reutiliza Project+Task) | Novo `Project.type = "shopping"`. Lista de compras nativa (checklist) reutilizando Project+Task+Label. Parser Quick Add especial: `item qty #secção`. |

### 8.2 Decisão sobre gestão de estado (Zustand vs Context + Hooks)

**Decisão: Context + custom `createStore` hook (sem Zustand).**

Justificação:

- O estado de UI previsto (filtros, Quick Add aberto/fechado + draft, tema, idioma) é de baixa/média frequência.
- 4-5 stores pequenos não beneficiam materialmente de selectors granulares que o Zustand oferece.
- Mantém a stack minimalista (zero dependências adicionais).
- Os stores ficam isolados em `src/state/` e expostos via hooks (`useTheme`, `useFilters`, `useQuickAdd`). Trocar para Zustand no futuro é trocar apenas a implementação interna do hook — os consumers não mudam.

**Escape hatch:** se a dor aparecer (re-renders excessivos, lógica de stores a crescer para >200 linhas, necessidade de devtools partilhados), a migração para Zustand é mecânica e isolada.

---

## 9. Riscos identificados

| Risco | Impacto | Mitigação |

|-------|---------|-----------|
| ~~Prisma em RN~~ | Resolvido | Drizzle adotado (ver secção 8.1) |
| ~~shadcn sem port~~ | Resolvido | react-native-reusables adotado (ver secção 8.1) |
| NativeWind v5 instável com SDK 55 | Bugs visuais | Pin v4 e smoke tests |
| react-native-calendars incompatível com Reanimated 4 | Conflitos de versão | Validar combo cedo; senão wrapper custom com `react-native-calendar-kit` |
| Notificações locais limitadas (~50 Android) | Lembretes perdidos em tarefas futuras | Política de re-agendamento em foreground/launch; não acumular lembretes órfãos |
| Listas grandes (milhares de tarefas) com FlatList | Jank | FlashList + tuning de `windowSize` |
| Sync futuro exige decisões já | Refactor doloroso | Outbox + ULIDs + `clientUpdatedAt` desde o dia 1 |
| Vitest em ambiente RN | Setup não-trivial | Mock de `expo-sqlite`; separar lógica pura (repos/schemas) testável em node |
| Expo Go não suporta `expo-notifications` em background | Testes flaky no emulador | Development Build (EAS Build local) para validar notificações agendadas |
| `@bottom-tabs/react-navigation` requer Development Build | Não corre em Expo Go | Aceitável para Android only MVP. `npm run android` (já `expo run:android`) gera dev build. |
| Assets não otimizados (`icon-blue.png` 4.2 MB, `icon-green.png` 4.2 MB) | Bundle da app inflado | Marcados como candidatos a remoção. **Não removidos** nesta fase por decisão do utilizador. Limpeza futura. |

---

## 10. Plano de scaffolding (Fase 1)

> Esta fase **não está aprovada para execução**. Aguarda nova aprovação do utilizador.

### 10.1 Objetivo da Fase 1

Validar a arquitetura de ponta a ponta com uma **única feature end-to-end**: o **Quick Add** (criar tarefa a partir do FAB central). Se esta feature funcionar — captura → parser local → persistência → notificação agendada → atualização da lista "Hoje" — a arquitetura está validada. O resto do app é composição.

### 10.2 Etapas

| # | Etapa | Entregáveis | Critério de validação |

|---|-------|-------------|------------------------|
| 1.1 | **Setup de packages** | Instalação: `nativewind`, `drizzle-orm`, `drizzle-kit`, `expo-sqlite`, `expo-notifications`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@shopify/flash-list`, `react-native-calendars`, `vitest`, `@testing-library/react-native`, `react-native-reusables`. Configuração de `tailwind.config.js`, `metro.config.js`, `babel.config.js` para NativeWind v4. | `npm run lint` + `npm run android` arrancam sem erros. |
| 1.2 | **Providers e UI base** | `_layout.tsx` raiz com providers: `DBProvider`, `ThemeProvider`, `I18nProvider`, `NotificationsProvider`. Componentes em `src/components/ui/`: `Button`, `Input`, `Text`, `Card`, `Dialog`, `Sheet`, `Chip` (via reusables). Helpers em `src/lib/`: `cn()`, formatadores. | Ecrã de preview renderiza todos os componentes base. Tema auto + manual funciona. |
| 1.3 | **Schema DB + migrações** | `src/db/schema.ts` com as 6 tabelas (users, projects, tasks, labels, task_labels, reminders, outbox). `src/db/client.ts` com init pattern (singleton, migração on first launch). `drizzle.config.ts`. Primeira migração gerada. | App inicia, cria DB local, migração aplica sem erro. Smoke test insere e lê 1 task. |
| 1.4 | **Repositórios + testes** | `src/repositories/{tasks,projects,labels,reminders,outbox}.repo.ts`. Testes Vitest com SQLite em memória (lógica pura). | `npm test` passa com cobertura >80% nos repos. |
| 1.5 | **Hooks de dados** | `src/hooks/useTasks.ts`, `useTaskMutations.ts` — camada TanStack Query-like (pode usar a lib real ou implementação leve). Optimistic updates. | UI consome hooks; cache é invalidado em mutations. |
| 1.6 | **Quick Add (POC)** | `src/app/(modals)/quick-add.tsx` com form RHF + Zod. Parser local básico (`!p1`, `#projeto`, `amanhã`). Integração: form → mutation → repo → DB → notificação agendada. | Criar tarefa via FAB → aparece em "Hoje" → notif agendada. |
| 1.7 | **Bottom Tabs + FAB** | `src/app/(tabs)/_layout.tsx` com 5 tabs (Opção B). FAB central no tab 3, sem screen (devolve `null`). `tabBarButton` custom + `tabBarIcon` elevado. | Navegação fluida; FAB abre modal Quick Add; long press mostra toast. |
| 1.8 | **Gate Go/No-Go** | Checklist de validação da arquitetura. Decisão de avançar para Fase 2. | — |

### 10.3 Fase 2 (alto nível, não detalhada)

Após gate positivo:

- Tela "Hoje" completa (com selector de filtro).
- Tela "Agenda" (calendário mensal + dots).
- Tela "Pesquisar" (full-text + filtros).
- Tela "Projetos" (CRUD + detalhe).
- Subtarefas (1 nível).
- Etiquetas (CRUD + filtros).
- Notificações agendadas + handler de tap.
- Onboarding (primeira execução).
- Definições (notificações, aparência, idioma).
- Internacionalização pt-PT + en-US.

### 10.4 Fase 3 e além (roadmap, não detalhado)

- Temas customizáveis.
- Recorrência funcional (criar próxima ocorrência ao concluir).
- Assistente IA (long press no FAB).
- OCR de documentos.
- Comandos em linguagem natural.
- Sincronização cloud (worker que consome a tabela `outbox`).

---

## 11. Tokens semânticos e mapeamento (Colors → UI)

Esta secção define como a paleta em `src/styles/Colors.ts` é exposta aos componentes `react-native-reusables` e ao NativeWind. É um **contrato de design system**, não código de implementação.

### 11.1 Princípio

- `Colors.ts` é o **único** ponto de verdade para cores.
- Componentes **nunca** importam hex directamente — consomem tokens semânticos (`bg-primary`, `text-foreground`, `border-border`, etc.).
- O mapeamento é feito em **dois pontos**:
  1. `tailwind.config.js` → `theme.extend.colors` aponta para `Colors.light` ou `Colors.dark`.
  2. `src/styles/reusables-adapter.ts` → exporta um objecto `UI_COLORS` que o `ThemeProvider` da `react-native-reusables` consome.

### 11.2 Mapeamento Colors → tokens (light + dark)

| Token semântico | Light (de Colors.ts) | Dark (proposto) | Uso |

|------------------|----------------------|------------------|-----|
| `primary` | `Colors.primary` (`#dc4c3e`) | igual | CTAs, FAB, acções primárias |
| `background` | `Colors.background` (`#fff`) | `#1a1a1a` (a afinar) | fundo da app |
| `muted` | `Colors.backgroundAlt` (`#f5f5f5`) | `#2a2a2a` (a afinar) | cards, inputs, sheets |
| `foreground` | `Colors.dark` (`#635E5E`) | `#f5f5f5` (a afinar) | texto principal |
| `muted-foreground` | `Colors.lightText` (`#a6a6a6`) | `#a6a6a6` (mantém) | texto secundário, labels |
| `border` | `Colors.lightBorder` (`#d9d9d9`) | `#3a3a3a` (a afinar) | divisórias, bordas de input |
| `destructive` | `Colors.primary` (`#dc4c3e`) | igual | eliminar, acções destrutivas |
| `success` | `DATE_COLORS.today` (`#2f9d23`) | igual | confirmações, badges "concluído" |
| `warning` | `Colors.secondary` (`#D88E2E`) | igual | alertas suaves |

### 11.3 Tokens de data (`DATE_COLORS`)

| Token | Cor | Uso |

|-------|-----|-----|
| `date-today` | `#2f9d23` | badge "Hoje" na lista |
| `date-tomorrow` | `#9d6023` | badge "Amanhã" |
| `date-weekend` | `#233d9d` | datas em fim de semana (visual opcional) |
| `date-other` | `#54239d` | datas genéricas |

### 11.4 Tokens de projeto (`PROJECT_COLORS`)

Paleta de 9 cores seleccionáveis pelo utilizador ao criar/editar projeto. Cada cor é exposta como `project-1` ... `project-9` no NativeWind.

| # | Token | Cor |

|---|-------|-----|
| 1 | `project-1` | `#0079bf` (azul) |
| 2 | `project-2` | `#d29034` (laranja) |
| 3 | `project-3` | `#519839` (verde) |
| 4 | `project-4` | `#b04632` (vermelho) |
| 5 | `project-5` | `#89609e` (roxo) |
| 6 | `project-6` | `#cd5a91` (rosa) |
| 7 | `project-7` | `#4bbf6b` (verde claro) |
| 8 | `project-8` | `#00aecc` (ciano) |
| 9 | `project-9` | `#838c91` (cinza) |

`DEFAULT_PROJECT_COLOR = project-1` (mantém-se o actual).

### 11.5 Prioridades (badge/chip)

| Prioridade | Cor proposta | Nota |

|------------|--------------|------|
| `p1` (alta) | `Colors.primary` (`#dc4c3e`) | vermelho, máxima urgência |
| `p2` | `Colors.secondary` (`#D88E2E`) | laranja |
| `p3` | `DATE_COLORS.today` (`#2f9d23`) | verde |
| `p4` (baixa) | `Colors.lightText` (`#a6a6a6`) | cinza |
| `none` | sem badge | — |

### 11.6 Estados visuais (a derivar dos tokens)

- **Hover / Pressed**: variantes `primary/90`, `primary/80` (opacidade) ou tons derivados.
- **Disabled**: `muted-foreground` com `opacity-50`.
- **Focus**: anel com `primary` a 30% de opacidade.
- **Error**: `destructive` com texto branco.
- **Loading**: `muted-foreground` com spinner.

> **Nota de implementação:** o adapter para `react-native-reusables` e a config do NativeWind serão afinados na Fase 1.2. Esta secção é o **contrato** — qualquer componente que não respeite este mapeamento deve ser revisto.

---

> Documento atualizado com as decisões confirmadas (secção 8), o plano de scaffolding (secção 10) e os ajustes na arquitectura (Context + Hooks em vez de Zustand, FAB central, Android only, `@bottom-tabs/react-navigation`, Inter + SpaceMono, paleta de `Colors.ts` como fonte de verdade).
> A Fase 1 (scaffolding) **aguarda aprovação explícita** antes de ser executada.
