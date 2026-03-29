/**
 * Background fetch task — polls flight + security data while the app is closed.
 * Runs every ~15 minutes (iOS minimum).
 *
 * If the flight is delayed, it recalculates the alarm and reschedules the
 * notification so the user gets extra sleep automatically.
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useFlightStore } from '../store/flightStore';
import { refreshFlight } from '../services/flightAware';
import { fetchSecurityWaits } from '../services/myTSA';
import { calculateAlarm, alarmNeedsUpdate } from '../services/alarmCalculator';
import {
  scheduleAlarmNotification,
  cancelAlarmNotification,
  sendAdjustmentNotification,
} from './notifications';

export const BACKGROUND_FETCH_TASK = 'flightrest-background-fetch';

// Re-export for convenience
export { scheduleAlarmNotification, cancelAlarmNotification } from './notifications';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const store = useFlightStore.getState();
    const { flight, alarm, setup, setFlight, setAlarm, setSecurityWaits } = store;

    if (!flight || !alarm?.isActive) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    let hasUpdates = false;

    // 1. Refresh security waits
    const newWaits = await fetchSecurityWaits(setup.airport).catch(() => store.securityWaits);
    setSecurityWaits(newWaits);

    // 2. Refresh flight data
    const flightUpdates = await refreshFlight(flight.flightNumber);
    const updatedFlight = { ...flight, ...flightUpdates };
    setFlight(updatedFlight);

    // 3. Recalculate alarm
    const newBreakdown = calculateAlarm({
      flight: updatedFlight,
      boardingZone: setup.boardingZone,
      concourse: setup.concourse,
      farEnd: setup.farEnd,
      routine: setup.routine,
      securityWaits: newWaits,
      hasTSAPreCheck: setup.hasTSAPreCheck,
    });

    if (alarmNeedsUpdate(alarm.breakdown.wakeUpTime, newBreakdown.wakeUpTime)) {
      hasUpdates = true;

      // Cancel old alarm and schedule new one
      if (alarm.notificationId) {
        await cancelAlarmNotification(alarm.notificationId);
      }

      const notificationId = await scheduleAlarmNotification(
        newBreakdown.wakeUpTime,
        updatedFlight
      );

      setAlarm({
        ...alarm,
        breakdown: newBreakdown,
        wakeUpTime: newBreakdown.wakeUpTime,
        notificationId,
      });

      // Notify user of the adjustment
      const oldTime = alarm.wakeUpTime;
      const newTime = newBreakdown.wakeUpTime;
      const diffMin = Math.round((oldTime.getTime() - newTime.getTime()) / 60_000);

      if (updatedFlight.delayMinutes > 0 && setup.smartAlerts.autoAdjustDelays) {
        await sendAdjustmentNotification(
          `Flight delayed ${updatedFlight.delayMinutes} min — sleep ${diffMin > 0 ? `${diffMin} more minutes` : `${Math.abs(diffMin)} min less`}`,
          newBreakdown.wakeUpTime
        );
      }
    }

    return hasUpdates
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetch(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,   // keep running after app close
      startOnBoot: true,
    });
  } catch {
    // Background fetch may not be available on all devices / simulators
  }
}

export async function unregisterBackgroundFetch(): Promise<void> {
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}
