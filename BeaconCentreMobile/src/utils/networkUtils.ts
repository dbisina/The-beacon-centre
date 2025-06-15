// src/utils/networkUtils.ts
import NetInfo from '@react-native-community/netinfo';

export const checkNetworkStatus = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return !!netInfo.isConnected;
};

export const isWifiConnection = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.type === 'wifi' && !!netInfo.isConnected;
};

export const getNetworkType = async (): Promise<string> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.type || 'unknown';
};

export const waitForConnection = (timeout: number = 10000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkConnection = async () => {
      const isConnected = await checkNetworkStatus();
      
      if (isConnected) {
        resolve(true);
      } else if (Date.now() - startTime >= timeout) {
        resolve(false);
      } else {
        setTimeout(checkConnection, 1000);
      }
    };
    
    checkConnection();
  });
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) break;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};