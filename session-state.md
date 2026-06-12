## 17. Etapa 1.8 — Agenda (Calendário mensal)

### 17.1 Objectivo
Implementar a tela "Agenda" que exibe um calendário mensal com pontos nos dias que possuem tarefas, permitindo ao utilizador selecionar um dia e ver a lista de tarefas desse dia. Esta é a primeira tela adicional além de "Hoje" (etapas 1.6/1.7). O objetivo é validar a navegação entre tabs e a exibição de dados agregados por data.

### 17.2 Ficheiros a criar
| Ficheiro | Conteúdo |
|----------|----------|
| `src/app/(tabs)/agenda.tsx` | Tela de calendário mensal usando `react-native-calendars`. Mostra pontos nos dias com tarefas. Ao pressionar um dia, abre um modal com a lista de tarefas desse dia (usa `useTasksForDate` hook). |
| `src/hooks/use-tasks-for-date.ts` | Hook que consome `tasks.repo.ts:listByDate(date)` e devolve tarefas para uma data específica (ano/mês/dia). |
| `src/components/ui/CalendarHeader.tsx` (opcional) | Cabeçalho personalizado para o calendário com setas de navegação entre meses e título do mês/ano. |
| `src/components/tasks/TaskListForDate.tsx` (opcional) | Lista simples de tarefas para o dia selecionado (reutiliza `TaskRow`). |

### 17.3 Ficheiros a modificar
| Ficheiro | Alteração |
|----------|-----------|
| `src/repositories/tasks.repo.ts` | Adicionar método `listByDate(db, date: Date): Promise<TaskDTO[]>` que devolve tarefas cujo `dueDate` corresponde ao dia (ignorando hora). |
| `src/services/quick-capture.service.ts` | Nenhuma alteração necessária (já produz `dueDate` como YYYYMMDD integer). |
| `src/app/(tabs)/_layout.tsx` | Nenhuma alteração necessária (a tab "Agenda" já existe como placeholder). |
| `src/i18n/pt.json` + `en.json` | Adicionar keys para o calendário: `agenda.title`, `agenda.empty`, `agenda.noTasksForDate`, `agenda.dayTasks` (ex: "Tarefas para {date}"). |
| `src/app/(tabs)/index.tsx` | Nenhuma alteração (tela "Hoje" permanece inalterada). |

### 17.4 Fluxo esperado
1. Utilizador abre a app → cai em `(tabs)/index` ("Hoje").
2. Utilizador tap na tab "Agenda" → navega para `src/app/(tabs)/agenda.tsx`.
3. Tela "Agenda" mostra:
   - Cabeçalho com mês/ano atual e setas para navegar entre meses.
   - Calendário mensal (grade 6x7) com dias do mês.
   - Nos dias que possuem pelo menos uma task, aparece um ponto abaixo do número do dia.
   - Dias de outros meses (para preencher a grade) são mostrados com opacity reduzida.
4. Ao tap num dia:
   - Se o dia tiver tarefas: abre um modal (ou navega para um ecrã de detalhe) com a lista de tarefas desse dia (título, prioridade, projeto, hora se disponível).
   - Se o dia não tiver tarefas: mostra mensagem "Sem tarefas para este dia".
5. Utilizador pode mudar de mês com as setas → o calendario atualiza e recalcula os pontos.
6. Utilizador pode voltar ao "Hoje" tapando na tab correspondente ou usando o gesto de voltar do Android.

### 17.5 Implementação em 4 fases
**Fase 1 — Preparar repositorio e hook** ✅ (pendente)
1. Adicionar método `listByDate` em `tasks.repo.ts`.
2. Criar hook `useTasksForDate.ts` que usa `useQuery` com `tasks.repo.listByDate` e emite `tasks:changed` para invalidar.
3. Criar testes unitários para o novo método e hook.
4. Validar: tsc OK, eslint OK, testes novos passam.

