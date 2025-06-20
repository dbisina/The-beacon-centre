// BeaconCentreMobile/src/services/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { config, validateConfig } from '../../config/environment';
import { getMockDataByEndpoint } from './mockData';

// Validate configuration on startup
validateConfig();

// Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API endpoints
export const ENDPOINTS = {
  // Public endpoints (no auth required)
  DEVOTIONALS: '/devotionals',
  DEVOTIONALS_TODAY: '/devotionals/today',
  DEVOTIONALS_BY_DATE: '/devotionals/date',
  
  VIDEO_SERMONS: '/video-sermons',
  VIDEO_SERMONS_FEATURED: '/video-sermons/featured',
  VIDEO_SERMONS_CATEGORY: '/video-sermons/category',
  
  AUDIO_SERMONS: '/audio-sermons',
  AUDIO_SERMONS_FEATURED: '/audio-sermons/featured',
  AUDIO_SERMONS_CATEGORY: '/audio-sermons/category',
  
  ANNOUNCEMENTS: '/announcements',
  ANNOUNCEMENTS_ACTIVE: '/announcements/active',
  
  CATEGORIES: '/categories',
  
  // Analytics endpoints (anonymous)
  ANALYTICS_TRACK: '/analytics/track',
  ANALYTICS_SESSION: '/analytics/session',
} as const;

// Error codes
export const API_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'ECONNABORTED',
  OFFLINE_ERROR: 'OFFLINE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

class ApiClient {
  private instance: AxiosInstance;
  private isOnline: boolean = true;
  private cachePrefix = 'api_cache_';

  constructor() {
    this.instance = axios.create({
      baseURL: config.apiUrl,
      timeout: config.apiTimeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': config.version,
        'X-Platform': Platform.OS,
      },
    });

    this.setupNetworkListener();
    this.setupInterceptors();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (config.enableDebugLogs) {
        console.log(`🌐 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);
      }
    });
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (requestConfig) => {
        if (config.enableDebugLogs) {
          console.log(`🌐 API Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        }
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        if (config.enableDebugLogs) {
          console.log(`✅ API Success: ${response.config.url}`);
        }
        
        // Cache successful responses if offline mode is enabled
        if (config.enableOfflineMode && response.config.method === 'get') {
          this.cacheResponse(response.config.url || '', response.data);
        }
        
        return response;
      },
      async (error: AxiosError) => {
        if (config.enableDebugLogs) {
          console.log(`❌ API Error: ${error.config?.url} - ${error.message}`);
        }
        
        // If offline or network error, return cached/mock data
        if (!this.isOnline || 
            error.code === API_ERRORS.NETWORK_ERROR || 
            error.code === API_ERRORS.TIMEOUT_ERROR ||
            error.message.includes('Network Error')) {
          
          if (config.enableDebugLogs) {
            console.log('📱 Using offline data for:', error.config?.url);
          }
          return this.handleOfflineRequest(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async handleOfflineRequest(requestConfig: any): Promise<any> {
    const endpoint = requestConfig?.url || '';
    
    // Get cached data first
    if (config.enableOfflineMode) {
      const cachedData = await this.getCachedData(endpoint);
      if (cachedData) {
        return { data: { success: true, data: cachedData } };
      }
    }

    // Fall back to mock data
    if (config.enableDebugLogs) {
      console.log('📋 Using mock data for:', endpoint);
    }
    const mockData = getMockDataByEndpoint(endpoint);
    
    return { data: { success: true, data: mockData } };
  }

  private async cacheResponse(endpoint: string, data: any): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(endpoint);
      const cachedItem = {
        data,
        timestamp: Date.now(),
        endpoint,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedItem));
      
      if (config.enableDebugLogs) {
        console.log('💾 Cached response for:', endpoint);
      }
    } catch (error) {
      console.log('Cache storage error:', error);
    }
  }

