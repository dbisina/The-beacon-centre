// src/hooks/useAnnouncements.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi } from '@/services/api/announcements';
import { analyticsApi } from '@/services/api/analytics';
import { Announcement } from '@/types/api';

export const useAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: announcementsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useActiveAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: announcementsApi.getActive,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnnouncementsByPriority = (priority: 'low' | 'medium' | 'high') => {
  return useQuery({
    queryKey: ['announcements', 'priority', priority],
    queryFn: () => announcementsApi.getByPriority(priority),
    staleTime: 10 * 60 * 1000,
  });
};

export const useTrackAnnouncementView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcementId: number) => {
      await analyticsApi.trackAnnouncementView(announcementId);
    },
    onSuccess: () => {
      // Optional: invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};