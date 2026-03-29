import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Space, Radius, Font } from '../constants/theme';
import { useFlightStore } from '../store/flightStore';

interface Props {
  airport: string;
  hasTSAPreCheck: boolean;
}

export default function SecurityWaitCard({ airport, hasTSAPreCheck }: Props) {
  const { securityWaits, isLoadingSecurity } = useFlightStore();

  const waits = securityWaits.filter((w) => w.airport === airport.toUpperCase());

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Security Wait · {airport.toUpperCase()}</Text>
        {hasTSAPreCheck && (
          <View style={styles.preCheckBadge}>
            <Text style={styles.preCheckText}>PreCheck</Text>
          </View>
        )}
      </View>

      {isLoadingSecurity ? (
        <ActivityIndicator color={Colors.accent} style={{ marginVertical: Space.sm }} />
      ) : waits.length === 0 ? (
        <Text style={styles.noDataText}>No live data available</Text>
      ) : (
        waits.map((w, i) => {
          const displayWait = hasTSAPreCheck
            ? Math.round(w.waitMinutes * 0.4)
            : w.waitMinutes;
          const color = displayWait < 15 ? Colors.green : displayWait < 25 ? Colors.yellow : Colors.red;

          return (
            <View key={i} style={styles.waitRow}>
              <Text style={styles.checkpointName}>{w.checkpoint}</Text>
              <View style={styles.waitRight}>
                <Text style={[styles.waitMinutes, { color }]}>{displayWait}</Text>
                <Text style={styles.waitUnit}>min</Text>
                <SourceDot source={w.source} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function SourceDot({ source }: { source: 'mytsa' | 'atl_live' }) {
  return (
    <View style={[styles.sourceDot, { backgroundColor: source === 'atl_live' ? Colors.green : Colors.accent }]} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  preCheckBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  preCheckText: {
    fontFamily: Font.mono,
    fontSize: 10,
    color: Colors.accent,
  },
  noDataText: {
    fontFamily: Font.mono,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Space.sm,
  },
  waitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkpointName: {
    fontFamily: Font.sans,
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  waitRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  waitMinutes: {
    fontFamily: Font.mono,
    fontSize: 22,
    fontWeight: '700',
  },
  waitUnit: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
});
