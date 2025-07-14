// src/services/api/sermons.ts
import { apiClient } from './client';
import { VideoSermon, AudioSermon } from '@/types/api';
import LocalStorageService from '@/services/storage/LocalStorage';

export const transformAudioSermon = (backendSermon: any): AudioSermon => {
  // Provide default thumbnail when none exists
  const defaultThumbnail = 'https://via.placeholder.com/400x400/1e3a8a/ffffff?text=Audio+Sermon';
  
  return {
    ...backendSermon,
    audioUrl: backendSermon.audioUrl || backendSermon.audio_url,
    // Enhanced thumbnail mapping with fallback
    thumbnail_url: backendSermon.thumbnail_url || 
                   backendSermon.thumbnailUrl || 
                   defaultThumbnail,
    thumbnail_cloudinary_public_id: backendSermon.thumbnail_cloudinary_public_id || 
                                   backendSermon.thumbnailCloudinaryPublicId || 
                                   'default-audio-thumbnail',
  };
};

export const sermonsApi = {
  video: {
    async getAll(): Promise<VideoSermon[]> {
      try {
        console.log('🎥 Fetching video sermons...');
        const response = await apiClient.get<any>('/video-sermons');
        
        // Handle backend response format
        let sermons: VideoSermon[] = [];
        if (response && response.data && Array.isArray(response.data.sermons)) {
          sermons = response.data.sermons;
        } else if (Array.isArray(response)) {
          sermons = response;
        } else if (Array.isArray(response.data)) {
          sermons = response.data;
        }

        console.log(`✅ Video sermons fetched: ${sermons.length} items`);
        await LocalStorageService.cacheData('video_sermons', sermons);
        return sermons;
      } catch (error) {
        console.error('❌ Failed to fetch video sermons:', error);
        const cached = await LocalStorageService.getCachedData<VideoSermon[]>('video_sermons');
        if (cached) {
          console.log('📱 Using cached video sermons');
          return cached;
        }
        throw error;
      }
    },

    async getFeatured(): Promise<VideoSermon[]> {
      try {
        console.log('🎥 Fetching featured video sermons...');
        const response = await apiClient.get<any>('/video-sermons/featured');
        
        // Featured endpoints typically return direct array
        const sermons = Array.isArray(response) ? response : response.data || [];
        console.log(`✅ Featured video sermons: ${sermons.length} items`);
        return sermons;
      } catch (error) {
        console.error('❌ Failed to fetch featured video sermons:', error);
        return [];
      }
    },

    async getByCategory(category: string): Promise<VideoSermon[]> {
      try {
        console.log(`🎥 Fetching video sermons by category: ${category}`);
        const response = await apiClient.get<any>(`/video-sermons/category/${category}`);
        
        const sermons = Array.isArray(response) ? response : response.data || [];
        console.log(`✅ Category ${category} video sermons: ${sermons.length} items`);
        return sermons;
      } catch (error) {
        console.error(`❌ Failed to fetch video sermons by category ${category}:`, error);
        return [];
      }
    },

    async search(query: string): Promise<VideoSermon[]> {
      try {
        console.log(`🔍 Searching video sermons for: ${query}`);
        const allSermons = await this.getAll();
        const searchTerm = query.toLowerCase();
        
        const results = allSermons.filter(sermon =>
          sermon.title.toLowerCase().includes(searchTerm) ||
          sermon.speaker.toLowerCase().includes(searchTerm) ||
          sermon.description?.toLowerCase().includes(searchTerm) ||
          sermon.category?.toLowerCase().includes(searchTerm)
        );
        
        console.log(`🔍 Video search results: ${results.length} items`);
        return results;
      } catch (error) {
        console.error(`❌ Failed to search video sermons:`, error);
        return [];
      }
    },
  },

  audio: {
    async getAll(): Promise<AudioSermon[]> {
      try {
        console.log('🎵 Fetching audio sermons...');
        const response = await apiClient.get<any>('/audio-sermons');
        
        console.log('🔍 Raw audio sermons response:', response);
        
        // Handle backend response format: { success: true, data: { sermons: [...] } }
        let sermons: any[] = [];
        
        if (response && response.data && Array.isArray(response.data.sermons)) {
          sermons = response.data.sermons;
          console.log('✅ Found sermons in response.data.sermons');
        } else if (Array.isArray(response)) {
          sermons = response;
          console.log('✅ Response is direct array');
        } else if (Array.isArray(response.data)) {
          sermons = response.data;
          console.log('✅ Found sermons in response.data');
        } else {
          console.warn('⚠️ Unexpected audio sermons response format:', response);
          return [];
        }

        // Transform all sermons and add thumbnails
        const transformedSermons = sermons.map(transformAudioSermon);
        
        // Debug: log thumbnail URLs for each sermon
        transformedSermons.forEach((sermon, idx) => {
          console.log(`🎧 AudioSermon[${idx}] "${sermon.title}"`);
          console.log(`   📸 thumbnail_url: ${sermon.thumbnail_url}`);
          console.log(`   🆔 thumbnail_id: ${sermon.thumbnail_cloudinary_public_id}`);
        });
        
        console.log(`✅ Audio sermons fetched: ${transformedSermons.length} items`);
        await LocalStorageService.cacheData('audio_sermons', transformedSermons);
        return transformedSermons;
      } catch (error) {
        console.error('❌ Failed to fetch audio sermons:', error);
        const cached = await LocalStorageService.getCachedData<AudioSermon[]>('audio_sermons');
        if (cached) {
          console.log('📱 Using cached audio sermons');
          return cached;
        }
        throw error;
      }
    },

    async getFeatured(): Promise<AudioSermon[]> {
      try {
        console.log('🎵 Fetching featured audio sermons...');
        const response = await apiClient.get<any>('/audio-sermons/featured');
        
        // Featured endpoints typically return direct array
        const sermons = Array.isArray(response) ? response : response.data || [];
        const transformedSermons = sermons.map(transformAudioSermon);
        
        console.log(`✅ Featured audio sermons: ${transformedSermons.length} items`);
        return transformedSermons;
      } catch (error) {
        console.error('❌ Failed to fetch featured audio sermons:', error);
        return [];
      }
    },

    async getByCategory(category: string): Promise<AudioSermon[]> {
      try {
        console.log(`🎵 Fetching audio sermons by category: ${category}`);
        const response = await apiClient.get<any>(`/audio-sermons/category/${category}`);
        
        const sermons = Array.isArray(response) ? response : response.data || [];
        const transformedSermons = sermons.map(transformAudioSermon);
        
        console.log(`✅ Category ${category} audio sermons: ${transformedSermons.length} items`);
        return transformedSermons;
      } catch (error) {
        console.error(`❌ Failed to fetch audio sermons by category ${category}:`, error);
        return [];
      }
    },

    async search(query: string): Promise<AudioSermon[]> {
      try {
        console.log(`🔍 Searching audio sermons for: ${query}`);
        const allSermons = await this.getAll();
        const searchTerm = query.toLowerCase();
        
        const results = allSermons.filter(sermon =>
          sermon.title.toLowerCase().includes(searchTerm) ||
          sermon.speaker.toLowerCase().includes(searchTerm) ||
          sermon.description?.toLowerCase().includes(searchTerm) ||
          sermon.category?.toLowerCase().includes(searchTerm)
        );
        
        console.log(`🔍 Audio search results: ${results.length} items`);
        return results;
      } catch (error) {
        console.error(`❌ Failed to search audio sermons:`, error);
        return [];
      }
    },

    async getById(id: number): Promise<AudioSermon | null> {
      try {
        console.log(`🎵 Fetching audio sermon ${id}...`);
        const response = await apiClient.get<any>(`/audio-sermons/${id}`);
        
        if (!response) {
          console.log(`📭 Audio sermon ${id} not found`);
          return null;
        }
        
        const transformedSermon = transformAudioSermon(response);
        console.log(`✅ Audio sermon ${id} fetched: "${transformedSermon.title}"`);
        console.log(`   📸 thumbnail: ${transformedSermon.thumbnail_url}`);
        
        return transformedSermon;
      } catch (error) {
        console.error(`❌ Failed to fetch audio sermon ${id}:`, error);
        return null;
      }
    },
  },
};

// Export individual APIs for easier imports
export const videoSermonsApi = sermonsApi.video;
export const audioSermonsApi = sermonsApi.audio;