import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Space, Radius, Font } from '../constants/theme';
import { useFlightStore } from '../store/flightStore';
import { calculateAlarm, formatBreakdown } from '../services/alarmCalculator';
import { syncToClockApp } from '../services/clockSync';
import type { Flight, Alarm } from '../types';

interface Props {
  flight: Flight;
  alarm: Alarm | null;
}

export default function AlarmRecommendation({ flight, alarm }: Props) {
  const { setup, securityWaits } = useFlightStore();
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const breakdown = calculateAlarm({
    flight,
    boardingZone: setup.boardingZone,
    concourse: setup.concourse,
    farEnd: setup.farEnd,
    routine: setup.routine,
    securityWaits,
    hasTSAPreCheck: setup.hasTSAPreCheck,
  });

  const wakeTime = breakdown.wakeUpTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleSyncClock = async () => {
    setSyncing(true);
    try {
      await syncToClockApp(breakdown.wakeUpTime, flight.flightNumber);
      setSynced(true);
    } finally {
      setSyncing(false);
    }
  };

  const lines = formatBreakdown(breakdown);

  // iOS label changes after first sync
  const syncLabel = Platform.OS === 'ios'
    ? (synced ? '✓  Sent to Shortcuts' : 'Sync to iPhone Clock')
    : (synced ? '✓  Alarm Set in Clock' : 'Set Alarm in Clock App');

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Recommended Wake-Up</Text>

      <Text style={styles.wakeTime}>{wakeTime}</Text>

      {/* Clock sync button */}
      <TouchableOpacity
        style={[styles.syncBtn, synced && styles.syncBtnDone, syncing && styles.syncBtnDisabled]}
        onPress={handleSyncClock}
        disabled={syncing}
        activeOpacity={0.8}
      >
        <Text style={styles.syncBtnIcon}>{synced ? '⏰' : '🔔'}</Text>
        <Text style={[styles.syncBtnText, synced && styles.syncBtnTextDone]}>
          {syncing ? 'Opening...' : syncLabel}
        </Text>
      </TouchableOpacity>

      {/* iOS hint */}
      {Platform.OS === 'ios' && !synced && (
        <Text style={styles.hint}>
          Uses Siri Shortcuts — one-time setup required
        </Text>
      )}

      {alarm?.isActive && (
        <View style={styles.alarmActiveBanner}>
          <Text style={styles.alarmActiveText}>In-app alarm also set for {wakeTime}</Text>
        </View>
      )}

      {/* Breakdown */}
      <View style={styles.breakdown}>
        {lines.map((line, i) => (
          <Text
            key={i}
            style={[
              styles.breakdownLine,
              line.startsWith('Wake') && styles.breakdownTotal,
              line.startsWith('─') && styles.breakdownDivider,
            ]}
          >
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Space.md,
    gap: Space.sm,
  },
  sectionLabel: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  wakeTime: {
    fontFamily: 'Syne-Bold',
    fontSize: 48,
    color: Colors.accent,
    letterSpacing: -1,
    textAlign: 'center',
    marginVertical: Space.sm,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 14,
  },
  syncBtnDone: {
    backgroundColor: Colors.green,
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnIcon: {
    fontSize: 18,
  },
  syncBtnText: {
    fontFamily: Font.mono,
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  syncBtnTextDone: {
    color: '#fff',
  },
  hint: {
    fontFamily: Font.mono,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: -Space.xs,
  },
  alarmActiveBanner: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.green,
    padding: Space.sm,
  },
  alarmActiveText: {
    fontFamily: Font.mono,
    fontSize: 12,
    color: Colors.green,
    textAlign: 'center',
  },
  breakdown: {
    marginTop: Space.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Space.md,
    gap: 4,
  },
  breakdownLine: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  breakdownTotal: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  breakdownDivider: {
    color: Colors.border,
  },
});
