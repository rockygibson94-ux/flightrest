import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  SpaceMono_400Regular,
} from '@expo-google-fonts/space-mono';
import {
  Syne_400Regular,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFlightStore } from '../src/store/flightStore';
import { registerBackgroundFetch } from '../src/tasks/backgroundFetch';
import { Colors } from '../src/constants/theme';
import DisclaimerModal, { DISCLAIMER_KEY } from '../src/components/DisclaimerModal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadFromStorage = useFlightStore((s) => s.loadFromStorage);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceMono: SpaceMono_400Regular,
    Syne: Syne_400Regular,
    'Syne-Bold': Syne_700Bold,
  });

  useEffect(() => {
    loadFromStorage();
    registerBackgroundFetch();

    // Check if user has already accepted the current disclaimer version
    AsyncStorage.getItem(DISCLAIMER_KEY).then((accepted) => {
      if (!accepted) setDisclaimerVisible(true);
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleDisclaimerAccept = async () => {
    await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
    setDisclaimerVisible(false);
  };

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <DisclaimerModal
        visible={disclaimerVisible}
        onAccept={handleDisclaimerAccept}
      />
    </>
  );
}
