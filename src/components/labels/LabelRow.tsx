// src/components/labels/LabelRow.tsx
// Linha de etiqueta na lista: cor + nome + contagem de tarefas.

import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/state/theme.store';
import type { LabelDTO } from '@/repositories/labels.repo';

interface LabelRowProps {
  label: LabelDTO;
  taskCount: number;
  onPress: () => void;
}

export function LabelRow({ label, taskCount, onPress }: LabelRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className="px-5 py-3 flex-row items-center gap-3 border-b border-border active:opacity-60"
    >
      <View
        className="w-5 h-5 rounded-full"
        style={{ backgroundColor: label.color }}
      />
      <Text variant="body" className="flex-1">{label.name}</Text>
      <Text variant="caption" className="text-muted-foreground">
        {taskCount}
      </Text>
      <Icon name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}