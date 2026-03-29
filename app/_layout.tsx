import { useEffect } from 'react';
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
import { useFlightStore } from '../src/store/flightStore';
import { registerBackgroundFetch } from '../src/tasks/backgroundFetch';
import { Colors } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadFromStorage = useFlightStore((s) => s.loadFromStorage);

  const [fontsLoaded] = useFonts({
    SpaceMono: SpaceMono_400Regular,
    Syne: Syne_400Regular,
    'Syne-Bold': Syne_700Bold,
  });

  useEffect(() => {
    loadFromStorage();
    registerBackgroundFetch();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

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
    </>
  );
}
