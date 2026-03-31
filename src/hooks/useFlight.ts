import { useCallback } from 'react';
import { useFlightStore } from '../store/flightStore';
import { fetchFlight, refreshFlight } from '../services/flightAware';
import { calculateAlarm, alarmNeedsUpdate } from '../services/alarmCalculator';
import { scheduleAlarmNotification, cancelAlarmNotification } from '../services/notifications';
import type { Alarm } from '../types';

export function useFlight() {
  const {
    setup,
    securityWaits,
    flight,
    alarm,
    setFlight,
    setAlarm,
    updateSetup,
    setLoadingFlight,
    setFlightError,
  } = useFlightStore();

  const lookup = useCallback(
    async (flightNumber: string) => {
      setLoadingFlight(true);
      setFlightError(null);
      try {
        const flightData = await fetchFlight(flightNumber);
        setFlight(flightData);

        // Auto-populate setup fields from flight data
        const setupUpdates: Partial<typeof setup> = {
          airport: flightData.origin,
        };
        if (flightData.gate) {
          setupUpdates.gateNumber = flightData.gate;
        }
        if (flightData.concourse) {
          setupUpdates.concourse = flightData.concourse;
        }
        updateSetup(setupUpdates);
      } catch (err) {
        setFlightError(err instanceof Error ? err.message : 'Failed to fetch flight');
      } finally {
        setLoadingFlight(false);
      }
    },
    [setFlight, updateSetup, setLoadingFlight, setFlightError]
  );

  const refresh = useCallback(async () => {
    if (!flight) return;
    try {
      const updates = await refreshFlight(flight.flightNumber);
      const updatedFlight = { ...flight, ...updates };
      setFlight(updatedFlight);

      // Recalculate alarm if flight changed
      if (alarm?.isActive && setup.smartAlerts.autoAdjustDelays) {
        const newBreakdown = calculateAlarm({
          flight: updatedFlight,
          boardingZone: setup.boardingZone,
          concourse: setup.concourse,
          farEnd: setup.farEnd,
          routine: setup.routine,
          securityWaits,
          hasTSAPreCheck: setup.hasTSAPreCheck,
        });

        if (alarmNeedsUpdate(alarm.breakdown.wakeUpTime, newBreakdown.wakeUpTime)) {
          // Cancel old notification and reschedule
          if (alarm.notificationId) {
            await cancelAlarmNotification(alarm.notificationId);
          }

          const notificationId = await scheduleAlarmNotification(
            newBreakdown.wakeUpTime,
            updatedFlight
          );

          const updatedAlarm: Alarm = {
            ...alarm,
            breakdown: newBreakdown,
            wakeUpTime: newBreakdown.wakeUpTime,
            notificationId,
          };
          setAlarm(updatedAlarm);
        }
      }
    } catch {
      // silent refresh failure — don't surface to user
    }
  }, [flight, alarm, setup, securityWaits, setFlight, setAlarm]);

  return { lookup, refresh };
}