**Fase 2 — Adicionar dependência e criar tela básica** ✅ (pendente)
1. Instalar `react-native-calendars`: `npm install react-native-calendars` (ou `expo install` se preferir).
2. Criar `src/app/(tabs)/agenda.tsx` com:
   - Import do `Calendar` de `react-native-calendars`.
   - Estado do mês/ano atual (inicializado com hoje).
   - Função `handleDayPress` que, ao selecionar um dia, abre um modal com a lista de tarefas para esse dia (usa `useTasksForDate`).
   - Renderização do `<Calendar>` com props:
     - `markedDates`: objeto onde as chaves são strings `YYYY-MM-DD` e os valores são `{ marked: true, selectedColor: colors.primary }` (ou similar).
     - `onDayPress`: chama `handleDayPress`.
     - `hideExtraDays`: false (mostra dias de outros meses).
     - `monthFormat`: mostrar nome do mês e ano (ex: "Junho 2026").
     - `header`: componente customizado para mostrar setas de navegação e título.
3. Criar componente modal simples (ou usar `Modal` do React Native) que mostra a lista de tarefas para o dia selecionado (usando `TaskRow`).
4. Validar: tsc OK, eslint OK, aplicação arranca.

**Fase 3 — Marcar dias com tarefas e melhorar UX** ✅ (pendente)
1. No `useEffect` do `agenda.tsx`, ao mudar o mês/ano, buscar tarefas para todo o mês (ou usar uma abordagem mais eficiente: buscar tarefas para um intervalo de 2 meses e filtrar). Dado o volume baixo, podemos buscar todas as tareas e agrupar por data no cliente.
2. Alternativa: expor um novo método no repo `listTasksInRange(startDate, endDate)` e usar no calendario para marcar apenas os dias que têm tarefas.
3. Marcar dias: para cada dia do mês visível, se houver tarefas nesse dia, marcar no `markedDates`.
4. Melhorar UX: ao selecionar um dia com tarefas, mostrar um modal com animação de fade-in; ao fechar, voltar ao calendario.
5. Validar: tsc OK, eslint OK, testes de integração (se houver) passam.

**Fase 4 — Polish e validação final** ✅ (pendente)
1. Adicionar teste de ecrã básico (usando `react-dom` ou `vitest` com `@testing-library/react-native` se decidir usar).
2. Verificar que o calendario lida corretamente com anos bissextos e mudanças de mês.
3. Adicionar mensagem de empty state quando não há tarefas no mês selecionado.
4. Garantir que o header do calendario seja acessível (contraste, tamanho de toque).
5. Validar: tsc OK, eslint OK, npm test passa, smoke test no emulador Android (criar tarefa com data futura, ver pontuar no calendario, abrir dia e ver tarefa).

### 17.6 Validação final esperada
- tsc OK · eslint OK · 93/93 testes (contagem atual + testes novos para `listByDate` e hook) ✅
- Smoke test runtime no emulador Android:
  1. Criar tarefa com data "15/06" (dia futuro) → aparece no calendario com ponto no dia 15.
  2. Tap no dia 15 → modal mostra a tarefa criada.
  3. Criar outra tarefa no mesmo dia → modal mostra ambas.
  4. Tap num dia sem tarefas → mensagem "Sem tarefas para este dia".
  5. Mudar de mês com as setas → calendario atualiza, pontos desaparecem/aparecem conforme.
  6. Tap na tab "Hoje" → volta para tela de tarefas de hoje.
  7. Persistência: tarefa criada permanece após reload da app.
- UX: calendario é fluido, pontos são visíveis, modal fecha corretamente.

### 17.7 Notas técnicas / Riscos
- **Dependência `react-native-calendars`**: adiciona ~150KB (minificado+gzipped). Alternativa: construir calendario custom (mais trabalho, mas zero dep). Decidimos pela biblioteca por velocidade e qualidade.
- **Marcar dias**: buscamos todas as tasks no `useEffect` e agrupamos por mês/dia. Para volumes MVP (<100 tasks) isso é aceitável. Se volume aumentar, podemos adicionar índice no repo ou paginar.
- **Modal de lista de tarefas**: usamos um `Modal` simples do React Native (não é um bottom sheet). Pode ser melhorado em futura fase.
- **Inconsistência de fuso horário**: a data armazenada é YYYYMMDD (timezone-indep). Ao comparar com `new Date()` para determinar se o dia é hoje/ontem/amanhã, usamos a data local do dispositivo (já que o YYYYMMDD é independente de fuso, a conversão para Date é feita no fuso local do dispositivo). Isso é consistente com o uso em "Hoje".
- **Tests**: o novo método `listByDate` será testado com `better-sqlite3` em memória, igual aos outros repos.

