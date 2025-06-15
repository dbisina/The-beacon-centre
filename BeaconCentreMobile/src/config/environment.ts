// src/config/environment.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  cloudinaryCloudName: string;
  youtubeApiKey?: string;
}

const getConfig = (): AppConfig => {
  const isDev = __DEV__;
  const extra = Constants.expoConfig?.extra || {};

  return {
    apiUrl: extra.apiUrl || (isDev ? 'http://localhost:5000/api' : 'https://api.thebeaconcentre.org/api'),
    environment: extra.environment || (isDev ? 'development' : 'production'),
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Platform.OS === 'ios' 
      ? Constants.expoConfig?.ios?.buildNumber || '1'
      : Constants.expoConfig?.android?.versionCode?.toString() || '1',
    enableAnalytics: !isDev,
    enableCrashReporting: !isDev,
    cloudinaryCloudName: extra.cloudinaryCloudName || 'your-cloudinary-cloud',
    youtubeApiKey: extra.youtubeApiKey,
  };
};

export const config = getConfig();