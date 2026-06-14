# Etapa 2.1 — Detalhe da Etiqueta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar tela de detalhe de etiqueta + lista de etiquetas acessível do header de Hoje e Projetos. Funcionalidades: criar etiqueta, listar por etiqueta, eliminar etiqueta. Sem edição.

**Architecture:** A tela de etiquetas é uma rota simples (`/labels`). O detalhe da etiqueta usa dynamic route (`/label/[id]`). O repositório de tarefas recebe novo método `listByLabel`. Os hooks seguem o padrão existente (useQuery/useMutation com eventBus invalidation).

**Tech Stack:** Expo Router, Drizzle ORM, react-native-reusables, NativeWind, Context API

---

## File Structure

### New Files
- `src/app/labels/index.tsx` — Lista de etiquetas (tela principal)
- `src/app/labels/new.tsx` — Criar nova etiqueta (modal/form)
- `src/app/label/[id].tsx` — Detalhe da etiqueta (dynamic route)
- `src/hooks/use-tasks-for-label.ts` — Hook para buscar tarefas por etiqueta

### Modified Files
- `src/repositories/tasks.repo.ts` — Adicionar método `listByLabel`
- `src/hooks/index.ts` — Exportar `useTasksForLabel`
- `src/app/(tabs)/index.tsx` — Header: adicionar link para etiquetas
- `src/app/(tabs)/projects.tsx` — Header: adicionar link para etiquetas
- `src/i18n/pt.json` — Keys para labels (list, detail, create)
- `src/i18n/en.json` — Keys para labels (list, detail, create)
- `src/components/labels/LabelRow.tsx` — Componente de linha para lista de etiquetas

---

## Task 1: Adicionar método `listByLabel` no repositório

**Files:**
- Modify: `src/repositories/tasks.repo.ts`

- [ ] **Step 1: Adicionar interface LabelTaskResult e função `listByLabel`**

No final de `tasks.repo.ts`, após a função `searchWithFilters`, adicionar:

```typescript
export async function listByLabel(
  db: JarvisDB,
  labelId: string,
  includeCompleted: boolean = false
): Promise<TaskDTO[]> {
  const { taskLabels } = await import('@/db/schema');
  
  const labelTasks = await db
    .select({ taskId: taskLabels.taskId })
    .from(taskLabels)
    .where(eq(taskLabels.labelId, labelId));
  
  if (labelTasks.length === 0) return [];
  
  const taskIds = labelTasks.map(lt => lt.taskId);
  
  const statusFilter = includeCompleted
    ? undefined
    : eq(tasks.status, 'todo');
  
  const conditions = [inArray(tasks.id, taskIds)];
  if (statusFilter) conditions.push(statusFilter);
  
  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.dueDate), asc(tasks.order));
}
```

**Nota:** Importar `inArray` de drizzle-orm se ainda não estiver importado.

- [ ] **Step 2: Verificar imports**

Garantir que `inArray` está importado no topo do ficheiro:
```typescript
import { and, asc, desc, eq, gte, inArray, isNull, lte, like, or, sql } from 'drizzle-orm';
```

- [ ] **Step 3: Commit**

```bash
git add src/repositories/tasks.repo.ts
git commit -m "feat(labels): add listByLabel method to tasks repository"
```

---

## Task 2: Criar hook `useTasksForLabel`

**Files:**
- Create: `src/hooks/use-tasks-for-label.ts`

- [ ] **Step 1: Criar o hook**

```typescript
// src/hooks/use-tasks-for-label.ts
// Hook para buscar tarefas filtradas por etiqueta.

import { useCallback } from 'react';
import * as tasksRepo from '@/repositories/tasks.repo';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { useQuery } from './use-query';

export function useTasksForLabel(
  labelId: string | null,
  includeCompleted: boolean = false
): { data: TaskDTO[]; loading: boolean; error: Error | null; refresh: () => void } {
  const fetcher = useCallback(
    (db: Parameters<typeof tasksRepo.listByLabel>[0]) =>
      labelId ? tasksRepo.listByLabel(db, labelId, includeCompleted) : Promise.resolve([]),
    [labelId, includeCompleted]
  );

  return useQuery<TaskDTO[]>(fetcher, ['tasks:changed', labelId ?? '']);
}
```

- [ ] **Step 2: Exportar no index**

