// src/app/project/[id].tsx
// Tela de detalhe de projecto (Etapa 2.0 — Sub-etapa C).
// Header com nome, cor, ícone, contagem de tarefas.
// Lista de tarefas + toggle "Mostrar/Ocultar concluídas".
// Menu de ações: editar, arquivar/restaurar, eliminar.

import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View, Pressable, ActivityIndicator, FlatList, type ListRenderItem, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProject } from '@/hooks/use-projects';
import { useArchiveProject, useRestoreProject, useHardDeleteProject } from '@/hooks/use-projects';
import { useProjectTasks } from '@/hooks/use-tasks';
import { TaskRow } from '@/components/tasks/TaskRow';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { useUIPrefs } from '@/state/ui-prefs.context';
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { TaskWithProject } from '@/repositories/tasks.repo';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showCompleted, toggleShowCompleted } = useUIPrefs();
  const { data: project, loading: projectLoading, error: projectError } = useProject(id);
  const { data: tasks, loading: tasksLoading, refresh } = useProjectTasks(id);
  const archiveProject = useArchiveProject();
  const restoreProject = useRestoreProject();
  const hardDeleteProject = useHardDeleteProject();

  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const filteredTasks: TaskWithProject[] = (tasks ?? []).filter(
    (task: TaskWithProject) => showCompleted || task.status === 'todo'
  );
  const todoCount = (tasks ?? []).filter((t: TaskWithProject) => t.status === 'todo').length;
  const doneCount = (tasks ?? []).filter((t: TaskWithProject) => t.status === 'done').length;
  const isArchived = project?.archivedAt != null;

  const isLoading = projectLoading || tasksLoading;
  const isEmpty = !isLoading && !project;
  const hasTasks = !isLoading && filteredTasks.length === 0 && (tasks?.length ?? 0) > 0;

  const renderItem: ListRenderItem<TaskWithProject> = ({ item }) => {
    const project = item.projectName
      ? { name: item.projectName, color: item.projectColor!, icon: item.projectIcon! }
      : null;
    return <TaskRow task={item} project={project} />;
  };

  const handleArchiveOrRestore = async () => {
    setMenuVisible(false);
    if (!id) return;
    if (isArchived) {
      await restoreProject.mutate(id);
    } else {
      await archiveProject.mutate(id);
    }
    router.back();
  };

  const handleDelete = async () => {
    setDeleteDialogVisible(false);
    setMenuVisible(false);
    if (!id) return;
    await hardDeleteProject.mutate(id);
    router.replace('/(tabs)/projects');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1">
        {/* Header com botão de voltar e título */}
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
                <Icon name={project.icon as ComponentProps<typeof Ionicons>['name']} size={18} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text variant="h1" numberOfLines={1} ellipsizeMode="tail">
                  {project.name}
                </Text>
                <Text variant="caption" className="text-muted-foreground">
                  {t('project.detail.taskCount', { count: todoCount })}
                </Text>
              </View>
              <Pressable
                onPress={toggleShowCompleted}
                className="p-2 active:opacity-60"
                accessibilityRole="button"
                accessibilityLabel={showCompleted ? t('today.hideCompleted') : t('today.showCompleted')}
              >
                <Icon
                  name={showCompleted ? 'eye' : 'eye-off'}
                  size={22}
                  color={colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => setMenuVisible(true)}
                className="p-2 active:opacity-60"
                accessibilityRole="button"
                accessibilityLabel="Menu"
              >
                <Icon name="ellipsis-horizontal" size={22} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() => router.push(`/quick-add?project=${id}` as never)}
                className="p-2 active:opacity-60"
                accessibilityRole="button"
                accessibilityLabel={t('project.detail.addTask')}
              >
                <Icon name="add-outline" size={22} color={colors.primary} />
              </Pressable>
            </>
          ) : (
            <Text variant="h1">{t('common.error')}</Text>
          )}
        </View>

        {/* Corpo da screen */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : projectError ? (
          <View className="flex-1 items-center justify-center p-5 gap-3">
            <Text variant="body" className="text-destructive">
              {projectError.message}
            </Text>
            <Button title="Tentar novamente" variant="outline" onPress={() => void refresh()} />
          </View>
        ) : isEmpty ? (
          <View className="flex-1 items-center justify-center p-5 gap-4">
            <Icon name="alert-circle-outline" size={64} color={colors.mutedForeground} />
            <Text variant="h3">{t('common.notFound')}</Text>
          </View>
        ) : hasTasks ? (
          <View className="flex-1 items-center justify-center p-5 gap-4">
            <Icon name="checkmark-done-outline" size={64} color={colors.mutedForeground} />
            <Text variant="h3">{t('project.detail.allDone')}</Text>
            <Text variant="caption" className="text-muted-foreground text-center">
              {t('project.detail.toggleToShow', { count: doneCount })}
            </Text>
            <Button
              title={t('today.showCompleted')}
              variant="outline"
              onPress={toggleShowCompleted}
            />
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerClassName="px-5 pb-32"
            ItemSeparatorComponent={() => <View className="h-px bg-border mx-1" />}
          />
        )}
      </View>

      {/* Menu de ações */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setMenuVisible(false)}
        >
          <View className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-2 pb-6">
            {/* Editar */}
            <Pressable
              onPress={() => { setMenuVisible(false); router.push(`/project/edit/${id}` as never); }}
              className="flex-row items-center gap-4 p-4 rounded-xl active:bg-muted"
            >
              <Icon name="create-outline" size={22} color={colors.foreground} />
              <Text variant="body">{t('project.menu.edit')}</Text>
            </Pressable>
            {/* Divider */}
            <View className="h-px bg-border mx-4" />
            {/* Arquivar / Restaurar */}
            <Pressable
              onPress={handleArchiveOrRestore}
              className="flex-row items-center gap-4 p-4 rounded-xl active:bg-muted"
            >
              <Icon
                name={isArchived ? 'arrow-up-circle-outline' : 'archive-outline'}
                size={22}
                color={colors.foreground}
              />
              <Text variant="body">
                {isArchived ? t('project.menu.restore') : t('project.menu.archive')}
              </Text>
            </Pressable>
            {/* Divider */}
            <View className="h-px bg-border mx-4" />
            {/* Eliminar */}
            <Pressable
              onPress={() => { setMenuVisible(false); setDeleteDialogVisible(true); }}
              className="flex-row items-center gap-4 p-4 rounded-xl active:bg-muted"
            >
              <Icon name="trash-outline" size={22} color={colors.destructive} />
              <Text variant="body" className="text-destructive">
                {t('project.menu.delete')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Dialog de confirmação de eliminação */}
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
            <Text variant="h3" className="mb-2">{t('project.delete.confirmTitle')}</Text>
            <Text variant="body" className="text-muted-foreground mb-6">
              {t('project.delete.confirmMessage')}
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title={t('project.delete.cancel')}
                  variant="outline"
                  onPress={() => setDeleteDialogVisible(false)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={t('project.delete.confirm')}
                  variant="destructive"
                  loading={hardDeleteProject.loading}
                  onPress={handleDelete}
                />
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}