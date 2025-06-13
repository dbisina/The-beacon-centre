// lib/api.ts - API client and authentication

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from './types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token management
class AuthTokenManager {
  private static readonly TOKEN_KEY = 'beacon_admin_token';
  
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = AuthTokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AuthTokenManager.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    const apiError: ApiError = {
      message: error.response?.data?.error || 'An unexpected error occurred',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors,
    };
    
    return Promise.reject(apiError);
  }
);

// API wrapper function for better error handling
async function apiRequest<T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> {
  try {
    const response = await request();
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed');
    }
    
    return response.data.data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
}

// Authentication API
export const authApi = {
  async login(credentials: { email: string; password: string }) {
    const response = await api.post('/admin/auth/login', credentials);
    if (response.data.success && response.data.data.accessToken) {
      AuthTokenManager.setToken(response.data.data.accessToken);
    }
    return apiRequest(() => Promise.resolve(response));
  },

  async logout() {
    try {
      await api.post('/admin/auth/logout');
    } finally {
      AuthTokenManager.removeToken();
    }
  },

  async getProfile() {
    return apiRequest(() => api.get('/admin/auth/me'));
  },

  async refreshToken() {
    return apiRequest(() => api.post('/admin/auth/refresh'));
  },

  // Token management
  getToken: AuthTokenManager.getToken,
  setToken: AuthTokenManager.setToken,
  removeToken: AuthTokenManager.removeToken,
};

// Devotionals API
export const devotionalsApi = {
  async getAll(filters?: Record<string, any>) {
    const params = new URLSearchParams();
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

  async create(data: any) {
    return apiRequest(() => api.post('/admin/devotionals', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/admin/devotionals/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/admin/devotionals/${id}`));
  },

  async bulkCreate(devotionals: any[]) {
    return apiRequest(() => api.post('/admin/devotionals/bulk', { devotionals }));
  },
};

// Video Sermons API
export const videoSermonsApi = {
  async getAll(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/video-sermons?${params.toString()}`));
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

  async getStats() {
    return apiRequest(() => api.get('/admin/video-sermons/stats'));
  },
};

// Audio Sermons API
export const audioSermonsApi = {
  async getAll(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/audio-sermons?${params.toString()}`));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/audio-sermons/${id}`));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/admin/audio-sermons', data));
  },

  async createWithUpload(formData: FormData) {
    return apiRequest(() => 
      api.post('/admin/audio-sermons/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
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

  async getStats() {
    return apiRequest(() => api.get('/admin/audio-sermons/stats'));
  },
};

// Announcements API
export const announcementsApi = {
  async getAll(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/announcements?${params.toString()}`));
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

  async getStats() {
    return apiRequest(() => api.get('/admin/announcements/stats'));
  },
};

// Categories API
export const categoriesApi = {
  async getAll() {
    return apiRequest(() => api.get('/categories'));
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

// Analytics API
export const analyticsApi = {
  async getDashboard() {
    return apiRequest(() => api.get('/admin/analytics/dashboard'));
  },

  async getContentPerformance(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/admin/analytics/content-performance?${params.toString()}`));
  },

  async getUserEngagement(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/admin/analytics/user-engagement?${params.toString()}`));
  },

  async getPopularContent(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/admin/analytics/popular-content?${params.toString()}`));
  },
};

// Upload API
export const uploadApi = {
  async uploadAudio(file: File) {
    const formData = new FormData();
    formData.append('audio', file);
    return apiRequest(() => 
      api.post('/admin/upload/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return apiRequest(() => 
      api.post('/admin/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  async uploadThumbnail(file: File) {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return apiRequest(() => 
      api.post('/admin/upload/thumbnail', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  async extractYouTubeThumbnail(youtubeId: string) {
    return apiRequest(() => 
      api.post('/admin/upload/youtube-thumbnail', { youtubeId })
    );
  },

  async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image') {
    return apiRequest(() => 
      api.delete(`/admin/upload/${publicId}?resourceType=${resourceType}`)
    );
  },

  async getFileDetails(publicId: string, resourceType: 'image' | 'video' = 'image') {
    return apiRequest(() => 
      api.get(`/admin/upload/${publicId}/details?resourceType=${resourceType}`)
    );
  },
};

// Admins API
export const adminsApi = {
  async getAll() {
    return apiRequest(() => api.get('/admin'));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/admin/create', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/admin/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/admin/${id}`));
  },
};

export default api;