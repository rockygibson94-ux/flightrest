import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Flight,
  Alarm,
  UserSetup,
  SecurityWait,
  FlightRecord,
  ATLConcourse,
  BoardingZone,
} from '../types';

const DEFAULT_SETUP: UserSetup = {
  flightNumber: '',
  airport: 'ATL',
  hasTSAPreCheck: false,
  concourse: null,
  gateNumber: '',
  farEnd: false,
  boardingZone: 'zone3',
  routine: {
    wakeBufferMinutes: 5,
    getReadyMinutes: 45,
    driveMinutes: 30,
    gateBufferMinutes: 10,
  },
  smartAlerts: {
    autoAdjustDelays: true,
    autoAdjustGateChanges: true,
    autoAdjustSecuritySpikes: true,
    notifyCancellations: true,
  },
};

interface FlightStore {
  // Data
  flight: Flight | null;
  alarm: Alarm | null;
  setup: UserSetup;
  securityWaits: SecurityWait[];
  history: FlightRecord[];

  // UI state
  isLoadingFlight: boolean;
  isLoadingSecurity: boolean;
  flightError: string | null;

  // Actions
  setFlight: (flight: Flight | null) => void;
  setAlarm: (alarm: Alarm | null) => void;
  updateSetup: (partial: Partial<UserSetup>) => void;
  setSecurityWaits: (waits: SecurityWait[]) => void;
  addHistoryRecord: (record: FlightRecord) => void;
  setLoadingFlight: (loading: boolean) => void;
  setLoadingSecurity: (loading: boolean) => void;
  setFlightError: (error: string | null) => void;
  loadFromStorage: () => Promise<void>;
  persistSetup: () => Promise<void>;
}

export const useFlightStore = create<FlightStore>((set, get) => ({
  flight: null,
  alarm: null,
  setup: DEFAULT_SETUP,
  securityWaits: [],
  history: [],
  isLoadingFlight: false,
  isLoadingSecurity: false,
  flightError: null,

  setFlight: (flight) => set({ flight }),
  setAlarm: (alarm) => set({ alarm }),

  updateSetup: (partial) => {
    set((state) => ({ setup: { ...state.setup, ...partial } }));
    get().persistSetup();
  },

  setSecurityWaits: (waits) => set({ securityWaits: waits }),

  addHistoryRecord: (record) => {
    set((state) => {
      const history = [record, ...state.history].slice(0, 50); // keep last 50
      AsyncStorage.setItem('history', JSON.stringify(history));
      return { history };
    });
  },

  setLoadingFlight: (loading) => set({ isLoadingFlight: loading }),
  setLoadingSecurity: (loading) => set({ isLoadingSecurity: loading }),
  setFlightError: (error) => set({ flightError: error }),

  loadFromStorage: async () => {
    try {
      const [setupRaw, historyRaw] = await Promise.all([
        AsyncStorage.getItem('setup'),
        AsyncStorage.getItem('history'),
      ]);
      if (setupRaw) {
        set({ setup: { ...DEFAULT_SETUP, ...JSON.parse(setupRaw) } });
      }
      if (historyRaw) {
        const records: FlightRecord[] = JSON.parse(historyRaw).map((r: any) => ({
          ...r,
          date: new Date(r.date),
          alarmTime: new Date(r.alarmTime),
          actualWakeTime: r.actualWakeTime ? new Date(r.actualWakeTime) : null,
        }));
        set({ history: records });
      }
    } catch {
      // storage read failure is non-fatal
    }
  },

  persistSetup: async () => {
    try {
      await AsyncStorage.setItem('setup', JSON.stringify(get().setup));
    } catch {
      // storage write failure is non-fatal
    }
  },
}));
