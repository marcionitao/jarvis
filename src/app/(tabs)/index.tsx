// src/app/(tabs)/index.tsx
// Ecrã "Hoje" (Etapa 1.6) — agora dentro do grupo (tabs).
// O botão "+" do header foi removido (FAB central na tab bar substitui).

import { View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTodayTasks } from '@/hooks/use-tasks';
import { TaskRow } from '@/components/tasks/TaskRow';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { useUIPrefs } from '@/state/ui-prefs.context';
import type { TaskDTO } from '@/repositories/tasks.repo';

export default function TodayScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { showCompleted, toggleShowCompleted } = useUIPrefs();
  const { data, loading, error, refresh } = useTodayTasks();

  const tasks: TaskDTO[] = data ?? [];
  const isEmpty = !loading && tasks.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1">
        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <Text variant="h1">{t('tab.today')}</Text>
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
        </View>

        {loading && tasks.length === 0 ? (
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
            <Icon name="checkmark-circle-outline" size={64} color={colors.mutedForeground} />
            <Text variant="h3">{t('common.empty')}</Text>
            <Text variant="caption" className="text-center">
              {t('task.quickAdd.hint')}
            </Text>
            <Button
              title={t('task.create')}
              variant="primary"
              onPress={() => router.push('/quick-add' as never)}
            />
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TaskRow task={item} />}
            contentContainerClassName="px-5 pb-32"
            ItemSeparatorComponent={() => <View className="h-px bg-border mx-1" />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
