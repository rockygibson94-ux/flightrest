import { View, Text, StyleSheet } from 'react-native';
import { Colors, Space, Radius, Font } from '../constants/theme';
import { ATL_WALK_TIMES, type ATLConcourse } from '../types';

const CONCOURSES: ATLConcourse[] = ['T', 'A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  selectedConcourse: ATLConcourse;
  gate: string;
  farEnd: boolean;
}

export default function ConcourseMap({ selectedConcourse, gate, farEnd }: Props) {
  const walkTime = ATL_WALK_TIMES[selectedConcourse] + (farEnd ? 5 : 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>ATL Plane Train Route</Text>

      {/* Linear concourse diagram */}
      <View style={styles.trainLine}>
        {CONCOURSES.map((c, i) => {
          const isSelected = c === selectedConcourse;
          const isPast =
            CONCOURSES.indexOf(c) < CONCOURSES.indexOf(selectedConcourse);

          return (
            <View key={c} style={styles.stopWrapper}>
              {/* Connector */}
              {i > 0 && (
                <View
                  style={[
                    styles.connector,
                    isPast && styles.connectorActive,
                    isSelected && styles.connectorActive,
                  ]}
                />
              )}
              {/* Stop dot */}
              <View
                style={[
                  styles.stopDot,
                  isPast && styles.stopDotPast,
                  isSelected && styles.stopDotSelected,
                ]}
              >
                <Text
                  style={[
                    styles.stopLabel,
                    isPast && styles.stopLabelPast,
                    isSelected && styles.stopLabelSelected,
                  ]}
                >
                  {c}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Walk time */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Gate {gate || selectedConcourse + '—'}</Text>
        <Text style={styles.walkTime}>~{walkTime} min walk</Text>
        {farEnd && <Text style={styles.farEndNote}>(far end)</Text>}
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
    gap: Space.md,
  },
  title: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  trainLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.sm,
  },
  stopWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
  },
  connectorActive: {
    backgroundColor: Colors.accent,
  },
  stopDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopDotPast: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  stopDotSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  stopLabel: {
    fontFamily: 'Syne-Bold',
    fontSize: 11,
    color: Colors.textMuted,
  },
  stopLabelPast: {
    color: Colors.accent,
  },
  stopLabelSelected: {
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  infoLabel: {
    fontFamily: Font.mono,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  walkTime: {
    fontFamily: Font.mono,
    fontSize: 13,
    color: Colors.accent,
  },
  farEndNote: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
