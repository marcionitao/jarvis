// src/app/labels/index.tsx
// Lista de etiquetas. Acesso via header de Hoje e Projetos.

import { View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLabels } from '@/hooks';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { LabelRow } from '@/components/labels/LabelRow';
import type { LabelDTO } from '@/repositories/labels.repo';

export default function LabelsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data: labels, loading, error, refresh } = useLabels();

  const handlePress = (label: LabelDTO) => {
    router.push(`/label/${label.id}` as never);
  };

  const renderItem = ({ item }: { item: LabelDTO }) => (
    <LabelRow
      label={item}
      taskCount={0}
      onPress={() => handlePress(item)}
    />
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center p-10 gap-4">
      <Icon name="pricetag-outline" size={64} color={colors.mutedForeground} />
      <Text variant="h3" className="text-center">{t('label.empty.title')}</Text>
      <Text variant="body" className="text-center text-muted-foreground">
        {t('label.empty.subtitle')}
      </Text>
      <Button
        title={t('label.empty.createFirst')}
        onPress={() => router.push('/labels/new' as never)}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1">
        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <Text variant="h1">{t('label.title')}</Text>
          <Pressable
            onPress={() => router.push('/labels/new' as never)}
            className="p-2 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={t('label.new.title')}
          >
            <Icon name="add-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>
        {loading && (labels?.length ?? 0) === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-5 gap-3">
            <Text variant="body" className="text-destructive">{error.message}</Text>
            <Button title="Tentar novamente" variant="outline" onPress={() => void refresh()} />
          </View>
        ) : (
          <FlatList
            data={labels ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerClassName={(labels?.length ?? 0) === 0 ? 'flex-1' : 'pb-32'}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>
    </SafeAreaView>
  );
}