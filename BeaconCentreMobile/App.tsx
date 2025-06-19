// App.tsx - SIMPLIFIED WITHOUT TRACKPLAYER
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
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
import { AudioContextProvider } from '@/context/AudioContext';
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
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);

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
        await NotificationService.getInstance().initialize();

        console.log('✅ App initialization completed');
      } catch (e) {
        console.warn('⚠️ App initialization error:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AppProvider>
                <OfflineProvider>
                  <AudioContextProvider>
                    <StatusBar style="auto" />
                    <AppNavigator />
                    
                    {/* Audio Player Components */}
                    <MiniPlayer onExpandPress={() => setAudioPlayerVisible(true)} />
                    <AudioPlayer 
                      visible={audioPlayerVisible} 
                      onClose={() => setAudioPlayerVisible(false)} 
                    />
                  </AudioContextProvider>
                </OfflineProvider>
              </AppProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});