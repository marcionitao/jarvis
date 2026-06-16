// src/app/(tabs)/search.tsx
// Tela de pesquisa com search bar + filtros + lista de resultados.

import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { TaskRow } from '@/components/tasks/TaskRow';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTasksSearch } from '@/hooks';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { useI18n } from '@/state/i18n.context';
import { useTheme } from '@/state/theme.store';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const {
    filters,
    data: tasks,
    isLoading,
    setFilter,
    clearFilters,
  } = useTasksSearch();

  const hasActiveFilters =
    filters.query ||
    filters.priority !== undefined ||
    filters.projectId !== undefined ||
    filters.labelId !== undefined ||
    filters.status !== 'all'

  const renderTask = ({ item }: { item: TaskDTO }) => <TaskRow task={item} />;

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center p-10">
      <Icon name="search-outline" size={64} color={colors.mutedForeground} />
      <Text variant="body" className="text-center text-muted-foreground mt-4">
        {tasks.length === 0 && hasActiveFilters
          ? t('search.noResults') ?? 'Nenhum resultado'
          : t('search.initialHint') ?? 'Digite para pesquisar ou use os filtros'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1 p-4 gap-4">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text variant="h2">{t('tab.search')}</Text>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={filters.query ?? ''}
          onChange={(value) => setFilter('query', value || null)}
        />

        {/* Filters */}
        <SearchFilters
          filters={{
            status: filters.status,
            priority: filters.priority ?? null,
            projectId: filters.projectId ?? null,
            labelId: filters.labelId ?? null,
          }}
          setFilter={setFilter}
          onClear={clearFilters}
        />

        {/* Results */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            contentContainerClassName={tasks.length === 0 ? 'flex-1' : 'pb-4'}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}