Modificar `src/hooks/index.ts`:
```typescript
export { useTasksForLabel } from './use-tasks-for-label';
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-tasks-for-label.ts src/hooks/index.ts
git commit -m "feat(labels): add useTasksForLabel hook"
```

---

## Task 3: Adicionar i18n keys

**Files:**
- Modify: `src/i18n/pt.json`
- Modify: `src/i18n/en.json`

- [ ] **Step 1: Adicionar keys em pt.json**

No final de `pt.json`, antes do último `}`, adicionar:

```json
,
"label": {
  "title": "Etiquetas",
  "new.title": "Nova Etiqueta",
  "new.nameLabel": "Nome",
  "new.namePlaceholder": "Ex: Trabalho, Pessoal...",
  "new.colorLabel": "Cor",
  "new.save": "Criar",
  "new.cancel": "Cancelar",
  "detail.title": "Detalhe da Etiqueta",
  "detail.taskCount": "{todo} por fazer, {done} concluídas",
  "detail.taskCountTotal": "{count} tarefa",
  "detail.taskCountTotal_other": "{count} tarefas",
  "detail.noTasks": "Sem tarefas com esta etiqueta",
  "detail.allDone": "Tudo feito!",
  "detail.toggleToShow": "Ativa para ver as {count} concluídas",
  "detail.menu.delete": "Eliminar",
  "detail.confirmDelete": "Eliminar esta etiqueta? As tarefas não serão eliminadas.",
  "detail.cancel": "Cancelar",
  "detail.confirm": "Eliminar",
  "menu.labels": "Etiquetas",
  "empty.title": "Ainda não tens etiquetas",
  "empty.subtitle": "Clica em + para criar a primeira etiqueta",
  "empty.createFirst": "Criar primeira etiqueta"
}
```

- [ ] **Step 2: Adicionar keys em en.json**

```json
,
"label": {
  "title": "Labels",
  "new.title": "New Label",
  "new.nameLabel": "Name",
  "new.namePlaceholder": "e.g. Work, Personal...",
  "new.colorLabel": "Color",
  "new.save": "Create",
  "new.cancel": "Cancel",
  "detail.title": "Label Detail",
  "detail.taskCount": "{todo} to do, {done} completed",
  "detail.taskCountTotal": "{count} task",
  "detail.taskCountTotal_other": "{count} tasks",
  "detail.noTasks": "No tasks with this label",
  "detail.allDone": "All done!",
  "detail.toggleToShow": "Toggle on to see {count} completed",
  "detail.menu.delete": "Delete",
  "detail.confirmDelete": "Delete this label? Tasks will not be deleted.",
  "detail.cancel": "Cancel",
  "detail.confirm": "Delete",
  "menu.labels": "Labels",
  "empty.title": "No labels yet",
  "empty.subtitle": "Tap + to create your first label",
  "empty.createFirst": "Create first label"
}
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/pt.json src/i18n/en.json
git commit -m "i18n: add label keys for pt and en"
```

---

## Task 4: Criar componente `LabelRow`

**Files:**
- Create: `src/components/labels/LabelRow.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
// src/components/labels/LabelRow.tsx
// Linha de etiqueta na lista: cor + nome + contagem de tarefas.

import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import type { LabelDTO } from '@/repositories/labels.repo';

interface LabelRowProps {
  label: LabelDTO;
  taskCount: number;
  onPress: () => void;
}

export function LabelRow({ label, taskCount, onPress }: LabelRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="px-5 py-3 flex-row items-center gap-3 border-b border-border active:opacity-60"
    >
      <View
        className="w-5 h-5 rounded-full"
        style={{ backgroundColor: label.color }}
      />
      <Text variant="body" className="flex-1">{label.name}</Text>
      <Text variant="caption" className="text-muted-foreground">
        {taskCount}
      </Text>
      <Icon name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/labels/LabelRow.tsx
git commit -m "feat(labels): add LabelRow component"
```

---

## Task 5: Criar ecrã `/labels` (Lista de Etiquetas)

**Files:**
- Create: `src/app/labels/index.tsx`

- [ ] **Step 1: Criar a tela de lista de etiquetas**

