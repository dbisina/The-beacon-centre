// beacon-admin/src/lib/youtube.ts

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string; 
  durationISO: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
    standard?: string;
    maxres?: string;
  };
  viewCount: number;
  likeCount?: number;
  tags?: string[];
  categoryId: string;
  isLiveBroadcast: boolean;
  isPrivate: boolean;
  isEmbeddable: boolean;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
}

export class YouTubeAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'YouTubeAPIError';
  }
}

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
        standard?: { url: string };
        maxres?: { url: string };
      };
      tags?: string[];
      categoryId: string;
    };
    contentDetails: {
      duration: string;
      regionRestriction?: {
        blocked?: string[];
      };
    };
    statistics: {
      viewCount: string;
      likeCount?: string;
      tags?: string[];
    };
  }>;
}

interface YouTubeChannelResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
    };
    statistics: {
      subscriberCount: string;
      videoCount: string;
      viewCount: string;
    };
  }>;
}

export class YouTubeAPI {
  private readonly apiKey: string;
  private readonly baseURL = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new YouTubeAPIError('YouTube API key is required', 'MISSING_API_KEY');
    }
    this.apiKey = apiKey;
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([^#&?]*)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Convert ISO 8601 duration to human readable format
   */
  static formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '00:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Validate if the API key works
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseURL}/videos?part=snippet&id=dQw4w9WgXcQ&key=${this.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed information about a YouTube video
   */
  async getVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
    if (!videoId) {
      throw new YouTubeAPIError('Video ID is required', 'MISSING_VIDEO_ID');
    }

    try {
      const response = await fetch(
        `${this.baseURL}/videos?` +
        new URLSearchParams({
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey,
        })
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new YouTubeAPIError(
            'YouTube API key is invalid or quota exceeded. Please check your API credentials.',
            'INVALID_API_KEY',
            403
          );
        }
        if (response.status === 404) {
          throw new YouTubeAPIError(
            'Video not found. The video may be private, deleted, or the ID is incorrect.',
            'VIDEO_NOT_FOUND',
            404
          );
        }
        throw new YouTubeAPIError(
          `YouTube API request failed: ${response.statusText}`,
          'API_ERROR',
          response.status
        );
      }

      const data: YouTubeVideoResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new YouTubeAPIError(
          'Video not found or is not publicly available',
          'VIDEO_NOT_FOUND',
          404
        );
      }

      const video = data.items[0];
      const { snippet, contentDetails, statistics } = video;

      return {
        id: video.id,
        title: snippet.title,
        description: snippet.description,
        channelTitle: snippet.channelTitle,
        channelId: snippet.channelId,
        publishedAt: snippet.publishedAt,
        duration: YouTubeAPI.formatDuration(contentDetails.duration),
        durationISO: contentDetails.duration,
        thumbnails: {
          default: snippet.thumbnails.default.url,
          medium: snippet.thumbnails.medium.url,
          high: snippet.thumbnails.high.url,
          standard: snippet.thumbnails.standard?.url,
          maxres: snippet.thumbnails.maxres?.url,
        },
        viewCount: parseInt(statistics.viewCount || '0'),
        likeCount: statistics.likeCount ? parseInt(statistics.likeCount) : undefined,
        tags: snippet.tags,
        categoryId: snippet.categoryId,
        isLiveBroadcast: contentDetails.duration === 'P0D', // Live videos have zero duration
        isPrivate: false, // We already filtered out private videos
        isEmbeddable: !contentDetails.regionRestriction?.blocked?.includes('US'), // Simplified check
      };
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      
      // Network or other errors
      throw new YouTubeAPIError(
        'Failed to fetch video information. Please check your internet connection.',
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Get information about a YouTube video from URL
   */
  async getVideoInfoFromUrl(url: string): Promise<YouTubeVideoInfo> {
    const videoId = YouTubeAPI.extractVideoId(url);
    
    if (!videoId) {
      throw new YouTubeAPIError(
        'Invalid YouTube URL. Please provide a valid YouTube video URL.',
        'INVALID_URL'
      );
    }

    return this.getVideoInfo(videoId);
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId: string): Promise<YouTubeChannelInfo> {
    try {
      const response = await fetch(
        `${this.baseURL}/channels?` +
        new URLSearchParams({
          part: 'snippet,statistics',
          id: channelId,
          key: this.apiKey,
        })
      );

      if (!response.ok) {
        throw new YouTubeAPIError(`Channel request failed: ${response.statusText}`, 'API_ERROR', response.status);
      }

      const data: YouTubeChannelResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new YouTubeAPIError('Channel not found', 'CHANNEL_NOT_FOUND', 404);
      }

      const channel = data.items[0];
      const { snippet, statistics } = channel;

      return {
        id: channel.id,
        title: snippet.title,
        description: snippet.description,
        customUrl: snippet.customUrl,
        subscriberCount: parseInt(statistics.subscriberCount || '0'),
        videoCount: parseInt(statistics.videoCount || '0'),
        viewCount: parseInt(statistics.viewCount || '0'),
        thumbnails: {
          default: snippet.thumbnails.default.url,
          medium: snippet.thumbnails.medium.url,
          high: snippet.thumbnails.high.url,
        },
      };
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError('Failed to fetch channel information', 'NETWORK_ERROR');
    }
  }

  /**
   * Search for videos (useful for finding church content)
   */
  async searchVideos(query: string, maxResults = 10): Promise<YouTubeVideoInfo[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/search?` +
        new URLSearchParams({
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: maxResults.toString(),
          order: 'relevance',
          key: this.apiKey,
        })
      );

      if (!response.ok) {
        throw new YouTubeAPIError(`Search failed: ${response.statusText}`, 'SEARCH_ERROR', response.status);
      }

      const data = await response.json();
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

      // Get detailed info for all videos
      if (videoIds) {
        const detailsResponse = await fetch(
          `${this.baseURL}/videos?` +
          new URLSearchParams({
            part: 'snippet,contentDetails,statistics',
            id: videoIds,
            key: this.apiKey,
          })
        );

        const detailsData: YouTubeVideoResponse = await detailsResponse.json();
        
        return detailsData.items.map(video => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          publishedAt: video.snippet.publishedAt,
          duration: YouTubeAPI.formatDuration(video.contentDetails.duration),
          durationISO: video.contentDetails.duration,
          thumbnails: {
            default: video.snippet.thumbnails.default.url,
            medium: video.snippet.thumbnails.medium.url,
            high: video.snippet.thumbnails.high.url,
            standard: video.snippet.thumbnails.standard?.url,
            maxres: video.snippet.thumbnails.maxres?.url,
          },
          viewCount: parseInt(video.statistics.viewCount || '0'),
          likeCount: video.statistics.likeCount ? parseInt(video.statistics.likeCount) : undefined,
          tags: video.snippet.tags,
          categoryId: video.snippet.categoryId,
          isLiveBroadcast: video.contentDetails.duration === 'P0D',
          isPrivate: false,
          isEmbeddable: true,
        }));
      }

      return [];
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError('Search request failed', 'SEARCH_ERROR');
    }
  }

  /**
   * Get videos from a specific channel
   */
  async getChannelVideos(channelId: string, maxResults = 10): Promise<YouTubeVideoInfo[]> {
    try {
      // First get the uploads playlist ID
      const channelResponse = await fetch(
        `${this.baseURL}/channels?` +
        new URLSearchParams({
          part: 'contentDetails',
          id: channelId,
          key: this.apiKey,
        })
      );

      const channelData = await channelResponse.json();
      const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        throw new YouTubeAPIError('Channel uploads not found', 'UPLOADS_NOT_FOUND');
      }

      // Get videos from uploads playlist
      const playlistResponse = await fetch(
        `${this.baseURL}/playlistItems?` +
        new URLSearchParams({
          part: 'snippet',
          playlistId: uploadsPlaylistId,
          maxResults: maxResults.toString(),
          key: this.apiKey,
        })
      );

      const playlistData = await playlistResponse.json();
      const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');

      // Get detailed info
      if (videoIds) {
        const detailsResponse = await fetch(
          `${this.baseURL}/videos?` +
          new URLSearchParams({
            part: 'snippet,contentDetails,statistics',
            id: videoIds,
            key: this.apiKey,
          })
        );

        const detailsData: YouTubeVideoResponse = await detailsResponse.json();
        
        return detailsData.items.map(video => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          publishedAt: video.snippet.publishedAt,
          duration: YouTubeAPI.formatDuration(video.contentDetails.duration),
          durationISO: video.contentDetails.duration,
          thumbnails: {
            default: video.snippet.thumbnails.default.url,
            medium: video.snippet.thumbnails.medium.url,
            high: video.snippet.thumbnails.high.url,
            standard: video.snippet.thumbnails.standard?.url,
            maxres: video.snippet.thumbnails.maxres?.url,
          },
          viewCount: parseInt(video.statistics.viewCount || '0'),
          likeCount: video.statistics.likeCount ? parseInt(video.statistics.likeCount) : undefined,
          tags: video.snippet.tags,
          categoryId: video.snippet.categoryId,
          isLiveBroadcast: video.contentDetails.duration === 'P0D',
          isPrivate: false,
          isEmbeddable: true,
        }));
      }

      return [];
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError('Failed to fetch channel videos', 'NETWORK_ERROR');
    }
  }
}

// Singleton instance
let youtubeAPI: YouTubeAPI | null = null;

export const getYouTubeAPI = (): YouTubeAPI => {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new YouTubeAPIError(
      'YouTube API key not configured. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your environment variables.',
      'MISSING_API_KEY'
    );
  }

  if (!youtubeAPI) {
    youtubeAPI = new YouTubeAPI(apiKey);
  }

  return youtubeAPI;
};

// Utility functions for the admin dashboard
export const youtubeUtils = {
  /**
   * Check if YouTube API is configured
   */
  isConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  },

  /**
   * Get video thumbnail URL (with fallback)
   */
  getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
    return `https://img.youtube.com/vi/${videoId}/${quality === 'high' ? 'hqdefault' : quality}.jpg`;
  },

  /**
   * Generate YouTube embed URL
   */
  getEmbedUrl(videoId: string, autoplay = false, controls = true): string {
    const params = new URLSearchParams({
      ...(autoplay && { autoplay: '1' }),
      ...(controls && { controls: '1' }),
      rel: '0', // Don't show related videos
      modestbranding: '1', // Modest YouTube branding
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  },

  /**
   * Generate YouTube watch URL
   */
  getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },

  /**
   * Validate video ID format
   */
  isValidVideoId(videoId: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  },
};