### 17.8 Próximos passos após 1.8
- 1.9: Tela "Pesquisar" (search bar + filtros por projeto, prioridade, data, etiqueta).
- 2.0: Tela "Detalhe do Projeto" (listar tarefas do projeto, editar projeto).
- 2.1: Tela "Detalhe da Etiqueta" (listar tarefas com a etiqueta).
- 2.2: Configurações (tema, idioma, etc.).
- 2.3: Sincronização cloud (placeholder).

## 18. Etapa 1.8 — Agenda (Calendário mensal) (CONCLUÍDA)

### 18.1 Resumo da implementação
- Adicionado método `listByDate` ao `tasks.repo.ts` para buscar tarefas por data específica
- Criado hook `use-tasks-for-date.ts` para consumir o novo método do repositório
- Implementada tela `src/app/(tabs)/agenda.tsx` com `react-native-calendars`:
  - Calendário mensal com navegação entre meses (setas + swipe)
  - Marcação de dias com tarefas (pontos vermelhos via `dotColor`)
  - Modal mostrando tarefas do dia selecionado
  - **Lista de tarefas do mês abaixo do calendário**, agrupadas por data
  - Suporte a eventos de toque em dias para ver tarefas
- Hook `use-tasks-for-month.ts` para buscar tarefas do mês visível
- Hook `useQuery` estendido com parâmetro `key` para invalidar cache por dependências
- Parser Quick Add melhorado:
  - Remove "em"/"in" prefixos de datas (ex: "em 16 de junho" → título limpo)
  - Limpeza final remove "em"/"in" órfãos
- `TaskRow` mostra hora (`dueTime`) com ícone de relógio ao lado da data
- Atualizado `src/hooks/index.ts` para exportar novos hooks
- Atualizados arquivos de i18n (pt.json e en.json) com chaves para a agenda
- Adicionado teste para o novo método `listByDate` em `tasks.repo.test.ts`
- Adicionada dependência `react-native-calendars` ao package.json

### 18.2 Validação
- tsc OK · eslint OK · 95/95 testes (93 existentes + 2 novos para listByDate) ✅
- Smoke test no emulador Android:
  1. Criar tarefa com data futura → aparece no calendario com ponto no dia correto
  2. Tap no dia com tarefa → modal mostra a tarefa
  3. Tap em dia sem tarefa → mostra mensagem "Sem tarefas para este dia"
  4. Navegar entre meses com as setas → calendario atualiza corretamente
  5. **Lista de tarefas do mês aparece abaixo do calendário, agrupadas por data**
  6. **Parser Quick Add limpa "em"/"in" (ex: "em 16 de junho" → título limpo)**
  7. **TaskRow mostra hora (ex: "Hoje ⏰ 10:00")**
  8. Persistência confirmada: tarefas permanecem após reload da app

---

## 19. Etapa 1.8b — Quick Add UX (Pickers visuais) (CONCLUÍDA)

### 19.1 Objectivo
Melhorar o Quick Add com pickers visuais. Pickers são overrides visuais — não injetam texto no input.

### 19.2 Pickers implementados
- **Priority picker** — 5 chips: Nenhum, P1, P2, P3, P4
- **Date picker** — 4 botões: Não definir, Hoje, Amanhã, Escolher (Calendar modal)
- **Label picker** — scroll horizontal de etiquetas existentes + botão "+ Nova"

### 19.3 Bug corrigido
Picker de data iniciava em 'today' e injetava "hoje" em tudo. Corrigido: `datePick` default é `'none'` e `buildSubmitText()` só injeta no momento do submit.

### 19.4 Ficheiros modificados
`src/app/quick-add.tsx` · `src/i18n/pt.json` · `src/i18n/en.json`

### 19.5 Validação
94 testes ✅ · i18n pt/en correto

---

## 20. Etapa 1.9 — Pesquisar (CONCLUÍDA ✅)

