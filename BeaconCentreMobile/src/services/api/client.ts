import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { config, validateConfig } from '../../config/environment';
import { transformAudioSermon } from './sermons';

// Validate configuration on startup
validateConfig();

// Types for API responses
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

// CORRECTED API ENDPOINTS - MATCHING BACKEND EXACTLY
export const ENDPOINTS = {
  // Public endpoints (no auth required) - MATCHING BACKEND
  DEVOTIONALS: '/devotionals',
  DEVOTIONALS_TODAY: '/devotionals/today',
  DEVOTIONALS_BY_DATE: '/devotionals/date', // /:date will be appended
  
  VIDEO_SERMONS: '/video-sermons',
  VIDEO_SERMONS_FEATURED: '/video-sermons/featured',
  VIDEO_SERMONS_BY_CATEGORY: '/video-sermons/category', // /:categoryId will be appended
  
  AUDIO_SERMONS: '/audio-sermons',
  AUDIO_SERMONS_FEATURED: '/audio-sermons/featured',
  AUDIO_SERMONS_BY_CATEGORY: '/audio-sermons/category', // /:categoryId will be appended
  
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
  NOT_FOUND: 'NOT_FOUND',
} as const;

class ApiClient {
  private instance: AxiosInstance;
  private isOnline: boolean = true;
  private cachePrefix = 'api_cache_';
  private backgroundSyncQueue: Array<{ endpoint: string; data: any; timestamp: number }> = [];

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
    this.loadBackgroundSyncQueue();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (config.enableDebugLogs) {
        console.log(`🌐 Network status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
      }

      if (wasOffline && this.isOnline) {
        this.processBackgroundSyncQueue();
      }
    });
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Log all API calls for debugging
        if (__DEV__) {
          console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        }
        
        config.headers['X-Online-Status'] = this.isOnline ? 'online' : 'offline';
        return config;
      },
      (error) => Promise.reject(error)
    );

      // Response interceptor  
  this.instance.interceptors.response.use(
    (response) => {
      if (__DEV__) {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
      }
      
      // Transform response data to match mobile app expectations (camelCase to snake_case)
      if (response.data && response.data.data) {
        response.data.data = this.transformResponseData(response.data.data);
      }
      
      // Cache successful responses
      if (response.config.method === 'get') {
        this.cacheResponse(response.config.url!, response.data);
      }
      return response;
    },
      async (error: AxiosError) => {
        if (__DEV__) {
          console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || error.message}`);
        }

        // Handle specific error codes
        if (error.response?.status === 404) {
          console.warn('🔍 Resource not found:', error.config?.url);
        } else if (error.response?.status === 500) {
          console.error('🚨 Server error:', error.config?.url);
        }

        // Handle network issues
        if (error.code === 'ECONNABORTED') {
          error.message = 'Request timeout. Please check your connection.';
        } else if (!this.isOnline) {
          const cachedData = await this.getCachedResponse(error.config?.url);
          if (cachedData) {
            console.log('📱 Returning cached data for offline request');
            return { data: cachedData };
          }
          error.message = 'You are offline. Please check your internet connection.';
        }

