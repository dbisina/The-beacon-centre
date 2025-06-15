// src/services/api/sermons.ts
import { apiClient } from './client';
import { VideoSermon, AudioSermon } from '@/types/api';
import LocalStorageService from '@/services/storage/LocalStorage';

export const sermonsApi = {
  video: {
    async getAll(): Promise<VideoSermon[]> {
      try {
        const sermons = await apiClient.get<VideoSermon[]>('/video-sermons');
        await LocalStorageService.cacheData('video_sermons', sermons);
        return sermons;
      } catch (error) {
        const cached = await LocalStorageService.getCachedData<VideoSermon[]>('video_sermons');
        if (cached) return cached;
        throw error;
      }
    },

    async getFeatured(): Promise<VideoSermon[]> {
      return await apiClient.get<VideoSermon[]>('/video-sermons/featured');
    },

    async getByCategory(category: string): Promise<VideoSermon[]> {
      return await apiClient.get<VideoSermon[]>(`/video-sermons/category/${category}`);
    },

    async search(query: string): Promise<VideoSermon[]> {
      const allSermons = await this.getAll();
      const searchTerm = query.toLowerCase();
      
      return allSermons.filter(sermon =>
        sermon.title.toLowerCase().includes(searchTerm) ||
        sermon.speaker.toLowerCase().includes(searchTerm) ||
        sermon.description?.toLowerCase().includes(searchTerm) ||
        sermon.category?.toLowerCase().includes(searchTerm)
      );
    },
  },

  audio: {
    async getAll(): Promise<AudioSermon[]> {
      try {
        const sermons = await apiClient.get<AudioSermon[]>('/audio-sermons');
        await LocalStorageService.cacheData('audio_sermons', sermons);
        return sermons;
      } catch (error) {
        const cached = await LocalStorageService.getCachedData<AudioSermon[]>('audio_sermons');
        if (cached) return cached;
        throw error;
      }
    },

    async getFeatured(): Promise<AudioSermon[]> {
      return await apiClient.get<AudioSermon[]>('/audio-sermons/featured');
    },

    async getByCategory(category: string): Promise<AudioSermon[]> {
      return await apiClient.get<AudioSermon[]>(`/audio-sermons/category/${category}`);
    },

    async search(query: string): Promise<AudioSermon[]> {
      const allSermons = await this.getAll();
      const searchTerm = query.toLowerCase();
      
      return allSermons.filter(sermon =>
        sermon.title.toLowerCase().includes(searchTerm) ||
        sermon.speaker.toLowerCase().includes(searchTerm) ||
        sermon.description?.toLowerCase().includes(searchTerm) ||
        sermon.category?.toLowerCase().includes(searchTerm)
      );
    },
  },
};