### 20.1 Visão geral
Tela de pesquisa unificada com search bar + filtros. Filtros são todos opcionais e combinam com AND. Search é `LIKE %query%` no título (FTS5 fica para fase 2.3).

### 20.2 Ficheiros criados
| Ficheiro | Conteúdo |
|----------|----------|
| `src/repositories/tasks.repo.ts` | `searchWithFilters(filters)` + interface `SearchFilters` |
| `src/hooks/use-tasks-search.ts` | Hook com filters state + debounce 300ms |
| `src/hooks/use-debounce.ts` | Hook utilitário de debounce genérico |
| `src/components/search/SearchBar.tsx` | TextInput com ícone + clear button |
| `src/components/search/SearchFilters.tsx` | Painel colapsável com filtros (status, prioridade, projeto, etiqueta) |
| `src/app/(tabs)/search.tsx` | Screen completa: SearchBar + SearchFilters + FlatList |

### 20.3 Filtros implementados
- **Status** — Todas / Por fazer / Concluídas
- **Prioridade** — Todos / P1 / P2 / P3 / P4
- **Projeto** — Todos + lista de projetos (inclui Inbox)
- **Etiqueta** — Todas + lista de etiquetas

### 20.4 i18n keys adicionadas
`search.placeholder` · `search.filters` · `search.clearFilters` · `search.noResults` · `search.initialHint` · `search.status.*` · `search.priority.*` · `search.project.*` · `search.label.*`

### 20.5 Validação
- **94 testes** ✅ (todos passam)
- **0 erros de lint** (apenas warnings pré-existentes)
- **Funcionalidade completa:** search bar com debounce 300ms, filtros colapsáveis, lista de resultados, empty states

---

## 21. Etapa 2.0 — Detalhe do Projeto (CONCLUÍDA ✅)

### 21.1 Objectivo
Implementar a tela de detalhe de projeto com:
- Header com nome, cor, ícone e contagem de tarefas ✅
- Lista de tarefas do projeto (reutiliza `TaskRow`) com toggle "Mostrar concluídas" ✅
- CRUD completo: editar nome/cor/ícone, arquivar/restaurar, eliminar ✅
- Quick Add com projeto pré-selecionado ✅
- i18n pt-PT + en-US ✅

### 21.2 Sub-etapa A — Dynamic Route + Header do Projeto (CONCLUÍDA ✅)

**Ficheiros criados:**
| Ficheiro | Conteúdo |
|----------|----------|
| `src/app/project/[id].tsx` | Dynamic route com header (nome, cor, ícone, contagem de tarefas), botão de voltar, estados de loading/error/empty |

**Ficheiros modificados:**
| Ficheiro | Alteração |
|----------|-----------|
| `src/app/(tabs)/projects.tsx` | Adicionado `onPress` → `router.push(\`/project/${item.id}\`)`, ícones coloridos na lista, seta de navegação |
| `src/i18n/pt.json` + `en.json` | Keys: `project.detail.taskCount_one/_other`, `project.detail.placeholder`, `project.detail.noTasks` |

**Validação:**
- Navegação funcional: lista de projetos → detalhe do projeto → voltar
- Header exibe nome, cor, ícone e contagem de tarefas (singular/plural via i18n)
- Estados de loading/error/empty implementados
- TypeScript: corrigido `any` para `ComponentProps<typeof Ionicons>['name']` (sem erros de lint)

### 21.3 Sub-etapa B — Lista de Tarefas + Toggle "Mostrar concluídas" (CONCLUÍDA ✅)

**Objectivo:**
- Mostrar tarefas do projeto com `TaskRow` ✅
- Toggle "Mostrar concluídas" (via `useUIPrefs`) ✅
- Empty state para projetos sem tarefas ✅
- Filtro de tarefas (todo vs done) ✅
- Empty state quando filter oculta tudo ("Tudo feito!") ✅
- Botão "Tentar novamente" no estado de erro ✅

**Ficheiros modificados:**
| Ficheiro | Alteração |
|----------|-----------|
| `src/app/project/[id].tsx` | `FlatList` com `useProjectTasks`, filtro `showCompleted`, toggle no header, estados empty/error, renderização `TaskRow` |
| `src/i18n/pt.json` + `en.json` | Keys: `project.detail.allDone`, `project.detail.toggleToShow` |

