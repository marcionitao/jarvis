# Jarvis — Análise do Produto (Fase 0)

> Documento de discovery e arquitetura.
> Sem código. Decisões confirmadas. Aguarda aprovação para avançar para a Fase 1 (scaffolding).

---

## Índice

1. [Visão resumida](#1-visão-resumida)
2. [Pontos críticos da stack](#2-pontos-críticos-da-stack)
3. [Arquitetura proposta](#3-arquitetura-proposta)
4. [Mapa de telas](#4-mapa-de-telas)
   - 4.1 [FAB — design preparado para IA futura](#41-fab--design-preparado-para-ia-futura)
5. [Fluxo de navegação](#5-fluxo-de-navegação)
6. [Modelo de dados](#6-modelo-de-dados)
7. [Stack final proposta](#7-stack-final-proposta)
8. [Decisões confirmadas](#8-decisões-confirmadas)
9. [Riscos identificados](#9-riscos-identificados)
10. [Plano de scaffolding (Fase 1)](#10-plano-de-scaffolding-fase-1)

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

---

## 3. Arquitetura proposta

### 3.1 Princípios arquiteturais

- **Offline-first** — a source of truth é a base de dados local; tudo funciona sem rede.
- **Repositórios como fronteira de dados** — a UI nunca toca na DB diretamente. Isto permite trocar a camada de persistência e adicionar sync cloud sem refactor.
- **Sync-ready desde o dia 1** — IDs gerados no cliente (ULID), campo `clientUpdatedAt`, `syncStatus`, e tabela **outbox** para mutations pendentes.
- **Feature-sliced dentro de `src/`** — organização por domínio funcional para escalar sem virar spaghetti.

### 3.2 Camadas

```
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

### 3.3 Estrutura de pastas

```
src/
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

---

## 4. Mapa de telas

### Bottom Tabs (5 + FAB central)

**Decisão: Opção B** — 5 tabs sem hub "Mais". Acesso rápido às vistas core (Hoje, Agenda, Pesquisar, Projetos); definições, etiquetas, próximos e estatísticas ficam acessíveis via stack/header (a partir do tab respetivo ou do header da tab "Hoje").

```
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
| 5 | **Projetos** | Lista de projetos. Tap → detalhe. Long press → reordenar. |

### Telas em stack / modal

- **Tarefa detalhe** — metadata, descrição, lembretes, atividade.
- **Tarefa criar/editar** — formulário (RHF + Zod + NativeWind + shadcn).
- **Projeto detalhe** — lista de tarefas do projeto + metadata.
- **Projeto criar/editar** — formulário.
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

```
<FAB mode="quickAdd" | "assistant" onPress onLongPress>
  <Icon />
</FAB>
```

- Hoje: `mode="quickAdd"` → ícone `plus`.
- Futuro: `mode="assistant"` → ícone de IA; long press comuta entre modos.

#### Implementação no React Navigation

O tab "central" no `@react-navigation/bottom-tabs` não é uma rota real. É um `tabBarButton` custom que renderiza o `<FAB>` e cujo `listeners` consome o evento sem navegar. Padrão conhecido:

```
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

```
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

```
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

```
projects {
  id: ULID (PK)
  name: string
  color: string             // hex
  icon: string              // symbol name
  parentId: ULID?           // subprojetos
  order: number
  archivedAt: number?       // soft delete
  createdAt: number
  updatedAt: number
  clientUpdatedAt: number
  syncStatus: 'local' | 'pending' | 'synced'
}
```

#### tasks

```
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

```
labels {
  id: ULID (PK)
  name: string
  color: string
  createdAt: number
}
```

#### task_labels (M:N)

```
task_labels {
  taskId: ULID
  labelId: ULID
}
```

#### reminders

```
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

```
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
| Roteamento | **Expo Router** (`src/app/`) |
| Estilo | **NativeWind v4** (Tailwind em RN) |
| UI Kit | **react-native-reusables** (shadcn port) — ou gluestack-ui, conforme decisão |
| Estado de dados | Camada de hooks sobre repos (TanStack Query-like, leve) |
| Estado de UI | **Context API + custom `createStore` hook** (sem Zustand no MVP) |
| Base de dados local | **expo-sqlite** + **Drizzle ORM** (substitui Prisma no mobile) |
| Migrações | drizzle-kit |
| Formulários | **React Hook Form** + **Zod** (resolver `@hookform/resolvers/zod`) |
| Calendário | **react-native-calendars** |
| Notificações | **expo-notifications** |
| Listas performantes | **@shopify/flash-list** (substitui FlatList) |
| Gestos e animações | Reanimated 4 + Gesture Handler (já no template) |
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
| Android only | Sem cobertura iOS | Trade-off aceite no MVP; iOS adicionado em fase futura sem refactor de modelo de dados |

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

> Documento atualizado com as decisões confirmadas (secção 8), o plano de scaffolding (secção 10) e os ajustes na arquitectura (Context + Hooks em vez de Zustand, FAB central, Android only).
> A Fase 1 (scaffolding) **aguarda aprovação explícita** antes de ser executada.
