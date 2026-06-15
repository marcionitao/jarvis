// src/components/settings/SettingRow.tsx
// Linha de definição reutilizável: label + control (segmented, select ou button).
// Usado na tela de Settings.

import { type ReactNode } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';

export interface SettingOption {
  value: string;
  label: string;
  color?: string;
}

export interface SettingRowProps {
  label: string;
  type: 'segmented' | 'select' | 'button';
  options?: SettingOption[];
  value?: string;
  onChange?: (value: string) => void;
  onPress?: () => void;
  accessory?: ReactNode;
}

export function SettingRow({
  label,
  type,
  options = [],
  value,
  onChange,
  onPress,
  accessory,
}: SettingRowProps) {
  const { colors } = useTheme();

  const renderControl = () => {
    if (type === 'segmented' && options.length > 0) {
      return (
        <View className="flex-row gap-1">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onChange?.(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md border',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-transparent',
                )}
              >
                <Text
                  variant="caption"
                  className={cn(
                    'font-medium',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (type === 'select' && options.length > 0) {
      const selected = options.find((o) => o.value === value);
      return (
        <Pressable
          onPress={onPress}
          className="flex-row items-center gap-1 px-2 py-1.5 rounded-md border border-border bg-muted/50 active:bg-muted"
        >
          <Text variant="caption" className="text-muted-foreground">
            {selected?.label ?? ''}
          </Text>
          <Icon name="chevron-down-outline" size={14} color={colors.mutedForeground} />
        </Pressable>
      );
    }

    if (type === 'button') {
      return (
        <Pressable
          onPress={onPress}
          className="flex-row items-center gap-1 px-2 py-1.5 rounded-md border border-border bg-muted/50 active:bg-muted"
        >
          <Text variant="caption" className="text-muted-foreground">
            {value}
          </Text>
          <Icon name="chevron-forward-outline" size={14} color={colors.mutedForeground} />
        </Pressable>
      );
    }

    return null;
  };

  return (
    <View className="px-5 py-3 flex-row items-center justify-between border-b border-border">
      <Text variant="body" className="text-foreground flex-1 pr-4">
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        {renderControl()}
        {accessory}
      </View>
    </View>
  );
}