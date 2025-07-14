// BeaconCentreMobile/src/context/AppContext.tsx - PERFORMANCE OPTIMIZED
import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import { LocalUserData } from '@/types/storage';
import LocalStorageService from '@/services/storage/LocalStorage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { apiClient } from '@/services/api/client';

// Enhanced App State Interface
interface AppContextState {
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  isRefreshing: boolean;
  
  // Network state
  isOnline: boolean;
  networkType: string | null;
  isInternetReachable: boolean | null;
  
  // User data
  userData: LocalUserData | null;
  
  // Error state
  error: string | null;
  lastError: Error | null;
  
  // App lifecycle
  appState: AppStateStatus;
  isBackground: boolean;
  lastActiveTime: number;
  
  // Performance metrics
  performanceMetrics: {
    appStartTime: number;
    lastSyncTime: number;
    cacheSize: number;
    apiCallsCount: number;
  };
}

// Action Types
type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_NETWORK_STATE'; payload: { isOnline: boolean; networkType: string | null; isInternetReachable: boolean | null } }
  | { type: 'SET_USER_DATA'; payload: LocalUserData }
  | { type: 'UPDATE_USER_DATA'; payload: Partial<LocalUserData> }
  | { type: 'SET_ERROR'; payload: { message: string | null; error?: Error } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_APP_STATE'; payload: AppStateStatus }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<LocalUserData['appSettings']> }
  | { type: 'UPDATE_PERFORMANCE_METRICS'; payload: Partial<AppContextState['performanceMetrics']> }
  | { type: 'INCREMENT_API_CALLS' };

// Initial State
const initialState: AppContextState = {
  isLoading: true,
  isInitialized: false,
  isRefreshing: false,
  isOnline: true,
  networkType: null,
  isInternetReachable: null,
  userData: null,
  error: null,
  lastError: null,
  appState: 'active',
  isBackground: false,
  lastActiveTime: Date.now(),
  performanceMetrics: {
    appStartTime: Date.now(),
    lastSyncTime: 0,
    cacheSize: 0,
    apiCallsCount: 0,
  },
};

// Enhanced Reducer
function appReducer(state: AppContextState, action: AppAction): AppContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { 
        ...state, 
        isLoading: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting to load
      };
      
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
      
    case 'SET_INITIALIZED':
      return { 
        ...state, 
        isInitialized: action.payload,
        isLoading: action.payload ? false : state.isLoading,
      };
      
    case 'SET_NETWORK_STATE':
      const wasOffline = !state.isOnline;
      const isNowOnline = action.payload.isOnline;
      
      return { 
        ...state, 
        isOnline: isNowOnline,
        networkType: action.payload.networkType,
        isInternetReachable: action.payload.isInternetReachable,
        performanceMetrics: {
          ...state.performanceMetrics,
          lastSyncTime: wasOffline && isNowOnline ? Date.now() : state.performanceMetrics.lastSyncTime,
        },
      };
      
    case 'SET_USER_DATA':
      return { 
        ...state, 
        userData: action.payload,
        error: null, // Clear any previous errors
      };
      
    case 'UPDATE_USER_DATA':
      return {
        ...state,
        userData: state.userData ? { ...state.userData, ...action.payload } : null,
      };
      
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload.message,
        lastError: action.payload.error || null,
        isLoading: false,
      };
      
    case 'CLEAR_ERROR':
      return { 
        ...state, 
        error: null,
        lastError: null,
      };
      
    case 'SET_APP_STATE':
      return { 
        ...state, 
        appState: action.payload,
        isBackground: action.payload === 'background' || action.payload === 'inactive',
        lastActiveTime: action.payload === 'active' ? Date.now() : state.lastActiveTime,
      };
      
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        userData: state.userData ? {
          ...state.userData,
          appSettings: { ...state.userData.appSettings, ...action.payload }
        } : null,
      };
      
    case 'UPDATE_PERFORMANCE_METRICS':
      return {
        ...state,
        performanceMetrics: { ...state.performanceMetrics, ...action.payload }
      };
      
    case 'INCREMENT_API_CALLS':
      return {
        ...state,
        performanceMetrics: {
          ...state.performanceMetrics,
          apiCallsCount: state.performanceMetrics.apiCallsCount + 1,
        }
      };
      
    default:
      return state;
  }
}

