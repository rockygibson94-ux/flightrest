import * as Notifications from 'expo-notifications';
import type { Flight } from '../types';

// Configure notification handler (call once at app start)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a local notification alarm for wakeUpTime.
 * Returns the notification identifier.
 */
export async function scheduleAlarmNotification(
  wakeUpTime: Date,
  flight: Flight
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Wake up for ${flight.flightNumber}`,
      body: `Boards at ${flight.boardingTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })} · Gate ${flight.gate ?? '—'}`,
      sound: 'alarm.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { flightNumber: flight.flightNumber },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: wakeUpTime,
    },
  });

  return id;
}

/**
 * Send an immediate push notification for alarm adjustments (e.g. flight delay).
 */
export async function sendAdjustmentNotification(
  reason: string,
  newWakeUpTime: Date
): Promise<void> {
  const timeStr = newWakeUpTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'FlightRest — Alarm Adjusted',
      body: `${reason}. New wake-up: ${timeStr}`,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // immediate
  });
}

export async function cancelAlarmNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllAlarms(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
