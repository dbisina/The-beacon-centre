// App.tsx - FIXED VERSION WITH MINI PLAYER
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// CRITICAL FIX: Import crypto polyfill for UUID
import 'react-native-get-random-values';
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

// NEW: Audio Components
import MiniPlayer from '@/components/audio/MiniPlayer';
import AudioPlayer from '@/components/audio/AudioPlayer';
import { useAudio } from '@/context/AudioContext';

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
    if (Platform.OS !== 'web') {
      const notificationService = NotificationService.getInstance();
      await notificationService.initialize();

      const audioService = TrackPlayerService.getInstance();
      await audioService.setup();
    }

    const offlineManager = OfflineManager.getInstance();
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// NEW: Audio Layer Component (inside AudioContext)
const AudioLayer: React.FC = () => {
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const { currentSermon, isPlayerVisible } = useAudio();

  return (
    <>
      {/* Mini Player - Shows when audio is playing */}
      {isPlayerVisible && currentSermon && (
        <MiniPlayer 
          onExpandPress={() => setShowFullPlayer(true)}
          visible={isPlayerVisible}
        />
      )}
      
      {/* Full Audio Player Modal */}
      <AudioPlayer
        visible={showFullPlayer}
        onClose={() => setShowFullPlayer(false)}
      />
    </>
  );
};

// Main App Component
const AppContent: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
      
      {/* NEW: Audio Layer with Mini Player */}
      <AudioLayer />
    </View>
  );
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize services
        await initializeServices();

        // Pre-load fonts
        await Font.loadAsync({
          Poppins_400Regular,
          Poppins_500Medium,
          Poppins_600SemiBold,
          Poppins_700Bold,
          NotoSerif_400Regular,
          NotoSerif_700Bold,
        });

        console.log('App initialized successfully');
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <LoadingSpinner />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <ThemeProvider>
              <OfflineProvider>
                <AppProvider>
                  <AudioContextProvider>
                    <AppContent />
                    <StatusBar style="auto" />
                  </AudioContextProvider>
                </AppProvider>
              </OfflineProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}