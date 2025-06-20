// beacon-admin/src/lib/api.ts (FIXED VERSION)
import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG, validateConfig, logConfig } from './api-config';

// Validate configuration on startup
validateConfig();
logConfig();

// Create axios instance with configuration
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'beacon_admin_token';
const REFRESH_TOKEN_KEY = 'beacon_admin_refresh_token';
const ADMIN_KEY = 'beacon_admin_user';

export interface Admin {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  data: {
    admin: Admin;
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

class AdminAuthService {
  private static readonly BASE_URL = API_CONFIG.baseURL;
  private static isRefreshing = false;
  private static refreshPromise: Promise<boolean> | null = null;

  // Token management
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  static removeTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  }

  static getStoredAdmin(): Admin | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(ADMIN_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  static setStoredAdmin(admin: Admin): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  }

  // Enhanced API call with automatic token refresh
  static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 Admin API Call: ${options.method || 'GET'} ${endpoint}`);
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      
      // If token expired, try to refresh
      if (response.status === 401 && token && !this.isRefreshing) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.getToken()}`,
          };
          const retryResponse = await fetch(`${this.BASE_URL}${endpoint}`, config);
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, remove tokens and redirect to login
          this.removeTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Session expired');
        }
      }
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Admin API call failed:', error);
      throw error;
    }
  }

  private static async handleResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data.message || data.error);
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }
      
      console.log(`✅ API Success: ${response.status}`);
      return data;
    } else {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    }
  }

  // Auth specific methods
  static async login(credentials: AdminLoginRequest): Promise<{ admin: Admin; accessToken: string; refreshToken: string }> {
    console.log('🔐 Attempting admin login...');
    const response = await this.apiCall('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setToken(response.data.accessToken);
      this.setRefreshToken(response.data.refreshToken);
      this.setStoredAdmin(response.data.admin);
      console.log('✅ Admin login successful');
      return response.data;
    }
    
    throw new Error(response.error || 'Login failed');
  }

  static async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || this.isRefreshing) {
      return false;
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private static async performTokenRefresh(refreshToken: string): Promise<boolean> {
    try {
      console.log('🔄 Refreshing access token...');
      const response = await fetch(`${this.BASE_URL}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.accessToken) {
          this.setToken(data.data.accessToken);
          console.log('✅ Token refresh successful');
          return true;
        }
      }
      
      console.error('❌ Token refresh failed');
      return false;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }

  static async getCurrentAdmin(): Promise<Admin | null> {
    try {
      const response = await this.apiCall('/admin/auth/me');
      if (response.success && response.data) {
        this.setStoredAdmin(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get current admin:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await this.apiCall('/admin/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.removeTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
}

// Generic API request wrapper with better error handling
async function apiRequest<T>(requestFn: () => Promise<any>): Promise<T> {
  try {
    const response = await requestFn();
    return response.data || response;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(message);
    }
    throw error;
  }
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = AdminAuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && AdminAuthService.getToken()) {
      const refreshed = await AdminAuthService.refreshToken();
      if (refreshed && error.config) {
        // Retry the original request
        error.config.headers['Authorization'] = `Bearer ${AdminAuthService.getToken()}`;
        return api.request(error.config);
      } else {
        AdminAuthService.removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Export the auth service and enhanced APIs
export { AdminAuthService };

// API Collections using the configured axios instance
export const devotionalsApi = {
  async getAll(page: number = 1, limit: number = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/devotionals?${params.toString()}`));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/devotionals/${id}`));
  },

  async getByDate(date: string) {
    return apiRequest(() => api.get(`/devotionals/date/${date}`));
  },

  async getToday() {
    return apiRequest(() => api.get('/devotionals/today'));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/admin/devotionals', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/admin/devotionals/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/admin/devotionals/${id}`));
  },

  async bulkCreate(data: any[]) {
    return apiRequest(() => api.post('/admin/devotionals/bulk', { devotionals: data }));
  },
};

