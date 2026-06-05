// src/components/ui/icon.tsx
// Wrapper para Ionicons via @expo/vector-icons.
// Permite theme-aware color e size consistentes.

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useTheme } from '@/state/theme.store';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.foreground} />;
}
