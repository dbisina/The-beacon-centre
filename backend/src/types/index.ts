// backend/src/types/index.ts
import { Request } from 'express';
import { 
  Devotional, 
  VideoSermon, 
  AudioSermon, 
  Announcement, 
  Category, 
  Admin, 
  DeviceSession, 
  ContentInteraction,
  Priority,
  AdminRole,
  ContentType,
  InteractionType
} from '@prisma/client';

// Export Prisma types
export {
  Devotional,
  VideoSermon, 
  AudioSermon,
  Announcement,
  Category,
  Admin,
  DeviceSession,
  ContentInteraction,
  Priority,
  AdminRole,
  ContentType,
  InteractionType
};

// Extended types with relations
export interface DevotionalWithInteractions extends Devotional {
  interactions: ContentInteraction[];
  _count?: {
    interactions: number;
  };
}

export interface VideoSermonWithCategory extends VideoSermon {
  category: Category | null;
  interactions: ContentInteraction[];
  _count?: {
    interactions: number;
  };
}

export interface AudioSermonWithCategory extends AudioSermon {
  category: Category | null;
  interactions: ContentInteraction[];
  _count?: {
    interactions: number;
  };
}

export interface AnnouncementWithInteractions extends Announcement {
  interactions: ContentInteraction[];
  _count?: {
    interactions: number;
  };
}

export interface CategoryWithCounts extends Category {
  _count: {
    videoSermons: number;
    audioSermons: number;
  };
}

// API Request/Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Devotional types
export interface CreateDevotionalRequest {
  date: string; // ISO date string
  title: string;
  verseText: string;
  verseReference: string;
  content: string;
  prayer?: string;
  isActive?: boolean;
}

export interface UpdateDevotionalRequest extends Partial<CreateDevotionalRequest> {
  id: number;
}

export interface DevotionalFilters extends PaginationParams {
  startDate?: string;
  endDate?: string;
  search?: string;
  isActive?: boolean;
}

// Video Sermon types
export interface CreateVideoSermonRequest {
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

export interface UpdateVideoSermonRequest extends Partial<CreateVideoSermonRequest> {
  id: number;
}

export interface VideoSermonFilters extends PaginationParams {
  categoryId?: number;
  speaker?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Audio Sermon types
export interface CreateAudioSermonRequest {
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
  // New fields for thumbnail support
  thumbnailUrl?: string;
  thumbnailCloudinaryPublicId?: string;
}

export interface UpdateAudioSermonRequest extends Partial<CreateAudioSermonRequest> {
  id: number;
}

export interface AudioSermonFilters extends PaginationParams {
  categoryId?: number;
  speaker?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Announcement types
export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority?: Priority;
  startDate: string;
  expiryDate?: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  actionUrl?: string;
  actionText?: string;
  isActive?: boolean;
}

export interface UpdateAnnouncementRequest extends Partial<CreateAnnouncementRequest> {
  id: number;
}

export interface AnnouncementFilters extends PaginationParams {
  priority?: Priority;
  isActive?: boolean;
  isExpired?: boolean;
  search?: string;
}

// Category types
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: number;
}

// Admin types
export interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
  role?: AdminRole;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateAdminRequest {
  id: number;
  email?: string;
  name?: string;
  role?: AdminRole;
  permissions?: string[];
  isActive?: boolean;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  admin: Omit<Admin, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  adminId: number;
  email: string;
  role: AdminRole;
  permissions: string[];
}

// Analytics types
export interface AnalyticsTrackingRequest {
  deviceId: string;
  contentType: ContentType;
  contentId: number;
  interactionType: InteractionType;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export interface DeviceSessionRequest {
  deviceId: string;
  platform?: string;
  appVersion?: string;
  country?: string;
  state?: string;
}

export interface AnalyticsDashboard {
  totalUsers: number;
  activeUsers: number;
  totalContent: {
    devotionals: number;
    videoSermons: number;
    audioSermons: number;
    announcements: number;
  };
  popularContent: {
    devotionals: DevotionalWithInteractions[];
    videoSermons: VideoSermonWithCategory[];
    audioSermons: AudioSermonWithCategory[];
  };
  engagementMetrics: {
    totalViews: number;
    totalPlays: number;
    totalDownloads: number;
    averageSessionDuration: number;
  };
  userDemographics: {
    byCountry: Array<{ country: string; count: number }>;
    byPlatform: Array<{ platform: string; count: number }>;
  };
}

// File Upload types
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  bytes: number;
  duration?: number;
  format: string;
  resource_type: string;
}

export interface FileUploadRequest {
  file: Express.Multer.File;
  folder?: string;
  resourceType?: 'image' | 'video' | 'auto';
  transformation?: any[];
}

export interface FileUploadResponse {
  url: string;
  publicId: string;
  bytes: number;
  duration?: number;
  format: string;
}

// Error types
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Utility types
export type ContentUnion = Devotional | VideoSermon | AudioSermon | Announcement;

export type ServiceResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details?: any;
};

export type ControllerResponse<T> = Promise<{
  statusCode: number;
  body: ApiResponse<T>;
}>;

// Database connection types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

// Environment types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

// Middleware types - FIXED: Properly extend Express Request
export interface AuthenticatedRequest extends Request {
  admin?: Omit<Admin, 'passwordHash'>;
  adminId?: number; // Add this line
}

export interface MulterFile extends Express.Multer.File {
  // Additional properties if needed
}