import { Request } from 'express';
export interface Devotional {
    id: number;
    title: string;
    content: string;
    verse_reference: string;
    verse_text: string;
    prayer?: string;
    date: string;
    created_at: string;
    updated_at: string;
}
export interface VideoSermon {
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
export interface AudioSermon {
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
export interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    start_date: string;
    expiry_date?: string;
    image_url?: string;
    cloudinary_public_id?: string;
    action_url?: string;
    action_text?: string;
    is_active: boolean;
    created_at: string;
}
export interface Category {
    id: number;
    name: string;
    description?: string;
    color?: string;
    created_at: string;
}
export interface Admin {
    id: number;
    email: string;
    name: string;
    role: AdminRole;
    is_active: boolean;
    last_login?: string;
    login_count: number;
    created_at: string;
    updated_at: string;
}
export interface AdminLoginRequest {
    email: string;
    password: string;
}
export interface AdminLoginResponse {
    admin: Omit<Admin, 'password_hash'>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AdminRefreshRequest {
    refreshToken: string;
}
export interface AdminCreateRequest {
    email: string;
    password: string;
    name: string;
    role?: AdminRole;
}
export interface DeviceSession {
    id: number;
    device_id: string;
    platform?: string;
    app_version?: string;
    country?: string;
    state?: string;
    last_active: string;
    total_sessions: number;
    created_at: string;
}
export interface ContentInteraction {
    id: number;
    device_id: string;
    content_type: ContentType;
    content_id: number;
    interaction_type: InteractionType;
    duration_seconds?: number;
    metadata?: Record<string, any>;
    created_at: string;
}
export interface AnalyticsTrackRequest {
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
        devotionals: (Devotional & {
            interaction_count: number;
        })[];
        videoSermons: (VideoSermon & {
            interaction_count: number;
        })[];
        audioSermons: (AudioSermon & {
            interaction_count: number;
        })[];
    };
    engagementMetrics: {
        totalViews: number;
        totalPlays: number;
        totalDownloads: number;
        averageSessionDuration: number;
    };
    userDemographics: {
        byCountry: Array<{
            country: string;
            count: number;
        }>;
        byPlatform: Array<{
            platform: string;
            count: number;
        }>;
    };
}
export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    url: string;
    bytes: number;
    duration?: number;
    format: string;
    resource_type: 'image' | 'video' | 'raw';
    width?: number;
    height?: number;
}
export interface FileUploadRequest {
    file: File | Buffer;
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
    width?: number;
    height?: number;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: PaginationMeta;
}
export interface ApiErrorResponse {
    success: false;
    error: string;
    message: string;
    details?: any;
    statusCode: number;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginationRequest {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    featured?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface DevotionalFilters extends PaginationRequest {
    dateFrom?: string;
    dateTo?: string;
    hasContent?: boolean;
    hasPrayer?: boolean;
}
export interface SermonFilters extends PaginationRequest {
    speaker?: string;
    category?: string;
    featured?: boolean;
    dateFrom?: string;
    dateTo?: string;
    minDuration?: number;
    maxDuration?: number;
}
export interface AnnouncementFilters extends PaginationRequest {
    priority?: AnnouncementPriority;
    active?: boolean;
    dateFrom?: string;
    dateTo?: string;
    hasImage?: boolean;
    hasAction?: boolean;
}
export declare enum AdminRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    EDITOR = "EDITOR"
}
export declare enum AnnouncementPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare enum ContentType {
    DEVOTIONAL = "DEVOTIONAL",
    VIDEO_SERMON = "VIDEO_SERMON",
    AUDIO_SERMON = "AUDIO_SERMON",
    ANNOUNCEMENT = "ANNOUNCEMENT"
}
export declare enum InteractionType {
    VIEWED = "VIEWED",
    PLAYED = "PLAYED",
    COMPLETED = "COMPLETED",
    DOWNLOADED = "DOWNLOADED",
    FAVORITED = "FAVORITED",
    SHARED = "SHARED",
    BOOKMARKED = "BOOKMARKED"
}
export interface LocalUserData {
    deviceId: string;
    favoriteDevotionals: number[];
    favoriteVideoSermons: number[];
    favoriteAudioSermons: number[];
    readDevotionals: number[];
    downloadedAudio: DownloadedAudio[];
    bookmarkedAnnouncements: number[];
    readingStreak: ReadingStreak;
    appSettings: AppSettings;
    lastSyncDate: string;
}
export interface DownloadedAudio {
    sermonId: number;
    localPath: string;
    downloadDate: string;
    fileSize: number;
    title: string;
    speaker: string;
}
export interface ReadingStreak {
    currentStreak: number;
    lastReadDate: string;
    longestStreak: number;
    totalDevotionalsRead: number;
}
export interface AppSettings {
    notifications: boolean;
    autoDownloadWifi: boolean;
    fontSize: 'small' | 'medium' | 'large';
    theme: 'light' | 'dark' | 'auto';
    language: string;
    audioQuality: 'low' | 'medium' | 'high';
}
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
    body: ApiResponse<T> | ApiErrorResponse;
}>;
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
export interface DatabaseError extends CustomError {
    code: string;
    meta?: any;
}
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
export interface AuthenticatedRequest extends Request {
    admin?: Omit<Admin, 'password_hash'>;
}
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}
export interface ApiClientConfig {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
    cacheDuration: number;
}
export interface RequestConfig {
    headers: Record<string, string>;
    retry: {
        attempts: number;
        delay: number;
    };
}
//# sourceMappingURL=shared.d.ts.map