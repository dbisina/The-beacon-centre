// src/services/api/announcements.ts
import { apiClient } from './client';
import { Announcement } from '@/types/api';
import LocalStorageService from '@/services/storage/LocalStorage';

export const announcementsApi = {
  async getAll(): Promise<Announcement[]> {
    try {
      const announcements = await apiClient.get<Announcement[]>('/announcements');
      await LocalStorageService.cacheData('announcements', announcements);
      return announcements;
    } catch (error) {
      const cached = await LocalStorageService.getCachedData<Announcement[]>('announcements');
      if (cached) return cached;
      throw error;
    }
  },

  async getActive(): Promise<Announcement[]> {
    const allAnnouncements = await this.getAll();
    const now = new Date();
    
    return allAnnouncements.filter(announcement => {
      const startDate = new Date(announcement.start_date);
      const expiryDate = announcement.expiry_date ? new Date(announcement.expiry_date) : null;
      
      return announcement.is_active &&
             startDate <= now &&
             (!expiryDate || expiryDate >= now);
    });
  },

  async getByPriority(priority: 'low' | 'medium' | 'high'): Promise<Announcement[]> {
    const allAnnouncements = await this.getAll();
    return allAnnouncements.filter(announcement => announcement.priority === priority);
  },

  async search(query: string): Promise<Announcement[]> {
    const allAnnouncements = await this.getAll();
    const searchTerm = query.toLowerCase();
    
    return allAnnouncements.filter(announcement =>
      announcement.title.toLowerCase().includes(searchTerm) ||
      announcement.content.toLowerCase().includes(searchTerm)
    );
  },
};