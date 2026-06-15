// src/app/settings.tsx
// Ecrã de Definições: tema, idioma, sobre.
// Acesso via header de "Hoje".

import { useState } from 'react';
import { ScrollView, View, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { SettingRow } from '@/components/settings/SettingRow';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const themeOptions = [
    { value: 'light', label: t('theme.light') },
    { value: 'dark', label: t('theme.dark') },
    { value: 'system', label: t('theme.system') },
  ];

  const languageOptions = [
    { value: 'pt', label: t('language.pt') },
    { value: 'en', label: t('language.en') },
  ];

  const selectedLanguage = languageOptions.find((o) => o.value === locale);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 pt-3 pb-4 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Icon name="chevron-back-outline" size={24} color={colors.foreground} />
          </Pressable>
          <Text variant="h2">{t('settings.title')}</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1">
          {/* Aparência */}
          <View className="mb-4">
            <Text variant="caption" className="px-5 py-2 text-muted-foreground uppercase tracking-wider">
              {t('settings.appearance')}
            </Text>
            <View className="bg-card border-y border-border">
              <SettingRow
                label={t('settings.appearance')}
                type="segmented"
                options={themeOptions}
                value={mode}
                onChange={(val) => setMode(val as 'light' | 'dark' | 'system')}
              />
            </View>
          </View>

          {/* Idioma */}
          <View className="mb-4">
            <Text variant="caption" className="px-5 py-2 text-muted-foreground uppercase tracking-wider">
              {t('settings.language')}
            </Text>
            <View className="bg-card border-y border-border">
              <SettingRow
                label={t('settings.language')}
                type="select"
                options={languageOptions}
                value={locale}
                onPress={() => setShowLanguageModal(true)}
              />
            </View>
          </View>

          {/* Sobre */}
          <View className="mb-4">
            <Text variant="caption" className="px-5 py-2 text-muted-foreground uppercase tracking-wider">
              {t('settings.about')}
            </Text>
            <View className="bg-card border-y border-border">
              <SettingRow
                label={t('about.version')}
                type="button"
                value={appVersion}
                onPress={() => {}}
              />
              <SettingRow
                label={t('about.licenses')}
                type="button"
                value=""
                onPress={() => {}}
                accessory={<Icon name="chevron-forward-outline" size={16} color={colors.mutedForeground} />}
              />
              <SettingRow
                label={t('about.privacy')}
                type="button"
                value=""
                onPress={() => {}}
                accessory={<Icon name="chevron-forward-outline" size={16} color={colors.mutedForeground} />}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowLanguageModal(false)}
        >
          <View
            className="w-72 rounded-xl border border-border bg-card shadow-xl"
            onStartShouldSetResponder={() => true}
          >
            <Text variant="h3" className="text-center py-4 border-b border-border">
              {t('settings.language')}
            </Text>
            {languageOptions.map((opt) => {
              const isSelected = opt.value === locale;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setLocale(opt.value as 'pt' | 'en');
                    setShowLanguageModal(false);
                  }}
                  className="flex-row items-center justify-between px-5 py-4 border-b border-border last:border-b-0 active:bg-muted"
                >
                  <Text variant="body" className={isSelected ? 'font-semibold' : ''}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Icon name="checkmark-outline" size={20} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
            <View className="p-3 border-t border-border">
              <Button
                title={t('common.cancel')}
                variant="ghost"
                onPress={() => setShowLanguageModal(false)}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}