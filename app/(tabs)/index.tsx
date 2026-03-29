import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Space, Radius, Font } from '../../src/constants/theme';
import { useFlightStore } from '../../src/store/flightStore';
import { useFlight } from '../../src/hooks/useFlight';
import { useSecurityWaits } from '../../src/hooks/useSecurityWaits';
import FlightStatusCard from '../../src/components/FlightStatusCard';
import SecurityWaitCard from '../../src/components/SecurityWaitCard';
import AlarmRecommendation from '../../src/components/AlarmRecommendation';
import ConcourseMap from '../../src/components/ConcourseMap';

export default function HomeScreen() {
  const { flight, alarm, setup, isLoadingFlight } = useFlightStore();
  const { refresh: refreshFlight } = useFlight();
  const { refresh: refreshSecurity } = useSecurityWaits();
  const [refreshing, setRefreshing] = useState(false);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Pulse animation for active alarm
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!alarm?.isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [alarm?.isActive]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshFlight(), refreshSecurity()]);
    setRefreshing(false);
  };

  const hasSetup = !!setup.flightNumber;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
        />
      }
    >
      {/* Live Clock */}
      <View style={styles.clockRow}>
        <Text style={styles.clock}>
          {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </Text>
        <Text style={styles.clockDate}>
          {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      {/* App title */}
      <Text style={styles.appTitle}>FlightRest</Text>

      {!hasSetup ? (
        <NoFlightSetup />
      ) : (
        <>
          {/* Flight Status Card */}
          <FlightStatusCard flight={flight} loading={isLoadingFlight} />

          {/* Security Wait Cards */}
          <SecurityWaitCard airport={setup.airport} hasTSAPreCheck={setup.hasTSAPreCheck} />

          {/* ATL Concourse Map (ATL only) */}
          {setup.airport === 'ATL' && setup.concourse && (
            <ConcourseMap
              selectedConcourse={setup.concourse}
              gate={setup.gateNumber}
              farEnd={setup.farEnd}
            />
          )}

          {/* Alarm Recommendation */}
          {flight && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <AlarmRecommendation flight={flight} alarm={alarm} />
            </Animated.View>
          )}

          {/* Set Alarm Button */}
          <TouchableOpacity
            style={[styles.alarmBtn, alarm?.isActive && styles.alarmBtnActive]}
            onPress={() => router.push('/setup')}
            activeOpacity={0.8}
          >
            <Text style={styles.alarmBtnText}>
              {alarm?.isActive ? '⏰  Alarm Set — Tap to Adjust' : 'Set Alarm'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function NoFlightSetup() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>✈</Text>
      <Text style={styles.emptyTitle}>No flight set up</Text>
      <Text style={styles.emptyBody}>
        Tap Setup to add your flight and morning routine. FlightRest will calculate the latest
        possible wake-up time so you can sleep in.
      </Text>
      <TouchableOpacity
        style={styles.setupBtn}
        onPress={() => router.push('/setup')}
        activeOpacity={0.8}
      >
        <Text style={styles.setupBtnText}>Go to Setup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Space.md,
    paddingTop: 60,
    paddingBottom: 32,
    gap: Space.md,
  },
  clockRow: {
    alignItems: 'center',
    marginBottom: -4,
  },
  clock: {
    fontFamily: Font.mono,
    fontSize: 42,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  clockDate: {
    fontFamily: Font.mono,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  appTitle: {
    fontFamily: 'Syne-Bold',
    fontSize: 13,
    color: Colors.accent,
    textAlign: 'center',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: Space.sm,
  },
  alarmBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Space.md,
    alignItems: 'center',
    marginTop: Space.sm,
  },
  alarmBtnActive: {
    backgroundColor: Colors.green,
  },
  alarmBtnText: {
    fontFamily: Font.mono,
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Space.xl,
    gap: Space.md,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: 'Syne-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontFamily: Font.sans,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Space.lg,
  },
  setupBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.xl,
    marginTop: Space.sm,
  },
  setupBtnText: {
    fontFamily: Font.mono,
    fontSize: 14,
    color: '#fff',
  },
});
