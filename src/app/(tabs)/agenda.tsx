// src/app/(tabs)/agenda.tsx
// Tela de calendário mensal para visualizar tarefas por data.

import { Icon } from '@/components/ui/icon';
import { Text as RNText } from '@/components/ui/text';
import { useTasksForDate } from '@/hooks/use-tasks-for-date';
import { useTasksForMonth } from '@/hooks/use-tasks-for-month';
import { useI18n } from '@/state/i18n.context';
import { useTheme } from '@/state/theme.store';
import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AgendaScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const { data: tasksForDate, isLoading: isLoadingTasks, error } = useTasksForDate(
    selectedDate ?? new Date()
  );

  // Fetch tasks for the visible month to mark days with dots
  const monthYear = visibleMonth.getFullYear();
  const monthMonth = visibleMonth.getMonth() + 1; // 1-indexed
  const { data: tasksForMonth } = useTasksForMonth(monthYear, monthMonth);

  // Build markedDates from tasks for the month
  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: true; dotColor?: string }> = {};
    if (tasksForMonth) {
      for (const task of tasksForMonth) {
        if (task.dueDate) {
          const d = String(task.dueDate);
          // Convert YYYYMMDD to YYYY-MM-DD for react-native-calendars
          const key = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
          marks[key] = { marked: true, dotColor: colors.primary };
        }
      }
    }
    return marks;
  }, [tasksForMonth, colors.primary]);

  const handleDayPress = (day: { day: number; month: number; year: number }) => {
    const date = new Date(day.year, day.month - 1, day.day);
    setSelectedDate(date);
  };

  const onMonthChange = (month: number) => {
    // month is 0-indexed (Jan=0, Dec=11)
    setVisibleMonth(new Date(visibleMonth.getFullYear(), month, 1));
  };

  const renderMarkedDot = () => (
    <View style={{
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      position: 'absolute',
      bottom: 4,
      left: '50%',
      transform: [{ translateX: -4 }],
    }} />
  );

  const renderDay = (date: string) => {
    const dayNumber = date.split('-')[2];
    return (
      <View style={{ position: 'relative' }}>
        <RNText variant="body" className="text-center">{dayNumber}</RNText>
        {markedDates[date] && renderMarkedDot()}
      </View>
    );
  };

  if (isLoading || isLoadingTasks) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View className="flex-1 items-center justify-center p-5">
          <RNText variant="caption" className="text-destructive">
            {t('common.error')}
          </RNText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1 p-4">
        {/* Calendar Header with navigation */}
        <View className="flex-row items-center justify-between pb-4">
          <Pressable
            onPress={() => {
              const prevMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
              setVisibleMonth(prevMonth);
            }}
            className="p-2"
          >
            <Icon name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>

          <RNText variant="h2" className="flex-1 text-center">
            {t(`date.${visibleMonth.toLocaleString('default', { month: 'long' }) as keyof typeof t}`)} {visibleMonth.getFullYear()}
          </RNText>

          <Pressable
            onPress={() => {
              const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
              setVisibleMonth(nextMonth);
            }}
            className="p-2"
          >
            <Icon name="chevron-forward" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Calendar */}
        <Calendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onMonthChange={(dateData) => {
            // dateData is { year: number, month: number } (month is 1-indexed)
            setVisibleMonth(new Date(dateData.year, dateData.month - 1, 1));
          }}
          hideArrows={false}
          hideExtraDays={false}
          enableSwipeMonths={true}
        />

        {/* Selected Date Tasks Modal/Panel */}
        {selectedDate && (
          <Modal
            visible={true}
            animationType="fade"
            presentationStyle="formSheet"
          >
            <View className="flex-1 items-center justify-center p-4">
              <View className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <RNText variant="h2">
                    {selectedDate.getDate()} de {t(`date.${selectedDate.toLocaleString('default', { month: 'long' }) as keyof typeof t}`)} {selectedDate.getFullYear()}
                  </RNText>
                  <Pressable onPress={() => setSelectedDate(null)}>
                    <Icon name="close" size={24} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                {tasksForDate === null ? (
                  <RNText variant="body" className="text-muted-foreground">
                    {t('common.loading')}
                  </RNText>
                ) : tasksForDate.length === 0 ? (
                  <RNText variant="body" className="text-muted-foreground">
                    {t('agenda.noTasksForDate')}
                  </RNText>
                ) : (
                  <View className="space-y-3">
                    {tasksForDate.map((task: typeof tasksForDate[0]) => (
                      <View key={task.id} className="p-3 bg-gray-50 rounded-lg">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <RNText variant="body" className="font-medium">{task.title}</RNText>
                            <View className="flex-row items-center gap-2 mt-1">
                              {task.priority > 0 && (
                                <View className="h-2 w-2 bg-primary-500 rounded-full" />
                              )}
                              {task.projectName && (
                                <RNText variant="caption" className="text-muted-foreground">
                                  #{task.projectName}
                                </RNText>
                              )}
                            </View>
                          </View>
                          {task.dueTime !== null && (
                            <View className="text-right">
                              <RNText variant="caption" className="text-muted-foreground">
                                {(() => {
                                  const h = Math.floor(task.dueTime! / 60);
                                  const m = task.dueTime! % 60;
                                  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                })()}
                              </RNText>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
}
