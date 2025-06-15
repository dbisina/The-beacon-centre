// src/utils/constants.ts
export const APP_CONFIG = {
    name: 'The Beacon Centre',
    version: '1.0.0',
    api: {
      baseUrl: __DEV__ ? 'http://localhost:5000/api' : 'https://your-api.com/api',
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
  };
  
  export const CONTENT_TYPES = {
    DEVOTIONAL: 'devotional',
    VIDEO_SERMON: 'video_sermon',
    AUDIO_SERMON: 'audio_sermon',
    ANNOUNCEMENT: 'announcement',
  } as const;
  
  export const INTERACTION_TYPES = {
    VIEWED: 'viewed',
    COMPLETED: 'completed',
    FAVORITED: 'favorited',
    DOWNLOADED: 'downloaded',
    SHARED: 'shared',
  } as const;
  
  export const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  } as const;
  