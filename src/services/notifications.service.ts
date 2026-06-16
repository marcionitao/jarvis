// src/services/notifications.service.ts
// Serviço de notificações push. Encapsula expo-notifications.
// Funcionalidades: pedido de permissão, agendar lembrete, cancelar.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert } from 'react-native';
import { getDB } from '@/db/client';
import * as remindersRepo from '@/repositories/reminders.repo';
import type { TaskDTO } from '@/repositories/tasks.repo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function taskDueDateToDate(dueDate: number, dueTime: number | null): Date {
  const y = Math.floor(dueDate / 10000);
  const m = Math.floor((dueDate % 10000) / 100) - 1;
  const d = dueDate % 100;
  const hours = dueTime !== null ? Math.floor(dueTime / 60) : 0;
  const minutes = dueTime !== null ? dueTime % 60 : 0;
  return new Date(y, m, d, hours, minutes, 0, 0);
}

export async function requestPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  if (!Device.isDevice) {
    return { status: 'denied' };
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') {
    return { status: 'granted' };
  }
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return { status: newStatus };
}

export async function scheduleTaskReminder(task: TaskDTO): Promise<void> {
  if (task.dueDate === null || task.dueTime === null) return;

  const db = getDB();
  if (!db) return;

  const triggerDate = taskDueDateToDate(task.dueDate, task.dueTime);
  if (triggerDate.getTime() <= Date.now()) return;

  let notificationId: string | null = null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title,
        body: 'Está na hora!',
        data: { taskId: task.id },
        sound: true,
      },
      trigger: triggerDate,
    });
    notificationId = id;
  } catch {
    // If scheduling fails (e.g. too far in future for OS), skip silently
    return;
  }

  await remindersRepo.create(db, {
    taskId: task.id,
    triggerAt: triggerDate.getTime(),
    type: 'absolute',
    notificationId,
  });
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  const db = getDB();
  if (!db) return;

  const reminders = await remindersRepo.listForTask(db, taskId);
  for (const reminder of reminders) {
    if (reminder.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      } catch {
        // Notification may have already fired or been cancelled
      }
    }
  }
  await remindersRepo.deleteForTask(db, taskId);
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore errors
  }
}

export function openPermissionSettings(): void {
  Alert.alert(
    'Notificações desativadas',
    'Ative as notificações nas definições do dispositivo para receber lembretes.',
    [{ text: 'OK' }]
  );
}