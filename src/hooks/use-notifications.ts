// src/hooks/use-notifications.ts
// Hook para gerir o estado das notificações: enabled (AsyncStorage),
// permissionStatus, e actions (toggleEnabled, requestPermission).

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  cancelAllReminders,
  openPermissionSettings,
  requestPermissions as requestPermissionsSvc,
} from '@/services/notifications.service';

const NOTIFICATIONS_ENABLED_KEY = '@jarvis/notifications-enabled';

export type NotificationPermissionStatus = 'unknown' | 'granted' | 'denied' | 'undetermined';

export function useNotifications() {
  const [enabled, setEnabledState] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('unknown');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        const storedEnabled = stored === 'true';
        if (!cancelled) setEnabledState(storedEnabled);

        if (Device.isDevice) {
          const { status } = await Notifications.getPermissionsAsync();
          if (!cancelled) {
            setPermissionStatus(
              status === 'granted'
                ? 'granted'
                : status === 'denied'
                ? 'denied'
                : 'undetermined'
            );
          }
        } else {
          if (!cancelled) setPermissionStatus('denied');
        }
      } catch {
        // Ignore storage errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setEnabled = useCallback(async (value: boolean) => {
    setEnabledState(value);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(value));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await requestPermissionsSvc();
    const granted = result.status === 'granted';
    setPermissionStatus(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  const toggleEnabled = useCallback(async () => {
    if (enabled) {
      await setEnabled(false);
    } else {
      const granted = await requestPermission();
      if (granted) {
        await setEnabled(true);
      } else {
        openPermissionSettings();
      }
    }
  }, [enabled, requestPermission, setEnabled]);

  return {
    enabled,
    permissionStatus,
    loading,
    toggleEnabled,
    requestPermission,
  };
}