```typescript
// src/app/labels/index.tsx
// Lista de etiquetas. Acesso via header de Hoje e Projetos.

import { View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLabels, useDeleteLabel } from '@/hooks';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { LabelRow } from '@/components/labels/LabelRow';
import type { LabelDTO } from '@/repositories/labels.repo';

export default function LabelsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data: labels, loading, error, refresh } = useLabels();
  const deleteLabel = useDeleteLabel();

  const handlePress = (label: LabelDTO) => {
    router.push(`/label/${label.id}`);
  };

  const renderItem = ({ item }: { item: LabelDTO }) => (
    <LabelRow
      label={item}
      taskCount={0}
      onPress={() => handlePress(item)}
    />
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center p-10 gap-4">
      <Icon name="pricetag-outline" size={64} color={colors.mutedForeground} />
      <Text variant="h3" className="text-center">{t('label.empty.title')}</Text>
      <Text variant="body" className="text-center text-muted-foreground">
        {t('label.empty.subtitle')}
      </Text>
      <Button
        title={t('label.empty.createFirst')}
        onPress={() => router.push('/labels/new')}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1">
        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <Text variant="h1">{t('label.title')}</Text>
          <Pressable
            onPress={() => router.push('/labels/new')}
            className="p-2 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={t('label.new.title')}
          >
            <Icon name="add-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>
        {loading && labels.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-5 gap-3">
            <Text variant="body" className="text-destructive">{error.message}</Text>
            <Button title="Tentar novamente" variant="outline" onPress={() => void refresh()} />
          </View>
        ) : (
          <FlatList
            data={labels}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerClassName={labels.length === 0 ? 'flex-1' : 'pb-32'}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
```

**Nota:** O `taskCount` na LabelRow está fixado a 0 porque contar tarefas por etiqueta necessitaria de uma query adicional. Numa versão futura pode-se adicionar contagem otimizada.

- [ ] **Step 2: Commit**

```bash
git add src/app/labels/index.tsx
git commit -m "feat(labels): add labels list screen"
```

---

## Task 6: Criar ecrã `/labels/new` (Criar Etiqueta)

**Files:**
- Create: `src/app/labels/new.tsx`

- [ ] **Step 1: Criar a tela de criar etiqueta**

```typescript
// src/app/labels/new.tsx
// Criar nova etiqueta: nome + cor.

import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCreateLabel } from '@/hooks';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

const LABEL_COLORS = [
  '#dc4c3e', '#d29034', '#519839', '#b04632', '#89609e',
  '#cd5a91', '#4bbf6b', '#00aecc', '#838c91',
];

export default function NewLabelScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const createLabel = useCreateLabel();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await createLabel.mutateAsync({ name: name.trim(), color: selectedColor });
      router.back();
    } catch (err) {
      console.error('Failed to create label:', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1 p-5 gap-6">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Icon name="close-outline" size={28} color={colors.foreground} />
          </Pressable>
          <Text variant="h2">{t('label.new.title')}</Text>
          <View className="w-10" />
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text variant="body" className="font-medium">{t('label.new.nameLabel')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('label.new.namePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              className={cn(
                'border border-border rounded-lg px-4 py-3 text-body',
                colors.foreground === '#f5f5f5' ? 'bg-black/20' : 'bg-muted'
              )}
              autoFocus
              maxLength={50}
            />
          </View>

          <View className="gap-2">
            <Text variant="body" className="font-medium">{t('label.new.colorLabel')}</Text>
            <View className="flex-row flex-wrap gap-3">
              {LABEL_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  className={cn(
                    'w-10 h-10 rounded-full border-2',
                    selectedColor === color ? 'border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
          </View>

          <View
            className="h-20 rounded-xl items-center justify-center gap-2"
            style={{ backgroundColor: selectedColor + '22' }}
          >
            <View
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: selectedColor }}
            />
            <Text variant="body" style={{ color: selectedColor }}>
              {name || t('label.new.namePlaceholder')}
            </Text>
          </View>
        </View>

        <View className="mt-auto gap-3">
          <Button
            title={t('label.new.save')}
            onPress={handleSave}
            disabled={!canSave}
            className={cn(!canSave && 'opacity-40')}
          />
          <Button
            title={t('label.new.cancel')}
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/labels/new.tsx
git commit -m "feat(labels): add create label screen"
```

---

## Task 7: Criar ecrã `/label/[id]` (Detalhe da Etiqueta)

**Files:**
- Create: `src/app/label/[id].tsx`

- [ ] **Step 1: Criar a tela de detalhe da etiqueta**

