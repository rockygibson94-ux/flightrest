import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Space, Radius, Font } from '../constants/theme';
import type { Flight } from '../types';

interface Props {
  flight: Flight | null;
  loading: boolean;
}

export default function FlightStatusCard({ flight, loading }: Props) {
  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator color={Colors.accent} />
        <Text style={styles.loadingText}>Fetching flight data...</Text>
      </View>
    );
  }

  if (!flight) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text style={styles.noFlightText}>No flight data</Text>
      </View>
    );
  }

  const statusColor = {
    scheduled: Colors.green,
    delayed: Colors.yellow,
    cancelled: Colors.red,
    landed: Colors.textSecondary,
    en_route: Colors.accent,
  }[flight.status];

  const departureTime = flight.estimatedDeparture.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const boardingTime = flight.boardingTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {flight.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <Text style={styles.airportCode}>{flight.origin}</Text>
        <Text style={styles.arrow}>──────→</Text>
        <Text style={styles.airportCode}>{flight.destination}</Text>
      </View>

      {/* Key times */}
      <View style={styles.timesRow}>
        <TimeBlock label="Departs" value={departureTime} />
        <TimeBlock label="Boarding" value={boardingTime} highlight />
        {flight.gate && <TimeBlock label="Gate" value={flight.gate} />}
      </View>

      {/* Delay notice */}
      {flight.delayMinutes > 0 && (
        <View style={styles.delayBanner}>
          <Text style={styles.delayText}>
            Delayed {flight.delayMinutes} min — alarm auto-adjusting
          </Text>
        </View>
      )}
    </View>
  );
}

function TimeBlock({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.timeBlock}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={[styles.timeValue, highlight && styles.timeValueHighlight]}>{value}</Text>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Space.lg,
  },
  loadingText: {
    fontFamily: Font.mono,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Space.sm,
  },
  noFlightText: {
    fontFamily: Font.mono,
    fontSize: 13,
    color: Colors.textMuted,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flightNumber: {
    fontFamily: 'Syne-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statusText: {
    fontFamily: Font.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  airportCode: {
    fontFamily: 'Syne-Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  arrow: {
    fontFamily: Font.mono,
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Space.xs,
  },
  timeBlock: { alignItems: 'center', gap: 2 },
  timeLabel: {
    fontFamily: Font.mono,
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeValue: {
    fontFamily: Font.mono,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  timeValueHighlight: {
    color: Colors.accent,
    fontSize: 18,
  },
  delayBanner: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.yellow,
    padding: Space.sm,
  },
  delayText: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.yellow,
    textAlign: 'center',
  },
});