// Context Interface
interface AppContextValue {
  state: AppContextState;
  dispatch: React.Dispatch<AppAction>;
  
  // Enhanced Actions
  refreshUserData: () => Promise<void>;
  updateSettings: (settings: Partial<LocalUserData['appSettings']>) => Promise<void>;
  markDevotionalRead: (devotionalId: number) => Promise<void>;
  addFavorite: (type: 'devotional' | 'video' | 'audio', id: number) => Promise<void>;
  removeFavorite: (type: 'devotional' | 'video' | 'audio', id: number) => Promise<void>;
  clearError: () => void;
  forceRefresh: () => Promise<void>;
  
  // Performance Actions
  getPerformanceMetrics: () => AppContextState['performanceMetrics'];
  clearCache: () => Promise<void>;
  
  // Utility Actions
  isDeviceOnline: () => boolean;
  getNetworkInfo: () => { type: string | null; isReachable: boolean | null };
}

// Create Context
const AppContext = createContext<AppContextValue>({
  state: initialState,
  dispatch: () => null,
  refreshUserData: async () => {},
  updateSettings: async () => {},
  markDevotionalRead: async () => {},
  addFavorite: async () => {},
  removeFavorite: async () => {},
  clearError: () => {},
  forceRefresh: async () => {},
  getPerformanceMetrics: () => initialState.performanceMetrics,
  clearCache: async () => {},
  isDeviceOnline: () => true,
  getNetworkInfo: () => ({ type: null, isReachable: null }),
});