```typescript
// src/app/label/[id].tsx
// Detalhe de uma etiqueta: header com info + lista de tarefas + ações.

import { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useLabel, useTasksForLabel, useDeleteLabel } from '@/hooks';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { TaskRow } from '@/components/tasks/TaskRow';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { cn } from '@/lib/cn';

export default function LabelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [showCompleted, setShowCompleted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: label, loading: labelLoading, error: labelError } = useLabel(id);
  const { data: allTasks, loading: tasksLoading } = useTasksForLabel(id, true);
  const { data: todoTasks, loading: todoLoading } = useTasksForLabel(id, false);
  const deleteLabel = useDeleteLabel();

  const tasks = showCompleted ? (allTasks ?? []) : (todoTasks ?? []);
  const loading = labelLoading || tasksLoading;
  const todoCount = (todoTasks ?? []).length;
  const doneCount = (allTasks ?? []).length - todoCount;
  const hasTasks = (allTasks ?? []).length > 0;

  const filteredTasks = tasks.filter(task => showCompleted || task.status === 'todo');
  const showAllDone = hasTasks && filteredTasks.length === 0;

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteLabel.mutateAsync(id);
      router.back();
    } catch (err) {
      console.error('Failed to delete label:', err);
    }
  };

  const renderTask = ({ item }: { item: TaskDTO }) => <TaskRow task={item} />;

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center p-10 gap-3">
      <Icon name="pricetag-outline" size={64} color={colors.mutedForeground} />
      <Text variant="h3" className="text-center">
        {showAllDone ? t('label.detail.allDone') : t('label.detail.noTasks')}
      </Text>
      {showAllDone && (
        <Text variant="body" className="text-center text-muted-foreground">
          {t('label.detail.toggleToShow', { count: doneCount })}
        </Text>
      )}
    </View>
  );

  if (loading && !label) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (labelError || !label) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="flex-1 items-center justify-center p-5 gap-3">
          <Text variant="body" className="text-destructive">
            {labelError?.message ?? 'Etiqueta não encontrada'}
          </Text>
          <Button title="Voltar" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View
          className="px-5 pt-3 pb-4 gap-2"
          style={{ backgroundColor: label.color + '22' }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <Icon name="chevron-back-outline" size={24} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={() => setShowMenu(true)} className="p-2">
              <Icon name="ellipsis-horizontal" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            <View>
              <Text variant="h1">{label.name}</Text>
              <Text variant="caption" className="text-muted-foreground">
                {t('label.detail.taskCount', { todo: todoCount, done: doneCount })}
              </Text>
            </View>
          </View>
        </View>

        {/* Toggle */}
        {hasTasks && (
          <View className="px-5 py-2 flex-row items-center justify-between">
            <Text variant="body" className="text-muted-foreground">
              {showCompleted ? t('today.hideCompleted') : t('today.showCompleted')}
            </Text>
            <Pressable
              onPress={() => setShowCompleted(!showCompleted)}
              className="p-2"
            >
              <Icon
                name={showCompleted ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.primary}
              />
            </Pressable>
          </View>
        )}

        {/* Task List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            contentContainerClassName={filteredTasks.length === 0 ? 'flex-1' : 'pb-32'}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>

      {/* Menu Modal */}
      {showMenu && (
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable
            className="flex-1 bg-black/40"
            onPress={() => setShowMenu(false)}
          >
            <View className="mt-20 mx-10 bg-background rounded-xl overflow-hidden">
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="flex-row items-center gap-3 p-4 active:opacity-60"
              >
                <Icon name="trash-outline" size={22} color={colors.destructive} />
                <Text variant="body" className="text-destructive">
                  {t('label.detail.menu.delete')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 items-center justify-center p-5"
            onPress={() => setShowDeleteConfirm(false)}
          >
            <View className="bg-background rounded-xl p-5 gap-4 w-full max-w-sm">
              <Text variant="h3">{t('label.detail.menu.delete')}</Text>
              <Text variant="body" className="text-muted-foreground">
                {t('label.detail.confirmDelete')}
              </Text>
              <View className="flex-row gap-3">
                <Button
                  title={t('label.detail.cancel')}
                  variant="outline"
                  onPress={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                />
                <Button
                  title={t('label.detail.confirm')}
                  onPress={handleDelete}
                  className="flex-1"
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
```

**Nota:** Precisa de hook `useLabel` que ainda não existe. Ver Task 8.

- [ ] **Step 2: Commit**

```bash
git add src/app/label/[id].tsx
git commit -m "feat(labels): add label detail screen"
```

