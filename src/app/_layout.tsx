// src/app/_layout.tsx
// Root layout — providers e fontes. Stack vazio; o ecrã inicial é o preview
// até a Etapa 1.6 (Quick Add) entrar em cena.
/* eslint-disable @typescript-eslint/no-require-imports */

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DBProvider } from '@/state/db.context';
import { ThemeProvider } from '@/state/theme.store';
import { I18nProvider } from '@/state/i18n.context';
import { NotificationsProvider } from '@/state/notifications.context';
import { useTheme } from '@/state/theme.store';

SplashScreen.preventAutoHideAsync();

function ThemedStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsError) throw fontsError;
  }, [fontsError]);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DBProvider>
        <ThemeProvider>
          <I18nProvider>
            <NotificationsProvider>
              <ThemedStack />
            </NotificationsProvider>
          </I18nProvider>
        </ThemeProvider>
      </DBProvider>
    </GestureHandlerRootView>
  );
}
