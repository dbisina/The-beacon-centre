// App.tsx - Main application entry point
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import 'react-native-url-polyfill/auto';

// Context Providers
import { AppProvider } from '@/context/AppContext';
import { AudioContextProvider } from '@/context/AudioContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { OfflineProvider } from '@/context/OfflineContext';

// Navigation
import AppNavigator from '@/navigation/AppNavigator';

// Services
import NotificationService from '@/services/notifications/NotificationService';
import TrackPlayerService from '@/services/audio/TrackPlayerService';
import OfflineManager from '@/services/storage/OfflineManager';

// Components
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Fonts
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  NotoSerif_400Regular,
  NotoSerif_700Bold,
} from '@expo-google-fonts/noto-serif';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize notification service
    const notificationService = NotificationService.getInstance();
    await notificationService.initialize();

    // Initialize offline manager
    const offlineManager = OfflineManager.getInstance();
    
    // Initialize audio service
    if (Platform.OS !== 'web') {
      const audioService = TrackPlayerService.getInstance();
      await audioService.setup();
    }

    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          Poppins_400Regular,
          Poppins_500Medium,
          Poppins_600SemiBold,
          Poppins_700Bold,
          NotoSerif_400Regular,
          NotoSerif_700Bold,
        });

        // Initialize services
        await initializeServices();

        // Artificial delay for splash screen (optional)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('App preparation error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <OfflineProvider>
                <AppProvider>
                  <AudioContextProvider>
                    <AppNavigator />
                    <StatusBar style="auto" />
                  </AudioContextProvider>
                </AppProvider>
              </OfflineProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}