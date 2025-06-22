// beacon-admin/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based refresh tokens
});

// Auth state management
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

// Set auth token
export const setAuthToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Get current token
export const getAuthToken = () => accessToken;

// Clear auth state
export const clearAuth = () => {
  accessToken = null;
  delete api.defaults.headers.common['Authorization'];
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        if (!refreshPromise) {
          refreshPromise = refreshToken();
        }
        
        const newToken = await refreshPromise;
        refreshPromise = null;
        
        setAuthToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Refresh token function
const refreshToken = async (): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {}, {
      withCredentials: true,
    });
    
    const { accessToken: newToken } = response.data.data;
    localStorage.setItem('adminToken', newToken);
    return newToken;
  } catch (error) {
    throw new Error('Token refresh failed');
  }
};

// Enhanced error handling for API requests
const apiRequest = async (requestFn: () => Promise<any>) => {
  try {
    const response = await requestFn();
    console.log('✅ API Success:', response.config?.url, response.data);
    return response.data.data; // Return just the data part
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 0;
    const url = error.config?.url || 'unknown endpoint';
    
    console.error(`❌ API Error: ${statusCode} ${url}`, {
      message: errorMessage,
      status: statusCode,
      data: error.response?.data,
    });
    
    throw new Error(errorMessage);
  }
};

// FIXED: Authentication API with correct endpoints
export const authApi = {
  async login(credentials: { email: string; password: string }) {
    console.log('🔐 Attempting login...');
    const response = await api.post('/admin/auth/login', credentials);
    
    const { admin, accessToken: token } = response.data.data;
    
    // Store token and user data
    setAuthToken(token);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(admin));
    
    console.log('✅ Login successful:', admin.email);
    return { admin, token };
  },

  async logout() {
    try {
      await api.post('/admin/auth/logout');
    } catch (error) {
      console.warn('Logout request failed, clearing local auth anyway');
    } finally {
      clearAuth();
    }
  },

  async getProfile() {
    return apiRequest(() => api.get('/admin/auth/me'));
  },

  async refreshToken() {
    return refreshToken();
  },
};

// FIXED: Analytics API with correct endpoints
export const analyticsApi = {
  async getDashboard() {
    console.log('📊 Fetching dashboard analytics...');
    return apiRequest(() => api.get('/analytics/dashboard'));
  },

  async getContentPerformance(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(() => api.get(`/analytics/content-performance${query}`));
  },

  async getUserEngagement(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(() => api.get(`/analytics/user-engagement${query}`));
  },

  async getPopularContent(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(() => api.get(`/analytics/popular-content${query}`));
  },
};

// FIXED: Video Sermons API with correct endpoints
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
    console.log('🎥 Fetching video sermons...');
    return apiRequest(() => api.get(`/video-sermons?${params.toString()}`));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/video-sermons/${id}`));
  },

  async getFeatured() {
    return apiRequest(() => api.get('/video-sermons/featured'));
  },

  async getByCategory(category: string) {
    return apiRequest(() => api.get(`/video-sermons/category/${category}`));
  },

  async create(data: any) {
    console.log('➕ Creating video sermon...');
    return apiRequest(() => api.post('/video-sermons', data));
  },

  async update(id: number, data: any) {
    console.log('📝 Updating video sermon:', id);
    return apiRequest(() => api.put(`/video-sermons/${id}`, data));
  },

  async delete(id: number) {
    console.log('🗑️ Deleting video sermon:', id);
    return apiRequest(() => api.delete(`/video-sermons/${id}`));
  },

  async toggleFeatured(id: number) {
    return apiRequest(() => api.patch(`/video-sermons/${id}/featured`));
  },

  async getStats() {
    return apiRequest(() => api.get('/video-sermons/admin/stats'));
  },
};

// FIXED: Audio Sermons API with correct endpoints
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
    console.log('🎵 Fetching audio sermons...');
    return apiRequest(() => api.get(`/audio-sermons?${params.toString()}`));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/audio-sermons/${id}`));
  },

  async getFeatured() {
    return apiRequest(() => api.get('/audio-sermons/featured'));
  },

  async getByCategory(category: string) {
    return apiRequest(() => api.get(`/audio-sermons/category/${category}`));
  },

  async create(data: any) {
    console.log('➕ Creating audio sermon...');
    return apiRequest(() => api.post('/audio-sermons', data));
  },

  async update(id: number, data: any) {
    console.log('📝 Updating audio sermon:', id);
    return apiRequest(() => api.put(`/audio-sermons/${id}`, data));
  },

  async delete(id: number) {
    console.log('🗑️ Deleting audio sermon:', id);
    return apiRequest(() => api.delete(`/audio-sermons/${id}`));
  },

  async toggleFeatured(id: number) {
    return apiRequest(() => api.patch(`/audio-sermons/${id}/featured`));
  },

  async getStats() {
    return apiRequest(() => api.get('/audio-sermons/admin/stats'));
  },
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

  async getByDate(date: string) {
    return apiRequest(() => api.get(`/devotionals/date/${date}`));
  },

  async getToday() {
    return apiRequest(() => api.get('/devotionals/today'));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/devotionals', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/devotionals/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/devotionals/${id}`));
  },

  async bulkImport(data: any) {
    return apiRequest(() => api.post('/devotionals/bulk', data));
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

  async getActive() {
    return apiRequest(() => api.get('/announcements/active'));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/announcements', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/announcements/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/announcements/${id}`));
  },

  async toggleActive(id: number) {
    return apiRequest(() => api.patch(`/announcements/${id}/activate`));
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
    return apiRequest(() => api.post('/categories', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/categories/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/categories/${id}`));
  },
};

// Upload API
export const uploadApi = {
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    
    return apiRequest(() => api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }));
  },

  async uploadAudio(file: File) {
    const formData = new FormData();
    formData.append('audio', file);
    
    return apiRequest(() => api.post('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }));
  },

  async deleteFile(fileId: string) {
    return apiRequest(() => api.delete(`/upload/${fileId}`));
  },
};

// Initialize auth token from localStorage on app start
if (typeof window !== 'undefined') {
  const savedToken = localStorage.getItem('adminToken');
  if (savedToken) {
    setAuthToken(savedToken);
  }
}

export default api;