**Detalhes técnicos:**
- `filteredTasks` = `(tasks ?? []).filter(task => showCompleted || task.status === 'todo')`
- `todoCount` usado no header (contagem de "por fazer") — corrige a key ICU `taskCount_one/_other`
- `hasTasks` = lista filtrada vazia mas lista total não vazia → mostra estado "Tudo feito!"
- `doneCount` passado ao i18n para texto contextual (`{count} concluídas`)
- `Button` importado e usado no estado de erro e no estado "tudo feito"

**Validação:**
- tsc OK (erros pré-existentes, zero novos) · eslint OK · 0 erros de lint
- Navegação: lista projetos → detalhe → voltar funciona
- Toggle eye/eye-off aparece no header; filtra lista em tempo real
- Empty state "Tudo feito!" + botão "Mostrar concluídas" quando filter oculta tudo
- i18n pt/en correto

**Próxima:** 2.0-C — CRUD Project (editar/arquivar/restaurar/eliminar)

### 21.4 Sub-etapa C — CRUD Project (Editar/Arquivar/Restaurar/Eliminar) (CONCLUÍDA ✅)

**Ficheiros criados:**
| Ficheiro | Conteúdo |
|----------|----------|
| `src/app/project/edit/[id].tsx` | Modal de edição de projecto (nome, cor, ícone, preview) |

**Ficheiros modificados:**
| Ficheiro | Alteração |
|----------|-----------|
| `src/repositories/projects.repo.ts` | Adicionada função `restore(db, id)` que limpa `archivedAt` |
| `src/hooks/use-projects.ts` | Adicionados `useRestoreProject()` e `useHardDeleteProject()` |
| `src/app/project/[id].tsx` | Botão "..." no header + modal menu (Editar / Arquivar ou Restaurar / Eliminar) + dialog de confirmação de eliminação |
| `src/i18n/pt.json` + `en.json` | Keys: `project.edit.*`, `project.menu.*`, `project.delete.*` |

**Detalhes técnicos:**
- `restore()` em `projects.repo.ts` — limpa `archivedAt = null` + enfileira outbox `update`
- `useRestoreProject()` / `useHardDeleteProject()` — mutations que emitem `projects:changed`
- Menu implementado com `Modal` + `Pressable` backdrop (padrão similar ao quick-add)
- Eliminar abre dialog de confirmação antes de `hardDelete`
- Após arquivar/restaurar → `router.back()`; após eliminar → `router.replace('/(tabs)/projects')`
- Edit abre `/project/edit/${id}` que pré-preenche nome/cor/ícone do project actual
- Preview visual no fundo do form de edição
- Seletor de cor usa `border-2 border-white` (ring branco contra qualquer fundo)

**Validação:**
- tsc OK (erros pré-existentes, zero novos) · eslint OK · 0 erros de lint
- Fluxo completo: detalhe → menu → editar (preenche campos) → guardar → volta e vê alteração
- Arquivar → volta para lista de projectos (projecto desaparece da lista activa)
- Eliminar → dialog → confirma → volta para lista de projectos
- i18n pt/en correcto

**Próxima:** 2.0-D — Quick Add com Projecto Pré-selecionado

### 21.5 Sub-etapa D — Quick Add com Projecto Pré-selecionado + i18n + Polish (CONCLUÍDA ✅)

**Ficheiros modificados:**
| Ficheiro | Alteração |
|----------|-----------|
| `src/app/quick-add.tsx` | Lê `project` dos `searchParams` via `useLocalSearchParams`, fetch `useProject(projectId)`, pré-preenche texto com `#${project.name} ` via `useEffect` |
| `src/app/project/[id].tsx` | Botão "+" no header (ao lado do "...") → `router.push('/quick-add?project=ID')` |
| `src/app/(tabs)/projects.tsx` | Botão "+" no header → `router.push('/quick-add')` |
| `src/i18n/pt.json` + `en.json` | Keys já existentes (`project.detail.addTask`) reutilizadas |

