import { useQuery } from '@tanstack/react-query';
import { sermonApi } from '@/services/api/client';

export const useFeaturedContent = () => {
  return useQuery({
    queryKey: ['featured-content'],
    queryFn: async () => {
      try {
        const [featuredVideos, featuredAudio] = await Promise.all([
          sermonApi.getFeaturedVideos(),
          sermonApi.getFeaturedAudio(),
        ]);

        return {
          videos: featuredVideos,
          audio: featuredAudio,
        };
      } catch (error) {
        console.error('Failed to fetch featured content:', error);
        return {
          videos: [],
          audio: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}; 