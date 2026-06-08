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

---