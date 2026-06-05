// src/components/tasks/TaskRow.tsx
// Linha de tarefa: checkbox bouncy + título + chip de prioridade + badge de data.

import { View, Pressable } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { useToggleComplete } from '@/hooks/use-task-mutations';
import type { TaskDTO } from '@/repositories/tasks.repo';
import { getPriorityColor, getPriorityLabel, type Priority } from '@/lib/format/priority';
import { formatSmartDate } from '@/lib/format/date';
import { dateColors } from '@/styles/theme';
import { cn } from '@/lib/cn';

function todayEpoch(): number {
  const d = new Date();
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
}

function dateColorFor(epochDay: number): string {
  const t = todayEpoch();
  if (epochDay === t) return dateColors.today;
  if (epochDay === t + 1) return dateColors.tomorrow;
  return dateColors.other;
}

export interface TaskRowProps {
  task: TaskDTO;
}

export function TaskRow({ task }: TaskRowProps) {
  const { colors } = useTheme();
  const { locale } = useI18n();
  const toggle = useToggleComplete();

  const isDone = task.status === 'done';
  const priority = task.priority as Priority;
  const hasPriority = priority >= 1 && priority <= 4;
  const dateColor = task.dueDate ? dateColorFor(task.dueDate) : null;
  const dateLabel = task.dueDate
    ? formatSmartDate(new Date(task.dueDate * 86400000), locale)
    : null;

  const handleToggle = () => {
    void toggle.mutate(task.id, !isDone);
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
      <View className="flex-1">
        <Pressable onPress={handleToggle}>
          <Text
            variant="body"
            numberOfLines={2}
            className={cn(isDone && 'line-through text-muted-foreground')}
          >
            {task.title}
          </Text>
          {(hasPriority || dateLabel) && (
            <View className="flex-row items-center gap-2 flex-wrap mt-1">
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
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
