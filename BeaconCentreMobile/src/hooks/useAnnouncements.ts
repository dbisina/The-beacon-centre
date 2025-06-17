// src/hooks/api/useAnnouncements.ts - ROBUST ANNOUNCEMENTS
import { useQuery } from '@tanstack/react-query';
import { announcementApi } from '@/services/api/client';
import { Announcement } from '@/types/api';

export const useAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async (): Promise<Announcement[]> => {
      try {
        console.log('Fetching announcements...');
        const data = await announcementApi.getAll();
        console.log('Announcements fetched:', data?.length || 0);
        
        if (!data || !Array.isArray(data)) {
          console.warn('Invalid announcements data, returning empty array');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
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