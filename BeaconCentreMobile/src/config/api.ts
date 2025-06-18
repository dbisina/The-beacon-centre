// BeaconCentreMobile/src/config/api.ts
export const API_CONFIG = {
    BASE_URL: __DEV__ 
      ? 'http://localhost:5000/api'  // Development - matches backend
      : 'https://your-production-api.com/api', // Production URL
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  };
  
  export const ENDPOINTS = {
    // Public endpoints (no auth required)
    DEVOTIONALS: '/devotionals',
    VIDEO_SERMONS: '/video-sermons',
    AUDIO_SERMONS: '/audio-sermons', 
    ANNOUNCEMENTS: '/announcements',
    CATEGORIES: '/categories',
    ANALYTICS_TRACK: '/analytics/track',
    ANALYTICS_SESSION: '/analytics/session',
    
    // Specific endpoints
    DEVOTIONALS_TODAY: '/devotionals/today',
    DEVOTIONALS_BY_DATE: (date: string) => `/devotionals/date/${date}`,
    VIDEO_SERMONS_FEATURED: '/video-sermons/featured',
    AUDIO_SERMONS_FEATURED: '/audio-sermons/featured',
    ANNOUNCEMENTS_ACTIVE: '/announcements/active',
  } as const;
  
  // Request configuration
  export const REQUEST_CONFIG = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // Retry configuration for failed requests
    retry: {
      attempts: API_CONFIG.RETRY_ATTEMPTS,
      delay: 1000, // 1 second
    },
  };
  
  // Error messages
  export const API_ERRORS = {
    NETWORK_ERROR: 'Network connection failed. Using offline content.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    TIMEOUT_ERROR: 'Request timed out. Please check your connection.',
    UNKNOWN_ERROR: 'An unexpected error occurred.',
  } as const;