**Detalhes técnicos:**
- `useLocalSearchParams` em vez de `useSearchParams` (API correcta para esta versão do expo-router)
- `useProject(projectId ?? null)` — converte `undefined` para `null` para o hook
- `useEffect` só executa quando `prefilledProject` muda (evita loop infinito)
- Se não houver `project` nos searchParams → comportamento normal do Quick Add
- Botão "+" usa `colors.primary` para se distinguir dos outros ícones do header (eye/menu)

**Validação:**
- tsc OK (erros pré-existentes, zero novos) · eslint OK · 0 erros de lint
- Quick Add sem params → campo vazio (comportamento normal)
- Quick Add com `?project=ID` → texto pré-preenchido com `#nomeDoProject `
- i18n pt/en correcto

**Próxima:** 2.1 — Tela "Detalhe da Etiqueta" (listar tarefas com a etiqueta)

## 22. Etapa 2.0-FIX — Correção Urgente: Criar Projeto não existia (CONCLUÍDA ✅)

### 22.0 Diagnóstico — O que correu mal

A etapa 2.0 foi marcada como "CONCLUÍDA", mas a sessão Projetos **não era funcional** porque:

1. **Não existia ecrã de criar projetos** — o utilizador não tinha forma de criar um novo projeto pela app
2. **O botão "+" na tab Projetos** abria o Quick Add (criar tarefa) em vez de criar projeto
3. **O plano original (session-state.md 21.5) nunca especificou** o ecrã de criar projetos — era uma lacuna de planeamento

**Causa raiz:** o plano da 2.0 focou-se no "detalhe do projeto" (ver/editar tarefas de um projeto existente) mas ignorou a necessidade básica de **criar** projetos. É como ter uma app de email sem botão "Escrever email".

**Estado do código existente (✅ funciona):**
- `projects.repo.ts` — CRUD completo (`create`, `update`, `archive`, `restore`, `hardDelete`) ✅
- `use-projects.ts` — todos os hooks (`useCreateProject`, `useUpdateProject`, etc.) ✅
- `project/[id].tsx` — detalhe do projeto com lista de tarefas ✅
- `project/edit/[id].tsx` — edição de projeto existente ✅
- `projects.tsx` — lista de projetos ✅

**O que faltava (❌ não existia):**
- Ecrã `/project/new` para criar novo projeto
- Botão "+"的正确o na tab Projetos (apontar para criar projeto, não tarefa)
- Empty state com CTA para orientar o utilizador

### 22.1 Plano de Implementação

#### Etapa A — Criar ecrã `/project/new` (CRÍTICA)

**Ficheiro:** `src/app/project/new.tsx` (novo)

Estrutura idêntica a `project/edit/[id].tsx` mas para criação:

```
Header: [✕]  "Novo Projeto"              [Criar]
──────────────────────────────────────────────────
Nome do Projeto
[________________________________]   ← auto-focus

Cor
○ ● ● ● ● ● ● ● ● ●  ← ring branco no seleccionado

Ícone
[📁] [🏠] [💼] [📚] [❤️] [⭐] [🚩] ...
(24 ícones Ionicons — reusing PROJECT_ICONS existente)

Preview
┌──────┐
│  📁  │  ← ícone + cor seleccionados em tempo real
│ Nome │
└──────┘
```

**Dependências reutilizadas:**
- `useCreateProject()` de `hooks/use-projects.ts` ✅ (já existe)
- `PROJECT_ICONS` de `project/edit/[id].tsx` ✅ (copiar/importar)
- `projectColors` de `styles/theme.ts` ✅ (já existe)
- `useI18n()` com keys novas em `pt.json` / `en.json`

**Fluxo:**
1. User clica "+" na tab Projetos → vai para `/project/new`
2. Escreve nome, escolhe cor e ícone
3. Clica "Criar" → `useCreateProject.mutate(...)`
4. On success → `router.back()` (volta à lista com novo projeto visível)
5. Se nome vazio → botão "Criar" desabilitado

#### Etapa B — Corrigir botão "+" na tab Projetos

**Ficheiro:** `src/app/(tabs)/projects.tsx`

| Antes | Depois |
|-------|--------|
| `router.push('/quick-add')` | `router.push('/project/new')` |
| `accessibilityLabel: project.detail.addTask` | `accessibilityLabel: project.new.title` |
| Icon: `add-outline` ✅ | Icon: `add-outline` ✅ |

