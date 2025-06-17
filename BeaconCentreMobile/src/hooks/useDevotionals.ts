// src/hooks/api/useDevotionals.ts - FIXED QUERY
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { devotionalApi } from '@/services/api/client';
import { Devotional } from '@/types/api';
import LocalStorageService from '@/services/storage/LocalStorage';

export const useDevotionals = () => {
  return useQuery({
    queryKey: ['devotionals'],
    queryFn: async (): Promise<Devotional[]> => {
      try {
        console.log('Fetching devotionals...');
        const data = await devotionalApi.getAll();
        console.log('Devotionals fetched:', data?.length || 0);
        
        // CRITICAL: Always return an array, never undefined
        if (!data || !Array.isArray(data)) {
          console.warn('Invalid devotionals data, returning empty array');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('Failed to fetch devotionals:', error);
        // Return empty array instead of undefined
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

export const useTodaysDevotional = () => {
  return useQuery({
    queryKey: ['devotional', 'today'],
    queryFn: async (): Promise<Devotional | null> => {
      try {
        const data = await devotionalApi.getToday();
        return data;
      } catch (error) {
        console.error('Failed to fetch today\'s devotional:', error);
        return null;
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  });
};

export const useDevotionalById = (id: number) => {
  return useQuery({
    queryKey: ['devotional', id],
    queryFn: async (): Promise<Devotional | null> => {
      if (!id) return null;
      
      try {
        const data = await devotionalApi.getById(id);
        return data;
      } catch (error) {
        console.error('Failed to fetch devotional by ID:', error);
        return null;
      }
    },
    enabled: !!id,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Custom hook for marking devotional as read
export const useMarkDevotionalRead = () => {
  const queryClient = useQueryClient();
  
  return async (devotionalId: number): Promise<boolean> => {
    try {
      // Update local storage
      await LocalStorageService.markDevotionalRead(devotionalId);
      
      // Invalidate related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      
      return true;
    } catch (error) {
      console.error('Failed to mark devotional as read:', error);
      return false;
    }
  };
};