// src/app/_layout.tsx
// Root layout — providers, fontes e rotas (Stack). Ecrã inicial é a tela
// "Hoje" (Etapa 1.6). O modal Quick Add é uma rota stack com presentation: 'modal'.
/* eslint-disable @typescript-eslint/no-require-imports */

import 'react-native-get-random-values';
import '../../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DBProvider } from '@/state/db.context';
import { I18nProvider } from '@/state/i18n.context';
import { NotificationsProvider } from '@/state/notifications.context';
import { ThemeProvider, useTheme } from '@/state/theme.store';

SplashScreen.preventAutoHideAsync();

function ThemedStack() {
  const { colors } = useTheme();
  return (
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="quick-add" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
    'SpaceMono-Regular': require('../../assets/fonts/SpaceMono-Regular.ttf'),
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
