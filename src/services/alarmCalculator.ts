/**
 * Core alarm calculation logic.
 *
 * Wake-Up Time = Boarding Time
 *   - Boarding Zone offset      (0–35 min)
 *   - Gate walk time            (5–24 min, ATL concourse based)
 *   - Security wait time        (live)
 *   - Drive to airport          (user input)
 *   - Get ready time            (user input)
 *   - Wake-up buffer            (user input)
 *   - Gate buffer               (user input)
 */

import {
  ATL_WALK_TIMES,
  BOARDING_OFFSETS,
  type ATLConcourse,
  type BoardingZone,
  type AlarmBreakdown,
  type Flight,
  type MorningRoutine,
  type SecurityWait,
} from '../types';
import { getBestWaitMinutes } from './myTSA';

interface CalculateAlarmParams {
  flight: Flight;
  boardingZone: BoardingZone;
  concourse: ATLConcourse | null;
  farEnd: boolean;
  routine: MorningRoutine;
  securityWaits: SecurityWait[];
  hasTSAPreCheck: boolean;
  customWalkMinutes?: number; // override for non-ATL airports
}

export function calculateAlarm(params: CalculateAlarmParams): AlarmBreakdown {
  const {
    flight,
    boardingZone,
    concourse,
    farEnd,
    routine,
    securityWaits,
    hasTSAPreCheck,
    customWalkMinutes,
  } = params;

  const boardingZoneOffset = BOARDING_OFFSETS[boardingZone];

  // Gate walk: ATL concourse-based or custom
  let gateWalkMinutes: number;
  if (customWalkMinutes !== undefined) {
    gateWalkMinutes = customWalkMinutes;
  } else if (concourse) {
    gateWalkMinutes = ATL_WALK_TIMES[concourse] + (farEnd ? 5 : 0);
  } else {
    gateWalkMinutes = 15; // generic default
  }

  const securityWaitMinutes = getBestWaitMinutes(securityWaits, hasTSAPreCheck, flight.origin);

  const totalMinutesBeforeBoarding =
    boardingZoneOffset +
    gateWalkMinutes +
    securityWaitMinutes +
    routine.driveMinutes +
    routine.getReadyMinutes +
    routine.wakeBufferMinutes +
    routine.gateBufferMinutes;

  const wakeUpTime = new Date(
    flight.boardingTime.getTime() - totalMinutesBeforeBoarding * 60_000
  );

  return {
    boardingTime: flight.boardingTime,
    boardingZoneOffset,
    gateWalkMinutes,
    securityWaitMinutes,
    driveMinutes: routine.driveMinutes,
    getReadyMinutes: routine.getReadyMinutes,
    wakeBufferMinutes: routine.wakeBufferMinutes,
    gateBufferMinutes: routine.gateBufferMinutes,
    wakeUpTime,
  };
}

/**
 * Returns true if the alarm needs to be rescheduled based on an updated flight.
 */
export function alarmNeedsUpdate(
  existingWakeUp: Date,
  newWakeUp: Date,
  thresholdMinutes = 1
): boolean {
  const diffMs = Math.abs(newWakeUp.getTime() - existingWakeUp.getTime());
  return diffMs > thresholdMinutes * 60_000;
}

/**
 * Format a breakdown into a human-readable array of lines for display.
 */
export function formatBreakdown(b: AlarmBreakdown): string[] {
  const fmt = (n: number) => `${n} min`;
  return [
    `Boarding time:        ${formatTime(b.boardingTime)}`,
    `− Zone offset:        ${fmt(b.boardingZoneOffset)}`,
    `− Gate walk:          ${fmt(b.gateWalkMinutes)}`,
    `− Security wait:      ${fmt(b.securityWaitMinutes)}`,
    `− Drive to airport:   ${fmt(b.driveMinutes)}`,
    `− Get ready:          ${fmt(b.getReadyMinutes)}`,
    `− Wake buffer:        ${fmt(b.wakeBufferMinutes)}`,
    `− Gate buffer:        ${fmt(b.gateBufferMinutes)}`,
    `─────────────────────────────`,
    `Wake-up time:         ${formatTime(b.wakeUpTime)}`,
  ];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