// Provider Component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const initializationRef = useRef(false);
  const performanceTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // NETWORK MONITORING
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      dispatch({
        type: 'SET_NETWORK_STATE',
        payload: {
          isOnline: netState.isConnected ?? false,
          networkType: netState.type,
          isInternetReachable: netState.isInternetReachable,
        }
      });
    });

    return unsubscribe;
  }, []);

  // APP STATE MONITORING
  useEffect(() => {
    const subscription = RNAppState.addEventListener('change', (nextAppState) => {
      console.log(`📱 App state changed: ${state.appState} -> ${nextAppState}`);
      dispatch({ type: 'SET_APP_STATE', payload: nextAppState });
      
      // Refresh data when app becomes active again after being in background
      if (state.appState === 'background' && nextAppState === 'active') {
        const timeSinceLastActive = Date.now() - state.lastActiveTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceLastActive > fiveMinutes && state.isOnline) {
          console.log('🔄 App active after 5+ minutes, refreshing data...');
          refreshUserData();
        }
      }
    });

    return () => subscription?.remove();
  }, [state.appState, state.lastActiveTime, state.isOnline]);

  // PERFORMANCE MONITORING
  useEffect(() => {
    // Update performance metrics every 30 seconds
    performanceTimerRef.current = setInterval(async () => {
      try {
        const cacheSize = await apiClient.getCacheSize();
        dispatch({
          type: 'UPDATE_PERFORMANCE_METRICS',
          payload: { cacheSize }
        });
      } catch (error) {
        console.error('Failed to update performance metrics:', error);
      }
    }, 30000);

    return () => {
      if (performanceTimerRef.current) {
        clearInterval(performanceTimerRef.current);
      }
    };
  }, []);

  // INITIALIZATION
  const initializeApp = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      console.log('🚀 Initializing app context...');
      dispatch({ type: 'SET_LOADING', payload: true });

      // Load user data
      await refreshUserData();
      
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      console.log('✅ App context initialized');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          message: 'Failed to initialize app', 
          error: error as Error 
        } 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // ENHANCED ACTIONS
  const refreshUserData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing user data...');
      dispatch({ type: 'SET_REFRESHING', payload: true });
      
      const userData = await LocalStorageService.getUserData();
      dispatch({ type: 'SET_USER_DATA', payload: userData });
      
      console.log('✅ User data refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          message: 'Failed to load user data', 
          error: error as Error 
        } 
      });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, []);

  const updateSettings = useCallback(async (settings: Partial<LocalUserData['appSettings']>) => {
    try {
      console.log('⚙️ Updating settings...', settings);
      
      if (state.userData) {
        const updatedUserData = {
          ...state.userData,
          appSettings: { ...state.userData.appSettings, ...settings }
        };
        
        await LocalStorageService.saveUserData(updatedUserData);
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        
        console.log('✅ Settings updated');
      }
    } catch (error) {
      console.error('❌ Failed to update settings:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          message: 'Failed to update settings', 
          error: error as Error 
        } 
      });
    }
  }, [state.userData]);

  const markDevotionalRead = useCallback(async (devotionalId: number) => {
    try {
      console.log(`📖 Marking devotional ${devotionalId} as read...`);
      await LocalStorageService.markDevotionalRead(devotionalId);
      await refreshUserData();
      console.log(`✅ Devotional ${devotionalId} marked as read`);
    } catch (error) {
      console.error(`❌ Failed to mark devotional ${devotionalId} as read:`, error);
      throw error;
    }
  }, [refreshUserData]);

  const addFavorite = useCallback(async (type: 'devotional' | 'video' | 'audio', id: number) => {
    try {
      console.log(`❤️ Adding ${type} ${id} to favorites...`);
      await LocalStorageService.addFavorite(type, id);
      await refreshUserData();
      console.log(`✅ ${type} ${id} added to favorites`);
    } catch (error) {
      console.error(`❌ Failed to add ${type} ${id} to favorites:`, error);
      throw error;
    }
  }, [refreshUserData]);

  const removeFavorite = useCallback(async (type: 'devotional' | 'video' | 'audio', id: number) => {
    try {
      console.log(`💔 Removing ${type} ${id} from favorites...`);
      await LocalStorageService.removeFavorite(type, id);
      await refreshUserData();
      console.log(`✅ ${type} ${id} removed from favorites`);
    } catch (error) {
      console.error(`❌ Failed to remove ${type} ${id} from favorites:`, error);
      throw error;
    }
  }, [refreshUserData]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const forceRefresh = useCallback(async () => {
    try {
      console.log('🔄 Force refreshing all data...');
      dispatch({ type: 'SET_REFRESHING', payload: true });
      
      // Clear cache and refresh
      await apiClient.clearCache();
      await refreshUserData();
      
      console.log('✅ Force refresh completed');
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          message: 'Failed to refresh data', 
          error: error as Error 
        } 
      });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [refreshUserData]);

  // PERFORMANCE UTILITIES
  const getPerformanceMetrics = useCallback(() => {
    return state.performanceMetrics;
  }, [state.performanceMetrics]);

  const clearCache = useCallback(async () => {
    try {
      console.log('🗑️ Clearing app cache...');
      await apiClient.clearCache();
      await LocalStorageService.clearCache();
      
      dispatch({
        type: 'UPDATE_PERFORMANCE_METRICS',
        payload: { cacheSize: 0 }
      });
      
      console.log('✅ Cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }, []);

  // UTILITY FUNCTIONS
  const isDeviceOnline = useCallback(() => {
    return state.isOnline && (state.isInternetReachable !== false);
  }, [state.isOnline, state.isInternetReachable]);

  const getNetworkInfo = useCallback(() => {
    return {
      type: state.networkType,
      isReachable: state.isInternetReachable,
    };
  }, [state.networkType, state.isInternetReachable]);

  // CONTEXT VALUE
  const contextValue: AppContextValue = {
    state,
    dispatch,
    refreshUserData,
    updateSettings,
    markDevotionalRead,
    addFavorite,
    removeFavorite,
    clearError,
    forceRefresh,
    getPerformanceMetrics,
    clearCache,
    isDeviceOnline,
    getNetworkInfo,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use App Context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Utility hooks
export const useNetworkStatus = () => {
  const { state, isDeviceOnline, getNetworkInfo } = useApp();
  
  return {
    isOnline: isDeviceOnline(),
    networkType: state.networkType,
    isInternetReachable: state.isInternetReachable,
    networkInfo: getNetworkInfo(),
  };
};

export const usePerformanceMetrics = () => {
  const { getPerformanceMetrics } = useApp();
  return getPerformanceMetrics();
};

export const useUserData = () => {
  const { state, refreshUserData, updateSettings } = useApp();
  
  return {
    userData: state.userData,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    refresh: refreshUserData,
    updateSettings,
  };
};