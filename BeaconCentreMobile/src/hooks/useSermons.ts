// src/hooks/useSermons.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import LocalStorageService from '@/services/storage/LocalStorage';

export const useVideoSermons = () => {
    return useQuery({
      queryKey: ['video-sermons'],
      queryFn: async () => {
        try {
          return await apiClient.get('/video-sermons');
        } catch (error) {
          const cached = await LocalStorageService.getCachedData('video_sermons');
          if (cached) return cached;
          throw error;
        }
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  
  export const useAudioSermons = () => {
    return useQuery({
      queryKey: ['audio-sermons'],
      queryFn: async () => {
        try {
          return await apiClient.get('/audio-sermons');
        } catch (error) {
          const cached = await LocalStorageService.getCachedData('audio_sermons');
          if (cached) return cached;
          throw error;
        }
      },
      staleTime: 10 * 60 * 1000,
    });
  };
  
  export const useFeaturedContent = () => {
    return useQuery({
      queryKey: ['featured-content'],
      queryFn: async () => {
        const [featuredVideos, featuredAudio] = await Promise.all([
          apiClient.get('/video-sermons/featured'),
          apiClient.get('/audio-sermons/featured'),
        ]);
        return { videos: featuredVideos, audio: featuredAudio };
      },
      staleTime: 15 * 60 * 1000,
    });
  };