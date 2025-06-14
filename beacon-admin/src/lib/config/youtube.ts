// src/lib/config/youtube.ts - YouTube API configuration with validation

export const YOUTUBE_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  BASE_URL: 'https://www.googleapis.com/youtube/v3',
  QUOTA_LIMITS: {
    VIDEOS_LIST: 1, // Cost per videos.list request
    SEARCH_LIST: 100, // Cost per search.list request
    CHANNELS_LIST: 1, // Cost per channels.list request
    DAILY_QUOTA: 10000, // Default daily quota
  },
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes cache for video info
} as const;

// Validate YouTube API configuration
export function validateYouTubeConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!YOUTUBE_CONFIG.API_KEY) {
    errors.push('YouTube API key is not configured. Set NEXT_PUBLIC_YOUTUBE_API_KEY in your environment variables.');
  }

  if (YOUTUBE_CONFIG.API_KEY && YOUTUBE_CONFIG.API_KEY.includes('your-youtube-api-key')) {
    warnings.push('YouTube API key appears to be a placeholder. Please replace with your actual API key.');
  }

  if (YOUTUBE_CONFIG.API_KEY && YOUTUBE_CONFIG.API_KEY.length < 30) {
    warnings.push('YouTube API key appears to be too short. Please verify your API key is correct.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Check if YouTube API is available
export async function checkYouTubeAPIHealth(): Promise<{
  isHealthy: boolean;
  quotaUsed?: number;
  quotaRemaining?: number;
  error?: string;
}> {
  if (!YOUTUBE_CONFIG.API_KEY) {
    return {
      isHealthy: false,
      error: 'YouTube API key not configured',
    };
  }

  try {
    // Make a simple request to check API health
    const response = await fetch(
      `${YOUTUBE_CONFIG.BASE_URL}/videos?part=snippet&id=dQw4w9WgXcQ&key=${YOUTUBE_CONFIG.API_KEY}`
    );

    if (response.ok) {
      // Check quota headers if available
      const quotaUsed = response.headers.get('X-Quota-Used');
      const quotaRemaining = response.headers.get('X-Quota-Remaining');

      return {
        isHealthy: true,
        quotaUsed: quotaUsed ? parseInt(quotaUsed) : undefined,
        quotaRemaining: quotaRemaining ? parseInt(quotaRemaining) : undefined,
      };
    } else if (response.status === 403) {
      const errorData = await response.json();
      const quotaExceeded = errorData.error?.errors?.some(
        (err: any) => err.reason === 'quotaExceeded'
      );

      return {
        isHealthy: false,
        error: quotaExceeded 
          ? 'YouTube API quota exceeded. Try again tomorrow or upgrade your quota.'
          : 'YouTube API access forbidden. Check your API key and permissions.',
      };
    } else if (response.status === 400) {
      return {
        isHealthy: false,
        error: 'Invalid YouTube API key. Please check your configuration.',
      };
    } else {
      return {
        isHealthy: false,
        error: `YouTube API returned status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      isHealthy: false,
      error: 'Network error when checking YouTube API health',
    };
  }
}