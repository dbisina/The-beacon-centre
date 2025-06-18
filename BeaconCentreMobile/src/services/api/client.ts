// src/services/api/client.ts - CORRECTED VERSION
import axios, { AxiosInstance, AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { API_CONFIG, ENDPOINTS, REQUEST_CONFIG, API_ERRORS } from '@/config/api';
import { Devotional, VideoSermon, AudioSermon, Announcement, Category } from '@/types/api';
import { 
  mockDevotionals, 
  mockVideoSermons, 
  mockAudioSermons, 
  mockAnnouncements, 
  mockCategories,
  mockData,
  getMockDataByEndpoint 
} from '@/services/api/mockData';

class ApiClient {
  private instance: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      ...REQUEST_CONFIG,
    });

    this.setupInterceptors();
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      console.log(`🌐 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);
    });
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add device platform for analytics
        if (Platform.OS) {
          config.headers['X-Device-Platform'] = Platform.OS;
          config.headers['X-App-Version'] = '1.0.0'; // Get from app config
        }
        
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`✅ API Success: ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        console.log(`❌ API Error: ${error.config?.url} - ${error.message}`);
        
        // If offline or network error, return cached/mock data
        if (!this.isOnline || 
            error.code === API_ERRORS.NETWORK_ERROR || 
            error.code === API_ERRORS.TIMEOUT_ERROR ||
            error.message.includes('Network Error')) {
          console.log('📱 Using offline data for:', error.config?.url);
          return this.handleOfflineRequest(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async handleOfflineRequest(config: any): Promise<any> {
    const endpoint = config?.url || '';
    
    // Get cached data first
    const cachedData = await this.getCachedData(endpoint);
    if (cachedData) {
      return { data: { success: true, data: cachedData } };
    }

    // Fall back to mock data
    console.log('📋 Using mock data for:', endpoint);
    const mockData = getMockDataByEndpoint(endpoint);
    
    return { data: { success: true, data: mockData } };
  }

  private async getCachedData(endpoint: string): Promise<any> {
    try {
      const cacheKey = `api_cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > API_CONFIG.CACHE_DURATION;
        if (!isExpired) {
          console.log('💾 Using cached data for:', endpoint);
          return data;
        } else {
          console.log('🗑️ Cache expired for:', endpoint);
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.log('Cache read error:', error);
    }
    return null;
  }

  private async setCachedData(endpoint: string, data: any): Promise<void> {
    try {
      const cacheKey = `api_cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Cached data for:', endpoint);
    } catch (error) {
      console.log('Cache write error:', error);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.instance.get(endpoint);
      
      if (response.data && response.data.success !== false) {
        const data = response.data.data || response.data;
        
        // Cache successful responses
        if (this.isOnline) {
          await this.setCachedData(endpoint, data);
        }
        
        return data;
      }
      
      throw new Error('API response indicates failure');
    } catch (error) {
      console.log('API Error, falling back to cached/mock data for:', endpoint);
      
      // Try to get cached data
      const cachedData = await this.getCachedData(endpoint);
      if (cachedData) {
        return cachedData;
      }
      
      // Last resort: mock data
      const mockData = getMockDataByEndpoint(endpoint);
      return mockData as T;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.instance.post(endpoint, data);
      return response.data.data || response.data;
    } catch (error) {
      console.log('POST request failed:', endpoint, error);
      
      // For analytics and tracking, fail silently in offline mode
      if (endpoint.includes('analytics') || endpoint.includes('track')) {
        console.log('📊 Analytics request failed (offline) - continuing silently');
        return { success: true, message: 'Offline mode - analytics not sent' } as T;
      }
      
      throw error;
    }
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('api_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('🗑️ Cache cleared:', cacheKeys.length, 'items');
    } catch (error) {
      console.log('Cache clear error:', error);
    }
  }

  // Get cache status
  async getCacheStatus(): Promise<{ [key: string]: { size: number; age: number } }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('api_cache_'));
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
}

// Create singleton instance
const apiClient = new ApiClient();

// Export API methods using the correct endpoints
export const devotionalsApi = {
  getAll: async (): Promise<Devotional[]> => {
    try {
      const result = await apiClient.get<Devotional[]>(ENDPOINTS.DEVOTIONALS);
      return Array.isArray(result) ? result : mockDevotionals;
    } catch (error) {
      console.error('Error fetching devotionals:', error);
      return mockDevotionals;
    }
  },

  getToday: async (): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>(ENDPOINTS.DEVOTIONALS_TODAY);
      return result || mockData.getTodaysDevotional();
    } catch (error) {
      console.error('Error fetching today\'s devotional:', error);
      return mockData.getTodaysDevotional();
    }
  },

  getByDate: async (date: string): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>(ENDPOINTS.DEVOTIONALS_BY_DATE(date));
      return result || mockData.getDevotionalByDate(date);
    } catch (error) {
      console.error('Error fetching devotional by date:', error);
      return mockData.getDevotionalByDate(date);
    }
  },

  getById: async (id: number): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>(`${ENDPOINTS.DEVOTIONALS}/${id}`);
      return result || mockDevotionals.find(d => d.id === id) || null;
    } catch (error) {
      console.error('Error fetching devotional by ID:', error);
      return mockDevotionals.find(d => d.id === id) || null;
    }
  },
};