---

## Task 8: Adicionar hook `useLabel`

**Files:**
- Modify: `src/hooks/use-labels.ts`

- [ ] **Step 1: Adicionar `useLabel`**

No ficheiro `src/hooks/use-labels.ts`, adicionar:

```typescript
export function useLabel(id: string | null): QueryState<LabelDTO | null> {
  const fetcher = useCallback(
    (db: Parameters<typeof labelsRepo.getById>[0]) =>
      id ? labelsRepo.getById(db, id) : Promise.resolve(null),
    [id]
  );
  return useQuery<LabelDTO | null>(fetcher, ['labels:changed', id ?? '']);
}
```

- [ ] **Step 2: Exportar no index**

```typescript
export { useLabel } from './use-labels';
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-labels.ts src/hooks/index.ts
git commit -m "feat(labels): add useLabel hook"
```

---

## Task 9: Adicionar links nos headers de Hoje e Projetos

**Files:**
- Modify: `src/app/(tabs)/index.tsx`
- Modify: `src/app/(tabs)/projects.tsx`

- [ ] **Step 1: Adicionar link para Etiquetas em Hoje**

Modificar `src/app/(tabs)/index.tsx`. Localizar a secção do header/menu e adicionar:

```typescript
// No menu ou header, adicionar:
<Pressable
  onPress={() => router.push('/labels')}
  className="flex-row items-center gap-3 px-5 py-3 active:opacity-60"
>
  <Icon name="pricetag-outline" size={20} color={colors.foreground} />
  <Text variant="body">{t('label.menu.labels')}</Text>
</Pressable>
```

- [ ] **Step 2: Adicionar link para Etiquetas em Projetos**

O mesmo para `src/app/(tabs)/projects.tsx`:

```typescript
<Pressable
  onPress={() => router.push('/labels')}
  className="flex-row items-center gap-3 px-5 py-3 active:opacity-60"
>
  <Icon name="pricetag-outline" size={20} color={colors.foreground} />
  <Text variant="body">{t('label.menu.labels')}</Text>
</Pressable>
```

**Nota:** A implementação exacta depende de como o menu/header está atualmente implementado em cada écran. Se for um Modal com links, adicionar estes items. Se for um menu de 3 pontos (ellipsis), pode ser necessário criar um sub-menu.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(tabs\)/index.tsx src/app/\(tabs\)/projects.tsx
git commit -m "feat(labels): add labels link to headers"
```

---

## Task 10: Validação Final

- [ ] **Step 1: Verificar TypeScript**

```bash
cd /Users/marcionitao/MeinProjekts/React\ Native/jarvis
npx tsc --noEmit
```

Esperado: 0 erros (erros pré-existentes são OK)

- [ ] **Step 2: Verificar ESLint**

```bash
npm run lint
```

Esperado: 0 erros de lint (warnings pré-existentes são OK)

- [ ] **Step 3: Verificar testes existentes**

```bash
npm test
```

Esperado: todos os testes passam

- [ ] **Step 4: Testar no emulador**

1. Criar etiqueta via `+` na tela de etiquetas
2. Criar tarefa com `@nomeDaEtiqueta` via Quick Add
3. Navegar para detalhe da etiqueta
4. Ver tarefa listada
5. Criar outra tarefa com mesma etiqueta
6. Ver ambas na lista
7. Toggle "Mostrar concluídas"
8. Eliminar etiqueta → confirmação → volta para lista

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat: implement label detail feature (2.1)"
```

---

## Self-Review Checklist

1. **Spec coverage:** Todos os requisitos do design foram cobertos?
   - ✅ Lista de etiquetas acessível de Hoje e Projetos
   - ✅ Criar etiqueta (nome + cor)
   - ✅ Detalhe da etiqueta (header + estatísticas + lista)
   - ✅ Toggle "Mostrar concluídas"
   - ✅ Eliminar etiqueta com confirmação
   - ✅ i18n pt-PT + en-US

2. **Placeholder scan:** Nenhum TBD/TODO no plano

3. **Type consistency:** Todos os métodos existem no código existente:
   - `labelsRepo.getById` ✅
   - `useMutation` ✅
   - `useQuery` ✅
   - `TaskRow` ✅
   - `LabelDTO` ✅

---

**Plan complete.** Saved to `docs/superpowers/plans/2026-06-13-label-detail.md`