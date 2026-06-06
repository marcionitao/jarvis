// src/app/(tabs)/projects.tsx
// Lista de projectos. Hook useProjects(includeArchived=true).

import { View, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProjects } from '@/hooks/use-projects';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import type { ProjectDTO } from '@/repositories/projects.repo';

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data, loading, error, refresh } = useProjects(true);
  const projects: ProjectDTO[] = data ?? [];
  const isEmpty = !loading && projects.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1">
        <View className="px-5 pt-2 pb-3">
          <Text variant="h1">{t('tab.projects')}</Text>
        </View>
        {loading && projects.length === 0 ? (
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
            <Icon name="folder-outline" size={64} color={colors.mutedForeground} />
            <Text variant="h3">{t('common.empty')}</Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="px-5 py-3 flex-row items-center gap-3 border-b border-border">
                <Icon name="folder-outline" size={20} color={colors.mutedForeground} />
                <Text variant="body" className="flex-1">{item.name}</Text>
              </View>
            )}
            contentContainerClassName="pb-32"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
