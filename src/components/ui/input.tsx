// src/components/ui/input.tsx
// Componente Input com label, helper text e estados (error, disabled).

import { View, TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

export interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  className?: string;
}

export function Input({ label, helperText, errorText, className, editable, ...rest }: InputProps) {
  const isDisabled = editable === false;
  return (
    <View className="gap-1.5">
      {label ? (
        <Text variant="label" className="text-foreground">
          {label}
        </Text>
      ) : null}
      <TextInput
        editable={editable}
        placeholderTextColor="#a6a6a6"
        className={cn(
          'h-11 px-3 rounded-lg border bg-input text-foreground',
          errorText ? 'border-destructive' : 'border-inputBorder',
          isDisabled && 'opacity-50',
          className,
        )}
        {...rest}
      />
      {errorText ? (
        <Text variant="caption" className="text-destructive">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text variant="caption">{helperText}</Text>
      ) : null}
    </View>
  );
}
