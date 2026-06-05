// src/state/notifications.context.tsx
// NotificationsProvider — regista o handler global de notificações e obtém
// o Expo push token (sem servidor de push no MVP; token é guardado para uso
// futuro na fase de sync cloud).

import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (projectId) {
      const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
      token = data;
    }
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Lembretes',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return token;
}

interface NotificationsContextValue {
  expoPushToken: string | null;
  ready: boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token);
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });
  }, []);

  return (
    <NotificationsContext.Provider value={{ expoPushToken, ready }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
