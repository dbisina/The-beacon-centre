import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  videoSermonsApi, 
  audioSermonsApi, 
  categoriesApi,
  sermonHelpers,
  apiClient 
} from '@/services/api/client';
import { VideoSermon, AudioSermon, Category } from '@/types/api';
import LocalStorageService from '@/services/storage/LocalStorage';
import { useApp } from '@/context/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// Query Keys
export const SERMON_QUERY_KEYS = {
  videos: ['video-sermons'] as const,
  videoLists: () => [...SERMON_QUERY_KEYS.videos, 'list'] as const,
  videoList: (filters: string) => [...SERMON_QUERY_KEYS.videoLists(), filters] as const,
  videoDetails: () => [...SERMON_QUERY_KEYS.videos, 'detail'] as const,
  videoDetail: (id: number) => [...SERMON_QUERY_KEYS.videoDetails(), id] as const,
  videoFeatured: () => [...SERMON_QUERY_KEYS.videos, 'featured'] as const,
  videoByCategory: (categoryId: number) => [...SERMON_QUERY_KEYS.videos, 'category', categoryId] as const,
  
  audios: ['audio-sermons'] as const,
  audioLists: () => [...SERMON_QUERY_KEYS.audios, 'list'] as const,
  audioList: (filters: string) => [...SERMON_QUERY_KEYS.audioLists(), filters] as const,
  audioDetails: () => [...SERMON_QUERY_KEYS.audios, 'detail'] as const,
  audioDetail: (id: number) => [...SERMON_QUERY_KEYS.audioDetails(), id] as const,
  audioFeatured: () => [...SERMON_QUERY_KEYS.audios, 'featured'] as const,
  audioByCategory: (categoryId: number) => [...SERMON_QUERY_KEYS.audios, 'category', categoryId] as const,
  
  categories: ['categories'] as const,
} as const;

// ========================================
// VIDEO SERMONS HOOKS
// ========================================

export const useVideoSermons = () => {
  const { state } = useApp();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SERMON_QUERY_KEYS.videoLists(),
    queryFn: async (): Promise<VideoSermon[]> => {
      try {
        console.log('🎥 Fetching video sermons...');
        const data = await videoSermonsApi.getAll();
        console.log(`✅ Video sermons fetched: ${data?.length || 0} items`);
        
        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ Invalid video sermons data, returning empty array');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('❌ Failed to fetch video sermons:', error);
        return [];
      }
    },
    enabled: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (!apiClient.getNetworkStatus()) return false;
      return failureCount < 3;
    },
    refetchInterval: state.isOnline ? 5 * 60 * 1000 : false,
  });

  useFocusEffect(
    useCallback(() => {
      if (state.isOnline) {
        console.log('📱 Screen focused, refreshing video sermons...');
        queryClient.invalidateQueries({ queryKey: SERMON_QUERY_KEYS.videoLists() });
      }
    }, [state.isOnline, queryClient])
  );

  return {
    ...query,
    videoSermons: query.data || [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
    refresh: () => query.refetch(),
    isEmpty: !query.isLoading && (!query.data || query.data.length === 0),
  };
};

