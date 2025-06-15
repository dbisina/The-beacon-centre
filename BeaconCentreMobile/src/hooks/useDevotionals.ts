// src/hooks/useDevotionals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Devotional } from '@/types/api';
import LocalStorageService from '@/services/storage/LocalStorage';

export const useDevotionals = () => {
  return useQuery({
    queryKey: ['devotionals'],
    queryFn: async (): Promise<Devotional[]> => {
      try {
        return await apiClient.get<Devotional[]>('/devotionals');
      } catch (error) {
        // Fallback to cached data if offline
        const cached = await LocalStorageService.getCachedData<Devotional[]>('devotionals');
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useTodaysDevotional = () => {
  return useQuery({
    queryKey: ['devotional', 'today'],
    queryFn: async (): Promise<Devotional> => {
      try {
        return await apiClient.get<Devotional>('/devotionals/today');
      } catch (error) {
        // Fallback to cached data
        const cached = await LocalStorageService.getCachedData<Devotional>('todays_devotional');
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useDevotionalByDate = (date: string) => {
  return useQuery({
    queryKey: ['devotional', 'date', date],
    queryFn: (): Promise<Devotional> => 
      apiClient.get<Devotional>(`/devotionals/date/${date}`),
    enabled: !!date,
  });
};

export const useMarkDevotionalRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (devotionalId: number) => {
      await LocalStorageService.markDevotionalRead(devotionalId);
      
      // Track analytics
      const userData = await LocalStorageService.getUserData();
      try {
        await apiClient.post('/analytics/track', {
          device_id: userData.deviceId,
          content_type: 'devotional',
          content_id: devotionalId,
          interaction_type: 'completed',
        });
      } catch (error) {
        console.log('Analytics tracking failed (offline)');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'reading-streak'] });
    },
  });
};