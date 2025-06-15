// src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { LocalUserData } from '@/types/storage';
import LocalStorageService from '@/services/storage/LocalStorage';
import NetInfo from '@react-native-community/netinfo';

interface AppState {
  isLoading: boolean;
  isOnline: boolean;
  userData: LocalUserData | null;
  error: string | null;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_USER_DATA'; payload: LocalUserData }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<LocalUserData['appSettings']> };

const initialState: AppState = {
  isLoading: true,
  isOnline: true,
  userData: null,
  error: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  refreshUserData: () => Promise<void>;
}>({
  state: initialState,
  dispatch: () => null,
  refreshUserData: async () => {},
});

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'SET_USER_DATA':
      return { ...state, userData: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        userData: state.userData ? {
          ...state.userData,
          appSettings: { ...state.userData.appSettings, ...action.payload }
        } : null,
      };
    default:
      return state;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const refreshUserData = async () => {
    try {
      const userData = await LocalStorageService.getUserData();
      dispatch({ type: 'SET_USER_DATA', payload: userData });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' });
    }
  };

  useEffect(() => {
    // Initialize app data
    const initializeApp = async () => {
      try {
        await refreshUserData();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();

    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch({ type: 'SET_ONLINE', payload: !!state.isConnected });
    });

    return unsubscribe;
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshUserData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};