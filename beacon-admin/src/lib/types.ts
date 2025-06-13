// lib/types.ts - Matching backend types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Content Types
export interface Devotional {
  id: number;
  date: string;
  title: string;
  verseText: string;
  verseReference: string;
  content: string;
  prayer?: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoSermon {
  id: number;
  title: string;
  speaker: string;
  youtubeId: string;
  description?: string;
  duration?: string;
  categoryId?: number;
  sermonDate?: string;
  thumbnailUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface AudioSermon {
  id: number;
  title: string;
  speaker: string;
  audioUrl: string;
  cloudinaryPublicId: string;
  duration?: string;
  fileSize?: number;
  categoryId?: number;
  sermonDate?: string;
  description?: string;
  isFeatured: boolean;
  isActive: boolean;
  playCount: number;
  downloadCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate: string;
  expiryDate?: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  actionUrl?: string;
  actionText?: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Admin Types
export interface Admin {
  id: number;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  admin: Admin;
  accessToken: string;
}

// Form Types
export interface CreateDevotionalForm {
  date: string;
  title: string;
  verseText: string;
  verseReference: string;
  content: string;
  prayer?: string;
  isActive?: boolean;
}

export interface CreateVideoSermonForm {
  title: string;
  speaker: string;
  youtubeId: string;
  description?: string;
  duration?: string;
  categoryId?: number;
  sermonDate?: string;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  tags?: string[];
}

export interface CreateAudioSermonForm {
  title: string;
  speaker: string;
  audioUrl: string;
  cloudinaryPublicId: string;
  duration?: string;
  fileSize?: number;
  categoryId?: number;
  sermonDate?: string;
  description?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  tags?: string[];
}

export interface CreateAnnouncementForm {
  title: string;
  content: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate: string;
  expiryDate?: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  actionUrl?: string;
  actionText?: string;
  isActive?: boolean;
}

export interface CreateCategoryForm {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

// Analytics Types
export interface AnalyticsDashboard {
  overview: {
    totalDevices: number;
    activeDevices: number;
    totalContent: {
      devotionals: number;
      videos: number;
      audios: number;
      announcements: number;
      total: number;
    };
    totalInteractions: number;
    recentInteractions: number;
  };
  demographics: {
    byPlatform: Array<{ platform: string; count: number }>;
    byCountry: Array<{ country: string; count: number }>;
  };
  popularContent: Array<{
    contentType: string;
    contentId: number;
    views: number;
  }>;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  publicId: string;
  bytes: number;
  duration?: number;
  format: string;
}

// API Error
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Table Filters
export interface TableFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

// Navigation Item
export interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: number;
  children?: NavItem[];
}