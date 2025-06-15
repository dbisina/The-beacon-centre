// src/services/api/analytics.ts
import { apiClient } from './client';
import LocalStorageService from '@/services/storage/LocalStorage';

export const analyticsApi = {
  async trackInteraction(contentType: string, contentId: number, interactionType: string): Promise<void> {
    try {
      const userData = await LocalStorageService.getUserData();
      
      await apiClient.post('/analytics/track', {
        device_id: userData.deviceId,
        content_type: contentType,
        content_id: contentId,
        interaction_type: interactionType,
      });
    } catch (error) {
      // Queue for later if offline
      console.log('Analytics tracking failed, will retry when online');
    }
  },

  async trackDevotionalRead(devotionalId: number): Promise<void> {
    await this.trackInteraction('devotional', devotionalId, 'completed');
  },

  async trackSermonPlay(sermonId: number, type: 'video' | 'audio'): Promise<void> {
    await this.trackInteraction(type === 'video' ? 'video_sermon' : 'audio_sermon', sermonId, 'viewed');
  },

  async trackAnnouncementView(announcementId: number): Promise<void> {
    await this.trackInteraction('announcement', announcementId, 'viewed');
  },

  async trackContentFavorite(contentType: string, contentId: number): Promise<void> {
    await this.trackInteraction(contentType, contentId, 'favorited');
  },

  async trackAudioDownload(sermonId: number): Promise<void> {
    await this.trackInteraction('audio_sermon', sermonId, 'downloaded');
  },
};