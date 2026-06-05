// src/components/ui/card.tsx
// Componente Card com sub-componentes Header, Title, Description, Content, Footer.

import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, ...rest }: CardProps) {
  return <View {...rest} className={cn('bg-card rounded-xl border border-border p-4', className)} />;
}

export function CardHeader({ className, ...rest }: CardProps) {
  return <View {...rest} className={cn('mb-2', className)} />;
}

export function CardTitle({ className, ...rest }: CardProps & { children?: React.ReactNode }) {
  return (
    <View {...rest}>
      <Text variant="h3" className={className}>
        {rest.children}
      </Text>
    </View>
  );
}

export function CardDescription({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <Text variant="caption" className={cn('mt-1', className)}>
      {children}
    </Text>
  );
}

export function CardContent({ className, ...rest }: CardProps) {
  return <View {...rest} className={cn('py-2', className)} />;
}

export function CardFooter({ className, ...rest }: CardProps) {
  return <View {...rest} className={cn('mt-3 flex-row gap-2', className)} />;
}
