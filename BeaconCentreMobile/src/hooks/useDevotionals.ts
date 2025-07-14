// BeaconCentreMobile/src/hooks/useDevotionals.ts
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { devotionalApi, apiClient } from '@/services/api/client';
import { Devotional } from '@/types/api';
import LocalStorageService from '@/services/storage/LocalStorage';
import { useApp } from '@/context/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// Query Keys
export const DEVOTIONAL_QUERY_KEYS = {
  all: ['devotionals'] as const,
  lists: () => [...DEVOTIONAL_QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...DEVOTIONAL_QUERY_KEYS.lists(), filters] as const,
  details: () => [...DEVOTIONAL_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...DEVOTIONAL_QUERY_KEYS.details(), id] as const,
  today: () => [...DEVOTIONAL_QUERY_KEYS.all, 'today'] as const,
  byDate: (date: string) => [...DEVOTIONAL_QUERY_KEYS.all, 'date', date] as const,
};

// MAIN DEVOTIONALS HOOK WITH AUTO-REFRESH
export const useDevotionals = () => {
  const { state } = useApp();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DEVOTIONAL_QUERY_KEYS.lists(),
    queryFn: async (): Promise<Devotional[]> => {
      try {
        console.log('🔄 Fetching devotionals...');
        const data = await devotionalApi.getAll();
        console.log(`✅ Devotionals fetched: ${data?.length || 0} items`);
        
        // Always return an array, never undefined
        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ Invalid devotionals data, returning empty array');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('❌ Failed to fetch devotionals:', error);
        return [];
      }
    },
    enabled: true, // Always enabled
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when app comes back to foreground
    refetchOnReconnect: true, // Refetch when network reconnects
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: (failureCount, error: any) => {
      console.log(`🔄 Devotionals query retry attempt: ${failureCount}`);
      // Don't retry if offline
      if (!apiClient.getNetworkStatus()) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Background refetch every 5 minutes when online
    refetchInterval: state.isOnline ? 5 * 60 * 1000 : false,
    meta: {
      errorMessage: 'Failed to load devotionals',
    },
  });

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (state.isOnline) {
        console.log('📱 Screen focused, refreshing devotionals...');
        queryClient.invalidateQueries({ queryKey: DEVOTIONAL_QUERY_KEYS.lists() });
      }
    }, [state.isOnline, queryClient])
  );

  return {
    ...query,
    devotionals: query.data || [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
    refresh: () => {
      console.log('🔄 Manual refresh triggered');
      return query.refetch();
    },
    isEmpty: !query.isLoading && (!query.data || query.data.length === 0),
  };
};

// TODAY'S DEVOTIONAL WITH AUTO-REFRESH
export const useTodaysDevotional = () => {
  const { state } = useApp();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DEVOTIONAL_QUERY_KEYS.today(),
    queryFn: async (): Promise<Devotional | null> => {
      try {
        console.log('🔄 Fetching today\'s devotional...');
        const data = await devotionalApi.getToday();
        console.log('✅ Today\'s devotional:', data ? 'found' : 'not found');
        return data;
      } catch (error) {
        console.error('❌ Failed to fetch today\'s devotional:', error);
        return null;
      }
    },
    enabled: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10 * 60 * 1000, // 10 minutes for today's devotional
    gcTime: 24 * 60 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (!apiClient.getNetworkStatus()) return false;
      return failureCount < 2;
    },
    // Refresh today's devotional every 30 minutes
    refetchInterval: state.isOnline ? 30 * 60 * 1000 : false,
  });

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (state.isOnline) {
        console.log('📱 Screen focused, refreshing today\'s devotional...');
        queryClient.invalidateQueries({ queryKey: DEVOTIONAL_QUERY_KEYS.today() });
      }
    }, [state.isOnline, queryClient])
  );

  return {
    ...query,
    devotional: query.data,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
    refresh: () => query.refetch(),
    isNotFound: !query.isLoading && !query.data,
  };
};