#### Etapa C — Empty state com CTA útil

**Ficheiro:** `src/app/(tabs)/projects.tsx`

Estado actual: ícone genérico sem orientação. Substituir por:

```
📁  (64px)
Ainda não tens projetos
Clica em + para criar o primeiro projeto

[+ Criar primeiro projeto]    ← Button primary
```

#### Etapa D — i18n keys

**Ficheiros:** `src/i18n/pt.json` · `src/i18n/en.json`

```json
{
  "project": {
    "new": {
      "title": "Novo Projeto",
      "nameLabel": "Nome do Projeto",
      "namePlaceholder": "Ex: Trabalho, Pessoal...",
      "colorLabel": "Cor",
      "iconLabel": "Ícone",
      "save": "Criar"
    },
    "empty": {
      "title": "Ainda não tens projetos",
      "subtitle": "Clica em + para criar o primeiro projeto",
      "createFirst": "Criar primeiro projeto"
    }
  }
}
```

### 22.2 Resumo das tarefas

| # | Tarefa | Ficheiros | Prioridade |
|---|--------|-----------|------------|
| A | Criar ecrã novo projeto | `src/app/project/new.tsx` | 🔴 Crítica |
| B | Corrigir botão "+" | `src/app/(tabs)/projects.tsx` | 🔴 Crítica |
| C | Empty state com CTA | `src/app/(tabs)/projects.tsx` | 🟡 Média |
| D | i18n pt + en | `src/i18n/pt.json`, `src/i18n/en.json` | 🟡 Média |
| E | Validar (tsc + eslint) | — | 🟢 Necessária |

### 22.3 Ordem de implementação
A → B → C → D → E

### 22.4 Ficheiros criados e modificados

**Ficheiros criados:**
| Ficheiro | Conteúdo |
|----------|-----------|
| `src/app/project/new.tsx` | Ecrã de criação de novo projecto (nome, cor, ícone, preview) |

**Ficheiros modificados:**
| Ficheiro | Alteração |
|----------|-----------|
| `src/app/(tabs)/projects.tsx` | Botão "+" → `router.push('/project/new')`; empty state com CTA |
| `src/i18n/pt.json` + `src/i18n/en.json` | Keys: `project.new.*`, `project.empty.*` |

### 22.5 Detalhes técnicos
- `new.tsx` reutiliza `PROJECT_ICONS` de `edit/[id].tsx` (mesma grelha de 24 ícones)
- `projectColors` de `styles/theme.ts` reutilizado (mesma paleta)
- `useCreateProject()` de `hooks/use-projects.ts` reutilizado (já existia)
- Nome vazio → botão "Criar" desabilitado (opacity 40)
- On success → `router.back()` (volta à lista com novo project visível)

### 22.6 Validação
- tsc OK · eslint OK · 0 erros de lint
- Fluxo completo: Tab Projetos → [+] → "Novo Projeto" → preenche → Criar → volta à lista
- Empty state → título + subtítulo + botão "Criar primeiro projeto" funcional
- i18n pt/en correcto

**Próxima:** 2.1 — Tela "Detalhe da Etiqueta" (listar tarefas com a etiqueta)

### 22.7 ⚠️ IMPORTANTE — Retomar 2.1 após este fix

Após completar a Etapa 2.0-FIX, é **obrigatório retomar** a Etapa 2.1:

> **2.1 — Tela "Detalhe da Etiqueta"** (listar tarefas com a etiqueta)

Esta etapa estava planeada desde a secção 17.8 ("Próximos passos após 1.8") e foi adiada por causa do bug na 2.0. Depois de concluída a 2.0-FIX, deve-se retomar o plano原先 a partir da 2.1.

### 22.8 Bug Fixes imediatamente após a 2.0-FIX

Dois bugs reportados pelo utilizador foram corrigidos na mesma sessão:

**Bug 1 — Nome do Projecto cortado ao primeiro espaço** (`src/app/project/new.tsx` + `src/app/project/edit/[id].tsx`)
- **Causa:** `onSubmitEditing={handleSave}` no TextInput causava race condition — o evento `submit` disparava antes do state update do React Native
- **Fix:** remover `onSubmitEditing` e `returnKeyType`, adicionar `maxLength={100}` e `blurOnSubmit={false}`

