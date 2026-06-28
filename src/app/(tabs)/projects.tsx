// src/app/(tabs)/projects.tsx
// Lista de projectos. Hook useProjects(includeArchived=true).

import { View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProjects } from '@/hooks/use-projects';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
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
        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.push('/labels' as never)}
            className="p-2 -ml-2"
            accessibilityRole="button"
            accessibilityLabel={t('label.menu.labels')}
          >
            <Icon name="pricetag-outline" size={22} color={colors.mutedForeground} />
          </Pressable>
          <Text variant="h1">{t('tab.projects')}</Text>
          <Pressable
            onPress={() => router.push('/project/new' as never)}
            className="p-2 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={t('project.new.title')}
          >
            <Icon name="add-outline" size={24} color={colors.primary} />
          </Pressable>
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
            <Text variant="h3" className="text-center">{t('project.empty.title')}</Text>
            <Text variant="body" className="text-muted-foreground text-center">
              {t('project.empty.subtitle')}
            </Text>
            <Button
              title={t('project.empty.createFirst')}
              onPress={() => router.push('/project/new' as never)}
            />
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  item.type === 'shopping'
                    ? router.push(`/shopping-list/${item.id}`)
                    : router.push(`/project/${item.id}`)
                }
                className="px-5 py-3 flex-row items-center gap-3 border-b border-border active:opacity-60"
              >
                <View
                  className="w-6 h-6 rounded-sm items-center justify-center"
                  style={{ backgroundColor: item.color }}
                >
                  <Icon name={item.icon as ComponentProps<typeof Ionicons>['name']} size={14} color="#ffffff" />
                </View>
                <Text variant="body" className="flex-1">{item.name}</Text>
                <Icon name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
            contentContainerClassName="pb-32"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