// DEVOTIONAL BY ID WITH CACHING
export const useDevotionalById = (id: number) => {
  return useQuery({
    queryKey: DEVOTIONAL_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<Devotional | null> => {
      if (!id) return null;
      
      try {
        console.log(`🔄 Fetching devotional ${id}...`);
        const data = await devotionalApi.getById(id);
        console.log(`✅ Devotional ${id}:`, data ? 'found' : 'not found');
        return data;
      } catch (error) {
        console.error(`❌ Failed to fetch devotional ${id}:`, error);
        return null;
      }
    },
    enabled: !!id && id > 0,
    staleTime: 60 * 60 * 1000, // 1 hour for individual devotionals
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
};

// DEVOTIONAL BY DATE
export const useDevotionalByDate = (date: string) => {
  return useQuery({
    queryKey: DEVOTIONAL_QUERY_KEYS.byDate(date),
    queryFn: async (): Promise<Devotional | null> => {
      if (!date) return null;
      
      try {
        console.log(`🔄 Fetching devotional for ${date}...`);
        const data = await devotionalApi.getByDate(date);
        console.log(`✅ Devotional for ${date}:`, data ? 'found' : 'not found');
        return data;
      } catch (error) {
        console.error(`❌ Failed to fetch devotional for ${date}:`, error);
        return null;
      }
    },
    enabled: !!date,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
};

// MARK DEVOTIONAL AS READ MUTATION
export const useMarkDevotionalRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (devotionalId: number): Promise<boolean> => {
      try {
        console.log(`📖 Marking devotional ${devotionalId} as read...`);
        await LocalStorageService.markDevotionalRead(devotionalId);
        console.log(`✅ Devotional ${devotionalId} marked as read`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to mark devotional ${devotionalId} as read:`, error);
        throw error;
      }
    },
    onSuccess: (_, devotionalId) => {
      // Invalidate and refetch user data to update UI
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      
      // Update the specific devotional in cache
      queryClient.setQueryData(
        DEVOTIONAL_QUERY_KEYS.detail(devotionalId),
        (old: Devotional | null) => {
          if (old) {
            return { ...old, isRead: true };
          }
          return old;
        }
      );
    },
    onError: (error) => {
      console.error('Failed to mark devotional as read:', error);
    },
  });
};

// FAVORITE DEVOTIONAL MUTATION
export const useFavoriteDevotional = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      devotionalId, 
      isFavorited 
    }: { 
      devotionalId: number; 
      isFavorited: boolean; 
    }): Promise<boolean> => {
      try {
        if (isFavorited) {
          console.log(`❤️ Adding devotional ${devotionalId} to favorites...`);
          await LocalStorageService.addFavorite('devotional', devotionalId);
        } else {
          console.log(`💔 Removing devotional ${devotionalId} from favorites...`);
          await LocalStorageService.removeFavorite('devotional', devotionalId);
        }
        console.log(`✅ Devotional ${devotionalId} favorite status updated`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to update favorite status for devotional ${devotionalId}:`, error);
        throw error;
      }
    },
    onSuccess: (_, { devotionalId }) => {
      // Invalidate user data and devotional queries
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      queryClient.invalidateQueries({ queryKey: DEVOTIONAL_QUERY_KEYS.detail(devotionalId) });
    },
    onError: (error) => {
      console.error('Failed to update favorite status:', error);
    },
  });
};

// BULK REFRESH ALL DEVOTIONAL DATA
export const useRefreshAllDevotionalData = () => {
  const queryClient = useQueryClient();
  
  return useCallback(async () => {
    console.log('🔄 Refreshing all devotional data...');
    
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DEVOTIONAL_QUERY_KEYS.all }),
        queryClient.refetchQueries({ queryKey: DEVOTIONAL_QUERY_KEYS.today() }),
        queryClient.refetchQueries({ queryKey: DEVOTIONAL_QUERY_KEYS.lists() }),
      ]);
      
      console.log('✅ All devotional data refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh devotional data:', error);
    }
  }, [queryClient]);
};

// PREFETCH FUNCTIONS FOR PERFORMANCE
export const usePrefetchDevotionals = () => {
  const queryClient = useQueryClient();
  
  return useCallback(async () => {
    console.log('⚡ Prefetching devotionals...');
    
    await queryClient.prefetchQuery({
      queryKey: DEVOTIONAL_QUERY_KEYS.lists(),
      queryFn: async () => {
        const data = await devotionalApi.getAll();
        return Array.isArray(data) ? data : [];
      },
      staleTime: 30 * 1000,
    });
    
    console.log('✅ Devotionals prefetched');
  }, [queryClient]);
};

export const usePrefetchTodaysDevotional = () => {
  const queryClient = useQueryClient();
  
  return useCallback(async () => {
    console.log('⚡ Prefetching today\'s devotional...');
    
    await queryClient.prefetchQuery({
      queryKey: DEVOTIONAL_QUERY_KEYS.today(),
      queryFn: async () => {
        return await devotionalApi.getToday();
      },
      staleTime: 10 * 60 * 1000,
    });
    
    console.log('✅ Today\'s devotional prefetched');
  }, [queryClient]);
};

// CACHE MANAGEMENT
export const useDevotionalCacheManager = () => {
  const queryClient = useQueryClient();
  
  const clearCache = useCallback(async () => {
    console.log('🗑️ Clearing devotional cache...');
    queryClient.removeQueries({ queryKey: DEVOTIONAL_QUERY_KEYS.all });
    await apiClient.clearCache();
    console.log('✅ Devotional cache cleared');
  }, [queryClient]);
  
  const getCacheInfo = useCallback(async () => {
    const cacheSize = await apiClient.getCacheSize();
    const queryCache = queryClient.getQueryCache();
    const cachedQueries = queryCache.findAll({ queryKey: DEVOTIONAL_QUERY_KEYS.all });
    
    return {
      apiCacheSize: cacheSize,
      queryCacheCount: cachedQueries.length,
      networkStatus: apiClient.getNetworkStatus(),
    };
  }, [queryClient]);
  
  return {
    clearCache,
    getCacheInfo,
  };
};