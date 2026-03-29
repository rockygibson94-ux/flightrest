/**
 * Clock sync — sends the wake-up time to the device's native alarm system.
 *
 * iOS:   Triggers a Siri Shortcut named "FlightRest" with the time as input.
 *        The shortcut runs "Set Alarm" → wired to Shortcut Input.
 *        One-time setup required (we walk the user through it).
 *
 * Android: Uses the SET_ALARM intent — pre-fills hour/minute directly,
 *           no setup needed.
 *
 * Web:   Not supported (shows instructions instead).
 */

import { Linking, Platform, Alert } from 'react-native';

const SHORTCUT_NAME = 'FlightRest';

export async function syncToClockApp(wakeUpTime: Date, flightNumber: string): Promise<void> {
  const hours = wakeUpTime.getHours();
  const minutes = wakeUpTime.getMinutes();
  const timeStr = wakeUpTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (Platform.OS === 'android') {
    await syncAndroid(hours, minutes, flightNumber);
  } else if (Platform.OS === 'ios') {
    await syncIOS(timeStr, flightNumber);
  } else {
    // Web preview — show instructions
    Alert.alert(
      'Clock Sync',
      `Set your alarm for ${timeStr} in your phone's Clock app.`,
      [{ text: 'Got it' }]
    );
  }
}

// ─── Android ─────────────────────────────────────────────────────────────────
// SET_ALARM intent opens the native alarm UI pre-filled with the time.

async function syncAndroid(hours: number, minutes: number, flightNumber: string) {
  const url =
    `intent:#Intent;` +
    `action=android.intent.action.SET_ALARM;` +
    `S.android.intent.extra.alarm.MESSAGE=FlightRest%20${encodeURIComponent(flightNumber)};` +
    `i.android.intent.extra.alarm.HOUR=${hours};` +
    `i.android.intent.extra.alarm.MINUTES=${minutes};` +
    `Z.android.intent.extra.alarm.SKIP_UI=false;` +
    `end`;

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Could not open Clock app', 'Please set your alarm manually.');
  }
}

// ─── iOS ──────────────────────────────────────────────────────────────────────
// Triggers the "FlightRest" Siri Shortcut with the wake-up time as input.
// If the shortcut isn't set up yet, shows a step-by-step setup guide.

async function syncIOS(timeStr: string, flightNumber: string) {
  const shortcutUrl = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=${encodeURIComponent(timeStr)}`;
  const clockUrl = 'clock-alarm://';

  const canRunShortcut = await Linking.canOpenURL('shortcuts://');

  if (!canRunShortcut) {
    // Very old iOS — fall back to just opening Clock
    await Linking.openURL(clockUrl);
    return;
  }

  // Check if user has done first-time setup
  const hasSetup = await getShortcutSetupComplete();

  if (!hasSetup) {
    showShortcutSetupGuide(timeStr, shortcutUrl);
    return;
  }

  // Run the shortcut with the wake-up time
  try {
    await Linking.openURL(shortcutUrl);
  } catch {
    // Shortcut not found — prompt re-setup
    clearShortcutSetupFlag();
    showShortcutSetupGuide(timeStr, shortcutUrl);
  }
}

function showShortcutSetupGuide(timeStr: string, shortcutUrl: string) {
  Alert.alert(
    'One-Time Setup Required',
    [
      '1. Open the Shortcuts app',
      '2. Tap  +  to create a new shortcut',
      '3. Search for "Set Alarm" and add it',
      '4. Tap the time field → choose "Shortcut Input"',
      '5. Tap the shortcut name → rename it "FlightRest"',
      '6. Tap Done',
      '',
      'After that, FlightRest will automatically set your alarm every time.',
    ].join('\n'),
    [
      {
        text: 'Open Shortcuts App',
        onPress: async () => {
          await Linking.openURL('shortcuts://');
        },
      },
      {
        text: 'Already Done — Set Alarm Now',
        onPress: async () => {
          await markShortcutSetupComplete();
          await Linking.openURL(shortcutUrl);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]
  );
}

// ─── Setup flag (AsyncStorage-free, in-memory for now) ───────────────────────
// In production, persist this to AsyncStorage.

let _setupComplete = false;

async function getShortcutSetupComplete(): Promise<boolean> {
  return _setupComplete;
}

async function markShortcutSetupComplete(): Promise<void> {
  _setupComplete = true;
}

function clearShortcutSetupFlag() {
  _setupComplete = false;
}
