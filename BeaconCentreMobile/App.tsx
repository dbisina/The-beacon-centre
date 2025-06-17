// App.tsx - COMPLETE EXPO-AUDIO IMPLEMENTATION
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// CRITICAL: Import crypto polyfills
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Context Providers
import { AppProvider } from '@/context/AppContext';
import { AudioContextProvider } from '@/context/AudioContext'; // ← Uses expo-audio
import { ThemeProvider } from '@/context/ThemeContext';
import { OfflineProvider } from '@/context/OfflineContext';

// Navigation
import AppNavigator from '@/navigation/AppNavigator';

// Services
import NotificationService from '@/services/notifications/NotificationService';
import OfflineManager from '@/services/storage/OfflineManager';

// Audio Components
import MiniPlayer from '@/components/audio/MiniPlayer';
import AudioPlayer from '@/components/audio/AudioPlayer';

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
      // Initialize notification service
      const notificationService = NotificationService.getInstance();
      await notificationService.initialize();
      console.log('✅ Notification service initialized');
    }

    // Initialize offline manager
    const offlineManager = OfflineManager.getInstance();
    console.log('✅ Offline manager initialized');
    
    console.log('🎉 All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
};

// Audio Layer Component (inside AudioContext)
const AudioLayer: React.FC = () => {
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  return (
    <>
      {/* Mini Player - Floats over content when audio is playing */}
      <MiniPlayer 
        onExpandPress={() => setShowFullPlayer(true)}
      />
      
      {/* Full Audio Player Modal */}
      <AudioPlayer
        visible={showFullPlayer}
        onClose={() => setShowFullPlayer(false)}
      />
    </>
  );
};

// Main App Content Component (inside all providers)
const AppContent: React.FC = () => {
  return (
    <View style={styles.container}>
      <AppNavigator />
      <AudioLayer />
    </View>
  );
};

// Main App Component
const App: React.FC = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Initializing The Beacon Centre App...');
        
        // Load fonts
        console.log('📝 Loading fonts...');
        await Font.loadAsync({
          Poppins_400Regular,
          Poppins_500Medium,
          Poppins_600SemiBold,
          Poppins_700Bold,
          NotoSerif_400Regular,
          NotoSerif_700Bold,
        });
        console.log('✅ Fonts loaded successfully');

        // Initialize services
        console.log('⚙️ Initializing services...');
        await initializeServices();

        console.log('🎉 App initialized successfully');
      } catch (error) {
        console.error('❌ App initialization error:', error);
        // Don't fail completely - continue with limited functionality
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      console.log('🎬 Hiding splash screen...');
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.rootContainer} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AppProvider>
                <OfflineProvider>
                  <AudioContextProvider> {/* ← expo-audio powered */}
                    <AppContent />
                    <StatusBar style="auto" />
                  </AudioContextProvider>
                </OfflineProvider>
              </AppProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});

export default App;