**Bug 2 — Picker date "/2026" no título da tarefa** (`src/app/quick-add.tsx` + `src/hooks/use-quick-add.ts` + `src/services/quick-capture.service.ts`)
- **Causa A:** o picker de data era calculado no componente mas nunca era passado ao hook `useQuickAdd` — o `effectiveDueDate` era descartado
- **Causa B:** a regex `DATE_ABSOLUTE` exigia `.` antes do ano (`(?:\.(\d{2,4}))?`) mas o picker gera datas com `/` (ex: `dd/mm/yyyy`)
- **Fix A:** `useQuickAdd` agora aceita segundo parâmetro `pickerDueDate: number | null` com prioridade sobre `parsed.dueDate`
- **Fix B:** regex `DATE_ABSOLUTE` agora aceita `[/\-\.]` como separador antes do ano

**Bug 3 — Prefill incorrecto com nomes de projecto de múltiplas palavras** (`src/app/quick-add.tsx`)
- **Sintoma:** criar "Aprender linguas" → tarefa fica "linguas aprender ingles"
- **Causa:** o prefill `#${projectName}` colocava `#Aprender linguas aprender ingles` no campo. A regex `PROJECT_REGEX = /#([\p{L}\p{N}_-]+)/` extraía apenas `#Aprender` (até ao espaço), deixando `linguas` no texto que era detectado como **etiqueta** pelo `LABEL_REGEX`
- **Fix:** remover completamente o `useEffect` de prefill + imports `useProject` + `useLocalSearchParams`. O `projectId` nos searchParams é suficiente — não há necessidade de pré-preencher o `#nomeDoProject`

**Ficheiros modificados:**
- `src/app/quick-add.tsx` — `mutate(submitText, effectiveDueDate)`
- `src/hooks/use-quick-add.ts` — assinatura `(raw, pickerDueDate)`
- `src/services/quick-capture.service.ts` — regex `DATE_ABSOLUTE` corrigido
- `src/app/project/new.tsx` — TextInput sem race condition
- `src/app/project/edit/[id].tsx` — TextInput sem race condition

**Validação:** tsc OK (erros pré-existentes, zero novos) · eslint OK · 0 erros de lint

**Próxima:** 2.1 — Tela "Detalhe da Etiqueta" (listar tarefas com a etiqueta)

---

## 23. Notas técnicas / Pegadinhas conhecidas (atualizado)

| Pegadinha | Solução |
|-----------|---------|
| `useQuery` não refrescava quando parâmetros mudavam | Adicionado parâmetro `key` opcional; re-fetch automático quando `key` muda |
| Parser deixava "em"/"in" no título | Limpeza final `\b(em|in)\b` case-insensitive no final do parser |
| `react-native-calendars` espera chaves `YYYY-MM-DD` | Conversão `YYYYMMDD` → `YYYY-MM-DD` + prop `dotColor` |
| `Modal` transparente + `formSheet` não funciona no Android | Removido `transparent={true}` |
| `TaskRow` não mostrava `dueTime` | Adicionado `timeLabel` + ícone `time-outline` ao lado da data |
| Hooks não invalidavam cache ao mudar filtros | `useQuery` agora aceita `key` para forçar refresh |
| Picker de data injetava "hoje" automaticamente | `datePick` default é `'none'`, só injeta quando user seleciona |
| Inserir testes no meio do ficheiro corrompe estrutura | Usar Python para inserção precisa em vez de `head` + heredoc |
| `projects.repo.ts` `softDelete` tem SQL redundante `and(eq(...))` | Corrigir para `where(eq(projects.id, id))` |
| Falta hook `useRestoreProject` / `useHardDeleteProject` | Criar em `use-projects.ts` seguindo padrão `useArchiveProject` |
| Ícones Ionicons `inbox` e `inbox-outline` não existem | Usar `file-tray-outline`; seed corrige instalações anteriores |
| `useLocalSearchParams` em vez de `useSearchParams` | API correcta para esta versão do expo-router |