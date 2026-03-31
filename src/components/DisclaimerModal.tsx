/**
 * DisclaimerModal
 *
 * Shown on first launch. User must scroll to the bottom before the
 * "I Understand & Agree" button activates. Acceptance is stored in
 * AsyncStorage so it only appears once (per disclaimer version).
 */

import { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Colors, Font, Radius, Space } from '../constants/theme';

// Bump this string any time the disclaimer text changes — users will be
// re-prompted to accept the updated version.
export const DISCLAIMER_VERSION = 'v1.0';
export const DISCLAIMER_KEY = `disclaimer_accepted_${DISCLAIMER_VERSION}`;

interface Props {
  visible: boolean;
  onAccept: () => void;
}

export default function DisclaimerModal({ visible, onAccept }: Props) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 30;
    if (isAtBottom) setScrolledToBottom(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>✈ FlightRest</Text>
          <Text style={styles.headerSub}>Before you use the app, please read this carefully.</Text>
        </View>

        {/* Scrollable disclaimer body */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          showsVerticalScrollIndicator
        >
          <Section title="What FlightRest Does">
            FlightRest helps you calculate the latest possible time you can wake up and still
            make your flight. It does this by combining publicly available data from multiple
            sources and working backwards from your flight's boarding time through every step
            of your morning — getting ready, driving to the airport, clearing security, and
            walking to your gate.
          </Section>

          <Section title="How the Wake-Up Time Is Calculated">
            Your wake-up recommendation is built from the following inputs:{'\n\n'}
            <BulletList items={[
              'Live flight departure and boarding times from FlightAware AeroAPI',
              'Live TSA security checkpoint wait times from the MyTSA Web Service (operated by the U.S. Department of Homeland Security)',
              'For Atlanta Hartsfield-Jackson (ATL): live checkpoint times from ATL\'s own published feed',
              'Your personal morning routine preferences (get-ready time, drive time, gate buffer) that you configure in the app',
              'Historical wait time patterns based on airport size, time of day, and day of week — used when live security data is unavailable or outdated',
              'Your boarding zone and concourse/gate location',
            ]} />
            {'\n'}
            The result is an <Bold>estimate</Bold> — not a guarantee.
          </Section>

          <Section title="This App Provides Estimates Only">
            FlightRest is a <Bold>planning aid</Bold>, not a flight management system. The
            wake-up time it recommends is an approximation based on the best data available
            at the time of calculation. Real-world conditions — including but not limited to
            traffic, weather, TSA staffing levels, gate changes, airport construction, and
            equipment delays — can change rapidly and without notice.{'\n\n'}
            <Bold>FlightRest does not guarantee that following its recommendations will
            result in you making your flight.</Bold>{'\n\n'}
            You are solely responsible for determining how much time you need to reach the
            airport and board your flight. We strongly recommend always building in your own
            personal safety buffer beyond what the app suggests.
          </Section>

          <Section title="Data Sources and Accuracy">
            All data displayed in FlightRest is sourced from publicly available third-party
            services:{'\n\n'}
            <BulletList items={[
              'Flight data: FlightAware AeroAPI (flightaware.com)',
              'Security wait times: MyTSA Web Service (tsa.gov)',
              'ATL checkpoint data: Hartsfield-Jackson Atlanta International Airport (atl.com)',
            ]} />
            {'\n'}
            FlightRest does not own, operate, or control any of these data sources. We cannot
            guarantee their accuracy, completeness, timeliness, or availability. These services
            may be temporarily unavailable, delayed, or inaccurate due to technical issues,
            staffing constraints, or government operations beyond our control.
          </Section>

          <Section title="Limitation of Liability">
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW:{'\n\n'}
            FlightRest and its developers shall not be liable for any missed flights, travel
            disruptions, financial losses, consequential damages, or any other losses of any
            kind arising from your use of this application or reliance on its recommendations.{'\n\n'}
            This includes, without limitation, situations where:{'\n\n'}
            <BulletList items={[
              'TSA wait times were longer than estimated',
              'Your flight\'s boarding time or gate changed after the alarm was set',
              'Live data was unavailable and historical estimates were used',
              'Unexpected traffic or road conditions increased your drive time',
              'Any third-party data source provided inaccurate or delayed information',
            ]} />
            {'\n'}
            YOUR USE OF FLIGHTREST IS AT YOUR OWN RISK. THIS APPLICATION IS PROVIDED "AS IS"
            WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          </Section>

          <Section title="No Substitute for Personal Judgment">
            No app can account for every variable of air travel. FlightRest is designed to
            help you sleep in a little more confidently — not to replace common sense.{'\n\n'}
            Always check your flight status directly with your airline before departure.
            Always allow yourself time you are personally comfortable with. If you have a
            critical flight (connecting international travel, important business meeting, etc.),
            give yourself extra buffer beyond what this app recommends.
          </Section>

          <Section title="By Using FlightRest, You Acknowledge">
            <BulletList items={[
              'Wake-up times are estimates based on publicly available data and your personal preferences',
              'You are solely responsible for arriving at the airport on time',
              'FlightRest is not liable for missed flights or related damages',
              'You have read and understood this disclaimer in full',
            ]} />
          </Section>

          {/* Scroll prompt */}
          {!scrolledToBottom && (
            <Text style={styles.scrollHint}>↓ Scroll to continue</Text>
          )}
        </ScrollView>

        {/* Accept button — only active after scrolling to bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.agreeBtn, !scrolledToBottom && styles.agreeBtnDisabled]}
            onPress={onAccept}
            disabled={!scrolledToBottom}
            activeOpacity={0.8}
          >
            <Text style={styles.agreeBtnText}>
              {scrolledToBottom ? 'I Understand & Agree →' : 'Read the full disclaimer above'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            You must scroll through and acknowledge this disclaimer to use FlightRest.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ─── Helper sub-components ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, i) => (
        <Text key={i} style={styles.bullet}>{`  •  ${item}`}</Text>
      ))}
    </>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Space.lg,
    paddingHorizontal: Space.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  logo: {
    fontFamily: 'Syne-Bold',
    fontSize: 24,
    color: Colors.accent,
    marginBottom: 6,
  },
  headerSub: {
    fontFamily: Font.sans,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Space.lg,
    paddingBottom: Space.xl ?? 40,
    gap: Space.lg,
  },
  section: {
    gap: 8,
    marginBottom: Space.md,
  },
  sectionTitle: {
    fontFamily: 'Syne-Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sectionBody: {
    fontFamily: Font.sans,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  bullet: {
    fontFamily: Font.sans,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontFamily: Font.mono,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  scrollHint: {
    textAlign: 'center',
    fontFamily: Font.mono,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Space.md,
    marginBottom: Space.sm,
  },
  footer: {
    paddingHorizontal: Space.lg,
    paddingTop: Space.lg,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Space.sm,
    alignItems: 'stretch',
  },
  agreeBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  agreeBtnDisabled: {
    backgroundColor: Colors.border,
  },
  agreeBtnText: {
    fontFamily: Font.mono,
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  footerNote: {
    fontFamily: Font.mono,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    width: '100%',
  },
});
