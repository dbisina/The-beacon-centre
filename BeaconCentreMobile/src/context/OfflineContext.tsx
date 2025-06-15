// src/context/OfflineContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { checkNetworkStatus, waitForConnection } from '@/utils/networkUtils';

interface OfflineState {
  isOnline: boolean;
  isConnecting: boolean;
  connectionType: string;
  hasInternetAccess: boolean;
}

interface OfflineContextType extends OfflineState {
  retry: () => Promise<boolean>;
  waitForConnection: (timeout?: number) => Promise<boolean>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isConnecting: false,
    connectionType: 'unknown',
    hasInternetAccess: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(netState => {
      setState({
        isOnline: !!netState.isConnected,
        isConnecting: false,
        connectionType: netState.type || 'unknown',
        hasInternetAccess: !!netState.isInternetReachable,
      });
    });

    // Initial check
    checkNetworkStatus().then(isOnline => {
      setState(prev => ({ ...prev, isOnline }));
    });

    return unsubscribe;
  }, []);

  const retry = async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      const isOnline = await checkNetworkStatus();
      setState(prev => ({ ...prev, isOnline, isConnecting: false }));
      return isOnline;
    } catch (error) {
      setState(prev => ({ ...prev, isConnecting: false }));
      return false;
    }
  };

  const waitForConnectionWithTimeout = async (timeout: number = 10000): Promise<boolean> => {
    setState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      const success = await waitForConnection(timeout);
      setState(prev => ({ ...prev, isConnecting: false }));
      return success;
    } catch (error) {
      setState(prev => ({ ...prev, isConnecting: false }));
      return false;
    }
  };

  return (
    <OfflineContext.Provider value={{
      ...state,
      retry,
      waitForConnection: waitForConnectionWithTimeout,
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};