  private async getCachedData(endpoint: string): Promise<any> {
    try {
      const cacheKey = this.getCacheKey(endpoint);
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Check if cache is still valid
        if (age < config.cacheDurationMs) {
          if (config.enableDebugLogs) {
            console.log('📦 Using cached data for:', endpoint, `(${Math.round(age / 1000)}s old)`);
          }
          return data;
        } else {
          // Remove expired cache
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.log('Cache retrieval error:', error);
    }
    
    return null;
  }

  private getCacheKey(endpoint: string): string {
    return `${this.cachePrefix}${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  // Retry logic for failed requests
  private async retryRequest<T>(requestFn: () => Promise<T>, attempt: number = 1): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt < config.retryAttempts && this.isOnline) {
        if (config.enableDebugLogs) {
          console.log(`🔄 Retrying request (attempt ${attempt + 1}/${config.retryAttempts})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, config.retryDelayMs * attempt));
        return this.retryRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  // Public API methods
  async get<T>(endpoint: string): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.instance.get<ApiResponse<T>>(endpoint);
      return response.data.data || response.data;
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.instance.post<ApiResponse<T>>(endpoint, data);
      return response.data.data || response.data;
    } catch (error) {
      if (config.enableDebugLogs) {
        console.log('POST request failed:', endpoint, error);
      }
      
      // For analytics and tracking, fail silently in offline mode
      if (endpoint.includes('analytics') || endpoint.includes('track')) {
        if (config.enableDebugLogs) {
          console.log('📊 Analytics request failed (offline) - continuing silently');
        }
        return { success: true, message: 'Offline mode - analytics not sent' } as T;
      }
      
      throw error;
    }
  }

  // Cache management methods
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
      
      if (config.enableDebugLogs) {
        console.log('🗑️ Cache cleared:', cacheKeys.length, 'items');
      }
    } catch (error) {
      console.log('Cache clear error:', error);
    }
  }

  async getCacheStatus(): Promise<{ [key: string]: { size: number; age: number } }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      const status: { [key: string]: { size: number; age: number } } = {};
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          status[key] = {
            size: cached.length,
            age: Date.now() - timestamp,
          };
        }
      }
      
      return status;
    } catch (error) {
      console.log('Cache status error:', error);
      return {};
    }
  }

  // Network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export API methods using the correct endpoints from types
import type { 
  Devotional, 
  VideoSermon, 
  AudioSermon, 
  Announcement, 
  Category 
} from '@/types/api';

export const devotionalsApi = {
  getAll: async (): Promise<Devotional[]> => {
    try {
      const result = await apiClient.get<Devotional[]>(ENDPOINTS.DEVOTIONALS);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching devotionals:', error);
      return getMockDataByEndpoint(ENDPOINTS.DEVOTIONALS);
    }
  },

  getToday: async (): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>(ENDPOINTS.DEVOTIONALS_TODAY);
      return result || null;
    } catch (error) {
      console.error('Error fetching today\'s devotional:', error);
      const mockDevotionals = getMockDataByEndpoint(ENDPOINTS.DEVOTIONALS);
      return mockDevotionals[0] || null;
    }
  },

  getByDate: async (date: string): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>(`${ENDPOINTS.DEVOTIONALS_BY_DATE}/${date}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching devotional by date:', error);
      return null;
    }
  },

  getById: async (id: number): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>(`${ENDPOINTS.DEVOTIONALS}/${id}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching devotional by ID:', error);
      return null;
    }
  },
};

