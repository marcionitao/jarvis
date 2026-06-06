// src/app/(tabs)/search.tsx
// Placeholder — pesquisa é fase 2 do roadmap.

import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';

export default function SearchScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1 items-center justify-center p-5 gap-4">
        <Text variant="h1">{t('tab.search')}</Text>
        <Icon name="search-outline" size={64} color={colors.mutedForeground} />
        <Text variant="body" className="text-center text-muted-foreground">Em breve</Text>
      </View>
    </SafeAreaView>
  );
}
