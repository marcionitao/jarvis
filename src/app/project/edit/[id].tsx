// src/app/project/edit/[id].tsx
// Modal de edição de projecto (Etapa 2.0 — Sub-etapa C).
// Editar nome, cor e ícone do projecto.

import { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useProject, useUpdateProject } from '@/hooks/use-projects';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { projectColors } from '@/styles/theme';
import { cn } from '@/lib/cn';
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type ProjectColor = (typeof projectColors)[number];

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// Ícones disponíveis para seleccionar num projecto.
const PROJECT_ICONS: IoniconsName[] = [
  'folder-outline',
  'home-outline',
  'briefcase-outline',
  'book-outline',
  'heart-outline',
  'star-outline',
  'flag-outline',
  'pin-outline',
  'gift-outline',
  'game-controller-outline',
  'fitness-outline',
  'car-outline',
  'airplane-outline',
  'cart-outline',
  'restaurant-outline',
  'musical-notes-outline',
  'camera-outline',
  'construct-outline',
  'school-outline',
  'medkit-outline',
  'planet-outline',
  'flask-outline',
  'leaf-outline',
  'cash-outline',
];

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data: project } = useProject(id);
  const updateProject = useUpdateProject();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<ProjectColor>(projectColors[0]);
  const [selectedIcon, setSelectedIcon] = useState<IoniconsName>('folder-outline');

  // Pré-preencher com os dados actuais do projecto.
  useEffect(() => {
    if (project) {
      setName(project.name);
      setSelectedColor(project.color as ProjectColor);
      setSelectedIcon(project.icon as IoniconsName);
    }
  }, [project]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await updateProject.mutate(id!, { name: name.trim(), color: selectedColor, icon: selectedIcon });
    router.back();
  };

  const handleCancel = () => router.back();

  const isLoading = updateProject.loading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between border-b border-border">
        <Pressable onPress={handleCancel} className="p-2 active:opacity-60">
          <Icon name="close-outline" size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="h3">{t('project.edit.title')}</Text>
        <Pressable
          onPress={handleSave}
          disabled={isLoading || !name.trim()}
          className={cn('p-2 active:opacity-60', (!name.trim() || isLoading) && 'opacity-40')}
        >
          <Text variant="body" className="text-primary font-semibold">
            {t('project.edit.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 py-6" keyboardShouldPersistTaps="handled">
        {/* Nome */}
        <View className="mb-6">
          <Text variant="label" className="text-foreground mb-2">{t('project.edit.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('project.edit.namePlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            className="h-11 px-3 rounded-lg border border-inputBorder bg-input text-foreground"
            autoFocus
            maxLength={100}
            blurOnSubmit={false}
          />
        </View>

        {/* Cor */}
        <View className="mb-6">
          <Text variant="label" className="text-foreground mb-3">{t('project.edit.color')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
            {projectColors.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                className={cn(
                  'w-10 h-10 rounded-full items-center justify-center border-2',
                  selectedColor === color ? 'border-white' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <Icon name="checkmark" size={18} color="#ffffff" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Ícone */}
        <View className="mb-8">
          <Text variant="label" className="text-foreground mb-3">{t('project.edit.icon')}</Text>
          <View className="flex-row flex-wrap gap-3">
            {PROJECT_ICONS.map((iconName) => (
              <Pressable
                key={iconName}
                onPress={() => setSelectedIcon(iconName)}
                className={cn(
                  'w-12 h-12 rounded-lg items-center justify-center',
                  selectedIcon === iconName
                    ? 'bg-primary'
                    : 'bg-muted active:bg-muted/70'
                )}
              >
                <Icon name={iconName} size={22} color={selectedIcon === iconName ? '#ffffff' : colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View className="items-center py-4 border-t border-border">
          <Text variant="caption" className="text-muted-foreground mb-3">Preview</Text>
          <View
            className="w-14 h-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: selectedColor }}
          >
            <Icon name={selectedIcon} size={28} color="#ffffff" />
          </View>
          <Text variant="body" className="mt-2 text-center" numberOfLines={1}>
            {name || t('project.edit.namePlaceholder')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}