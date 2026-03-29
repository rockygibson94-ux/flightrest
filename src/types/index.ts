// ─── Flight ───────────────────────────────────────────────────────────────────

export type FlightStatus = 'scheduled' | 'delayed' | 'cancelled' | 'landed' | 'en_route';

export interface Flight {
  flightNumber: string;       // e.g. "DL 402"
  origin: string;             // IATA code
  destination: string;        // IATA code
  scheduledDeparture: Date;
  estimatedDeparture: Date;
  boardingTime: Date;         // derived from FlightAware or estimated
  gate: string | null;        // e.g. "E14"
  concourse: ATLConcourse | null;
  terminal: string | null;
  status: FlightStatus;
  delayMinutes: number;
}

// ─── ATL Concourse ─────────────────────────────────────────────────────────────

export type ATLConcourse = 'T' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export const ATL_WALK_TIMES: Record<ATLConcourse, number> = {
  T: 5,
  A: 10,
  B: 12,
  C: 14,
  D: 18,
  E: 20,
  F: 24,
};

// ─── Boarding Zone ──────────────────────────────────────────────────────────────

export type BoardingZone = 'preboard' | 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'lastcall';

export const BOARDING_OFFSETS: Record<BoardingZone, number> = {
  preboard: 35,
  zone1: 30,
  zone2: 20,
  zone3: 10,
  zone4: 5,
  lastcall: 0,
};

export const BOARDING_ZONE_LABELS: Record<BoardingZone, string> = {
  preboard: 'Pre-Board',
  zone1: 'Zone 1',
  zone2: 'Zone 2',
  zone3: 'Zone 3',
  zone4: 'Zone 4',
  lastcall: 'Last Call',
};

// ─── Security ──────────────────────────────────────────────────────────────────

export interface SecurityWait {
  airport: string;            // IATA code
  checkpoint: string;
  waitMinutes: number;
  updatedAt: Date;
  source: 'mytsa' | 'atl_live';
}

// ─── Morning Routine ───────────────────────────────────────────────────────────

export interface MorningRoutine {
  wakeBufferMinutes: number;    // buffer after alarm before you get up
  getReadyMinutes: number;      // shower, pack, etc.
  driveMinutes: number;         // drive to airport
  gateBufferMinutes: number;    // buffer at gate before boarding
}

// ─── Alarm ─────────────────────────────────────────────────────────────────────

export interface AlarmBreakdown {
  boardingTime: Date;
  boardingZoneOffset: number;
  gateWalkMinutes: number;
  securityWaitMinutes: number;
  driveMinutes: number;
  getReadyMinutes: number;
  wakeBufferMinutes: number;
  gateBufferMinutes: number;
  wakeUpTime: Date;
}

export interface Alarm {
  id: string;
  flightNumber: string;
  wakeUpTime: Date;
  isActive: boolean;
  autoAdjust: boolean;
  breakdown: AlarmBreakdown;
  notificationId: string | null;
}

// ─── Smart Alert Toggles ────────────────────────────────────────────────────────

export interface SmartAlerts {
  autoAdjustDelays: boolean;
  autoAdjustGateChanges: boolean;
  autoAdjustSecuritySpikes: boolean;
  notifyCancellations: boolean;
}

// ─── User Setup ────────────────────────────────────────────────────────────────

export interface UserSetup {
  flightNumber: string;
  airport: string;             // departure airport IATA
  hasTSAPreCheck: boolean;
  concourse: ATLConcourse | null;
  gateNumber: string;
  farEnd: boolean;             // +5 min if far end of concourse
  boardingZone: BoardingZone;
  routine: MorningRoutine;
  smartAlerts: SmartAlerts;
}

// ─── Flight History ─────────────────────────────────────────────────────────────

export interface FlightRecord {
  id: string;
  date: Date;
  flightNumber: string;
  origin: string;
  destination: string;
  alarmTime: Date;
  actualWakeTime: Date | null;
  madeItOnTime: boolean;
  sleepSavedMinutes: number;
  autoAdjustments: number;
  gateChangesCaught: boolean;
  delayMinutes: number;
}
