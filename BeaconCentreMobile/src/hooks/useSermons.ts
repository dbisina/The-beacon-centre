// src/hooks/api/useSermons.ts - ROBUST SERMON HOOKS
import { useQuery } from '@tanstack/react-query';
import { sermonApi } from '@/services/api/client';
import { VideoSermon, AudioSermon } from '@/types/api';

export const useVideoSermons = () => {
  return useQuery({
    queryKey: ['video-sermons'],
    queryFn: async (): Promise<VideoSermon[]> => {
      try {
        console.log('Fetching video sermons...');
        const data = await sermonApi.getVideoSermons();
        console.log('Video sermons fetched:', data?.length || 0);
        
        if (!data || !Array.isArray(data)) {
          console.warn('Invalid video sermons data, returning empty array');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('Failed to fetch video sermons:', error);
        return [];
      }
    },
    initialData: [], // CRITICAL: Provide initial data
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: (failureCount, error: any) => {
      console.log('Query retry attempt:', failureCount);
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
};

export const useAudioSermons = () => {
  return useQuery({
    queryKey: ['audio-sermons'],
    queryFn: async (): Promise<AudioSermon[]> => {
      try {
        console.log('Fetching audio sermons...');
        const data = await sermonApi.getAudioSermons();
        console.log('Audio sermons fetched:', data?.length || 0);
        
        if (!data || !Array.isArray(data)) {
          console.warn('Invalid audio sermons data, returning empty array');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('Failed to fetch audio sermons:', error);
        return [];
      }
    },
    initialData: [], // CRITICAL: Provide initial data
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: (failureCount, error: any) => {
      console.log('Query retry attempt:', failureCount);
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
};