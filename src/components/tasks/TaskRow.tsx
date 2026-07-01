// src/components/tasks/TaskRow.tsx
// Linha de tarefa: checkbox bouncy + badge projeto + título + chip de prioridade + badge de data + etiquetas.

import { Alert, View, Pressable } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { useToggleComplete, useLabelsForTask } from '@/hooks';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { getPriorityColor, getPriorityLabel, type Priority } from '@/lib/format/priority';
import { formatSmartDate, formatRelative } from '@/lib/format/date';
import { fromDateKey, toDateKey } from '@/repositories/tasks.repo';
import { dateColors } from '@/styles/theme';
import { cn } from '@/lib/cn';

function todayKey(): number {
  return toDateKey(new Date());
}

function dateColorFor(dayKey: number): string {
  const t = todayKey();
  if (dayKey === t) return dateColors.today;
  if (dayKey === t + 1) return dateColors.tomorrow;
  return dateColors.other;
}

export interface TaskProjectInfo {
  name: string;
  color: string;
  icon: string;
}

export interface TaskRowProps {
  task: TaskDTO;
  project?: TaskProjectInfo | null;
}

export function TaskRow({ task, project }: TaskRowProps) {
  const { colors } = useTheme();
  const { locale, t } = useI18n();
  const toggle = useToggleComplete();
  const { data: labels } = useLabelsForTask(task.id);

  const isDone = task.status === 'done';
  const priority = task.priority as Priority;
  const hasPriority = priority >= 1 && priority <= 4;
  const dateColor = task.dueDate ? dateColorFor(task.dueDate) : null;
  const dateLabel = task.dueDate
    ? formatSmartDate(fromDateKey(task.dueDate), locale)
    : null;
  const timeLabel = task.dueTime !== null
    ? `${Math.floor(task.dueTime / 60).toString().padStart(2, '0')}:${(task.dueTime % 60).toString().padStart(2, '0')}`
    : null;

  const handleToggle = () => {
    void toggle.mutate(task.id, !isDone);
  };

  const handleProjectPress = () => {
    if (project) {
      Alert.alert(project.name, '', [{ text: 'OK' }]);
    }
  };

  return (
    <View className={cn('flex-row items-center gap-3 py-3 px-2', isDone && 'opacity-60')}>
      <BouncyCheckbox
        size={24}
        isChecked={isDone}
        disableText
        onPress={handleToggle}
        fillColor={colors.primary}
        unFillColor="transparent"
        iconStyle={{ borderColor: colors.border, borderWidth: 2 }}
        innerIconStyle={{ borderWidth: 0 }}
      />
      {project && (
        <Pressable onPress={handleProjectPress} className="active:opacity-70">
          <View
            className="w-5 h-5 rounded items-center justify-center"
            style={{ backgroundColor: project.color }}
          >
            <Icon name={project.icon as never} size={12} color="#ffffff" />
          </View>
        </Pressable>
      )}
      <View className="flex-1">
        <Pressable onPress={handleToggle}>
          <Text
            variant="body"
            numberOfLines={2}
            className={cn(isDone && 'line-through text-muted-foreground')}
          >
            {task.title}
          </Text>
          {(hasPriority || dateLabel || (isDone && task.completedAt) || (labels && labels.length > 0) || project) && (
            <View className="flex-row items-center gap-2 flex-wrap mt-1">
              {project && (
                <Pressable onPress={handleProjectPress} className="flex-row items-center gap-1 active:opacity-70">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <Text
                    variant="caption"
                    className="text-xs"
                    style={{ color: project.color }}
                    numberOfLines={1}
                  >
                    {project.name}
                  </Text>
                </Pressable>
              )}
              {isDone && task.completedAt && (
                <View className="flex-row items-center gap-1">
                  <Icon name="checkmark-circle" size={14} color={colors.mutedForeground} />
                  <Text variant="caption" style={{ color: colors.mutedForeground }}>
                    {t('task.completedAt', {
                      time: formatRelative(new Date(task.completedAt), locale),
                    })}
                  </Text>
                </View>
              )}
              {hasPriority && (
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: getPriorityColor(priority) + '22' }}
                >
                  <Text variant="caption" style={{ color: getPriorityColor(priority) }}>
                    {getPriorityLabel(priority, locale)}
                  </Text>
                </View>
              )}
              {dateLabel && dateColor && (
                <View className="flex-row items-center gap-1">
                  <Icon name="calendar-outline" size={14} color={dateColor} />
                  <Text variant="caption" style={{ color: dateColor }}>
                    {dateLabel}
                    {timeLabel && (
                      <>
                        {' '}
                        <Icon name="time-outline" size={14} color={dateColor} />
                        {' '}{timeLabel}
                      </>
                    )}
                  </Text>
                </View>
              )}
              {labels && labels.length > 0 && (
                <View className="flex-row items-center gap-1 flex-wrap">
                  <Icon name="pricetag-outline" size={14} color={colors.mutedForeground} />
                  {labels.slice(0, 3).map((label) => (
                    <View
                      key={label.id}
                      className="px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: label.color + '33' }}
                    >
                      <Text
                        variant="caption"
                        className="text-xs"
                        style={{ color: label.color }}
                      >
                        {label.name}
                      </Text>
                    </View>
                  ))}
                  {labels.length > 3 && (
                    <Text variant="caption" className="text-muted-foreground">
                      +{labels.length - 3}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}