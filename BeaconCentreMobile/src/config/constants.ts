// src/config/constants.ts - Updated with environment config
import { config } from './environment';

export const APP_CONFIG = {
  name: 'The Beacon Centre',
  version: config.version,
  environment: config.environment,
  api: {
    baseUrl: config.apiUrl,
    timeout: 10000,
  },
  storage: {
    cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxCacheSize: 100 * 1024 * 1024, // 100MB
  },
  audio: {
    maxDownloads: 50,
    bufferSize: 1024,
    progressUpdateInterval: 1000,
  },
  notifications: {
    channelId: 'beacon_notifications',
    dailyReminderTime: { hour: 7, minute: 0 },
  },
  analytics: {
    enabled: config.enableAnalytics,
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
  },
  cloudinary: {
    cloudName: config.cloudinaryCloudName,
    uploadPreset: 'beacon_mobile_uploads',
  },
};