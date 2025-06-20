// beacon-admin/src/lib/api-config.ts
// API Configuration using environment variables

export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
    retryAttempts: 3,
    retryDelay: 1000,
  } as const;
  
  export const APP_CONFIG = {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'The Beacon Centre Admin',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    enableDevTools: process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  } as const;
  
  export const CLOUDINARY_CONFIG = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'beacon_admin_preset',
  } as const;
  
  export const FILE_CONFIG = {
    allowedTypes: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 
      'image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/mp4').split(','),
    maxSizeMB: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '100'),
  } as const;
  
  export const SECURITY_CONFIG = {
    sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '900000'), // 15 minutes
    tokenRefreshThreshold: parseInt(process.env.NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD || '300000'), // 5 minutes
  } as const;
  
  export const FEATURE_FLAGS = {
    notifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    bulkOperations: process.env.NEXT_PUBLIC_ENABLE_BULK_OPERATIONS === 'true',
    advancedAnalytics: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS === 'true',
  } as const;
  
  // Validation helper
  export const validateConfig = () => {
    const errors: string[] = [];
  
    if (!API_CONFIG.baseURL) {
      errors.push('NEXT_PUBLIC_API_URL is required');
    }
  
    if (!CLOUDINARY_CONFIG.cloudName && process.env.NODE_ENV === 'production') {
      console.warn('Warning: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set - file uploads may not work');
    }
  
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  
    return true;
  };
  
  // Development helper
  export const logConfig = () => {
    if (APP_CONFIG.environment === 'development' && APP_CONFIG.enableDevTools) {
      console.log('🔧 Admin Dashboard Configuration:', {
        API_URL: API_CONFIG.baseURL,
        ENVIRONMENT: APP_CONFIG.environment,
        VERSION: APP_CONFIG.version,
        CLOUDINARY_CONFIGURED: !!CLOUDINARY_CONFIG.cloudName,
        FEATURES: FEATURE_FLAGS,
      });
    }
  };