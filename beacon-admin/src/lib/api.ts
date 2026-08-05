// beacon-admin/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth state management - Use same keys as AuthContext
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

// Set auth token
export const setAuthToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      localStorage.setItem('tbc_admin_token', token);
    } catch (error) {
      console.error('Failed to persist auth token:', error);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => accessToken;

export const clearAuth = () => {
  accessToken = null;
  delete api.defaults.headers.common['Authorization'];
  // Use same keys as AuthContext
  try {
    localStorage.removeItem('tbc_admin_token');
    localStorage.removeItem('tbc_admin_refresh_token');
    localStorage.removeItem('tbc_admin_data');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
};

// Initialize token from localStorage on client side
if (typeof window !== 'undefined') {
  try {
    const savedToken = localStorage.getItem('tbc_admin_token');
    if (savedToken) {
      setAuthToken(savedToken);
    }
  } catch (error) {
    console.error('Failed to initialize token from localStorage:', error);
  }
}


api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('🔄 Token expired, attempting refresh...');

      try {
        // Try to refresh token
        if (!refreshPromise) {
          refreshPromise = refreshToken();
        }
        
        const newToken = await refreshPromise;
        refreshPromise = null;
        
        console.log('✅ Token refresh successful');
        setAuthToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Refresh failed, redirect to login
        clearAuth();
        if (typeof window !== 'undefined') {
          console.log('🔄 Redirecting to login...');
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
    console.log('🔄 Attempting token refresh...');
    const storedRefreshToken = localStorage.getItem('tbc_admin_refresh_token');
    if (!storedRefreshToken) {
      console.error('❌ No refresh token available');
      throw new Error('No refresh token available');
    }

    console.log('📤 Sending refresh request...');
    const response = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
      refreshToken: storedRefreshToken
    }, {
      withCredentials: true,
    });
    
    const { accessToken: newToken } = response.data.data;
    console.log('✅ Received new access token');
    // Use same key as AuthContext
    localStorage.setItem('tbc_admin_token', newToken);
    return newToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    throw new Error('Token refresh failed');
  }
};

// Generic API request wrapper with error handling
const apiRequest = async (requestFn: () => Promise<any>) => {
  try {
    const response = await requestFn();
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('API request failed:', error.response?.data || error.message);
    // Backend error responses use `{ error: "..." }` (see backend/src/utils/
    // responses.ts sendError) - not `.message`. Callers across the admin
    // check `error?.response?.data?.message` first (always undefined) then
    // fall back to `error.message`, so patch the real backend reason in
    // here rather than fixing every call site.
    const backendMessage = error.response?.data?.error;
    if (backendMessage) error.message = backendMessage;
    throw error;
  }
};

// FIXED: Authentication API with correct endpoints
export const authApi = {
  async login(credentials: { email: string; password: string }) {
    console.log('🔐 Attempting login...');
    const response = await api.post('/admin/auth/login', credentials);
    
    const { admin, accessToken: token, refreshToken: refresh } = response.data.data;

    // Store tokens (admin object is persisted separately by authContext's setStoredAdmin)
    setAuthToken(token);
    if (refresh) {
      localStorage.setItem('tbc_admin_refresh_token', refresh);
    }

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
    const refresh = localStorage.getItem('tbc_admin_refresh_token');
    if (!refresh) throw new Error('No refresh token available');

    const response = await api.post('/admin/auth/refresh', { refreshToken: refresh });
    const { accessToken, refreshToken: newRefresh } = response.data.data;

    setAuthToken(accessToken);
    if (newRefresh) {
      localStorage.setItem('tbc_admin_refresh_token', newRefresh);
    }

    return response.data;
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
    console.log('➕ Creating video sermon via admin endpoint...');
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

  async syncFromYoutube() {
    console.log('📡 Syncing video sermons from YouTube channel...');
    // Overrides the 30s default - this processes every new video sequentially
    // (one Gemini classification call each), which can genuinely take minutes
    // on a channel with a lot of uploads.
    return apiRequest(() => api.post('/video-sermons/admin/sync-youtube', undefined, { timeout: 10 * 60 * 1000 }));
  },

  async getSeriesList() {
    return apiRequest(() => api.get('/video-sermons/admin/series'));
  },

  async bulkUpdateKind(ids: number[], kind: 'SERMON' | 'EXCERPT' | 'INSPIRATIONAL') {
    return apiRequest(() => api.patch('/video-sermons/admin/bulk-kind', { ids, kind }));
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
  async audio(file: File) {
    console.log('🎵 Uploading audio file:', file.name);
    
    const formData = new FormData();
    formData.append('audio', file);
    
    const response = await api.post('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${progress}%`);
        }
      },
    });
    
    return response.data.data;
  },

  async image(file: File) {
    console.log('🖼️ Uploading image file:', file.name);
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  },

  async extractYouTubeThumbnail(youtubeId: string) {
    console.log('📺 Extracting YouTube thumbnail for:', youtubeId);

    const response = await api.post('/upload/youtube-thumbnail', {
      youtubeId,
    });

    return response.data.data;
  },
};

