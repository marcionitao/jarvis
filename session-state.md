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

## 20. Próximas fases sugeridas

| Fase | Descrição | Prioridade |
|------|-----------|------------|
| **1.8b** | **Quick Add UX** — Pickers visuais (prioridade, data, etiquetas) | Alta |
| **1.9** | **Pesquisar** — Search bar + filtros (projeto, prioridade, data, etiqueta) + full-text | Alta |
| **2.0** | **Detalhe do Projeto** — CRUD projetos, lista tarefas do projeto, reordenar | Alta |
| **2.1** | **Detalhe da Etiqueta** — Lista tarefas com etiqueta, editar etiqueta | Média |
| **2.2** | **Configurações** — Tema, idioma, notificações, backup/export | Média |
| **2.3** | **Sincronização cloud** — Placeholder (Supabase/Firebase) | Baixa |

### 1.9 — Pesquisar (CONCLUÍDA ✅)

### 1.9.1 Visão geral
Tela de pesquisa unificada com search bar + filtros. Filtros são todos opcionais e combinam com AND. Search é `LIKE %query%` no título (FTS5 fica para fase 2.3).

### 1.9.2 Ficheiros criados
| Ficheiro | Conteúdo |
|----------|----------|
| `src/repositories/tasks.repo.ts` | `searchWithFilters(filters)` + interface `SearchFilters` |
| `src/hooks/use-tasks-search.ts` | Hook com filters state + debounce 300ms |
| `src/hooks/use-debounce.ts` | Hook utilitário de debounce genérico |
| `src/components/search/SearchBar.tsx` | TextInput com ícone + clear button |
| `src/components/search/SearchFilters.tsx` | Painel colapsável com filtros (status, prioridade, projeto, etiqueta) |
| `src/app/(tabs)/search.tsx` | Screen completa: SearchBar + SearchFilters + FlatList |

### 1.9.3 Filtros implementados
- **Status** — Todas / Por fazer / Concluídas
- **Prioridade** — Todos / P1 / P2 / P3 / P4
- **Projeto** — Todos + lista de projetos (inclui Inbox)
- **Etiqueta** — Todas + lista de etiquetas

### 1.9.4 i18n keys adicionadas
`search.placeholder` · `search.filters` · `search.clearFilters` · `search.noResults` · `search.initialHint` · `search.status.*` · `search.priority.*` · `search.project.*` · `search.label.*`

### 1.9.5 Validação
- **94 testes** ✅ (todos passam)
- **0 erros de lint** (apenas warnings pré-existentes)
- **Funcionalidade completa:** search bar com debounce 300ms, filtros colapsáveis, lista de resultados, empty states

---

## 21. Próximas fases sugeridas

| Fase | Descrição | Prioridade |
|------|-----------|------------|
| **2.0** | **Detalhe do Projeto** — CRUD projetos, lista tarefas do projeto, reordenar | Alta |
| **2.1** | **Detalhe da Etiqueta** — Lista tarefas com etiqueta, editar etiqueta | Média |
| **2.2** | **Configurações** — Tema, idioma, notificações, backup/export | Média |
| **2.3** | **Sincronização cloud** — Placeholder (Supabase/Firebase) | Baixa |

### 2.0 — Detalhe do Projeto (próxima)
**Objetivo:** Tela de detalhe de projeto com:
- Header com nome, cor e ícone do projeto
- Lista de tarefas do projeto (reutiliza `TaskRow`)
- Checkbox "Mostrar concluídas"
- Botão "Adicionar tarefa" (abre Quick Add com projeto pré-selecionado)
- Menu "..." para editar/arquivar/deletar projeto

**Ficheiros a criar/modificar:**
- `src/app/(tabs)/project/[id].tsx` — screen de detalhe (dynamic route)
- `src/app/projects.tsx` — lista de projetos (se necessário)
- `src/hooks/use-project-tasks.ts` — hook para buscar tarefas por projeto
- `src/repositories/projects.repo.ts` — métodos existentes já suportam

**Fase de implementação:**
- **Fase A** — Dynamic route + header do projeto
- **Fase B** — Lista de tarefas + toggle "Mostrar concluídas"
- **Fase C** — CRUD projeto (editar/arquivar/deletar)
- **Fase D** — Quick Add com projeto pré-selecionado + i18n

---

## 22. Notas técnicas / Pegadinhas conhecidas (atualizado)

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

| Pegadinha | Solução |
|-----------|---------|
| `useQuery` não refrescava quando parâmetros mudavam | Adicionado parâmetro `key` opcional; re-fetch automático quando `key` muda |
| Parser deixava "em"/"in" no título | Limpeza final `\b(em|in)\b` case-insensitive no final do parser |
| `react-native-calendars` espera chaves `YYYY-MM-DD` | Conversão `YYYYMMDD` → `YYYY-MM-DD` + prop `dotColor` |
| `Modal` transparente + `formSheet` não funciona no Android | Removido `transparent={true}` |
| `TaskRow` não mostrava `dueTime` | Adicionado `timeLabel` + ícone `time-outline` ao lado da data |
| Hooks não invalidavam cache ao mudar filtros | `useQuery` agora aceita `key` para forçar refresh |

---