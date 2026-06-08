// src/app/quick-add.tsx
// Modal Quick Add — captura rápida de tarefa (<5s).
// Suporta syntax inline: !p1 #projeto @etiqueta hoje/amanhã
// + Visual pickers: Priority (P1-P4), Date (Hoje/Amanha/Custom), Labels.
// Pickers são overrides visuais — não injetam texto no input.

import { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { addDays, format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { useQuickAdd } from '@/hooks/use-quick-add';
import { useLabels, useCreateLabel } from '@/hooks/use-labels';
import { parseQuickAdd } from '@/services/quick-capture.service';
import { cn } from '@/lib/cn';
import { priorityColors } from '@/styles/theme';
import { toDateKey, fromDateKey } from '@/repositories/tasks.repo';

type Priority = 0 | 1 | 2 | 3 | 4;
type DatePick = 'none' | 'today' | 'tomorrow' | 'custom';

function pickerDueDate(pick: DatePick, custom: Date | null): number | null {
  if (pick === 'today') return toDateKey(new Date());
  if (pick === 'tomorrow') return toDateKey(addDays(new Date(), 1));
  if (pick === 'custom' && custom) return toDateKey(custom);
  return null;
}

function formatPickerDate(pick: DatePick, custom: Date | null): string | null {
  if (pick === 'today') return 'hoje';
  if (pick === 'tomorrow') return 'amanha';
  if (pick === 'custom' && custom) return format(custom, 'dd/MM/yyyy');
  return null;
}

function buildSubmitText(
  text: string,
  priority: Priority,
  datePick: DatePick,
  customDate: Date | null,
  labels: string[]
): string {
  let t = text;

  if (priority > 0) {
    t = t.replace(/!p[1-4]\b/gi, '').replace(/\s+/g, ' ').trim();
    t = `!p${priority} ${t}`;
  }

  const pickerDateStr = formatPickerDate(datePick, customDate);
  if (pickerDateStr) {
    t = t
      .replace(/\b(hoje|amanha|today|tomorrow)\b/gi, '')
      .replace(/\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    t = `${pickerDateStr} ${t}`;
  }

  if (labels.length > 0) {
    t = t
      .replace(new RegExp(`@(${labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi'), '')
      .replace(/\s+/g, ' ')
      .trim();
    t = `${labels.map((l) => `@${l}`).join(' ')} ${t}`;
  }

  return t.replace(/\s+/g, ' ').trim();
}

export default function QuickAdd() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const quickAdd = useQuickAdd();
  const createLabel = useCreateLabel();

  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>(0);
  const [datePick, setDatePick] = useState<DatePick>('none');
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');
  const [showNewLabelInput, setShowNewLabelInput] = useState(false);

  const { data: labels } = useLabels();

  const parsedFromText = useMemo(() => parseQuickAdd(text), [text]);

  const submitText = useMemo(
    () => buildSubmitText(text, priority, datePick, customDate, selectedLabels),
    [text, priority, datePick, customDate, selectedLabels]
  );

  const effectivePriority: Priority = priority > 0 ? priority : parsedFromText.priority;
  const effectiveDueDate = datePick !== 'none' && datePick !== 'custom'
    ? pickerDueDate(datePick, customDate)
    : datePick === 'custom'
      ? pickerDueDate(datePick, customDate)
      : parsedFromText.dueDate;
  const effectiveDueTime = parsedFromText.dueTime;
  const effectiveLabel = selectedLabels.length > 0 ? selectedLabels[0] : parsedFromText.labelName;

  const preview = parsedFromText;
  const canSubmit = parsedFromText.title.length > 0 && !quickAdd.loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const result = await quickAdd.mutate(submitText);
    if (result) router.back();
  };

  const toggleLabel = (name: string) => {
    setSelectedLabels((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  };

  const handleCreateLabel = async () => {
    if (!newLabelText.trim()) return;
    const created = await createLabel.mutateAsync({
      name: newLabelText.trim(),
      color: priorityColors.p2,
    });
    setSelectedLabels((prev) => [...prev, created.name]);
    setNewLabelText('');
    setShowNewLabelInput(false);
  };

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 0, label: t('task.priority.none'), color: colors.mutedForeground },
    { value: 1, label: 'P1', color: priorityColors.p1 },
    { value: 2, label: 'P2', color: priorityColors.p2 },
    { value: 3, label: 'P3', color: priorityColors.p3 },
    { value: 4, label: 'P4', color: priorityColors.p4 },
  ];

  const dateOptions: { value: DatePick; label: string }[] = [
    { value: 'none', label: t('task.date.none') },
    { value: 'today', label: t('task.date.today') },
    { value: 'tomorrow', label: t('task.date.tomorrow') },
    { value: 'custom', label: t('task.date.pick') },
  ];

  const calendarTheme = useMemo(() => ({
    backgroundColor: colors.background,
    calendarBackground: colors.background,
    textSectionTitleColor: colors.mutedForeground,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: '#ffffff',
    todayTextColor: colors.primary,
    dayTextColor: colors.foreground,
    textDisabledColor: colors.mutedForeground,
    dotColor: colors.primary,
    selectedDotColor: '#ffffff',
    arrowColor: colors.primary,
    monthTextColor: colors.foreground,
    textDayFontWeight: '400' as const,
    textMonthFontWeight: '600' as const,
    textDayHeaderFontWeight: '500' as const,
  }), [colors]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 p-5 gap-4">

          <View className="flex-row items-center justify-between">
            <Text variant="h2">{t('task.create')}</Text>
            <Pressable onPress={() => router.back()} className="p-2 active:opacity-60" accessibilityRole="button" accessibilityLabel={t('common.close')}>
              <Icon name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            placeholder={t('task.quickAdd.placeholder')}
            placeholderTextColor={colors.mutedForeground}
            multiline
            className={cn('min-h-[80px] p-3 rounded-lg border bg-input text-foreground text-base', 'border-inputBorder')}
            style={{ textAlignVertical: 'top' }}
          />

          {text.length > 0 && <Text variant="caption">{t('task.quickAdd.hint')}</Text>}

          {/* Priority picker */}
          <View className="gap-2">
            <Text variant="caption" className="text-muted-foreground">{t('task.priority.label') || 'Prioridade'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {priorityOptions.map((opt) => {
                const selected = priority === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPriority(opt.value)}
                    className={cn(
                      'px-4 py-2 rounded-full border',
                      selected ? 'border-transparent' : 'border-border bg-transparent'
                    )}
                    style={selected ? { backgroundColor: opt.color + '22' } : undefined}
                  >
                    <Text
                      variant="caption"
                      className="font-semibold"
                      style={{ color: selected ? opt.color : colors.mutedForeground }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Date picker */}
          <View className="gap-2">
            <Text variant="caption" className="text-muted-foreground">{t('task.date.label') || 'Data'}</Text>
            <View className="flex-row gap-2">
              {dateOptions.map((opt) => {
                const selected = datePick === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={opt.value === 'custom' ? () => setShowDateModal(true) : () => setDatePick(opt.value)}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg border items-center',
                      selected ? 'border-primary bg-primary/10' : 'border-border bg-transparent'
                    )}
                  >
                    <Text
                      variant="caption"
                      className={cn('font-medium', selected ? 'text-primary' : 'text-foreground')}
                    >
                      {opt.label}
                    </Text>
                    {opt.value === 'custom' && customDate && (
                      <Text variant="caption" className="text-muted-foreground" style={{ fontSize: 10 }}>
                        {format(customDate, 'dd/MM')}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Label picker */}
          <View className="gap-2">
            <Text variant="caption" className="text-muted-foreground">{t('task.labels') || 'Etiquetas'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {showNewLabelInput ? (
                <View className="flex-row items-center gap-2 bg-muted px-3 py-2 rounded-full">
                  <RNTextInput
                    value={newLabelText}
                    onChangeText={setNewLabelText}
                    placeholder="nome"
                    placeholderTextColor={colors.mutedForeground}
                    className="text-foreground text-sm min-w-[60px] max-w-[100px]"
                    autoFocus
                    onSubmitEditing={handleCreateLabel}
                    returnKeyType="done"
                  />
                  <Pressable onPress={handleCreateLabel} className="p-1">
                    <Icon name="checkmark" size={16} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => { setShowNewLabelInput(false); setNewLabelText(''); }} className="p-1">
                    <Icon name="close" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowNewLabelInput(true)}
                  className="px-3 py-2 rounded-full border border-dashed border-border items-center justify-center"
                  style={{ minWidth: 48 }}
                >
                  <Icon name="add" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
              {labels?.map((label) => {
                const selected = selectedLabels.includes(label.name);
                return (
                  <Pressable
                    key={label.id}
                    onPress={() => toggleLabel(label.name)}
                    className={cn(
                      'px-3 py-2 rounded-full border',
                      selected ? 'border-transparent' : 'border-border bg-transparent'
                    )}
                    style={selected ? { backgroundColor: label.color + '33' } : undefined}
                  >
                    <Text
                      variant="caption"
                      className="font-medium"
                      style={{ color: selected ? label.color : colors.foreground }}
                    >
                      @{label.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Preview — shows what will be submitted */}
          {preview.title.length > 0 && (
            <View className="p-3 rounded-lg bg-muted">
              <Text variant="caption" className="text-muted-foreground mb-1">Preview</Text>
              <View className="flex-row flex-wrap gap-2 items-center">
                {(effectivePriority > 0 || preview.priority > 0) && (
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: priorityColors[`p${effectivePriority > 0 ? effectivePriority : preview.priority}`] + '22' }}
                  >
                    <Text
                      variant="caption"
                      style={{ color: priorityColors[`p${effectivePriority > 0 ? effectivePriority : preview.priority}`] }}
                    >
                      {effectivePriority > 0 ? `!p${effectivePriority}` : (preview.priority > 0 ? `!p${preview.priority}` : null)}
                    </Text>
                  </View>
                )}
                {(effectiveDueDate || preview.dueDate) && (
                  <View className="flex-row items-center gap-1">
                    <Icon name="calendar-outline" size={12} color={colors.mutedForeground} />
                    <Text variant="caption" className="text-muted-foreground">
                      {effectiveDueDate && fromDateKey(effectiveDueDate)
                        ? format(fromDateKey(effectiveDueDate), 'dd/MM/yyyy')
                        : preview.dueDate
                          ? format(fromDateKey(preview.dueDate), 'dd/MM/yyyy')
                          : null}
                      {effectiveDueTime !== null && (
                        <> {format(new Date(2000, 0, 1, Math.floor(effectiveDueTime / 60), effectiveDueTime % 60), 'HH:mm')}</>
                      )}
                    </Text>
                  </View>
                )}
                {(effectiveLabel || preview.labelName) && (
                  <Text variant="caption" className="text-muted-foreground">
                    @{(effectiveLabel || preview.labelName)}
                  </Text>
                )}
                <Text variant="body" className="w-full font-medium">{preview.title}</Text>
              </View>
            </View>
          )}

          {quickAdd.error && (
            <Text variant="caption" className="text-destructive">{quickAdd.error.message}</Text>
          )}

          <View className="flex-1" />

          <Button
            title={t('common.add')}
            variant="primary"
            size="lg"
            loading={quickAdd.loading}
            disabled={!canSubmit}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Date picker modal */}
      <Modal visible={showDateModal} animationType="fade" transparent>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowDateModal(false)}>
          <Pressable className="m-4 rounded-xl overflow-hidden" style={{ backgroundColor: colors.card }} onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text variant="h3">{t('task.date.pick') || 'Escolher data'}</Text>
              <Pressable onPress={() => setShowDateModal(false)}>
                <Icon name="close" size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <Calendar
              onDayPress={(day) => {
                const d = new Date(day.year, day.month - 1, day.day);
                setCustomDate(d);
                setDatePick('custom');
                setShowDateModal(false);
              }}
              markedDates={customDate ? { [format(customDate, 'yyyy-MM-dd')]: { selected: true, selectedColor: colors.primary } } : {}}
              theme={calendarTheme}
              minDate={format(new Date(), 'yyyy-MM-dd')}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}