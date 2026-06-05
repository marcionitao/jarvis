// src/components/ui/button.tsx
// Componente Button com variantes (primary, secondary, outline, ghost, destructive)
// e tamanhos (sm, md, lg). Suporta loading state.

import { Pressable, ActivityIndicator, type PressableProps, type ViewStyle } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary active:opacity-80',
  secondary: 'bg-secondary active:opacity-80',
  outline: 'border border-border bg-transparent active:bg-muted',
  ghost: 'bg-transparent active:bg-muted',
  destructive: 'bg-destructive active:opacity-80',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 rounded-md',
  md: 'h-11 px-4 rounded-lg',
  lg: 'h-14 px-6 rounded-lg',
};

const textColorClass: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-white',
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      className={cn(
        'items-center justify-center flex-row',
        variantClass[variant],
        sizeClass[size],
        isDisabled && 'opacity-50',
        className,
      )}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#635E5E' : '#ffffff'} />
      ) : (
        <Text className={cn('font-semibold', textColorClass[variant])}>{title}</Text>
      )}
    </Pressable>
  );
}