        return Promise.reject(error);
      }
    );
  }

  // Background sync implementation (same as before)
  private async loadBackgroundSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem('background_sync_queue');
      if (queueData) {
        this.backgroundSyncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load background sync queue:', error);
    }
  }

  private async saveBackgroundSyncQueue() {
    try {
      await AsyncStorage.setItem('background_sync_queue', JSON.stringify(this.backgroundSyncQueue));
    } catch (error) {
      console.error('Failed to save background sync queue:', error);
    }
  }

  private async processBackgroundSyncQueue() {
    if (this.backgroundSyncQueue.length === 0) return;

    console.log(`🔄 Processing ${this.backgroundSyncQueue.length} background sync items`);

    const failedItems: typeof this.backgroundSyncQueue = [];

    for (const item of this.backgroundSyncQueue) {
      try {
        const isRecent = Date.now() - item.timestamp < 24 * 60 * 60 * 1000;
        if (!isRecent) continue;

        await this.instance.post(item.endpoint, item.data);
        console.log(`✅ Background sync completed: ${item.endpoint}`);
      } catch (error) {
        console.error(`❌ Background sync failed: ${item.endpoint}`, error);
        failedItems.push(item);
      }
    }

    this.backgroundSyncQueue = failedItems;
    await this.saveBackgroundSyncQueue();
  }

  private async addToBackgroundSync(endpoint: string, data: any) {
    this.backgroundSyncQueue.push({
      endpoint,
      data,
      timestamp: Date.now(),
    });
    await this.saveBackgroundSyncQueue();
  }

  // Caching implementation (same as before)
  private async cacheResponse(url: string, data: any) {
    try {
      const cacheKey = `${this.cachePrefix}${url}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + config.cacheDurationMs,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  private async getCachedResponse(url?: string): Promise<any | null> {
    if (!url) return null;

    try {
      const cacheKey = `${this.cachePrefix}${url}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        if (Date.now() < parsed.expiresAt) {
          return parsed.data;
        } else {
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Failed to get cached response:', error);
    }

    return null;
  }

  // Transform backend camelCase fields to mobile app snake_case expectations
  private transformResponseData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformResponseData(item));
    }
    
    if (data && typeof data === 'object') {
      const transformed: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        let newKey = key;
        
        // Transform specific field names
        if (key === 'youtubeId') newKey = 'youtube_id';
        else if (key === 'thumbnailUrl') newKey = 'thumbnail_url';
        else if (key === 'audioUrl') newKey = 'audio_url';
        else if (key === 'cloudinaryPublicId') newKey = 'cloudinary_public_id';
        else if (key === 'fileSize') newKey = 'file_size';
        else if (key === 'sermonDate') newKey = 'sermon_date';
        else if (key === 'isFeatured') newKey = 'is_featured';
        else if (key === 'isActive') newKey = 'is_active';
        else if (key === 'viewCount') newKey = 'view_count';
        else if (key === 'playCount') newKey = 'play_count';
        else if (key === 'downloadCount') newKey = 'download_count';
        else if (key === 'startDate') newKey = 'start_date';
        else if (key === 'expiryDate') newKey = 'expiry_date';
        else if (key === 'imageUrl') newKey = 'image_url';
        else if (key === 'actionUrl') newKey = 'action_url';
        else if (key === 'actionText') newKey = 'action_text';
        else if (key === 'verseText') newKey = 'verse_text';
        else if (key === 'verseReference') newKey = 'verse_reference';
        else if (key === 'createdAt') newKey = 'created_at';
        else if (key === 'updatedAt') newKey = 'updated_at';
        
        // Recursively transform nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          transformed[newKey] = this.transformResponseData(value);
        } else if (Array.isArray(value)) {
          transformed[newKey] = value.map(item => 
            typeof item === 'object' ? this.transformResponseData(item) : item
          );
        } else {
          transformed[newKey] = value;
        }
      }
      
      return transformed;
    }
    
    return data;
  }

  // IMPROVED API METHODS WITH PROPER ERROR HANDLING
  async get<T>(endpoint: string, useCache: boolean = true): Promise<T> {
    try {
      if (this.isOnline) {
        const response = await this.instance.get<ApiResponse<T>>(endpoint);
        
        // Handle different response formats from backend
        if (response.data && typeof response.data === 'object') {
          // New backend format: { success: true, data: [...] }
          if ('success' in response.data && response.data.success) {
            return (response.data as ApiResponse<T>).data;
          }
          // Direct array/object response (fallback)
          return response.data as T;
        }
        
        throw new Error('Invalid response format from server');
      }

      // Offline fallback
      if (useCache) {
        const cachedData = await this.getCachedResponse(endpoint);
        if (cachedData) {
          return cachedData;
        }
      }

      throw new Error('No internet connection and no cached data available');
    } catch (error: any) {
      console.error(`API GET Error (${endpoint}):`, error.message);
      
      // Always try cache as fallback
      if (useCache) {
        const cachedData = await this.getCachedResponse(endpoint);
        if (cachedData) {
          console.log(`📱 Using cached data for ${endpoint}`);
          return cachedData;
        }
      }

      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      if (!this.isOnline) {
        await this.addToBackgroundSync(endpoint, data);
        throw new Error('Request queued for when connection is restored');
      }

      const response = await this.instance.post<ApiResponse<T>>(endpoint, data);
      
      if (response.data && 'success' in response.data && response.data.success) {
        return response.data.data;
      } else if (response.data) {
        return response.data as T;
      }
      
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error(`API POST Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  // Status and utility methods
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`🗑️ Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      return cacheKeys.length;
    } catch {
      return 0;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// CORRECTED API SERVICES - MATCHING BACKEND ENDPOINTS EXACTLY
export const devotionalApi = {
  getAll: async (): Promise<Devotional[]> => {
    try {
      const result = await apiClient.get<any>(ENDPOINTS.DEVOTIONALS);
      // Support both direct array and nested array (data.devotionals)
      if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.devotionals)) {
        return result.devotionals;
      } else if (result && Array.isArray(result.items)) {
        return result.items;
      }
      return [];
    } catch (error) {
      console.error('Error fetching devotionals:', error);
      return [];
    }
  },

  getToday: async (): Promise<Devotional | null> => {
    try {
      const result = await apiClient.get<Devotional>(ENDPOINTS.DEVOTIONALS_TODAY);
      return result || null;
    } catch (error) {
      console.error('Error fetching today\'s devotional:', error);
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

  getByDate: async (date: string): Promise<Devotional | null> => {
    try {
      // Format: YYYY-MM-DD
      const result = await apiClient.get<Devotional>(`${ENDPOINTS.DEVOTIONALS_BY_DATE}/${date}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching devotional by date:', error);
      return null;
    }
  },
};

export const videoSermonsApi = {
  getAll: async (): Promise<VideoSermon[]> => {
    try {
      const result = await apiClient.get<any>(ENDPOINTS.VIDEO_SERMONS);
      // Handle the backend response format: { success: true, data: { sermons: [...], total, page, etc } }
      if (result && result.sermons && Array.isArray(result.sermons)) {
        return result.sermons;
      }
      return [];
    } catch (error) {
      console.error('Error fetching video sermons:', error);
      return [];
    }
  },

  getFeatured: async (): Promise<VideoSermon[]> => {
    try {
      const result = await apiClient.get<VideoSermon[]>(ENDPOINTS.VIDEO_SERMONS_FEATURED);
      // Featured endpoints return direct array, not paginated
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching featured video sermons:', error);
      return [];
    }
  },

  // FIXED: Backend expects categoryId (number), not category name (string)
  getByCategory: async (categoryId: number): Promise<VideoSermon[]> => {
    try {
      if (!categoryId || isNaN(categoryId)) {
        console.warn('Invalid categoryId provided to getByCategory:', categoryId);
        return [];
      }
      
      const result = await apiClient.get<VideoSermon[]>(`${ENDPOINTS.VIDEO_SERMONS_BY_CATEGORY}/${categoryId}`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching video sermons by category:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<VideoSermon | null> => {
    try {
      const result = await apiClient.get<VideoSermon>(`${ENDPOINTS.VIDEO_SERMONS}/${id}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching video sermon by ID:', error);
      return null;
    }
  },
};

export const audioSermonsApi = {
  getAll: async (): Promise<AudioSermon[]> => {
    try {
      const result = await apiClient.get<any>(ENDPOINTS.AUDIO_SERMONS);
      // Handle the backend response format: { success: true, data: { sermons: [...], ... } }
      if (result && result.sermons && Array.isArray(result.sermons)) {
        return result.sermons.map(transformAudioSermon);
      }
      return [];
    } catch (error) {
      console.error('Error fetching audio sermons:', error);
      return [];
    }
  },

  getFeatured: async (): Promise<AudioSermon[]> => {
    try {
      const result = await apiClient.get<AudioSermon[]>(ENDPOINTS.AUDIO_SERMONS_FEATURED);
      // Featured endpoints return direct array, not paginated
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching featured audio sermons:', error);
      return [];
    }
  },

  // FIXED: Backend expects categoryId (number), not category name (string)
  getByCategory: async (categoryId: number): Promise<AudioSermon[]> => {
    try {
      if (!categoryId || isNaN(categoryId)) {
        console.warn('Invalid categoryId provided to getByCategory:', categoryId);
        return [];
      }
      
      const result = await apiClient.get<AudioSermon[]>(`${ENDPOINTS.AUDIO_SERMONS_BY_CATEGORY}/${categoryId}`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching audio sermons by category:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<AudioSermon | null> => {
    try {
      const result = await apiClient.get<AudioSermon>(`${ENDPOINTS.AUDIO_SERMONS}/${id}`);
      return result || null;
    } catch (error) {
      console.error('Error fetching audio sermon by ID:', error);
      return null;
    }
  },
};

export const announcementsApi = {
  getAll: async (): Promise<Announcement[]> => {
    try {
      const result = await apiClient.get<any>(ENDPOINTS.ANNOUNCEMENTS);
      // Support both direct array and nested array (data.announcements)
      if (Array.isArray(result)) {
        return result;
      } else if (result && Array.isArray(result.announcements)) {
        return result.announcements;
      } else if (result && Array.isArray(result.items)) {
        return result.items;
      }
      return [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  },

  getActive: async (): Promise<Announcement[]> => {
    try {
      const result = await apiClient.get<Announcement[]>(ENDPOINTS.ANNOUNCEMENTS_ACTIVE);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching active announcements:', error);
      return [];
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
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
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

  // Helper method to find category by name and return ID
  findCategoryIdByName: async (name: string): Promise<number | null> => {
    try {
      const categories = await categoriesApi.getAll();
      const category = categories.find(cat => 
        cat.name.toLowerCase() === name.toLowerCase()
      );
      return category ? category.id : null;
    } catch (error) {
      console.error('Error finding category by name:', error);
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
        console.log('📊 Analytics tracking failed (queued for background sync)');
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
        console.log('📊 Session tracked');
      }
    } catch (error) {
      if (config.enableDebugLogs) {
        console.log('📊 Session tracking failed (queued for background sync)');
      }
    }
  },
};

// HELPER FUNCTIONS FOR CATEGORY HANDLING
export const sermonHelpers = {
  // Get video sermons by category name (converts to ID)
  getVideosByCategoryName: async (categoryName: string): Promise<VideoSermon[]> => {
    try {
      const categoryId = await categoriesApi.findCategoryIdByName(categoryName);
      if (!categoryId) {
        console.warn(`Category "${categoryName}" not found`);
        return [];
      }
      return await videoSermonsApi.getByCategory(categoryId);
    } catch (error) {
      console.error('Error fetching videos by category name:', error);
      return [];
    }
  },

  // Get audio sermons by category name (converts to ID)
  getAudioByCategoryName: async (categoryName: string): Promise<AudioSermon[]> => {
    try {
      const categoryId = await categoriesApi.findCategoryIdByName(categoryName);
      if (!categoryId) {
        console.warn(`Category "${categoryName}" not found`);
        return [];
      }
      return await audioSermonsApi.getByCategory(categoryId);
    } catch (error) {
      console.error('Error fetching audio by category name:', error);
      return [];
    }
  },
};

// Types (ensure these match backend exactly)
interface Devotional {
  id: number;
  title: string;
  content: string;
  verse_reference: string;
  verse_text: string;
  date: string;
  prayer?: string;
  created_at: string;
  updated_at: string;
}

interface VideoSermon {
  id: number;
  title: string;
  speaker: string;
  youtube_id: string;
  description?: string;
  duration?: string;
  category?: string;
  sermon_date?: string;
  thumbnail_url?: string;
  is_featured: boolean;
  created_at: string;
}

interface AudioSermon {
  id: number;
  title: string;
  speaker: string;
  audio_url: string;
  cloudinary_public_id?: string;
  duration?: string;
  file_size?: number;
  category?: string;
  sermon_date?: string;
  description?: string;
  is_featured: boolean;
  created_at: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  start_date: string;
  expiry_date?: string;
  image_url?: string;
  cloudinary_public_id?: string;
  action_url?: string;
  action_text?: string;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
}