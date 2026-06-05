// src/components/ui/chip.tsx
// Chip — badge pequeno para tags, prioridades, etiquetas.

import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'muted';

const variantClass: Record<Variant, string> = {
  default: 'bg-muted border border-border',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted',
};

const textVariantClass: Record<Variant, string> = {
  default: 'text-foreground',
  primary: 'text-white',
  success: 'text-white',
  warning: 'text-white',
  destructive: 'text-white',
  muted: 'text-muted-foreground',
};

export interface ChipProps extends ViewProps {
  label: string;
  variant?: Variant;
  className?: string;
}

export function Chip({ label, variant = 'default', className, ...rest }: ChipProps) {
  return (
    <View
      {...rest}
      className={cn('px-2.5 py-1 rounded-full self-start', variantClass[variant], className)}
    >
      <Text variant="caption" className={cn('font-medium', textVariantClass[variant])}>
        {label}
      </Text>
    </View>
  );
}
