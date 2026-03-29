import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors, Space, Radius, Font } from '../../src/constants/theme';
import { useFlightStore } from '../../src/store/flightStore';
import type { FlightRecord } from '../../src/types';

export default function HistoryScreen() {
  const history = useFlightStore((s) => s.history);

  const stats = computeStats(history);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>History</Text>

      {/* Stats Panel */}
      <View style={styles.statsGrid}>
        <StatCell label="Flights Made" value={`${stats.flightsMade}`} color={Colors.green} />
        <StatCell label="Avg Sleep Saved" value={`${stats.avgSleepSaved}m`} color={Colors.accent} />
        <StatCell label="Auto-Adjustments" value={`${stats.autoAdjustments}`} color={Colors.yellow} />
        <StatCell label="Gate Changes" value={`${stats.gateChangesCaught}`} color={Colors.textSecondary} />
      </View>

      {/* Flight Records */}
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No flights yet. Your history will appear here.</Text>
        </View>
      ) : (
        history.map((record) => <FlightRow key={record.id} record={record} />)
      )}
    </ScrollView>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FlightRow({ record }: { record: FlightRecord }) {
  const date = record.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const alarmTime = record.alarmTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={styles.flightRow}>
      <View style={styles.flightRowLeft}>
        <Text style={styles.flightNumber}>{record.flightNumber}</Text>
        <Text style={styles.flightRoute}>
          {record.origin} → {record.destination}
        </Text>
        <Text style={styles.flightDate}>{date}</Text>
      </View>

      <View style={styles.flightRowRight}>
        <Text style={styles.alarmTime}>{alarmTime}</Text>
        <View style={styles.badges}>
          <Badge
            label={record.madeItOnTime ? 'Made it' : 'Missed'}
            color={record.madeItOnTime ? Colors.green : Colors.red}
          />
          {record.sleepSavedMinutes > 0 && (
            <Badge label={`+${record.sleepSavedMinutes}m sleep`} color={Colors.accent} />
          )}
          {record.autoAdjustments > 0 && (
            <Badge label={`${record.autoAdjustments} adj`} color={Colors.yellow} />
          )}
        </View>
      </View>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function computeStats(history: FlightRecord[]) {
  if (!history.length) {
    return { flightsMade: 0, avgSleepSaved: 0, autoAdjustments: 0, gateChangesCaught: 0 };
  }
  const flightsMade = history.filter((r) => r.madeItOnTime).length;
  const avgSleepSaved = Math.round(
    history.reduce((acc, r) => acc + r.sleepSavedMinutes, 0) / history.length
  );
  const autoAdjustments = history.reduce((acc, r) => acc + r.autoAdjustments, 0);
  const gateChangesCaught = history.filter((r) => r.gateChangesCaught).length;
  return { flightsMade, avgSleepSaved, autoAdjustments, gateChangesCaught };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Space.md, paddingTop: 60, paddingBottom: 40, gap: Space.md },
  screenTitle: {
    fontFamily: 'Syne-Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: Space.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Space.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: Font.mono,
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: Font.mono,
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  flightRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Space.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Space.md,
  },
  flightRowLeft: { gap: 4 },
  flightNumber: {
    fontFamily: 'Syne-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  flightRoute: {
    fontFamily: Font.mono,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  flightDate: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.textMuted,
  },
  flightRowRight: { alignItems: 'flex-end', gap: 6 },
  alarmTime: {
    fontFamily: Font.mono,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: Font.mono,
    fontSize: 10,
  },
  emptyState: { alignItems: 'center', paddingVertical: Space.xl, gap: Space.md },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontFamily: Font.sans,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
