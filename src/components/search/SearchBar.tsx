// src/components/search/SearchBar.tsx
// Barra de pesquisa com debounce e botão de limpar.

import { View, TextInput, Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { cn } from '@/lib/cn';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder, className }: SearchBarProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View
      className={cn(
        'flex-row items-center gap-2 px-4 py-3 rounded-xl border bg-input',
        'border-inputBorder',
        className
      )}
    >
      <Icon name="search" size={20} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? t('search.placeholder') ?? 'Pesquisar...'}
        placeholderTextColor={colors.mutedForeground}
        className="flex-1 text-foreground text-base"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} className="p-1">
          <Icon name="close-circle" size={20} color={colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}