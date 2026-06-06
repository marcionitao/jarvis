// src/app/quick-add.tsx
// Modal Quick Add — captura rápida de tarefa (<5s).
// Suporta syntax inline: !p1 #projeto @etiqueta hoje/amanhã
// (Revertido para root-level no Etapa 1.7 — padrão oficial Expo Router.)

import { useState, useMemo } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { useQuickAdd } from '@/hooks/use-quick-add';
import { parseQuickAdd } from '@/services/quick-capture.service';
import { cn } from '@/lib/cn';

export default function QuickAdd() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const quickAdd = useQuickAdd();

  const preview = useMemo(() => parseQuickAdd(text), [text]);
  const canSubmit = preview.title.length > 0 && !quickAdd.loading;

  const onSubmit = async () => {
    if (!canSubmit) return;
    const result = await quickAdd.mutate(text);
    if (result) router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <Text variant="h2">{t('task.create')}</Text>
            <Pressable
              onPress={() => router.back()}
              className="p-2 active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
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
            className={cn(
              'min-h-[80px] p-3 rounded-lg border bg-input text-foreground text-base',
              'border-inputBorder'
            )}
            style={{ textAlignVertical: 'top' }}
          />

          {text.length > 0 && (
            <Text variant="caption">{t('task.quickAdd.hint')}</Text>
          )}

          {quickAdd.error && (
            <Text variant="caption" className="text-destructive">
              {quickAdd.error.message}
            </Text>
          )}

          <View className="flex-1" />

          <Button
            title={t('common.add')}
            variant="primary"
            size="lg"
            loading={quickAdd.loading}
            disabled={!canSubmit}
            onPress={onSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
