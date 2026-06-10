// src/components/search/SearchFilters.tsx
// Painel colapsável com filtros de pesquisa.

import { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { useProjects } from '@/hooks/use-projects';
import { useLabels } from '@/hooks/use-labels';
import { cn } from '@/lib/cn';

export interface SearchFiltersProps {
  filters: {
    status: 'todo' | 'done' | 'all';
    priority: number | null;
    projectId: string | null;
    labelId: string | null;
  };
  setFilter: <K extends keyof SearchFiltersProps['filters']>(key: K, value: SearchFiltersProps['filters'][K]) => void;
  onClear: () => void;
}

interface FilterOption {
  label: string;
  value: string | number | null;
  color?: string;
}

export function SearchFilters({ filters, setFilter, onClear }: SearchFiltersProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const { data: projects } = useProjects();
  const { data: labels } = useLabels();

  const hasActiveFilters =
    filters.priority !== null ||
    filters.projectId !== null ||
    filters.labelId !== null ||
    filters.status !== 'all';

  const statusOptions: FilterOption[] = [
    { label: t('search.status.all') ?? 'Todas', value: 'all' },
    { label: t('search.status.todo') ?? 'Por fazer', value: 'todo' },
    { label: t('search.status.done') ?? 'Concluídas', value: 'done' },
  ];

  const priorityOptions: FilterOption[] = [
    { label: t('search.priority.all') ?? 'Todos', value: null },
    { label: 'P1', value: 1 },
    { label: 'P2', value: 2 },
    { label: 'P3', value: 3 },
    { label: 'P4', value: 4 },
  ];

  const projectOptions: FilterOption[] = [
    { label: t('search.project.all') ?? 'Todos', value: null },
    ...(projects?.map((p) => ({ label: p.name, value: p.id, color: p.color })) ?? []),
  ];

  const labelOptions: FilterOption[] = [
    { label: t('search.label.all') ?? 'Todas', value: null },
    ...(labels?.map((l) => ({ label: `@${l.name}`, value: l.id, color: l.color })) ?? []),
  ];

  const renderChip = (option: FilterOption, isSelected: boolean) => (
    <Pressable
      key={String(option.value)}
      onPress={() => {
        const key = option.value === 'all' || option.value === 'todo' || option.value === 'done' ? 'status'
          : typeof option.value === 'number' ? 'priority'
          : option.value === null ? null
          : option.value === filters.projectId ? 'projectId'
          : 'labelId';
        if (key) setFilter(key as any, option.value);
      }}
      className={cn(
        'px-3 py-1.5 rounded-full border items-center',
        isSelected
          ? 'border-transparent'
          : 'border-border bg-transparent'
      )}
      style={isSelected && option.color ? { backgroundColor: option.color + '33' } : undefined}
    >
      <Text
        variant="caption"
        className={cn('font-medium', isSelected ? 'text-foreground' : 'text-muted-foreground')}
        style={isSelected && option.color ? { color: option.color } : undefined}
      >
        {option.label}
      </Text>
    </Pressable>
  );

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => setIsOpen(!isOpen)} className="flex-row items-center gap-2">
          <Icon name="filter" size={18} color={colors.mutedForeground} />
          <Text variant="caption" className="text-muted-foreground">
            {t('search.filters') ?? 'Filtros'}
          </Text>
        </Pressable>
        {hasActiveFilters && (
          <Pressable onPress={onClear} className="p-1">
            <Text variant="caption" className="text-primary">
              {t('search.clearFilters') ?? 'Limpar'}
            </Text>
          </Pressable>
        )}
      </View>

      {isOpen && (
        <View className="gap-3">
          {/* Status */}
          <View className="gap-2">
            <Text variant="caption" className="text-muted-foreground">Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {statusOptions.map((opt) => renderChip(opt, filters.status === opt.value))}
            </ScrollView>
          </View>

          {/* Priority */}
          <View className="gap-2">
            <Text variant="caption" className="text-muted-foreground">Prioridade</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {priorityOptions.map((opt) => renderChip(opt, filters.priority === opt.value))}
            </ScrollView>
          </View>

          {/* Project */}
          <View className="gap-2">
            <Text variant="caption" className="text-muted-foreground">Projeto</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {projectOptions.map((opt) => renderChip(opt, filters.projectId === opt.value))}
            </ScrollView>
          </View>

          {/* Label */}
          <View className="gap-2">
            <Text variant="caption" className="text-muted-foreground">Etiqueta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {labelOptions.map((opt) => renderChip(opt, filters.labelId === opt.value))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}