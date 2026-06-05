// src/components/ui/text.tsx
// Componente Text com variantes e suporte a NativeWind (className).

import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/cn';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

const variantClass: Record<Variant, string> = {
  h1: 'text-2xl font-bold text-foreground',
  h2: 'text-xl font-semibold text-foreground',
  h3: 'text-base font-semibold text-foreground',
  body: 'text-base font-normal text-foreground',
  caption: 'text-sm font-normal text-muted-foreground',
  label: 'text-sm font-medium text-foreground',
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = 'body', className, style, ...rest }: TextProps) {
  return <RNText {...rest} className={cn(variantClass[variant], className)} style={style} />;
}
