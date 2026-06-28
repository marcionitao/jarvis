// src/app/shopping-list/[id].tsx
// Shopping List screen — tarefas agrupadas por secção (label).
// Acesso: tab Projetos → tap em Shopping List → shopping-list/[id]

import { useState } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useProject } from '@/hooks/use-projects';
import { useToggleComplete, useDeleteTask, useCreateTask } from '@/hooks';
import { useSnackbar } from '@/state/snackbar.context';
import type { ShoppingSection } from '@/hooks/use-shopping-list';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { cn } from '@/lib/cn';

export default function ShoppingListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    data: sections,
    loading,
    error,
    refresh,
  } = useShoppingList(id ?? null);
  const {
    data: project,
    loading: projectLoading,
  } = useProject(id ?? null);
  const toggleComplete = useToggleComplete();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const snackbar = useSnackbar();

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskDTO | null>(null);

  const allTasks = sections?.flatMap((s) => s.tasks) ?? [];
  const totalCount = allTasks.length;
  const doneCount = allTasks.filter((t) => t.status === 'done').length;

  const handleToggle = (task: TaskDTO) => {
    void toggleComplete.mutate(task.id, task.status !== 'done');
  };

  const handleDeletePress = (task: TaskDTO) => {
    setTaskToDelete(task);
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleteDialogVisible(false);
    const deletedTask = taskToDelete;
    setTaskToDelete(null);
    await deleteTask.mutate(deletedTask.id);
    snackbar.show(t('shopping.itemDeleted', { title: deletedTask.title }), {
      label: t('common.undo'),
      onPress: async () => {
        await createTask.mutate({
          title: deletedTask.title,
          description: deletedTask.description,
          projectId: deletedTask.projectId,
          priority: deletedTask.priority,
          status: deletedTask.status,
          dueDate: deletedTask.dueDate,
          dueTime: deletedTask.dueTime,
        });
      },
    });
  };

  const handleClearDone = async () => {
    const doneTasks = allTasks.filter((t) => t.status === 'done');
    await Promise.all(doneTasks.map((t) => deleteTask.mutate(t.id)));
  };

  const renderItem: ListRenderItem<TaskDTO> = ({ item }) => {
    const isDone = item.status === 'done';
    return (
      <View
        className={cn(
          'flex-row items-center gap-3 py-3 px-2',
          isDone && 'opacity-50'
        )}
      >
        <BouncyCheckbox
          size={24}
          isChecked={isDone}
          disableText
          onPress={() => handleToggle(item)}
          fillColor={colors.primary}
          unFillColor="transparent"
          iconStyle={{ borderColor: colors.border, borderWidth: 2 }}
          innerIconStyle={{ borderWidth: 0 }}
        />
        <Pressable onPress={() => handleToggle(item)} className="flex-1">
          <Text
            variant="body"
            numberOfLines={2}
            className={cn(isDone && 'line-through text-muted-foreground')}
          >
            {item.title}
          </Text>
          {item.description && (
            <Text variant="caption" className="text-muted-foreground mt-0.5">
              {item.description}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => handleDeletePress(item)}
          className="p-2 active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel={t('common.delete')}
        >
          <Icon name="trash-outline" size={20} color={colors.destructive} />
        </Pressable>
      </View>
    );
  };

  const renderSectionHeader = (section: ShoppingSection) => {
    const labelName = section.label?.name ?? t('shopping.section.withoutSection');
    const labelColor = section.label?.color ?? colors.mutedForeground;

    return (
      <View className="flex-row items-center gap-2 px-2 pt-4 pb-2">
        <View
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: labelColor }}
        />
        <Text
          variant="caption"
          className="font-semibold uppercase tracking-wider"
          style={{ color: labelColor }}
        >
          {labelName}
        </Text>
      </View>
    );
  };

  const flatData = sections?.flatMap((section) => [
    { type: 'header' as const, section },
    ...section.tasks.map((task) => ({ type: 'item' as const, task })),
  ]) ?? [];

  const renderFlatItem: ListRenderItem<{ type: 'header' | 'item'; section?: ShoppingSection; task?: TaskDTO }> = ({
    item,
  }) => {
    if (item.type === 'header' && item.section) {
      return renderSectionHeader(item.section);
    }
    if (item.type === 'item' && item.task) {
      return renderItem({ item: item.task, index: 0, separators: null as never });
    }
    return null;
  };

  const keyExtractor = (item: { type: 'header' | 'item'; section?: ShoppingSection; task?: TaskDTO }, index: number) => {
    if (item.type === 'header') return `header-${item.section?.label?.id ?? 'no-label'}-${index}`;
    return item.task?.id ?? `item-${index}`;
  };

  const isEmpty = !loading && totalCount === 0;
  const isLoading = loading || projectLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1">
        <View className="px-5 pt-2 pb-3 flex-row items-center gap-4 border-b border-border">
          <Pressable
            onPress={() => router.back()}
            className="p-2 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Icon name="arrow-back-outline" size={24} color={colors.foreground} />
          </Pressable>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : project ? (
            <>
              <View
                className="w-8 h-8 rounded-md items-center justify-center"
                style={{ backgroundColor: project.color }}
              >
                <Icon name="cart-outline" size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text variant="h1" numberOfLines={1} ellipsizeMode="tail">
                  {project.name}
                </Text>
                <Text variant="caption" className="text-muted-foreground">
                  {t('shopping.itemCount', { count: totalCount })}
                  {doneCount > 0 ? ` · ${doneCount} ✓` : ''}
                </Text>
              </View>
              {doneCount > 0 && (
                <Pressable
                  onPress={handleClearDone}
                  className="p-2 active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel={t('shopping.clearDone')}
                >
                  <Icon name="checkmark-done-outline" size={22} color={colors.mutedForeground} />
                </Pressable>
              )}
              <Pressable
                onPress={() => router.push(`/quick-add?project=${id}` as never)}
                className="p-2 active:opacity-60"
                accessibilityRole="button"
                accessibilityLabel={t('common.add')}
              >
                <Icon name="add-outline" size={22} color={colors.primary} />
              </Pressable>
            </>
          ) : (
            <Text variant="h1">{t('common.error')}</Text>
          )}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-5 gap-3">
            <Text variant="body" className="text-destructive">{error.message}</Text>
            <Button title="Tentar novamente" variant="outline" onPress={() => void refresh()} />
          </View>
        ) : isEmpty ? (
          <View className="flex-1 items-center justify-center p-5 gap-4">
            <Icon name="cart-outline" size={64} color={colors.mutedForeground} />
            <Text variant="h3" className="text-center">{t('shopping.empty.title')}</Text>
            <Text variant="body" className="text-muted-foreground text-center">
              {t('shopping.empty.subtitle')}
            </Text>
            <Text variant="caption" className="text-muted-foreground text-center font-mono">
              {t('shopping.empty.hint')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={flatData}
            keyExtractor={keyExtractor}
            renderItem={renderFlatItem}
            contentContainerClassName="px-5 pb-32"
            ItemSeparatorComponent={() => <View className="h-px bg-border mx-1" />}
          />
        )}
      </View>

      <Modal
        visible={deleteDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteDialogVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-8"
          onPress={() => setDeleteDialogVisible(false)}
        >
          <View
            className="bg-card rounded-2xl p-6 w-full max-w-sm"
            onStartShouldSetResponder={() => true}
          >
            <Text variant="h3" className="mb-2">{t('shopping.delete.confirm')}</Text>
            {taskToDelete && (
              <Text variant="body" className="text-muted-foreground mb-6">
                {taskToDelete.title}
              </Text>
            )}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title={t('common.cancel')}
                  variant="outline"
                  onPress={() => setDeleteDialogVisible(false)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={t('common.delete')}
                  variant="destructive"
                  loading={deleteTask.loading}
                  onPress={handleConfirmDelete}
                />
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}