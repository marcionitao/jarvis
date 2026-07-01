// src/app/label/[id].tsx
// Detalhe de uma etiqueta: header com info + lista de tarefas + ações.

import { useState } from 'react';
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
import type { TaskWithProject } from '@/repositories/tasks.repo';

export default function LabelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [showCompleted, setShowCompleted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: label, loading: labelLoading, error: labelError } = useLabel(id ?? null);
  const { data: allTasks, loading: tasksLoading } = useTasksForLabel(id ?? null, true);

  const deleteLabel = useDeleteLabel();

  const todoCount = (allTasks ?? []).filter(t => t.status === 'todo').length;
  const doneCount = (allTasks ?? []).filter(t => t.status === 'done').length;
  const hasTasks = (allTasks ?? []).length > 0;

  const filteredTasks = (allTasks ?? []).filter(task => showCompleted || task.status === 'todo');
  const showAllDone = hasTasks && filteredTasks.length === 0;

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteLabel.mutate(id);
      router.back();
    } catch (err) {
      console.error('Failed to delete label:', err);
    }
  };

  const renderTask = ({ item }: { item: TaskWithProject }) => {
    const project = item.projectName
      ? { name: item.projectName, color: item.projectColor!, icon: item.projectIcon! }
      : null;
    return <TaskRow task={item} project={project} />;
  };

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

  if (labelLoading && !label) {
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
        {tasksLoading ? (
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