// CSGs (Community Small Groups) API
export const csgsApi = {
  async getAll() {
    return apiRequest(() => api.get('/csgs'));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/csgs/${id}`));
  },

  async getAdminMembers(id: number) {
    return apiRequest(() => api.get(`/csgs/${id}/admin/members`));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/csgs', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/csgs/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/csgs/${id}`));
  },

  async removeMember(id: number, membershipId: number) {
    return apiRequest(() => api.delete(`/csgs/${id}/members/${membershipId}`));
  },

  async postUpdate(id: number, data: { title?: string; body: string; notifyMembers?: boolean }) {
    return apiRequest(() => api.post(`/csgs/${id}/updates`, data));
  },

  async getStats() {
    return apiRequest(() => api.get('/csgs/admin/stats'));
  },
};

// Sunday photo collages API
export const collagesApi = {
  async getAll() {
    return apiRequest(() => api.get('/collages'));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/collages/${id}`));
  },

  async create(data: { date: string; photos: { url: string; publicId: string }[]; coverIndex: number }) {
    return apiRequest(() => api.post('/collages', data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/collages/${id}`));
  },
};

// Admins API (admin user management - distinct from authApi's /admin/auth/* endpoints)
export const adminsApi = {
  async getAll() {
    return apiRequest(() => api.get('/admin'));
  },

  async create(data: { email: string; password: string; name: string; role: string; csgId?: number }) {
    return apiRequest(() => api.post('/admin/create', data));
  },

  async update(id: number, data: { name?: string; role?: string; csgId?: number; isActive?: boolean }) {
    return apiRequest(() => api.put(`/admin/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/admin/${id}`));
  },

  async updateSelf(data: { name?: string; currentPassword?: string; newPassword?: string }) {
    return apiRequest(() => api.put('/admin/me', data));
  },
};

// Giving API
export const givingApi = {
  async getBankAccounts() {
    return apiRequest(() => api.get('/giving/bank-accounts'));
  },

  async createBankAccount(data: any) {
    return apiRequest(() => api.post('/giving/bank-accounts', data));
  },

  async updateBankAccount(id: number, data: any) {
    return apiRequest(() => api.put(`/giving/bank-accounts/${id}`, data));
  },

  async deleteBankAccount(id: number) {
    return apiRequest(() => api.delete(`/giving/bank-accounts/${id}`));
  },

  async getAdminTransactions(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/giving/admin/transactions?${params.toString()}`));
  },
};

// Projects API
export const projectsApi = {
  async getAll() {
    return apiRequest(() => api.get('/projects'));
  },

  async getById(id: number) {
    return apiRequest(() => api.get(`/projects/${id}`));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/projects', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/projects/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/projects/${id}`));
  },
};

// Prayer Requests API
export const prayerRequestsApi = {
  async getAll(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/prayer-requests?${params.toString()}`));
  },

  async updateStatus(id: number, status: string) {
    return apiRequest(() => api.patch(`/prayer-requests/${id}/status`, { status }));
  },
};

// Contact API
export const contactApi = {
  async getAll(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return apiRequest(() => api.get(`/contact?${params.toString()}`));
  },

  async updateStatus(id: number, status: string) {
    return apiRequest(() => api.patch(`/contact/${id}/status`, { status }));
  },
};

// Notify API
export const notifyApi = {
  async send(data: {
    audience: 'all' | 'topic' | 'csg';
    topic?: string;
    csgId?: number;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    return apiRequest(() => api.post('/notify/send', data));
  },
};

// Live Schedule API
export const liveScheduleApi = {
  async getAll() {
    return apiRequest(() => api.get('/live-schedule'));
  },

  async create(data: any) {
    return apiRequest(() => api.post('/live-schedule', data));
  },

  async update(id: number, data: any) {
    return apiRequest(() => api.put(`/live-schedule/${id}`, data));
  },

  async delete(id: number) {
    return apiRequest(() => api.delete(`/live-schedule/${id}`));
  },
};

export default api;