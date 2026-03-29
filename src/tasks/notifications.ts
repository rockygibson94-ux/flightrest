// Re-export from services so backgroundFetch can import from a sibling path
export {
  scheduleAlarmNotification,
  cancelAlarmNotification,
  sendAdjustmentNotification,
  cancelAllAlarms,
  requestNotificationPermissions,
} from '../services/notifications';
