import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/services/auth';
import { PlayerProvider } from '@/services/player';
import { registerForPushNotifications } from '@/services/notifications';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    InstrumentSerif_400Regular,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Guests get notifications too (the backend accepts a null uid) - never
    // gate this behind sign-in. Silently no-ops on simulators/denied
    // permission, see services/notifications.ts.
    registerForPushNotifications();
  }, []);

  const onReady = useCallback(async () => {
    if (loaded) await SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* SafeAreaProvider is what makes the notch, Dynamic Island, Samsung
          punch-hole and Android gesture bar all resolve to real insets. */}
      <SafeAreaProvider>
        <AuthProvider>
        <PlayerProvider>
        <View style={{ flex: 1, backgroundColor: colors.ground }} onLayout={onReady}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.ground },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding/index" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding/setup" />
            <Stack.Screen name="player/shorts" options={{ animation: 'fade' }} />
            <Stack.Screen name="player/message" />
            <Stack.Screen name="player/audio" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="live" />
            <Stack.Screen name="csg" />
            <Stack.Screen name="csg/[id]" />
            <Stack.Screen name="devotional" />
            <Stack.Screen name="gallery" />
            <Stack.Screen name="gallery/[id]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="prayer" options={{ presentation: 'modal' }} />
            <Stack.Screen name="contact" options={{ presentation: 'modal' }} />
            <Stack.Screen name="give/pay" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="give/receipt" options={{ animation: 'fade' }} />
            <Stack.Screen name="give/history" />
          </Stack>
        </View>
        </PlayerProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