export const sermonsApi = {
  getAllVideos: async (): Promise<VideoSermon[]> => {
    try {
      const result = await apiClient.get<VideoSermon[]>(ENDPOINTS.VIDEO_SERMONS);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching video sermons:', error);
      return getMockDataByEndpoint(ENDPOINTS.VIDEO_SERMONS);
    }
  },

  getAllAudio: async (): Promise<AudioSermon[]> => {
    try {
      const result = await apiClient.get<AudioSermon[]>(ENDPOINTS.AUDIO_SERMONS);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching audio sermons:', error);
      return getMockDataByEndpoint(ENDPOINTS.AUDIO_SERMONS);
    }
  },

  getFeaturedVideos: async (): Promise<VideoSermon[]> => {
    try {
      const result = await apiClient.get<VideoSermon[]>(ENDPOINTS.VIDEO_SERMONS_FEATURED);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      return getMockDataByEndpoint(ENDPOINTS.VIDEO_SERMONS).slice(0, 3);
    }
  },

  getFeaturedAudio: async (): Promise<AudioSermon[]> => {
    try {
      const result = await apiClient.get<AudioSermon[]>(ENDPOINTS.AUDIO_SERMONS_FEATURED);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching featured audio:', error);
      return getMockDataByEndpoint(ENDPOINTS.AUDIO_SERMONS).slice(0, 3);
    }
  },

  getVideoById: async (id: number): Promise<VideoSermon | null> => {
    try {
      const result = await apiClient.get<VideoSermon>(`${ENDPOINTS.VIDEO_SERMONS}/${id}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching video sermon by ID:', error);
      return null;
    }
  },

  getAudioById: async (id: number): Promise<AudioSermon | null> => {
    try {
      const result = await apiClient.get<AudioSermon>(`${ENDPOINTS.AUDIO_SERMONS}/${id}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching audio sermon by ID:', error);
      return null;
    }
  },

  getVideosByCategory: async (categoryId: number): Promise<VideoSermon[]> => {
    try {
      const result = await apiClient.get<VideoSermon[]>(`${ENDPOINTS.VIDEO_SERMONS_CATEGORY}/${categoryId}`);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching videos by category:', error);
      return [];
    }
  },

  getAudioByCategory: async (categoryId: number): Promise<AudioSermon[]> => {
    try {
      const result = await apiClient.get<AudioSermon[]>(`${ENDPOINTS.AUDIO_SERMONS_CATEGORY}/${categoryId}`);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching audio by category:', error);
      return [];
    }
  },
};

export const announcementsApi = {
  getAll: async (): Promise<Announcement[]> => {
    try {
      const result = await apiClient.get<Announcement[]>(ENDPOINTS.ANNOUNCEMENTS);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return getMockDataByEndpoint(ENDPOINTS.ANNOUNCEMENTS);
    }
  },

  getActive: async (): Promise<Announcement[]> => {
    try {
      const result = await apiClient.get<Announcement[]>(ENDPOINTS.ANNOUNCEMENTS_ACTIVE);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching active announcements:', error);
      return getMockDataByEndpoint(ENDPOINTS.ANNOUNCEMENTS);
    }
  },

  getById: async (id: number): Promise<Announcement | null> => {
    try {
      const result = await apiClient.get<Announcement>(`${ENDPOINTS.ANNOUNCEMENTS}/${id}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching announcement by ID:', error);
      return null;
    }
  },
};

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    try {
      const result = await apiClient.get<Category[]>(ENDPOINTS.CATEGORIES);
      return Array.isArray(result) ? result : [result].filter(Boolean);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return getMockDataByEndpoint(ENDPOINTS.CATEGORIES);
    }
  },

  getById: async (id: number): Promise<Category | null> => {
    try {
      const result = await apiClient.get<Category>(`${ENDPOINTS.CATEGORIES}/${id}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      return null;
    }
  },

  getByName: async (name: string): Promise<Category | null> => {
    try {
      const result = await apiClient.get<Category>(`${ENDPOINTS.CATEGORIES}/name/${name}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching category by name:', error);
      return null;
    }
  },
};

export const analyticsApi = {
  track: async (data: {
    deviceId: string;
    contentType: string;
    contentId: number;
    interactionType: string;
    durationSeconds?: number;
  }): Promise<void> => {
    if (!config.enableAnalytics) {
      return;
    }

    try {
      await apiClient.post(ENDPOINTS.ANALYTICS_TRACK, data);
      if (config.enableDebugLogs) {
        console.log('📊 Analytics tracked:', data.interactionType);
      }
    } catch (error) {
      if (config.enableDebugLogs) {
        console.log('📊 Analytics tracking failed (non-critical):', error);
      }
    }
  },

  trackSession: async (data: {
    deviceId: string;
    platform?: string;
    appVersion?: string;
    country?: string;
  }): Promise<void> => {
    if (!config.enableAnalytics) {
      return;
    }

    try {
      await apiClient.post(ENDPOINTS.ANALYTICS_SESSION, data);
      if (config.enableDebugLogs) {
        console.log('📊 Session tracked for device:', data.deviceId);
      }
    } catch (error) {
      if (config.enableDebugLogs) {
        console.log('📊 Session tracking failed (non-critical):', error);
      }
    }
  },
};

// Export additional client methods
export const cacheApi = {
  clear: () => apiClient.clearCache(),
  status: () => apiClient.getCacheStatus(),
  networkStatus: () => apiClient.getNetworkStatus(),
};

// Legacy exports for backward compatibility
export const devotionalApi = devotionalsApi;
export const sermonApi = {
  getVideoSermons: sermonsApi.getAllVideos,
  getAudioSermons: sermonsApi.getAllAudio,
  getFeaturedVideos: sermonsApi.getFeaturedVideos,
  getFeaturedAudios: sermonsApi.getFeaturedAudio,
  getVideoById: sermonsApi.getVideoById,
  getAudioById: sermonsApi.getAudioById,
};

export default apiClient;