// src/lib/youtube.ts - YouTube API client and utilities

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
    standard?: { url: string; width: number; height: number };
    maxres?: { url: string; width: number; height: number };
  };
  tags?: string[];
  categoryId: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}

interface YouTubeVideoContentDetails {
  duration: string; // ISO 8601 format (PT4M13S)
  dimension: string;
  definition: string;
  caption: string;
  licensedContent: boolean;
  regionRestriction?: {
    allowed?: string[];
    blocked?: string[];
  };
}

interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount?: string;
  dislikeCount?: string;
  favoriteCount: string;
  commentCount?: string;
}

interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  items: {
    kind: string;
    etag: string;
    id: string;
    snippet: YouTubeVideoSnippet;
    contentDetails: YouTubeVideoContentDetails;
    statistics: YouTubeVideoStatistics;
  }[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string; // Formatted duration (e.g., "4:13")
  durationISO: string; // ISO 8601 format
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
  error?: string;
}

class YouTubeAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'YouTubeAPIError';
  }
}

export class YouTubeAPI {
  private apiKey: string;
  private baseURL = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Extract video ID from various YouTube URL formats
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
   * Validate if a string is a valid YouTube video ID
   */
  static isValidVideoId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  /**
   * Convert ISO 8601 duration to readable format
   */
  static formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get video information from YouTube API
   */
  async getVideoInfo(videoUrl: string): Promise<YouTubeVideoInfo> {
    const videoId = YouTubeAPI.extractVideoId(videoUrl);
    
    if (!videoId) {
      throw new YouTubeAPIError('Invalid YouTube URL or video ID');
    }

    try {
      const response = await fetch(
        `${this.baseURL}/videos?` +
        new URLSearchParams({
          part: 'snippet,contentDetails,statistics,status',
          id: videoId,
          key: this.apiKey,
        })
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new YouTubeAPIError('API quota exceeded or invalid API key', 'QUOTA_EXCEEDED', 403);
        }
        if (response.status === 400) {
          throw new YouTubeAPIError('Bad request - check your API key', 'BAD_REQUEST', 400);
        }
        throw new YouTubeAPIError(`HTTP ${response.status}: ${response.statusText}`, 'HTTP_ERROR', response.status);
      }

      const data: YouTubeVideoResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new YouTubeAPIError('Video not found or is private/deleted', 'VIDEO_NOT_FOUND');
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;
      const statistics = video.statistics;

      // Check if video is available
      if (snippet.title === 'Private video' || snippet.title === 'Deleted video') {
        throw new YouTubeAPIError('Video is private or has been deleted', 'VIDEO_UNAVAILABLE');
      }

      return {
        id: videoId,
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
   * Get channel information
   */
  async getChannelInfo(channelId: string) {
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
        throw new YouTubeAPIError(`Failed to fetch channel info: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new YouTubeAPIError('Channel not found');
      }

      const channel = data.items[0];
      
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        thumbnails: channel.snippet.thumbnails,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        viewCount: parseInt(channel.statistics.viewCount || '0'),
      };
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        throw error;
      }
      throw new YouTubeAPIError('Failed to fetch channel information');
    }
  }
}

// Create YouTube API instance
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

export const youtubeAPI = new YouTubeAPI(YOUTUBE_API_KEY);

// Hook for using YouTube API in React components
export const useYouTubeAPI = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getVideoInfo = React.useCallback(async (url: string): Promise<YouTubeVideoInfo | null> => {
    if (!YOUTUBE_API_KEY) {
      setError('YouTube API key not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const videoInfo = await youtubeAPI.getVideoInfo(url);
      return videoInfo;
    } catch (error) {
      const errorMessage = error instanceof YouTubeAPIError 
        ? error.message 
        : 'Failed to fetch video information';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchVideos = React.useCallback(async (query: string, maxResults = 10): Promise<YouTubeVideoInfo[]> => {
    if (!YOUTUBE_API_KEY) {
      setError('YouTube API key not configured');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const videos = await youtubeAPI.searchVideos(query, maxResults);
      return videos;
    } catch (error) {
      const errorMessage = error instanceof YouTubeAPIError 
        ? error.message 
        : 'Failed to search videos';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getVideoInfo,
    searchVideos,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

// Utility functions for frontend use
export const YouTubeUtils = {
  extractVideoId: YouTubeAPI.extractVideoId,
  isValidVideoId: YouTubeAPI.isValidVideoId,
  formatDuration: YouTubeAPI.formatDuration,
  
  /**
   * Get the best thumbnail URL for a given size preference
   */
  getBestThumbnail: (thumbnails: YouTubeVideoInfo['thumbnails'], preferredSize: 'small' | 'medium' | 'large' = 'medium'): string => {
    switch (preferredSize) {
      case 'large':
        return thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default;
      case 'medium':
        return thumbnails.high || thumbnails.medium || thumbnails.standard || thumbnails.default;
      case 'small':
        return thumbnails.medium || thumbnails.default || thumbnails.high;
      default:
        return thumbnails.medium || thumbnails.default;
    }
  },

  /**
   * Generate YouTube embed URL
   */
  getEmbedUrl: (videoId: string, options?: {
    autoplay?: boolean;
    start?: number; // Start time in seconds
    end?: number; // End time in seconds
    loop?: boolean;
    controls?: boolean;
    modestbranding?: boolean;
    rel?: boolean; // Show related videos
  }): string => {
    const params = new URLSearchParams();
    
    if (options?.autoplay) params.append('autoplay', '1');
    if (options?.start) params.append('start', options.start.toString());
    if (options?.end) params.append('end', options.end.toString());
    if (options?.loop) params.append('loop', '1');
    if (options?.controls === false) params.append('controls', '0');
    if (options?.modestbranding) params.append('modestbranding', '1');
    if (options?.rel === false) params.append('rel', '0');

    const queryString = params.toString();
    return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`;
  },

  /**
   * Generate YouTube watch URL
   */
  getWatchUrl: (videoId: string, startTime?: number): string => {
    const baseUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return startTime ? `${baseUrl}&t=${startTime}s` : baseUrl;
  },

  /**
   * Format view count for display
   */
  formatViewCount: (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  },

  /**
   * Format publish date for display
   */
  formatPublishDate: (publishedAt: string): string => {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  },
};

// React import for the hook
import React from 'react';