export const sermonsApi = {
  getAllVideos: async (): Promise<VideoSermon[]> => {
    try {
      const result = await apiClient.get<VideoSermon[]>(ENDPOINTS.VIDEO_SERMONS);
      return Array.isArray(result) ? result : mockVideoSermons;
    } catch (error) {
      console.error('Error fetching video sermons:', error);
      return mockVideoSermons;
    }
  },

  getAllAudio: async (): Promise<AudioSermon[]> => {
    try {
      const result = await apiClient.get<AudioSermon[]>(ENDPOINTS.AUDIO_SERMONS);
      return Array.isArray(result) ? result : mockAudioSermons;
    } catch (error) {
      console.error('Error fetching audio sermons:', error);
      return mockAudioSermons;
    }
  },

  getFeaturedVideos: async (): Promise<VideoSermon[]> => {
    try {
      const result = await apiClient.get<VideoSermon[]>(ENDPOINTS.VIDEO_SERMONS_FEATURED);
      return Array.isArray(result) ? result : mockVideoSermons.filter(v => v.is_featured);
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      return mockVideoSermons.filter(v => v.is_featured);
    }
  },

  getFeaturedAudio: async (): Promise<AudioSermon[]> => {
    try {
      const result = await apiClient.get<AudioSermon[]>(ENDPOINTS.AUDIO_SERMONS_FEATURED);
      return Array.isArray(result) ? result : mockAudioSermons.filter(a => a.is_featured);
    } catch (error) {
      console.error('Error fetching featured audio:', error);
      return mockAudioSermons.filter(a => a.is_featured);
    }
  },

  getVideoById: async (id: number): Promise<VideoSermon | null> => {
    try {
      const result = await apiClient.get<VideoSermon>(`${ENDPOINTS.VIDEO_SERMONS}/${id}`);
      return result || mockVideoSermons.find(v => v.id === id) || null;
    } catch (error) {
      console.error('Error fetching video sermon by ID:', error);
      return mockVideoSermons.find(v => v.id === id) || null;
    }
  },

  getAudioById: async (id: number): Promise<AudioSermon | null> => {
    try {
      const result = await apiClient.get<AudioSermon>(`${ENDPOINTS.AUDIO_SERMONS}/${id}`);
      return result || mockAudioSermons.find(a => a.id === id) || null;
    } catch (error) {
      console.error('Error fetching audio sermon by ID:', error);
      return mockAudioSermons.find(a => a.id === id) || null;
    }
  },
};

export const announcementApi = {
  getAll: async (): Promise<Announcement[]> => {
    try {
      const result = await apiClient.get<Announcement[]>(ENDPOINTS.ANNOUNCEMENTS);
      return Array.isArray(result) ? result : mockAnnouncements;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return mockAnnouncements;
    }
  },

  getActive: async (): Promise<Announcement[]> => {
    try {
      const result = await apiClient.get<Announcement[]>(ENDPOINTS.ANNOUNCEMENTS_ACTIVE);
      return Array.isArray(result) ? result : mockData.getActiveAnnouncements();
    } catch (error) {
      console.error('Error fetching active announcements:', error);
      return mockData.getActiveAnnouncements();
    }
  },

  getById: async (id: number): Promise<Announcement | null> => {
    try {
      const result = await apiClient.get<Announcement>(`${ENDPOINTS.ANNOUNCEMENTS}/${id}`);
      return result || mockAnnouncements.find(a => a.id === id) || null;
    } catch (error) {
      console.error('Error fetching announcement by ID:', error);
      return mockAnnouncements.find(a => a.id === id) || null;
    }
  },
};

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    try {
      const result = await apiClient.get<Category[]>(ENDPOINTS.CATEGORIES);
      return Array.isArray(result) ? result : mockCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return mockCategories;
    }
  },

  getById: async (id: number): Promise<Category | null> => {
    try {
      const result = await apiClient.get<Category>(`${ENDPOINTS.CATEGORIES}/${id}`);
      return result || mockCategories.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      return mockCategories.find(c => c.id === id) || null;
    }
  },

  getByName: async (name: string): Promise<Category | null> => {
    try {
      const result = await apiClient.get<Category>(`${ENDPOINTS.CATEGORIES}/name/${name}`);
      return result || mockData.getCategoryByName(name);
    } catch (error) {
      console.error('Error fetching category by name:', error);
      return mockData.getCategoryByName(name);
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
    try {
      await apiClient.post(ENDPOINTS.ANALYTICS_TRACK, data);
      console.log('📊 Analytics tracked:', data.interactionType);
    } catch (error) {
      console.log('📊 Analytics tracking failed (non-critical):', error);
    }
  },

  trackSession: async (data: {
    deviceId: string;
    platform?: string;
    appVersion?: string;
    country?: string;
  }): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.ANALYTICS_SESSION, data);
      console.log('📊 Session tracked for device:', data.deviceId);
    } catch (error) {
      console.log('📊 Session tracking failed (non-critical):', error);
    }
  },
};

// Export additional client methods
export const cacheApi = {
  clear: () => apiClient.clearCache(),
  status: () => apiClient.getCacheStatus(),
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