export const useFeaturedVideoSermons = () => {
  const { state } = useApp();

  return useQuery({
    queryKey: SERMON_QUERY_KEYS.videoFeatured(),
    queryFn: async (): Promise<VideoSermon[]> => {
      try {
        console.log('🌟 Fetching featured video sermons...');
        const data = await videoSermonsApi.getFeatured();
        console.log(`✅ Featured video sermons: ${data?.length || 0} items`);
        return data || [];
      } catch (error) {
        console.error('❌ Failed to fetch featured video sermons:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: state.isOnline ? 15 * 60 * 1000 : false,
  });
};

// CORRECTED: Uses categoryId (number) instead of category name (string)
export const useVideoSermonsByCategory = (categoryId: number) => {
  const { state } = useApp();

  return useQuery({
    queryKey: SERMON_QUERY_KEYS.videoByCategory(categoryId),
    queryFn: async (): Promise<VideoSermon[]> => {
      if (!categoryId || isNaN(categoryId)) {
        console.warn('Invalid categoryId for video sermons:', categoryId);
        return [];
      }

      try {
        console.log(`🎥 Fetching video sermons for category ${categoryId}...`);
        const data = await videoSermonsApi.getByCategory(categoryId);
        console.log(`✅ Video sermons for category ${categoryId}: ${data?.length || 0} items`);
        return data || [];
      } catch (error) {
        console.error(`❌ Failed to fetch video sermons for category ${categoryId}:`, error);
        return [];
      }
    },
    enabled: !!categoryId && !isNaN(categoryId),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: state.isOnline ? 15 * 60 * 1000 : false,
  });
};

// NEW: Helper hook to get videos by category name (converts to ID first)
export const useVideoSermonsByCategoryName = (categoryName: string) => {
  const { data: categories } = useCategories();
  
  // Find category ID by name
  const categoryId = categories?.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  )?.id;

  return useVideoSermonsByCategory(categoryId || 0);
};

export const useVideoSermonById = (id: number) => {
  return useQuery({
    queryKey: SERMON_QUERY_KEYS.videoDetail(id),
    queryFn: async (): Promise<VideoSermon | null> => {
      if (!id || isNaN(id)) return null;
      
      try {
        console.log(`🎥 Fetching video sermon ${id}...`);
        const data = await videoSermonsApi.getById(id);
        console.log(`✅ Video sermon ${id}:`, data ? 'found' : 'not found');
        return data;
      } catch (error) {
        console.error(`❌ Failed to fetch video sermon ${id}:`, error);
        return null;
      }
    },
    enabled: !!id && !isNaN(id),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
};

// ========================================
// AUDIO SERMONS HOOKS  
// ========================================

export const useAudioSermons = () => {
  const { state } = useApp();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SERMON_QUERY_KEYS.audioLists(),
    queryFn: async (): Promise<AudioSermon[]> => {
      try {
        console.log('🎵 Fetching audio sermons...');
        const data = await audioSermonsApi.getAll();
        // Debug: log the thumbnail_url for each sermon
        if (Array.isArray(data)) {
          data.forEach((sermon, idx) => {
            // @ts-expect-error: thumbnail_url may not be in the type but is present in the API response
            console.log(`AudioSermon[${idx}] id=${sermon.id} title="${sermon.title}" thumbnail_url=`, sermon.thumbnail_url);
          });
        }
        console.log(`✅ Audio sermons fetched: ${data?.length || 0} items`);
        
        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ Invalid audio sermons data, returning empty array');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('❌ Failed to fetch audio sermons:', error);
        return [];
      }
    },
    enabled: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (!apiClient.getNetworkStatus()) return false;
      return failureCount < 3;
    },
    refetchInterval: state.isOnline ? 5 * 60 * 1000 : false,
  });

  useFocusEffect(
    useCallback(() => {
      if (state.isOnline) {
        console.log('📱 Screen focused, refreshing audio sermons...');
        queryClient.invalidateQueries({ queryKey: SERMON_QUERY_KEYS.audioLists() });
      }
    }, [state.isOnline, queryClient])
  );

  return {
    ...query,
    audioSermons: query.data || [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
    refresh: () => query.refetch(),
    isEmpty: !query.isLoading && (!query.data || query.data.length === 0),
  };
};

export const useFeaturedAudioSermons = () => {
  const { state } = useApp();

  return useQuery({
    queryKey: SERMON_QUERY_KEYS.audioFeatured(),
    queryFn: async (): Promise<AudioSermon[]> => {
      try {
        console.log('🌟 Fetching featured audio sermons...');
        const data = await audioSermonsApi.getFeatured();
        console.log(`✅ Featured audio sermons: ${data?.length || 0} items`);
        return data || [];
      } catch (error) {
        console.error('❌ Failed to fetch featured audio sermons:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: state.isOnline ? 15 * 60 * 1000 : false,
  });
};

// CORRECTED: Uses categoryId (number) instead of category name (string)
export const useAudioSermonsByCategory = (categoryId: number) => {
  const { state } = useApp();

  return useQuery({
    queryKey: SERMON_QUERY_KEYS.audioByCategory(categoryId),
    queryFn: async (): Promise<AudioSermon[]> => {
      if (!categoryId || isNaN(categoryId)) {
        console.warn('Invalid categoryId for audio sermons:', categoryId);
        return [];
      }

      try {
        console.log(`🎵 Fetching audio sermons for category ${categoryId}...`);
        const data = await audioSermonsApi.getByCategory(categoryId);
        console.log(`✅ Audio sermons for category ${categoryId}: ${data?.length || 0} items`);
        return data || [];
      } catch (error) {
        console.error(`❌ Failed to fetch audio sermons for category ${categoryId}:`, error);
        return [];
      }
    },
    enabled: !!categoryId && !isNaN(categoryId),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: state.isOnline ? 15 * 60 * 1000 : false,
  });
};

// NEW: Helper hook to get audio by category name (converts to ID first)
export const useAudioSermonsByCategoryName = (categoryName: string) => {
  const { data: categories } = useCategories();
  
  // Find category ID by name
  const categoryId = categories?.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  )?.id;

  return useAudioSermonsByCategory(categoryId || 0);
};

export const useAudioSermonById = (id: number) => {
  return useQuery({
    queryKey: SERMON_QUERY_KEYS.audioDetail(id),
    queryFn: async (): Promise<AudioSermon | null> => {
      if (!id || isNaN(id)) return null;
      
      try {
        console.log(`🎵 Fetching audio sermon ${id}...`);
        const data = await audioSermonsApi.getById(id);
        console.log(`✅ Audio sermon ${id}:`, data ? 'found' : 'not found');
        return data;
      } catch (error) {
        console.error(`❌ Failed to fetch audio sermon ${id}:`, error);
        return null;
      }
    },
    enabled: !!id && !isNaN(id),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
};

// ========================================
// CATEGORIES HOOK
// ========================================

export const useCategories = () => {
  const { state } = useApp();

  return useQuery({
    queryKey: SERMON_QUERY_KEYS.categories,
    queryFn: async (): Promise<Category[]> => {
      try {
        console.log('📁 Fetching categories...');
        const data = await categoriesApi.getAll();
        console.log(`✅ Categories fetched: ${data?.length || 0} items`);
        
        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ Invalid categories data, returning empty array');
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 60 * 60 * 1000, // Categories don't change often
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: state.isOnline ? 60 * 60 * 1000 : false, // Refresh every hour
  });
};

// ========================================
// SERMON HELPERS HOOKS (NEW)
// ========================================

// Helper hook for getting both video and audio sermons by category name
export const useSermonsByCategoryName = (categoryName: string) => {
  const videoQuery = useVideoSermonsByCategoryName(categoryName);
  const audioQuery = useAudioSermonsByCategoryName(categoryName);

  return {
    videoSermons: videoQuery.data || [],
    audioSermons: audioQuery.data || [],
    isLoadingVideos: videoQuery.isLoading,
    isLoadingAudio: audioQuery.isLoading,
    isLoading: videoQuery.isLoading || audioQuery.isLoading,
    isRefreshing: videoQuery.isRefetching || audioQuery.isRefetching,
    errorVideos: videoQuery.error,
    errorAudio: audioQuery.error,
    error: videoQuery.error || audioQuery.error,
    refreshVideos: videoQuery.refetch,
    refreshAudio: audioQuery.refetch,
    refresh: () => {
      videoQuery.refetch();
      audioQuery.refetch();
    },
  };
};

// ========================================
// FAVORITE SERMON MUTATIONS
// ========================================

export const useFavoriteVideoSermon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sermonId, 
      isFavorited 
    }: { 
      sermonId: number; 
      isFavorited: boolean; 
    }): Promise<boolean> => {
      try {
        if (isFavorited) {
          console.log(`❤️ Adding video sermon ${sermonId} to favorites...`);
          await LocalStorageService.addFavorite('video', sermonId);
        } else {
          console.log(`💔 Removing video sermon ${sermonId} from favorites...`);
          await LocalStorageService.removeFavorite('video', sermonId);
        }
        console.log(`✅ Video sermon ${sermonId} favorite status updated`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to update favorite status for video sermon ${sermonId}:`, error);
        throw error;
      }
    },
    onSuccess: (_, { sermonId }) => {
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      queryClient.invalidateQueries({ queryKey: SERMON_QUERY_KEYS.videoDetail(sermonId) });
    },
  });
};

export const useFavoriteAudioSermon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sermonId, 
      isFavorited 
    }: { 
      sermonId: number; 
      isFavorited: boolean; 
    }): Promise<boolean> => {
      try {
        if (isFavorited) {
          console.log(`❤️ Adding audio sermon ${sermonId} to favorites...`);
          await LocalStorageService.addFavorite('audio', sermonId);
        } else {
          console.log(`💔 Removing audio sermon ${sermonId} from favorites...`);
          await LocalStorageService.removeFavorite('audio', sermonId);
        }
        console.log(`✅ Audio sermon ${sermonId} favorite status updated`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to update favorite status for audio sermon ${sermonId}:`, error);
        throw error;
      }
    },
    onSuccess: (_, { sermonId }) => {
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      queryClient.invalidateQueries({ queryKey: SERMON_QUERY_KEYS.audioDetail(sermonId) });
    },
  });
};

// ========================================
// BULK REFRESH FUNCTIONS
// ========================================

export const useRefreshAllSermonData = () => {
  const queryClient = useQueryClient();
  
  return useCallback(async () => {
    console.log('🔄 Refreshing all sermon data...');
    
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SERMON_QUERY_KEYS.videos }),
        queryClient.invalidateQueries({ queryKey: SERMON_QUERY_KEYS.audios }),
        queryClient.invalidateQueries({ queryKey: SERMON_QUERY_KEYS.categories }),
      ]);
      
      console.log('✅ All sermon data refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh sermon data:', error);
    }
  }, [queryClient]);
};