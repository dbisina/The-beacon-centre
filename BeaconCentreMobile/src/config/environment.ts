// BeaconCentreMobile/src/config/environment.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enableOfflineMode: boolean;
  enableDownloads: boolean;
  enablePushNotifications: boolean;
  enableSharing: boolean;
  cloudinaryCloudName: string;
  cloudinaryBaseUrl: string;
  youtubeApiKey?: string;
  cacheDurationMs: number;
  offlineCacheSizeMB: number;
  apiTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  audioQuality: 'low' | 'medium' | 'high';
  autoDownloadWifiOnly: boolean;
  enableDebugLogs: boolean;
  mockApiDelayMs: number;
}

const getConfig = (): AppConfig => {
  const isDev = __DEV__;
  
  // Get environment variables from Expo config
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 
    (isDev ? 'http://localhost:5000/api' : 'https://tbc-backend-vybk.onrender.com/api');
  
  const environment = (process.env.EXPO_PUBLIC_ENVIRONMENT as AppConfig['environment']) || 
    (isDev ? 'development' : 'production');

  return {
    // API Configuration
    apiUrl,
    environment,
    
    // App Metadata
    version: process.env.EXPO_PUBLIC_APP_VERSION || Constants.expoConfig?.version || '1.0.0',
    buildNumber: Platform.OS === 'ios' 
      ? Constants.expoConfig?.ios?.buildNumber || '1'
      : Constants.expoConfig?.android?.versionCode?.toString() || '1',
    
    // Feature Flags
    enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true' || !isDev,
    enableCrashReporting: !isDev,
    enableOfflineMode: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE !== 'false',
    enableDownloads: process.env.EXPO_PUBLIC_ENABLE_DOWNLOADS !== 'false',
    enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS !== 'false',
    enableSharing: process.env.EXPO_PUBLIC_ENABLE_SHARING !== 'false',
    
    // External Services
    cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloudinary-cloud',
    cloudinaryBaseUrl: process.env.EXPO_PUBLIC_CLOUDINARY_BASE_URL || 'https://res.cloudinary.com',
    youtubeApiKey: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY,
    
    // Performance Configuration
    cacheDurationMs: parseInt(process.env.EXPO_PUBLIC_CACHE_DURATION_MS || '3600000'), // 1 hour
    offlineCacheSizeMB: parseInt(process.env.EXPO_PUBLIC_OFFLINE_CACHE_SIZE_MB || '50'),
    apiTimeoutMs: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || '30000'),
    retryAttempts: parseInt(process.env.EXPO_PUBLIC_RETRY_ATTEMPTS || '3'),
    retryDelayMs: parseInt(process.env.EXPO_PUBLIC_RETRY_DELAY_MS || '1000'),
    
    // Audio Configuration
    audioQuality: (process.env.EXPO_PUBLIC_AUDIO_QUALITY as AppConfig['audioQuality']) || 'medium',
    autoDownloadWifiOnly: process.env.EXPO_PUBLIC_AUTO_DOWNLOAD_WIFI_ONLY !== 'false',
    
    // Development Configuration
    enableDebugLogs: process.env.EXPO_PUBLIC_ENABLE_DEBUG_LOGS === 'true' || isDev,
    mockApiDelayMs: parseInt(process.env.EXPO_PUBLIC_MOCK_API_DELAY_MS || '1000'),
  };
};

export const config = getConfig();

// Validation helper
export const validateConfig = () => {
  const errors: string[] = [];

  if (!config.apiUrl) {
    errors.push('API URL is required');
  }

  if (!config.cloudinaryCloudName || config.cloudinaryCloudName === 'your-cloudinary-cloud') {
    console.warn('⚠️ Warning: Cloudinary cloud name not configured - image optimization may not work');
  }

  if (config.enableAnalytics && !config.youtubeApiKey) {
    console.warn('⚠️ Warning: YouTube API key not configured - video metadata may be limited');
  }

  if (errors.length > 0) {
    throw new Error(`Mobile app configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
};

// Development helper
export const logConfig = () => {
  if (config.enableDebugLogs) {
    console.log('📱 Mobile App Configuration:', {
      API_URL: config.apiUrl,
      ENVIRONMENT: config.environment,
      VERSION: config.version,
      FEATURES: {
        analytics: config.enableAnalytics,
        offline: config.enableOfflineMode,
        downloads: config.enableDownloads,
        notifications: config.enablePushNotifications,
        sharing: config.enableSharing,
      },
      SERVICES: {
        cloudinary: !!config.cloudinaryCloudName && config.cloudinaryCloudName !== 'your-cloudinary-cloud',
        youtube: !!config.youtubeApiKey,
      },
    });
  }
};

// Performance configuration helpers
export const getImageUrl = (publicId: string, transformations?: string) => {
  if (!config.cloudinaryCloudName || config.cloudinaryCloudName === 'your-cloudinary-cloud') {
    return publicId; // Return original URL if Cloudinary not configured
  }
  
  const baseUrl = `${config.cloudinaryBaseUrl}/${config.cloudinaryCloudName}/image/upload`;
  const transforms = transformations ? `${transformations}/` : '';
  return `${baseUrl}/${transforms}${publicId}`;
};

export const getCachedImageUrl = (publicId: string, width?: number, height?: number) => {
  const transforms = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push('c_fill', 'f_auto', 'q_auto');
  
  return getImageUrl(publicId, transforms.join(','));
};

// Initialize configuration validation
try {
  validateConfig();
  logConfig();
} catch (error) {
  console.error('❌ Configuration validation failed:', error);
  if (config.environment === 'production') {
    throw error;
  }
}