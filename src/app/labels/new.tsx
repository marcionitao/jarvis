// src/app/labels/new.tsx
// Criar nova etiqueta: nome + cor.

import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCreateLabel } from '@/hooks';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

const LABEL_COLORS = [
  '#dc4c3e', '#d29034', '#519839', '#b04632', '#89609e',
  '#cd5a91', '#4bbf6b', '#00aecc', '#838c91',
];

export default function NewLabelScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const createLabel = useCreateLabel();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await createLabel.mutate({ name: name.trim(), color: selectedColor });
      router.back();
    } catch (err) {
      console.error('Failed to create label:', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1 p-5 gap-6">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Icon name="close-outline" size={28} color={colors.foreground} />
          </Pressable>
          <Text variant="h2">{t('label.new.title')}</Text>
          <View className="w-10" />
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text variant="body" className="font-medium">{t('label.new.nameLabel')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('label.new.namePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              className={cn(
                'border border-border rounded-lg px-4 py-3 text-body',
                colors.foreground === '#f5f5f5' ? 'bg-black/20' : 'bg-muted'
              )}
              autoFocus
              maxLength={50}
            />
          </View>

          <View className="gap-2">
            <Text variant="body" className="font-medium">{t('label.new.colorLabel')}</Text>
            <View className="flex-row flex-wrap gap-3">
              {LABEL_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  className={cn(
                    'w-10 h-10 rounded-full border-2',
                    selectedColor === color ? 'border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
          </View>

          <View
            className="h-20 rounded-xl items-center justify-center gap-2"
            style={{ backgroundColor: selectedColor + '22' }}
          >
            <View
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: selectedColor }}
            />
            <Text variant="body" style={{ color: selectedColor }}>
              {name || t('label.new.namePlaceholder')}
            </Text>
          </View>
        </View>

        <View className="mt-auto gap-3">
          <Button
            title={t('label.new.save')}
            onPress={handleSave}
            disabled={!canSave}
            className={cn(!canSave && 'opacity-40')}
          />
          <Button
            title={t('label.new.cancel')}
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}