export const videoSermonsApi = {
  async getAll(page: number = 1, limit: number = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/video-sermons?${params.toString()}`));
  },

  async getFeatured() {
    return apiRequest(() => api.get('/video-sermons/featured'));
  },

  async getByCategory(categoryId: number) {
    return apiRequest(() => api.get(`/video-sermons/category/${categoryId}`));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/video-sermons/${id}`));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/admin/video-sermons', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/admin/video-sermons/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/admin/video-sermons/${id}`));
  },

  async toggleFeatured(id: number) {
    return apiRequest(() => api.patch(`/admin/video-sermons/${id}/featured`));
  },
};

export const audioSermonsApi = {
  async getAll(page: number = 1, limit: number = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/audio-sermons?${params.toString()}`));
  },

  async getFeatured() {
    return apiRequest(() => api.get('/audio-sermons/featured'));
  },

  async getByCategory(categoryId: number) {
    return apiRequest(() => api.get(`/audio-sermons/category/${categoryId}`));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/audio-sermons/${id}`));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/admin/audio-sermons', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/admin/audio-sermons/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/admin/audio-sermons/${id}`));
  },

  async toggleFeatured(id: number) {
    return apiRequest(() => api.patch(`/admin/audio-sermons/${id}/featured`));
  },
};

export const announcementsApi = {
  async getAll(page: number = 1, limit: number = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/announcements?${params.toString()}`));
  },

  async getActive() {
    return apiRequest(() => api.get('/announcements/active'));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/announcements/${id}`));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/admin/announcements', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/admin/announcements/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/admin/announcements/${id}`));
  },

  async toggleActive(id: number) {
    return apiRequest(() => api.patch(`/admin/announcements/${id}/activate`));
  },
};

export const categoriesApi = {
  async getAll() {
    try {
      const response = await apiRequest(() => api.get('/categories'));
      // Ensure we always return an array
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else if (response && Array.isArray(response.categories)) {
        return response.categories;
      } else {
        console.warn('Categories API returned unexpected format:', response);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/categories/${id}`));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/admin/categories', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/admin/categories/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/admin/categories/${id}`));
  },

  async getStats() {
    return apiRequest(() => api.get('/admin/categories/stats'));
  },
};

// FIXED: Analytics API with correct endpoints
export const analyticsApi = {
  async trackInteraction(data: any) {
    return apiRequest(() => api.post('/analytics/track', data));
  },

  async trackSession(data: any) {
    return apiRequest(() => api.post('/analytics/session', data));
  },

  // FIXED: Use correct endpoint path
  async getDashboard() {
    try {
      return await apiRequest(() => api.get('/analytics/dashboard'));
    } catch (error) {
      console.error('Analytics dashboard error:', error);
      // Return mock data for development
      return {
        totalUsers: 0,
        totalContent: 0,
        todayViews: 0,
        weeklyGrowth: 0,
      };
    }
  },

  async getContentPerformance() {
    try {
      return await apiRequest(() => api.get('/analytics/content-performance'));
    } catch (error) {
      console.error('Content performance error:', error);
      return [];
    }
  },

  async getUserEngagement() {
    try {
      return await apiRequest(() => api.get('/analytics/user-engagement'));
    } catch (error) {
      console.error('User engagement error:', error);
      return {};
    }
  },

  async getPopularContent() {
    try {
      return await apiRequest(() => api.get('/analytics/popular-content'));
    } catch (error) {
      console.error('Popular content error:', error);
      return [];
    }
  },
};

export const uploadApi = {
  async uploadImage(file: File, folder?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    return apiRequest(() => 
      api.post('/admin/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
  },

  async uploadAudio(file: File, folder?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    return apiRequest(() => 
      api.post('/admin/upload/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          console.log(`📤 Upload progress: ${percentCompleted}%`);
        },
      })
    );
  },

  async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image') {
    return apiRequest(() => 
      api.delete(`/admin/upload/${publicId}`, {
        data: { resourceType }
      })
    );
  },
};

export default api;