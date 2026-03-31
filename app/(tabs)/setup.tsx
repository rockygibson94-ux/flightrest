import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Space, Radius, Font } from '../../src/constants/theme';
import { useFlightStore } from '../../src/store/flightStore';
import { useFlight } from '../../src/hooks/useFlight';
import {
  ATL_WALK_TIMES,
  BOARDING_ZONE_LABELS,
  type ATLConcourse,
  type BoardingZone,
} from '../../src/types';

const CONCOURSES: ATLConcourse[] = ['T', 'A', 'B', 'C', 'D', 'E', 'F'];
const ZONES: BoardingZone[] = ['preboard', 'zone1', 'zone2', 'zone3', 'zone4', 'lastcall'];

export default function SetupScreen() {
  const { setup, updateSetup, isLoadingFlight, flightError, flight } = useFlightStore();
  const { lookup } = useFlight();
  const [flightInput, setFlightInput] = useState(setup.flightNumber);

  const handleLookup = async () => {
    if (!flightInput.trim()) return;
    const num = flightInput.trim().toUpperCase();
    updateSetup({ flightNumber: num });
    await lookup(num);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>Setup</Text>

      {/* ── Flight Lookup ── */}
      <Section title="Flight">
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            value={flightInput}
            onChangeText={setFlightInput}
            placeholder="e.g. DL402"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={handleLookup}
          />
          <TouchableOpacity
            style={[styles.lookupBtn, isLoadingFlight && styles.lookupBtnDisabled]}
            onPress={handleLookup}
            disabled={isLoadingFlight}
            activeOpacity={0.8}
          >
            {isLoadingFlight
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.lookupBtnText}>Look Up</Text>
            }
          </TouchableOpacity>
        </View>

        {flightError ? (
          <Text style={styles.errorText}>{flightError}</Text>
        ) : null}

        {/* Confirmed flight summary */}
        {flight && !isLoadingFlight && !flightError && (
          <View style={styles.confirmedCard}>
            <Text style={styles.confirmedTitle}>
              {flight.flightNumber}  ·  {flight.origin} → {flight.destination}
            </Text>
            <Text style={styles.confirmedLine}>
              Departs {flight.estimatedDeparture.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              {'  ·  '}Boards {flight.boardingTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
            {(flight.gate || flight.terminal) && (
              <Text style={styles.confirmedLine}>
                {flight.terminal ? `Terminal ${flight.terminal}` : ''}
                {flight.terminal && flight.gate ? '  ·  ' : ''}
                {flight.gate ? `Gate ${flight.gate}` : ''}
              </Text>
            )}
            <Text style={[styles.confirmedStatus, { color: flight.status === 'delayed' ? Colors.yellow : Colors.green }]}>
              {flight.status.replace('_', ' ').toUpperCase()}
              {flight.delayMinutes > 0 ? ` +${flight.delayMinutes} min` : ''}
            </Text>
          </View>
        )}
      </Section>

      {/* ── Airport ── */}
      <Section title="Airport">
        <TextInput
          style={styles.input}
          value={setup.airport}
          onChangeText={(v) => updateSetup({ airport: v.toUpperCase() })}
          placeholder="IATA code (e.g. ATL)"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          maxLength={3}
        />
        <SwitchRow
          label="TSA PreCheck"
          value={setup.hasTSAPreCheck}
          onValueChange={(v) => updateSetup({ hasTSAPreCheck: v })}
        />
      </Section>

      {/* ── ATL Concourse ── */}
      {setup.airport === 'ATL' && (
        <Section title="ATL Concourse">
          <View style={styles.gridRow}>
            {CONCOURSES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.gridCell, setup.concourse === c && styles.gridCellSelected]}
                onPress={() => updateSetup({ concourse: c })}
                activeOpacity={0.7}
              >
                <Text style={[styles.gridCellLabel, setup.concourse === c && styles.gridCellLabelSelected]}>
                  {c}
                </Text>
                <Text style={styles.gridCellSub}>~{ATL_WALK_TIMES[c]}m</Text>
              </TouchableOpacity>
            ))}
          </View>
          <SwitchRow
            label="Far end of concourse (+5 min)"
            value={setup.farEnd}
            onValueChange={(v) => updateSetup({ farEnd: v })}
          />
        </Section>
      )}

      {/* ── Gate & Terminal ── */}
      <Section title="Gate & Terminal">
        {/* Terminal — auto-filled from FlightAware, read-only */}
        <View style={styles.autoRow}>
          <Text style={styles.autoLabel}>Terminal</Text>
          <View style={styles.autoValueWrap}>
            <Text style={[styles.autoValue, !flight?.terminal && styles.autoValueMuted]}>
              {flight?.terminal ?? (flight ? 'Not yet assigned' : '—')}
            </Text>
            {flight?.terminal && (
              <View style={styles.autoFilledBadge}>
                <Text style={styles.autoFilledText}>✓ Live</Text>
              </View>
            )}
          </View>
        </View>

        {/* Gate — auto-filled when available, editable as override */}
        <View style={styles.autoRow}>
          <Text style={styles.autoLabel}>Gate</Text>
          <View style={styles.autoValueWrap}>
            <TextInput
              style={[styles.gateInput, flight?.gate === setup.gateNumber && flight?.gate ? styles.gateInputAutoFilled : null]}
              value={setup.gateNumber}
              onChangeText={(v) => updateSetup({ gateNumber: v.toUpperCase() })}
              placeholder={flight ? (isLoadingFlight ? 'Fetching…' : 'Not yet assigned') : 'e.g. E14'}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              maxLength={6}
            />
            {flight?.gate && setup.gateNumber === flight.gate && (
              <View style={styles.autoFilledBadge}>
                <Text style={styles.autoFilledText}>✓ Live</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.autoHint}>
          Gate and terminal are pulled automatically from live flight data. You can override the gate if needed.
        </Text>
      </Section>

      {/* ── Boarding Zone ── */}
      <Section title="Boarding Zone">
        <View style={styles.zoneGrid}>
          {ZONES.map((z) => (
            <TouchableOpacity
              key={z}
              style={[styles.zoneCell, setup.boardingZone === z && styles.zoneCellSelected]}
              onPress={() => updateSetup({ boardingZone: z })}
              activeOpacity={0.7}
            >
              <Text style={[styles.zoneCellText, setup.boardingZone === z && styles.zoneCellTextSelected]}>
                {BOARDING_ZONE_LABELS[z]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* ── Morning Routine ── */}
      <Section title="Morning Routine">
        <SliderRow
          label="Wake buffer"
          value={setup.routine.wakeBufferMinutes}
          min={0} max={30} step={5}
          onChange={(v) => updateSetup({ routine: { ...setup.routine, wakeBufferMinutes: v } })}
        />
        <SliderRow
          label="Get ready"
          value={setup.routine.getReadyMinutes}
          min={15} max={120} step={5}
          onChange={(v) => updateSetup({ routine: { ...setup.routine, getReadyMinutes: v } })}
        />
        <SliderRow
          label="Drive to airport"
          value={setup.routine.driveMinutes}
          min={5} max={120} step={5}
          onChange={(v) => updateSetup({ routine: { ...setup.routine, driveMinutes: v } })}
        />
        <SliderRow
          label="Gate buffer"
          value={setup.routine.gateBufferMinutes}
          min={0} max={30} step={5}
          onChange={(v) => updateSetup({ routine: { ...setup.routine, gateBufferMinutes: v } })}
        />
      </Section>

      {/* ── Smart Alerts ── */}
      <Section title="Smart Alerts">
        <SwitchRow
          label="Auto-adjust for delays"
          value={setup.smartAlerts.autoAdjustDelays}
          onValueChange={(v) => updateSetup({ smartAlerts: { ...setup.smartAlerts, autoAdjustDelays: v } })}
        />
        <SwitchRow
          label="Auto-adjust for gate changes"
          value={setup.smartAlerts.autoAdjustGateChanges}
          onValueChange={(v) => updateSetup({ smartAlerts: { ...setup.smartAlerts, autoAdjustGateChanges: v } })}
        />
        <SwitchRow
          label="Alert on security spikes"
          value={setup.smartAlerts.autoAdjustSecuritySpikes}
          onValueChange={(v) => updateSetup({ smartAlerts: { ...setup.smartAlerts, autoAdjustSecuritySpikes: v } })}
        />
        <SwitchRow
          label="Alert on cancellations"
          value={setup.smartAlerts.notifyCancellations}
          onValueChange={(v) => updateSetup({ smartAlerts: { ...setup.smartAlerts, notifyCancellations: v } })}
        />
      </Section>

      {flight && (
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>See My Wake-Up Time →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SwitchRow({ label, value, onValueChange }: {
  label: string; value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.accent }} thumbColor="#fff" />
    </View>
  );
}

function SliderRow({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const steps = Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step);
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value} min</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepScroll}>
        <View style={styles.stepRow}>
          {steps.map((s) => (
            <TouchableOpacity key={s}
              style={[styles.stepPill, value === s && styles.stepPillSelected]}
              onPress={() => onChange(s)} activeOpacity={0.7}>
              <Text style={[styles.stepPillText, value === s && styles.stepPillTextSelected]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Space.md, paddingTop: 60, paddingBottom: 40, gap: Space.lg },
  screenTitle: { fontFamily: 'Syne-Bold', fontSize: 28, color: Colors.textPrimary, marginBottom: -Space.sm },
  section: { gap: Space.sm },
  sectionTitle: { fontFamily: Font.mono, fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2 },
  sectionBody: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Space.md, gap: Space.sm },
  row: { flexDirection: 'row', gap: Space.sm, alignItems: 'center' },
  input: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, padding: Space.sm, fontFamily: Font.mono, fontSize: 15, color: Colors.textPrimary },
  inputFlex: { flex: 1 },
  lookupBtn: { backgroundColor: Colors.accent, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: Space.sm, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
  lookupBtnDisabled: { opacity: 0.5 },
  lookupBtnText: { fontFamily: Font.mono, fontSize: 13, color: '#fff' },
  errorText: { fontFamily: Font.mono, fontSize: 12, color: Colors.red },
  confirmedCard: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.green, padding: Space.md, gap: 4 },
  confirmedTitle: { fontFamily: 'Syne-Bold', fontSize: 15, color: Colors.textPrimary },
  confirmedLine: { fontFamily: Font.mono, fontSize: 12, color: Colors.textSecondary },
  confirmedStatus: { fontFamily: Font.mono, fontSize: 11, letterSpacing: 1, marginTop: 2 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  gridCell: { width: 72, paddingVertical: Space.sm, alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  gridCellSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  gridCellLabel: { fontFamily: 'Syne-Bold', fontSize: 18, color: Colors.textSecondary },
  gridCellLabelSelected: { color: Colors.accent },
  gridCellSub: { fontFamily: Font.mono, fontSize: 10, color: Colors.textMuted },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontFamily: Font.sans, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  zoneCell: { paddingVertical: Space.sm, paddingHorizontal: Space.md, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  zoneCellSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  zoneCellText: { fontFamily: Font.mono, fontSize: 12, color: Colors.textSecondary },
  zoneCellTextSelected: { color: Colors.accent },
  sliderRow: { gap: 6 },
  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontFamily: Font.sans, fontSize: 13, color: Colors.textPrimary },
  sliderValue: { fontFamily: Font.mono, fontSize: 13, color: Colors.accent },
  stepScroll: { marginHorizontal: -Space.sm },
  stepRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Space.sm },
  stepPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  stepPillSelected: { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  stepPillText: { fontFamily: Font.mono, fontSize: 11, color: Colors.textSecondary },
  stepPillTextSelected: { color: Colors.accent },
  homeBtn: { backgroundColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: Space.md, alignItems: 'center' },
  homeBtnText: { fontFamily: Font.mono, fontSize: 15, color: '#fff', fontWeight: '700' },
  autoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  autoLabel: { fontFamily: Font.mono, fontSize: 12, color: Colors.textSecondary, width: 72 },
  autoValueWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Space.sm, justifyContent: 'flex-end' },
  autoValue: { fontFamily: Font.mono, fontSize: 14, color: Colors.textPrimary },
  autoValueMuted: { color: Colors.textMuted, fontSize: 12 },
  gateInput: { fontFamily: Font.mono, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 6, minWidth: 80, textAlign: 'center' },
  gateInputAutoFilled: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  autoHint: { fontFamily: Font.mono, fontSize: 10, color: Colors.textMuted, lineHeight: 15, marginTop: 2 },
  autoFilledBadge: { backgroundColor: Colors.accentDim, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.accent, paddingHorizontal: 8, paddingVertical: 4 },
  autoFilledText: { fontFamily: Font.mono, fontSize: 11, color: Colors.accent },
});
