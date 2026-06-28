// src/components/ui/snackbar.tsx
// Global Snackbar — shown at the bottom of the screen.
// Controlled via useSnackbar() hook.

import { useEffect } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useSnackbar } from '@/state/snackbar.context';
import { useTheme } from '@/state/theme.store';

export function Snackbar() {
  const { colors } = useTheme();
  const { visible, message, action, hide } = useSnackbar();

useEffect(() => {
    if (visible) {
      const timer = setTimeout(hide, action ? 5000 : 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, action, hide]);

  if (!visible) return null;

  return (
    <View
      className="absolute bottom-20 left-4 right-4 rounded-xl px-4 py-3 flex-row items-center gap-3"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <Text variant="body" className="flex-1" numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <Pressable
          onPress={() => {
            action.onPress();
            hide();
          }}
          className="pl-3 active:opacity-60"
          accessibilityRole="button"
        >
          <Text variant="body" className="font-semibold text-primary">
            {action.label}
          </Text>
        </Pressable>
      )}
      <Pressable onPress={hide} className="pl-2 active:opacity-60" accessibilityRole="button">
        <Icon name="close-outline" size={18} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}